'use strict';

/**
 * Overrides the close function in the standardized websocket.
 *
 * @param {object} standardSocket The standardized websocket.
 * @param {object} requestCache The request cache to use.
 * @param {object} options Websocket options.
 * @param {*} [message=Socket was closed] The message to close with.
 * @param {number} [code=1000] The code to close with.
 * @param {number} timeout The timeout for onClose to be called.
 * @param {function} cb The callback to use when not using promises.
 */
module.exports = (standardSocket, requestCache, options, message = 'Socket was closed', code = 1000, timeout = 0, cb) => {

    // Reject all in-flight requests
    requestCache.rejectAll('Websocket was closed locally', code, message);

    // Set up the timeout if required
    if (timeout) {
        setTimeout(() => {
            requestCache.reject(requestCache.closeKey, new Error(`Timed out after ${timeout} ms`));
        }, timeout);
    }

    // If a callback was supplied, add a close callback to the request cache
    if (cb) {
        requestCache.addCallback(requestCache.closeKey, cb);
        standardSocket.close(code, options.encodeCloseMessage(message));

    } else if (options.Promise) {
        return new options.Promise((resolve, reject) => {
            requestCache.addPromise(requestCache.closeKey, resolve, reject);
            standardSocket.close(code, options.encodeCloseMessage(message));
        });

    } else {
        throw new Error('Can\'t close without a Promise implementation or callback');
    }
};
