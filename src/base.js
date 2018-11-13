var cache = require("./cache");
var options = require("./options");
var crypto = require("crypto");
var isoDateStr = require("iso-date-str");
const newid = require("./utils").newid;
const ENVIRONMENT = process.env["ENVIRONMENT"] || "dev";
const DYNAMODB_URL = process.env["DYNAMODB_URL"] || 'localhost:8001';
const AWS = require("aws-sdk");
var _ = require("lodash");


AWS.config.region = process.env["aws-region"] || "us-east-1";
if(ENVIRONMENT == "local") {
    AWS.config.dynamodb = {endpoint: `http://${DYNAMODB_URL}`};
}


var dynamodb = new AWS.DynamoDB();

function marshalValue(value) {
    // convert booleans to string
    if (typeof value === "boolean") {
      value = value.toString()
    }
    return value
}

function unmarshalValue(value) {
    // convert boolean-y strings back to bools
    if (value === 'true') {
      return true
    } else if (value === 'false') {
      return false
    } else {
      return value
    }
}

function hashPair(key, value) {
    // convert booleans to string
    if (typeof value === "boolean") {
      value = value.toString()
    }
    var hasher = crypto.createHash('sha256');
    hasher.update(key);
    hasher.update("::");
    hasher.update(marshalValue(value));
    return hasher.digest("base64");
}

function prepareTriple(subject, predicate, value, modificationDate) {

    return {
        "id": {"S": subject},
        "hash": {"S": hashPair(predicate, value)},
        "predicate": {"S": predicate},
        "value": {"S": marshalValue(value)},
        "modificationDate": {"S": modificationDate},
    };
}

function prepareTripleForRemove(subject, predicate, value) {
    return {
        "id": {"S": subject},
        "hash": {"S": hashPair(predicate, value)},
    };
}

function getTriple(tableName, subject, predicate, value) {
    var params = {
        TableName: tableName,
        Key: {
            id: {S: subject},
            hash: {"S": hashPair(predicate, value)},
        }
    }
    return new Promise(async function(resolve, reject) {
        try {
            let data = await dynamodb.getItem(params).promise();
            var item = {};
            if(data.Item) {
                for(const key in data.Item) {
                    item[key] = unmarshalValue(data.Item[key].S);
                }
            }
            resolve(item);
        } catch(e) {
            reject(e);
        }
    });
}

function writeTriple(tableName, subject, predicate, value) {
    var mod = isoDateStr();
    var item = prepareTriple(subject, predicate, value, mod);
    var params = {
        TableName: tableName,
        Item: item,
    }
    return new Promise(async function(resolve, reject) {
        try {
            let data = await dynamodb.putItem(params).promise();
            resolve(item);
        } catch(e) {
            reject(e);
        }
    });
}

function removeTriple(tableName, subject, predicate, value) {
    var mod = isoDateStr();
    var item = prepareTripleForRemove(subject, predicate, value, mod);
    var params = {
        TableName: tableName,
        Key: item,
    }
    return new Promise(function(resolve, reject) {
        var prom = dynamodb.deleteItem(params).promise();
        prom.then(function(data) {
                resolve(item);
            })
            .catch(function(err) {
                reject(err);
            });
        });
}

