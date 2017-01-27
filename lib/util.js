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
        if (typeof msg === 'string') {
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
        if (typeof msg === 'string') {
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
    }
};

module.exports = Util;
