'use strict';

/**
 * Wraps a standard socket with Rapport functionality.
 *
 * @param {object} standardSocket The standardized socket.
 * @param {object} opts The socket specific options.
 * @return {object} The wrapped socket object.
 */
module.exports = (standardSocket, opts) => {
    const router = opts && opts.router ? opts.router : null;

    const wrappedSocket = {};

    wrappedSocket.send = require('./send.js').bind(null, standardSocket);
    wrappedSocket.close = require('./close.js').bind(null, standardSocket);

    // Add base request/response functionality
    wrappedSocket.request = require('./request.js').bind(null, wrappedSocket);
    wrappedSocket.respond = require('./respond.js').bind(null, wrappedSocket);
    wrappedSocket.respondWithError = require('./respond.with.error.js').bind(null, wrappedSocket);

    // Add HTTP-like methods
    wrappedSocket.http = require('./http.js').bind(null, wrappedSocket);
    wrappedSocket.get = require('./get.js').bind(null, wrappedSocket);
    wrappedSocket.post = require('./post.js').bind(null, wrappedSocket);
    wrappedSocket.put = require('./put.js').bind(null, wrappedSocket);
    wrappedSocket.patch = require('./patch.js').bind(null, wrappedSocket);
    wrappedSocket.delete = require('./delete.js').bind(null, wrappedSocket);

    // Add standard handlers
    wrappedSocket.onOpen = standardSocket.onOpen;
    wrappedSocket.onError = standardSocket.onError;
    wrappedSocket.onMessage = require('./on.message.js').bind(null, standardSocket, wrappedSocket, router);
    wrappedSocket.onClose = require('./on.close.js').bind(null, standardSocket);

    // Add default handlers
    wrappedSocket.onMessage((msg) => {});
    wrappedSocket.onClose((code, reason) => {});

    return wrappedSocket;
};
