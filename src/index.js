const base = require("./base");
const provision = require("./provision");
const options = require("./options");
const utils = require("./utils");
var bluebird = require('bluebird');


function getNode(type, id) {
    return base.getObject(options.tableName(type), id);
}

function listNodes(type, token) {
    var predicated = base.getSubjectsWithPredicate(options.tableName(type), "id", token);
    return new bluebird.Promise(function (resolve, reject) {
        predicated.then(function (d) {
            resolve({
                "nodes": d.subjects,
                "token": d.pageInfo.token
            });
        });
    });
}

function putNode(type, id, obj) {
    obj["id"] = id;
    console.log(options.tableName(type));
    return base.putObject(options.tableName(type), obj);
}


function deleteNode(type, id) {
    return base.removeObject(options.tableName(type), id);
}


function findNodesWithAttribute(type, attr, token) {
    return base.getSubjectsWithPredicate(options.tableName(type), attr, token);
}

function filterNodes(type, attr, value, token) {
    return base.getSubjectsWithPredicateValue(options.tableName(type), attr, value, token);
}


exports.getNode = getNode;
exports.putNode = putNode;
exports.deleteNode = deleteNode;
exports.listNodes = listNodes;
exports.findNodesWithAttribute = findNodesWithAttribute;
exports.filterNodes = filterNodes;


exports.deploy = function (project, tables, environment) {
    return provision.deploy(project, tables, environment);
};

exports.provision = provision;
exports.utils = utils;
exports.options = options;
exports.base = base;


exports.commonSchema = `
  input PaginationInput {
    # default max_items is 50
    max_items: Int
    token: String
  }

  type PaginationOutput {
    max_items: Int!
    token: String
    count: Int
  }

  type StatusOutput {
    id: String!
    status: Boolean!
    message: String
  }
`;