function getSubjectsWithPredicate(tableName, predicate, token) {
    console.log(tableName);
    // pulls a list of subjects that have a value for the specified predicate
    return new Promise(function(resolve, reject) {
        var params = {
            Limit: 50,
            TableName: tableName,
            KeyConditionExpression: "predicate = :id",
            ExpressionAttributeValues: {
                ":id": {"S": predicate}
            },
            IndexName: "predicate-index",
        }
        if(token && token.max_items) {
            params.Limit = token.max_items;
        }
        if(token && token.token) {
            var token_string = Buffer.from(token.token, "base64");
            params.ExclusiveStartKey = JSON.parse(token_string);
        }

        var prom = dynamodb.query(params).promise();
        prom.then(function(data) {
                if(data.Items.length > 0) {
                    var items = new Set([]);
                    data.Items.forEach(function(value) {
                        items.add(value.id.S);
                    });
                    var subjects = [];
                    Array.from(items).forEach(function(item) {
                        subjects.push({id: item});
                    });
                    var page_info = {
                        max_items: params.Limit,
                        count: subjects.length
                    };
                    if(data.LastEvaluatedKey) {
                        page_info.token = new Buffer(JSON.stringify(data.LastEvaluatedKey)).toString("base64");
                    }
                    var result = {
                        subjects: subjects,
                        pageInfo: page_info
                    };
                    resolve(result);
                } else {
                    resolve({subjects: []});
                }
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

function getSubjectsWithPredicateValue(tableName, predicate, value, token) {
    // pulls a list of subjects that have a predicate with specified value
    return new Promise(function(resolve, reject) {
      var params = {
          Limit: 50,
          TableName: tableName,
          KeyConditionExpression: "#my_val = :my_val",
          FilterExpression: "predicate = :id",
          ExpressionAttributeValues: {
              ":id": {"S": predicate},
              ":my_val": {"S": marshalValue(value)}
          },
          ExpressionAttributeNames: {
            "#my_val": "value"
          },
          IndexName: "value-index"
      }
      if(token && token.max_items) {
          params.Limit = token.max_items;
      }
      if(token && token.token) {
          var token_string = Buffer.from(token.token, "base64");
          params.ExclusiveStartKey = JSON.parse(token_string);
      }

      var prom = dynamodb.query(params).promise();
      prom.then(function(data) {
              if(data.Items.length > 0) {
                  var items = new Set([]);
                  data.Items.forEach(function(value) {
                      items.add(value.id.S);
                  });
                  var subjects = [];
                  Array.from(items).forEach(function(item) {
                      subjects.push({id: item});
                  });
                  var page_info = {
                      max_items: params.Limit,
                      count: subjects.length
                  };
                  if(data.LastEvaluatedKey) {
                      page_info.token = new Buffer(JSON.stringify(data.LastEvaluatedKey)).toString("base64");
                  }
                  var result = {
                      subjects: subjects,
                      pageInfo: page_info
                  };
                  resolve(result);
              } else {
                  resolve({subjects: []});
              }
          })
          .catch(function(err) {
              reject(err);
          });
    })
}

function removeObject(tableName, subject) {
    var ops = [];
    return new Promise(function(resolve, reject) {
        getObjectTriples(tableName, subject)
            .then(function(data) {
                data.forEach(function(triple) {
                    ops.push({
                        DeleteRequest: {
                            Key: {id: triple.id, hash: triple.hash}
                        }
                    });
                });
            })
            .catch(reject)
            .then(function() {
                var params = {
                    RequestItems: {
                    }
                };
                if(ops.length) {
                    var batchedOps = _.chunk(ops, 20)
                    let writes = [];
                    batchedOps.forEach(function(batch) {
                        params.RequestItems[tableName] = batch;
                        writes.push(dynamodb.batchWriteItem(params).promise())
                    })
                    return Promise.all(writes).then(function(data) {
                        if (data.UnprocessedItems) {
                            console.log('UNPROCESSED ITEMS : ')
                            console.log(JSON.stringify(data.UnprocessedItems))
                        }
                        cache.delCached(tableName+"::"+subject);
                        resolve({id: subject, status: true});
                    }).catch(reject)
                } else {
                    reject(new Error("nothing to do"));
                }
            });


    });
}

function putObject(tableName, obj) {
    var ops = [];
    var mod = isoDateStr();
    var id = obj.id;
    if(!id) {
        obj.id = id = newid();
    }
    var newTripleHashes = new Set([]);
    for(const key in obj) {
        if (Array.isArray(obj[key])) {
            obj[key].forEach(function(item, index) {
                var triple = prepareTriple(id, key, item, mod);
                newTripleHashes.add(triple.hash.S);
                triple.index = {"N": String(index)};
                ops.push({
                    PutRequest: {
                        Item: triple
                    }
                });
            })
        } else {
            var triple = prepareTriple(id, key, obj[key], mod);
            newTripleHashes.add(triple.hash.S);
            ops.push({
                PutRequest: {
                    Item: triple
                }
            });
        }
    }

    return new Promise(function(resolve, reject) {
        getObjectTriples(tableName, id)
            .then(function(data) {
                data.forEach(function(triple) {
                    if(!newTripleHashes.has(triple.hash.S)) {
                        ops.push({
                            DeleteRequest: {
                                Key: {id: triple.id, hash: triple.hash}
                            }
                        });
                    }
                });
            })
            .catch(reject)
            .then(function() {
                var params = {
                    RequestItems: {
                    }
                };
                if (ops.length) {
                    var batchedOps = _.chunk(ops, 20)
                    let writes = [];
                    batchedOps.forEach(function(batch){
                        params.RequestItems[tableName]= batch;

                        writes.push(dynamodb.batchWriteItem(params).promise());
                    })
                    return Promise.all(writes).then(function(data) {
                        if (data.UnprocessedItems) {
                            console.log('UNPROCESSED ITEMS : ')
                            console.log(JSON.stringify(data.UnprocessedItems))
                        }
                        resolve({status: true, id: id, message: "success"});
                    }).catch(reject)
                } else {
                    reject(new Error("nothing to do"));
                }
            });

    });
}

function getObjectTriples(tableName, subject) {
    return new Promise(function(resolve, reject) {
        var params = {
            KeyConditionExpression: "id = :id",
            ExpressionAttributeValues: {
                ":id": {"S": subject}
            },
            TableName: tableName
        };
        var prom = dynamodb.query(params).promise();
        prom.then(function(data) {
                resolve(data.Items);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

function getObject(tableName, subject) {
    var cached = cache.getCached(tableName+"::"+subject);
    return new Promise(function(resolve, reject) {
        cached.then(function(data) {
            if(data) {
                console.log(subject + " was cached ******************");
                resolve(data);
            }
        }).catch(function(err) {
            console.log(subject + " :-(");
            var prom = getObjectTriples(tableName, subject);
            prom.then(function(data) {
                if(data.length > 0) {
                    var item = {
                        id: subject
                    };
                    data.forEach(function(value) {
                        if(value.index) {
                            if(!Array.isArray(item[value.predicate.S])) {
                                item[value.predicate.S] = [];
                            }
                            item[value.predicate.S].push(unmarshalValue(value));
                        } else {
                            item[value.predicate.S] = unmarshalValue(value.value.S);
                        }
                    });
                    Object.keys(item).forEach(function(key) {
                        var val = item[key];
                        if(Array.isArray(val)) {
                            var rep = [];
                            // Sort the items correctly.
                            function compare(a,b) {
                                if (Number(a.index.N) < Number(b.index.N))
                                    return -1;
                                if (Number(a.index.N) > Number(b.index.N))
                                    return 1;
                                return 0;
                            }
                            val.sort(compare);

                            // remove the ddb structure
                            val.forEach(function(item) {
                                rep.push(unmarshalValue(item.value.S));
                            });
                            item[key] = rep;
                        }
                    });
                    cache.cacheData(tableName+"::"+subject, item, options.cacheSeconds);
                    resolve(item);
                }
                resolve(null);
            })
            .catch(function(err) {
                console.log(err);
                resolve(null);
            });
        });
    });
}


exports.hashPair = hashPair;
exports.prepareTriple = prepareTriple;
exports.getTriple = getTriple;
exports.writeTriple = writeTriple;
exports.removeTriple = removeTriple;
exports.getSubjectsWithPredicate = getSubjectsWithPredicate;
exports.getSubjectsWithPredicateValue = getSubjectsWithPredicateValue;
exports.getObject = getObject;
exports.putObject = putObject;
exports.removeObject = removeObject;
exports.getObjectTriples = getObjectTriples;

exports.dynamodb = dynamodb;
