'use strict';

const rapportOptions = require('./options.js');

/**
 * Defines a utility object.
 */
const Util = {

    /**
     * Stringifies a message.
     *
     * @param {*} msg The message.
     * @return {string} The stringified version of the message.
     */
    stringify: (msg) => {
        if (Util.isString(msg)) {
            return msg;
        } else {
            return rapportOptions.stringify(msg);
        }
    },

    /**
     * Parses a message.
     *
     * @param {*} msg The message to parse.
     * @param {*} [defaultValue] The default value to return if parsing fails.
     * @return {*} The parsed message.
     */
    parse: (msg, defaultValue = null) => {
        if (Util.isString(msg)) {
            try {
                return rapportOptions.parse(msg);
            } catch (err) {
                if (defaultValue) {
                    return defaultValue;
                }

                throw err;
            }
        }
        return msg;
    },

    /**
     * Determines if a parameter is a function.
     *
     * @param obj The parameter to check.
     * @return {boolean} True if function, false otherwise.
     */
    isFunction: (obj) => {
        return typeof obj === 'function';
    },

    /**
     * Determines if a parameter is a string.
     *
     * @param str The parameter to check.
     * @return {boolean} True if string, false otherwise.
     */
    isString: (str) => {
        return typeof str === 'string';
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
     * Escapes a string so it can be used in regex.
     *
     * @param {string} string The string to escape.
     * @return {string} The escaped string.
     */
    regexEscape: (string) => {
        return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    }
};

module.exports = Util;
