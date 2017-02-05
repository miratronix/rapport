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
    }
};

module.exports = Util;
