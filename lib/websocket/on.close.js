'use strict';

const util = require('../util.js');
const requestCache = require('../request.cache.js');

/**
 * Adds an onClose handler to the socket.
 *
 * @param {object} standardSocket The standardized socket.
 * @param {function} handler Function to execute on close.
 */
module.exports = (standardSocket, handler) => {
    standardSocket.onClose((code, msg) => {
        const message = util.parse(msg, msg);
        requestCache.rejectAll(code, message);
        handler(message, code);
    });
};
