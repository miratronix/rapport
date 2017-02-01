'use strict';

/**
 * Responds to a request.
 *
 * @param {object} wrappedSocket The wrapped socket.
 * @param {string} responseId The response ID.
 * @param {*} body The body of the response to send.
 */
module.exports = (wrappedSocket, responseId, body) => {
    wrappedSocket.send({ responseId, body });
};
