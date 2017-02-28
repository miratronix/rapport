'use strict';

/**
 * Overrides the close function in the standardized websocket.
 *
 * @param {object} standardSocket The standardized websocket.
 * @param {object} requestCache The request cache to use.
 * @param {object} options Websocket options.
 * @param {*} [message=Socket was closed] The message to close with.
 * @param {number} [code=1000] The code to close with.
 */
module.exports = (standardSocket, requestCache, options, message = 'Socket was closed', code = 1000) => {
    requestCache.rejectAll('Websocket was closed locally', code, message);
    standardSocket.close(code, options.encodeCloseMessage(message));
};
