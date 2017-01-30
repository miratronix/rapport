'use strict';

/**
 * Makes a HTTP-like request on the socket.
 *
 * @param {object} wrappedSocket The wrapped socket.
 * @param {string} verb The request verb to use.
 * @param {string} route The request route.
 * @param {*} body The request body.
 * @param {number} [timeout] Timeout for the request in milliseconds.
 * @param {function} [cb] The callback to invoke when the request is resolved.
 * @return {Promise|undefined} The request promise if promises are enabled, or undefined.
 */
module.exports = (wrappedSocket, verb, route, body, timeout, cb) => {
    return wrappedSocket.request({ verb, route, body }, timeout, cb);
};
