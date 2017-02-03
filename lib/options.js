'use strict';

const util = require('./util.js');

/**
 * Defines library-wide options.
 */
const Options = {

    /**
     * Initializes the options object from the supplied user options.
     *
     * @param {object} userOptions The user options.
     */
    initialize: (userOptions) => {
        if (userOptions) {
            if (userOptions.stringify) {
                Options.stringify = userOptions.stringify;
            }

            if (userOptions.parse) {
                Options.parse = userOptions.parse;
            }

            if (userOptions.Promise) {
                Options.Promise = userOptions.Promise;
            }

            if (userOptions.generateRequestId) {
                Options.generateRequestId = userOptions.generateRequestId;
            }
        }
    },

    /**
     * Stringifies a message.
     *
     * @param {*} msg The message.
     * @return {string} The string message.
     */
    stringify: (msg) => {
        if (util.isString(msg)) {
            return msg;
        }

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

module.exports = Options;
