const expect = require('chai').expect


//--------------------------------------------------
// Tests that the basic API contract is maintained.
//--------------------------------------------------
const functions = [
    "getLabels",
    "resolve",
];


functions.forEach(function (func_name) {
    describe('options module api', function () {
        describe('"' + func_name + '"', function () {
            var options = require('./options');
            it('should export as a function', function () {
                expect(options[func_name]).to.be.a('function');
            });
        });
    });
});


//--------------------------------------------------
// Tests loading options from file.
//--------------------------------------------------
describe('options module functionality', function () {
    delete process.env["DDB-GQL-OPTIONS"];
    delete process.env["DDB-GQL-LABELS"];
    describe('"no options defined"', function () {
        it('should get a list of labels in a file.', function () {
            delete process.env["DDB-GQL-OPTIONS"];
            var options = require('./options');
            var labels = options.getLabels();
            expect(labels).to.deep.equal([]);
        });
    });
    describe('"options from file"', function () {
        it('should get a list of labels in a file.', function () {
            process.env["DDB-GQL-OPTIONS"] = "./test-files/test-options.json";
            var options = require('./options');
            var labels = options.getLabels();
            expect(labels).to.deep.equal(["one", "message", "people", "hair"]);
        });
    });
    describe('"labels from ENV"', function () {
        it('should get a list of labels in a file.', function () {
            delete process.env["DDB-GQL-OPTIONS"];
            process.env["DDB-GQL-LABELS"] = "animal,veggie,rocks";
            var options = require('./options');
            var labels = options.getLabels();
            expect(labels).to.deep.equal(["animal", "veggie", "rocks"]);
        });
    });
});