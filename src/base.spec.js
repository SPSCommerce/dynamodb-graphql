const base = require('./base')
const expect = require('chai').expect
const provision = require('./provision');


//--------------------------------------------------
// Tests that the basic API contract is maintained.
//--------------------------------------------------
const functions = [
    "hashPair",
    "prepareTriple",
    "getTriple",
    "writeTriple",
    "removeTriple",
    "getSubjectsWithPredicate",
    "getSubjectsWithPredicateValue",
    "getObject",
    "putObject",
    "removeObject",
    "getObjectTriples",
];


functions.forEach(function (func_name) {
    describe('base module api', function () {
        describe('"' + func_name + '"', function () {
            it('should export a function', function () {
                expect(base[func_name]).to.be.a('function');
            });
        });
    });
});


//--------------------------------------------------
// Tests for hashing
//--------------------------------------------------

describe('base module functionality', function () {
    describe('"hashPair"', function () {
        it('should produce a consistent hash for `key` and `value`', function () {
            expect(base.hashPair("key", "value")).to.equal('rn1Rn2ztJwrbwm9R7cp17Nuskdu3VHFl2c1zsL+kS6Q=');
        });
        it('should produce a consistent hash for `favorite` and `pencil`', function () {
            expect(base.hashPair("favorite", "pencil")).to.equal('/SUQv+hoyKDoSGKa12F7SXql3WnUCLMR7YdL3pmBFyw=');
        });
        it('should produce a consistent hash for `hormone` and `replacement`', function () {
            expect(base.hashPair("hormone", "replacement")).to.equal('TbYp7dXsyB2toW20b4ovYN6AsfTCVs2zb7qsqntKSwI=');
        });
    });
});



//--------------------------------------------------
// Tests for triple preparation
//--------------------------------------------------

describe('base module functionality', function () {
    describe('"prepareTriple"', function () {
        it('should produce a ddb formatted item for a triple', function () {
            expect(base.prepareTriple("subject", "predicate", "value", "modificationDate")).to.deep.equal({
                "id": {
                    "S": "subject"
                },
                "hash": {
                    "S": "navHUk2JAadxbRAqN+o/R1hpEoHXNisN9I3q5f7647Y="
                },
                "predicate": {
                    "S": "predicate"
                },
                "value": {
                    "S": "value"
                },
                "modificationDate": {
                    "S": "modificationDate"
                },
            });
        });
    });
});


//--
// Stuff
//---

