'use strict';

/**
 * Responds to a request.
 *
 * @param {object} wrappedSocket The wrapped socket.
 * @param {string} responseId The response ID.
 * @param {*} response The response to send.
 */
module.exports = (wrappedSocket, responseId, response) => {
    wrappedSocket.send({ responseId, response });
};
