'use strict';

/**
 * Wraps a standard socket with Rapport functionality.
 *
 * @param {object} standardSocket The standardized socket.
 * @return {object} The wrapped socket object.
 */
module.exports = (standardSocket) => {
    const wrappedSocket = {};

    wrappedSocket.send = require('./send.js').bind(null, standardSocket);
    wrappedSocket.close = require('./close.js').bind(null, standardSocket);

    wrappedSocket.request = require('./request.js').bind(null, wrappedSocket);
    wrappedSocket.respond = require('./respond.js').bind(null, wrappedSocket);
    wrappedSocket.respondWithError = require('./respond.with.error.js').bind(null, wrappedSocket);

    wrappedSocket.onOpen = standardSocket.onOpen;
    wrappedSocket.onError = standardSocket.onError;
    wrappedSocket.onMessage = require('./on.message.js').bind(null, standardSocket, wrappedSocket);
    wrappedSocket.onClose = require('./on.close.js').bind(null, standardSocket);

    return wrappedSocket;
};
