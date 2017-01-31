'use strict';

/**
 * Does a GET request on the socket.
 *
 * @param {object} wrappedSocket The wrapped socket.
 * @param {string} route The route to make the request on.
 * @param {object} query The query parameters to supply.
 * @param {number} [timeout] Timeout for the request in milliseconds.
 * @param {function} [cb] The callback to invoke when the request is resolved.
 * @return {Promise|undefined} The request promise if promises are enabled, or undefined.
 */
module.exports = (wrappedSocket, route, query, timeout, cb) => {
    let fullRoute = route;

    if (query) {
        const queryArray = [];
        for (const key in query) {
            if (query.hasOwnProperty(key)) {
                queryArray.push(`${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`);
            }
        }
        fullRoute = `${route}?${queryArray.join('&')}`;
    }

    return wrappedSocket.http('get', fullRoute, undefined, timeout, cb);
};
