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

    const functions = {
        send: require('./send.js'),
        close: require('./close.js'),

        request: require('./request.js'),
        respond: require('./respond.js'),
        respondWithError: require('./respond.with.error.js'),

        onOpen: standardSocket.onOpen,
        onError: standardSocket.onError,

        onMessage: require('./on.message.js'),
        onClose: require('./on.close.js')
    };

    wrappedSocket.send = functions.send.bind(null, standardSocket, options);
    wrappedSocket.close = functions.close.bind(null, standardSocket, requestCache, options);

    // Add base request/response functionality
    wrappedSocket.request = functions.request.bind(null, wrappedSocket, requestCache, options);
    wrappedSocket.respond = functions.respond.bind(null, wrappedSocket, options);
    wrappedSocket.respondWithError = functions.respondWithError.bind(null, wrappedSocket, options);

    // Add standard handlers
    wrappedSocket.onOpen = functions.onOpen;
    wrappedSocket.onError = functions.onError;
    wrappedSocket.onMessage = functions.onMessage.bind(null, standardSocket, wrappedSocket, requestCache, options);
    wrappedSocket.onClose = functions.onClose.bind(null, standardSocket, requestCache, options);

    // Store the raw functions so they're easier to override
    wrappedSocket._functions = functions;

    return wrappedSocket;
};