describe('ddb interactions', function () {
    var tableName = null;
    this.timeout(150000);

    before(function (done) {
        var promise = provision.deploy("graphql", ["unitTests"], "dev");

        promise.then(function (d) {
            tableName = d.graphqlunitTestsTableName;
            done();
        });
    });

    after(function (done) {
        if (process.env.TEAR_DOWN_DDB === "YES") {
            try {
                var promise = provision.deleteStack("graphql", "dev");
                promise.then(function (d) {
                    done();
                });
            } catch (e) {
                console.log(e);
                done();
            }
        } else {
            done();
        }
    });

    describe('writeTriple/getTriple', function () {
        it("should write a triple to dynamo", function (done) {
            base.writeTriple(tableName, "subject", "predicate", "value")
                .then(function (created) {
                    expect(created).to.not.equal(null);
                    var readPromise = base.getTriple(tableName, "subject", "predicate", "value");

                    function removeTriple() {
                        base.removeTriple(tableName, "subject", "predicate", "value")
                            .then(function () {})
                            .then(done, done);
                    }
                    readPromise.then(function (in_db) {
                            expect(in_db).to.deep.equal({
                                value: 'value',
                                hash: 'navHUk2JAadxbRAqN+o/R1hpEoHXNisN9I3q5f7647Y=',
                                modificationDate: created.modificationDate.S,
                                id: 'subject',
                                predicate: 'predicate'
                            });
                        })
                        .catch(function (err) {
                            throw err;
                            done();
                        })
                        .then(removeTriple, removeTriple);
                });
        });
    });


    describe('putObject/getObject', function () {
        it("should write a set of triples to dynamo", function (done) {
            var anObject = {
                id: "thirdverse",
                name: "same as the first",
                monkees: [
                    "Micky Dolenz",
                    "Michael Nesmith",
                    "Peter Tork",
                    "Davy Jones"
                ],
                states: ["one"]
            };

            function removeObj() {
                base.removeObject(tableName, "thirdverse")
                    .then(function () {})
                    .then(done, done);
            }

            base.putObject(tableName, anObject)
                .then(function (created) {
                    expect(created).to.not.equal(null);
                    var readPromise = base.getObject(tableName, anObject.id);
                    readPromise.then(function (in_db) {
                            expect(in_db).to.deep.equal(anObject);
                        })
                        .catch(function (err) {
                            throw err;
                        })
                        .then(removeObj, removeObj);
                })
        });
    });




    describe('removeObject', function () {
        it("should remove triples in DDB", function (done) {
            var anObject = {
                id: "test-object",
                name: "same as the first",
                states: ["one"]
            };

            function removeObj() {
                base.removeObject(tableName, "test-object")
                    .then(function () {
                        var readPromise = base.getObjectTriples(tableName, anObject.id);
                        readPromise.then(function (triples) {
                                expect(triples.length).to.equal(0);
                            })
                            .then(done, done);
                    });
            }

            base.putObject(tableName, anObject)
                .then(function (created) {
                    expect(created).to.not.equal(null);
                    var readPromise = base.getObject(tableName, anObject.id);
                    readPromise.then(function (in_db) {
                            // console.log(in_db);
                            expect(in_db).to.deep.equal(anObject);
                        })
                        .catch(function (err) {
                            throw err;
                        })
                        .then(removeObj, removeObj);
                });
        });
    });




    describe('getSubjectsWithPredicate', function () {
        it("should find a set of subjects that have a specific predicate set.", function (done) {

            var obj1 = {
                id: "obj1",
                name: "one"
            };
            var obj2 = {
                id: "obj2",
                home: "none"
            };
            var obj3 = {
                id: "obj3",
                name: "one"
            };

            after(function (done) {
                Promise.all([
                        base.removeObject(tableName, "obj1"),
                        base.removeObject(tableName, "obj2"),
                        base.removeObject(tableName, "obj3"),
                    ])
                    .then(function () {})
                    .then(done, done);
            });

            Promise.all([
                    base.putObject(tableName, obj1),
                    base.putObject(tableName, obj2),
                    base.putObject(tableName, obj3),
                ])
                .then(function () {
                    var subjectsPromise = base.getSubjectsWithPredicate(tableName, "name");
                    subjectsPromise.then(function (subjects) {
                            expect(new Set(subjects.subjects)).to.have.deep.keys([{
                                id: "obj1"
                            }, {
                                id: "obj3"
                            }]);
                            done();
                        })
                        .catch(function (err) {
                            done(err);
                        })
                });
        });
    });
    describe('getSubjectsWithPredicateValue', function () {
        it("Should find a set of subjects that have a predicate / value set", function (done) {
            let obj1 = {
                id: "obj6",
                name: "boston"
            }
            let obj2 = {
                id: "obj7",
                name: "mclain"
            }
            after(function (done) {
                Promise.all([
                        base.removeObject(tableName, "obj6"),
                        base.removeObject(tableName, "obj7"),
                    ])
                    .then(function (a, b) {
                        done()
                    })
            });

            Promise.all([
                    base.putObject(tableName, obj1),
                    base.putObject(tableName, obj2)
                ])
                .then(function () {
                    var subjectsPromise = base.getSubjectsWithPredicateValue(tableName, "name", "boston");

                    subjectsPromise.then(function (subjects) {
                            // var match = new Set(["obj1", "obj3"]);
                            expect(new Set(subjects.subjects)).to.have.deep.keys([{
                                id: "obj6"
                            }]);
                            done();
                        })
                        .catch(function (err) {
                            done(err);
                        })
                });
        })
    })


});