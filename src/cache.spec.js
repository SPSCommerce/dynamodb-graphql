const cache = require('./cache')
const expect = require('chai').expect


//--------------------------------------------------
// Tests that the basic API contract is maintained.
//--------------------------------------------------
const functions = [
    "cacheData",
    "getCached",
];


functions.forEach(function (func_name) {
    describe('cache module api', function () {
        describe('"' + func_name + '"', function () {
            it('should export a function', function () {
                expect(cache[func_name]).to.be.a('function');
            });
        });
    });
});


//--------------------------------------------------
// Tests the cache holds a value.
//--------------------------------------------------
describe('cache module functionality', function () {
    describe('"getCached"', function () {
        it('should cache a value to be retrieved later', function (done) {
            cache.cacheData("key", "value", 2);
            cache.getCached("key").then(function (data) {
                expect(data).to.equal("value");
                done();
            });
        });
        it('cache miss should produce null', function (done) {
            cache.getCached("not_cached")
                .catch(function (err) {
                    expect(err).to.not.equal(null);
                    done();
                });
        });
        it('cache expired should produce null', function (done) {
            cache.cacheData("should_expire", "value", 1);
            setTimeout(function () {
                cache.getCached("should_expire")
                    .catch(function (err) {
                        expect(err).to.not.equal(null);
                        done();
                    });
            }, 1200);
        });
    });
});