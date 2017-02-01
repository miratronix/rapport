'use strict';

const standardizeSocket = require('./standardize.js');
const wrapSocket = require('./websocket/index.js');
const opts = require('./options.js');
const util = require('./util.js');

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
         * Creates a rapport router.
         */
        Router: require('./router.js'),

        /**
         * Creates a rapport websocket connection.
         *
         * @param {string} url The URL to connect to.
         * @param {object} [opts] Options for the websocket.
         * @param {*} [opts.ws] Websocket implementation specific options.
         * @param {object} [opts.router] The WS router to use.
         * @return {RapportWrapper} Wrapped WS object.
         */
        create: (url, opts) => {
            let wsOpts;

            // If we have an options object, pluck out the ws property for passing to the websocket itself. The rest of
            // the options are rapport specific options for this socket.
            if (opts && util.isObject(opts)) {
                wsOpts = opts.ws;
                delete opts.ws;
            }

            return rapport.wrap(new wsImplementation(url, wsOpts), opts);
        },

        /**
         * Wraps a WS object for request/response functionality.
         *
         * @param {object} websocket Websocket to wrap.
         * @param {object} [opts] Options for the websocket.
         * @param {object} [opts.router] The WS router to use.
         * @return {RapportWrapper} The wrapped WS object.
         */
        wrap: (websocket, opts) => {

            if (opts && opts.router && !util.isObject(opts.router) && !util.isFunction(opts.router.handle)) {
                throw new Error('Please supply a rapport router as the router property');
            }

            return wrapSocket(standardizeSocket(websocket), opts);
        }
    };

    return rapport;
};

if (!(typeof window === 'undefined')) {
    window.Rapport = Rapport;
}

if (!(typeof module === 'undefined')) {
    module.exports = Rapport;
}
