'use strict';

/**
 * Overrides the close function in the standardized websocket.
 *
 * @param {object} standardSocket The standardized websocket.
 * @param {object} requestCache The request cache to use.
 * @param {object} options Websocket options.
 * @param {string|object} message The message to close with.
 * @param {number} code The code to close with.
 */
module.exports = (standardSocket, requestCache, options, message = 'Socket was closed', code = 1000) => {
    requestCache.rejectAll(new Error(`Websocket was closed: with code ${code} and message ${message}`));
    standardSocket.close(code, options.stringify(message));
};
