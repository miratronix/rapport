'use strict';

/**
 * Responds to a request.
 *
 * @param {object} wrappedSocket The wrapped socket.
 * @param {object} options Websocket options.
 * @param {string} responseId The response ID.
 * @param {*} body The body of the response to send.
 */
module.exports = (wrappedSocket, options, responseId, body) => {
    wrappedSocket.send({
        _res: responseId,
        _b: body
    });
};
