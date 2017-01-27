'use strict';

/**
 * Responds to a request with an error.
 *
 * @param {object} wrappedSocket The wrapped socket.
 * @param {string} responseId The response ID.
 * @param {*} error The error response to send.
 */
module.exports = (wrappedSocket, responseId, error) => {
    wrappedSocket.send({ responseId, error });
};
