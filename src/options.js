var fs = require("fs");

var cacheSeconds = 10;
var tableNamePrefix = "ddbgql-";
var localOptions = null;


const tableName = function (objtype) {
    return tableNamePrefix + objtype;
}


function getLocalOptions() {
    if (localOptions) {
        console.log(" -- already loaded");
        return localOptions;
    }
    var localOptionsLocation = process.env["DDB-GQL-OPTIONS"] || "./ddb-gql.json";
    if (fs.existsSync(localOptionsLocation)) {
        localOptions = JSON.parse(fs.readFileSync(localOptionsLocation));
        return localOptions;
    } else {
        console.warn("`" + localOptionsLocation + "` not found, could not load options.")
    }
    return null;
}


function resolve(name, default_value) {
    var value = process.env["DDB-GQL-" + name.toUpperCase()] || null;
    if (value) {
        return value;
    }
    var lc = getLocalOptions();
    if (lc && lc[name]) {
        return lc[name];
    }
    return default_value;
}


exports.getLabels = function () {
    var labels = resolve("labels", []);
    if (labels.split) {
        return labels.split(",");
    }
    return labels;
};


exports.resolve = resolve;
exports.cacheSeconds = cacheSeconds;
exports.tableNamePrefix = tableNamePrefix;
exports.tableName = tableName;

exports.setTableNamePattern = function (project, environment) {
    tableNamePrefix = environment + "-" + project + "-";
};