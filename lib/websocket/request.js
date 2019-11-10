'use strict';

/**
 * Makes a request on the socket.
 *
 * @param {object} wrappedSocket The wrapped socket.
 * @param {object} requestCache The request cache to use.
 * @param {object} options Websocket options.
 * @param {*} body The request body to make.
 * @param {number} [timeout] Timeout for the request in milliseconds.
 * @param {function} [cb] The callback to invoke when the request is resolved.
 * @return {Promise|undefined} The request promise if promises are enabled, or undefined.
 */
module.exports = (wrappedSocket, requestCache, options, body, timeout, cb) => {

    const wrappedRequest = {
        _rq: options.generateRequestId(),
        _b: body
    };

    // Set up the timeout if required
    if (timeout) {
        setTimeout(() => {
            requestCache.reject(wrappedRequest._rq, new Error(`Timed out after ${timeout} ms`));
        }, timeout);
    }

    // Set up a function for attempting the send
    const attemptSend = (wrappedRequest) => {
        try {
            wrappedSocket.send(wrappedRequest);
        } catch (err) {
            requestCache.reject(wrappedRequest._rq, err);
        }
    };

    if (cb) {
        requestCache.addCallback(wrappedRequest._rq, cb);
        attemptSend(wrappedRequest);

    } else if (options.Promise) {
        return new options.Promise((resolve, reject) => {
            requestCache.addPromise(wrappedRequest._rq, resolve, reject);
            attemptSend(wrappedRequest);
        });

    } else {
        throw new Error('Can\'t make a request without a Promise implementation or callback');
    }
};
