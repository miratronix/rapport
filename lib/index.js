'use strict';

const standardizeSocket = require('./standardize.js');
const wrapSocket = require('./websocket/index.js');
const opts = require('./options.js');

/**
* @typedef {object} Rapport
* @property {function} create
* @property {function} wrap
*/

/**
* @typedef {object} RapportWrapper
* @property {function} onOpen
* @property {function} onError
* @property {function} onClose
* @property {function} onMessage
* @property {function} close
* @property {function} send
* @property {function} request
* @property {function} respond
* @property {function} respondWithError
*/

/**
 * Creates a Rapport instance.
 *
 * @param wsImplementation The websocket implementation to wrap.
 * @param {object} [options] Optional options object.
 * @param {function} [options.stringify] The function to use to convert messages to strings. Defaults to JSON.stringify.
 * @param {function} [options.parse] The function to use to parse messages from strings. Defaults to JSON.parse.
 * @param {function} [options.Promise] The promise implementation to use. Defaults to the ES6 Promise if found.
 * @param {function} [options.generateRequestId] The function to use to generate request IDs. Defaults to a UUID.
 * @return {Rapport} Rapport library.
 */
const Rapport = (wsImplementation, options) => {
    opts.initialize(options);

    const rapport = {

        /**
         * Creates a rapport websocket connection.
         *
         * @param {string} url The URL to connect to.
         * @param {object} opts Options for the websocket.
         * @return {RapportWrapper} Wrapped WS object.
         */
        create: (url, opts) => {
            return rapport.wrap(new wsImplementation(url, opts));
        },

        /**
         * Wraps a WS object for request/response functionality.
         *
         * @param {object} websocket Websocket to wrap.
         * @return {RapportWrapper} The wrapped WS object.
         */
        wrap: (websocket) => {
            const wrappedSocket = wrapSocket(standardizeSocket(websocket));

            // Add default handlers
            wrappedSocket.onMessage((msg) => {});
            wrappedSocket.onClose((code, reason) => {});

            return wrappedSocket;
        }
    };

    return rapport;
};

if (typeof window !== 'undefined') {
    window.Rapport = Rapport;
}

if (typeof module !== 'undefined') {
    module.exports = Rapport;
}
