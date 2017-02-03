'use strict';

/**
 * Does a DELETE request on the socket.
 *
 * @param {object} wrappedSocket The wrapped socket.
 * @param {string} route The route to make the request on.
 * @param {*} body The request body.
 * @param {number} [timeout] Timeout for the request in milliseconds.
 * @param {function} [cb] The callback to invoke when the request is resolved.
 * @return {Promise|undefined} The request promise if promises are enabled, or undefined.
 */
module.exports = (wrappedSocket, route, body, timeout, cb) => {
    return wrappedSocket.http('delete', route, body, timeout, cb);
};
