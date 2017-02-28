'use strict';

/**
 * Sends a message on ths socket.
 *
 * @param {object} standardSocket The standardized socket.
 * @param {object} options Websocket options.
 * @param {*} message The message to send.
 */
module.exports = (standardSocket, options, message) => {
    standardSocket.send(options.encodeMessage(message));
};
