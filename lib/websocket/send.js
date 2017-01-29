'use strict';

const util = require('../util.js');

/**
 * Sends a message on ths socket.
 *
 * @param {object} standardSocket The standardized socket.
 * @param {*} message The message to send.
 */
module.exports = (standardSocket, message) => {
    standardSocket.send(util.stringify(message));
};
