'use strict';

/**
 * Responds to a request with an error.
 *
 * @param {object} wrappedSocket The wrapped socket.
 * @param {object} options Websocket options.
 * @param {string} responseId The response ID.
 * @param {*} error The error response to send.
 */
module.exports = (wrappedSocket, options, responseId, error) => {
    wrappedSocket.send({
        _res: responseId,
        _e: error
    });
};
