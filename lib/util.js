'use strict';

/**
 * Defines a utility object.
 */
const Util = {

    /**
     * Determines if a parameter is a function.
     *
     * @param {*} obj The parameter to check.
     * @return {boolean} True if function, false otherwise.
     */
    isFunction: (obj) => {
        return typeof obj === 'function';
    },

    /**
     * Determines if a parameter is a string.
     *
     * @param {*} str The parameter to check.
     * @return {boolean} True if string, false otherwise.
     */
    isString: (str) => {
        return typeof str === 'string';
    },

    /**
     * Determines if a parameter is an object.
     *
     * @param {*} obj The parameter to check.
     * @return {boolean} True if object, false otherwise.
     */
    isObject: (obj) => {
        return typeof obj === 'object';
    },

    /**
     * Determines if a parameter is an array.
     *
     * @param {*} arr The parameter to check.
     * @return {boolean} True if array, false otherwise.
     */
    isArray: (arr) => {
        return Array.isArray(arr);
    },

    /**
     * Determines if a string ends with a string.
     *
     * @param {string} str The string to check.
     * @param {string} suffix The suffix we're checking for.
     * @return {boolean} true if the string ends with the string, false otherwise.
     */
    endsWith: (str, suffix) => {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    },

    /**
     * Determines if a string starts with a string.
     *
     * @param {string} str The string to check.
     * @param {string} prefix The prefix we're checking for.
     * @return {boolean} true if the string starts with the string, false otherwise.
     */
    startsWith: (str, prefix) => {
        return str.lastIndexOf(prefix, 0) === 0;
    },

    /**
     * Trims slashes on either end of a string.
     *
     * @param {string} string The string.
     * @return {string} The trimmed string.
     */
    trimSlashes: (string) => {
        let cleanString = string;

        if (Util.endsWith(cleanString, '/')) {
            cleanString = cleanString.substring(0, cleanString.length - 1);
        }

        if (Util.startsWith(cleanString, '/')) {
            cleanString = cleanString.substring(1, cleanString.length);
        }

        return cleanString;
    },


    /**
     * Loops over object keys.
     *
     * @param {object} object The object.
     * @param {function} iterator The iterator function, called with (key, value)
     */
    forEach: (object, iterator) => {
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                iterator(key, object[key]);
            }
        }
    }
};

module.exports = Util;
