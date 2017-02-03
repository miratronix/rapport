'use strict';

const options = require('../options.js');
const requestCache = require('../request.cache.js');

/**
 * adds an onClose handler to the socket.
 *
 * @param {object} standardSocket the standardized socket.
 * @param {function} handler function to execute on close.
 */
module.exports = (standardSocket, handler) => {
    standardSocket.onClose((code, msg) => {
        let message;

        try {
            message = options.parse(msg);
        } catch (err) {
            message = msg;
        }

        requestCache.rejectAll(code, message);
        handler(message, code);
    });
};
