const uuidv4 = require('uuid/v4');


function newid() {
    /**
     * Creates a new uuid4.
     **/
    return uuidv4();
}

function shouldBeVectors(fields, obj) {
    /**
     * helper function that ensures that if a value is a scalar it is put in an array.
     **/
    fields.forEach(function (field) {
        if (obj.hasOwnProperty(field)) {
            var value = obj[field];
            if (value) {
                if (!Array.isArray(value)) {
                    obj[field] = [value];
                }
            } else {
                obj[field] = [];
            }
        } else {
            obj[field] = [];
        }
    });
}


function shouldBeScalars(fields, obj) {
    /**
     * helper function that ensures that if a value is an array only the first item is returned.
     * if more than one exists then a warning is logged.
     **/
    fields.forEach(function (field) {
        if (obj.hasOwnProperty(field)) {
            var value = obj[field];
            if (value) {
                if (Array.isArray(value)) {
                    if (value.length > 1) {
                        console.warn("Scalar value has multiple values [" + obj.id + "] field:" + field);
                    }
                    obj[field] = value[0];
                }
            }
        }
    });
}


function applyDefaults(obj, defaults) {
    /**
     * helper function to apply a set of defaults to an object if they don't exist.
     **/
    for (const key in defaults) {
        if (!obj[key]) {
            obj[key] = defaults[key];
        }
    }
}


function only(obj, fields) {
    /**
     * helper function to only return an object with a set of fields.
     * does not set values for fields that don't exist on the target object.
     **/
    var result = {};
    fields.forEach(function (field) {
        if (obj[field]) {
            result[field] = obj[field];
        }
    });
    return result;
}


exports.shouldBeVectors = shouldBeVectors;
exports.shouldBeScalars = shouldBeScalars;
exports.applyDefaults = applyDefaults;
exports.newid = newid;
exports.only = only;