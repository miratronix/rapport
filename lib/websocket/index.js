'use strict';

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
 * Wraps a standard socket with Rapport functionality.
 *
 * @param {object} standardSocket The standardized socket.
 * @param {object} requestCache The request cache for the connection.
 * @param {object} options The options for the socket.
 * @return {RapportWrapper} The wrapped socket object.
 */
module.exports = (standardSocket, requestCache, options) => {
    const wrappedSocket = {};

    wrappedSocket.send = require('./send.js').bind(null, standardSocket, options);
    wrappedSocket.close = require('./close.js').bind(null, standardSocket, requestCache, options);

    // Add base request/response functionality
    wrappedSocket.request = require('./request.js').bind(null, wrappedSocket, requestCache, options);
    wrappedSocket.respond = require('./respond.js').bind(null, wrappedSocket, options);
    wrappedSocket.respondWithError = require('./respond.with.error.js').bind(null, wrappedSocket, options);

    // Add standard handlers
    wrappedSocket.onOpen = standardSocket.onOpen;
    wrappedSocket.onError = standardSocket.onError;
    wrappedSocket.onMessage = require('./on.message.js').bind(null, standardSocket, wrappedSocket, requestCache, options);
    wrappedSocket.onClose = require('./on.close.js').bind(null, standardSocket, requestCache, options);

    return wrappedSocket;
};
