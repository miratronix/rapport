'use strict';

/**
 * adds an onClose handler to the socket.
 *
 * @param {object} standardSocket the standardized socket.
 * @param {object} requestCache The request cache to use.
 * @param {object} options Websocket options.
 * @param {function} handler function to execute on close.
 */
module.exports = (standardSocket, requestCache, options, handler) => {
    standardSocket.onClose((code, msg) => {
        let message;

        try {
            message = options.parse(msg);
        } catch (err) {
            message = msg;
        }

        requestCache.rejectAll(new Error(`Websocket was closed: with code ${code} and message ${options.stringify(message)}`));
        handler(message, code);
    });
};
