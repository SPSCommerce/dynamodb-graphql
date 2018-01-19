/**********************************************
 * very dumb simple in-mem local LRU cache.
 * This could be replaced with memcached or
 * redis in the future or DAX I suppose.
 **********************************************/
const DISABLE_CACHE = process.env["DISABLE_CACHE"];

var bluebird = require('bluebird');
var LRU = require("lru-cache"),
    options = {
        max: 100,
        maxAge: 1000 * 300
    },
    cache = LRU(options);



exports.cacheData = function (key, data, exipresIn) {
    if (DISABLE_CACHE) {
        console.log("------=====-------- cache disabled --------=====------");
        return;
    }
    cache.set(key, data, exipresIn * 1000);
};


exports.getCached = function (key) {
    return new bluebird.Promise(function (resolve, reject) {
        var value = cache.get(key);
        if (value) {
            resolve(value);
        }
        reject("not found");
    });
};

exports.delCached = function (key) {
    if (DISABLE_CACHE) {
        console.log("------=====-------- cache disabled --------=====------");
        return;
    }
    cache.del(key);
};