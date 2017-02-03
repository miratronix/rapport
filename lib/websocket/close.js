'use strict';

const options = require('../options.js');
const requestCache = require('../request.cache.js');

/**
 * Overrides the close function in the standardized websocket.
 *
 * @param {object} standardSocket The standardized websocket.
 * @param {string|object} message The message to close with.
 * @param {number} code The code to close with.
 */
module.exports = (standardSocket, message = 'Socket was closed', code = 1000) => {
    requestCache.rejectAll(code, message);
    standardSocket.close(code, options.stringify(message));
};
