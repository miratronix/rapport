'use strict';

const util = require('./util.js');

const defaults = {

    /**
     * Stringifies a message.
     *
     * @param {*} msg The message.
     * @return {string} The string message.
     */
    stringify: (msg) => {
        if (msg instanceof Error) {
            return JSON.stringify({
                name: msg.name,
                message: msg.message,
                stack: msg.stack
            });
        }

        return JSON.stringify(msg);
    },

    /**
     * Parses a message.
     *
     * @param {string} msg The message.
     * @return {*} The parsed message.
     */
    parse: (msg) => {
        if (util.isString(msg)) {
            return JSON.parse(msg);
        }

        return msg;
    },

    /**
     * Defines the promise implementation.
     */
    Promise: (typeof Promise !== 'undefined') ? Promise : null,

    /**
     * Generates a request ID.
     *
     * @return {string}
     */
    generateRequestId: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const d = Date.now();
            const r = (d + Math.random() * 16) % 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
};

/**
 * Creates an options object with the supplied options.
 *
 * @param {...object} options The options objects to use.
 * @return {object} A finalized options object.
 */
module.exports = (...options) => {
    const returnedOpts = {};
    const opts = [...options, defaults];

    for (let i = 0; i < opts.length; i++) {
        for (const key in opts[i]) {
            if (opts[i].hasOwnProperty(key) && !returnedOpts[key]) {
                returnedOpts[key] = opts[i][key];
            }
        }
    }

    return returnedOpts;
};
