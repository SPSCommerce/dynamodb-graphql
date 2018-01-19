const provision = require('./provision')
const expect = require('chai').expect


//--------------------------------------------------
// Tests that the basic API contract is maintained.
//--------------------------------------------------
const functions = [
    "generateCFN",
];


functions.forEach(function (func_name) {
    describe('provision module api', function () {
        describe('"' + func_name + '"', function () {
            it('should export a function', function () {
                expect(provision[func_name]).to.be.a('function');
            });
        });
    });
});


//--------------------------------------------------
// Tests the generateCFN generates what we expect.
//--------------------------------------------------
describe('generateCFN module functionality', function () {
    describe('"generateCFN"', function () {
        it('return a YML formatted cloudformation template with two tables defined and one IAM role', function () {
            var cfn = provision.generateCFN("unit-tests", ["one", "hat"]);
            // console.log(cfn);
        });
    });
});