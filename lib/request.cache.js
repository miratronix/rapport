'use strict';

/**
 * Creates a new outstanding request cache.
 */
module.exports = () => {

    const requestCache = {

        requests: {},

        /**
         * Adds a new request with a callback.
         *
         * @param {string} requestId The request ID.
         * @param {function} cb The callback.
         */
        addCallback: (requestId, cb) => {
            requestCache.requests[requestId] = { cb };
        },

        /**
         * Adds a new request with a Promise.
         *
         * @param {string} requestId The request ID.
         * @param {function} resolve The function to resolve the promise.
         * @param {function} reject The function to reject the promise.
         */
        addPromise: (requestId, resolve, reject) => {
            requestCache.requests[requestId] = { resolve, reject };
        },

        /**
         * Resolves a request with a response.
         *
         * @param {string} requestId The request ID.
         * @param {*} response The response.
         */
        resolve: (requestId, response) => {
            if (requestCache.requests[requestId]) {
                if (requestCache.requests[requestId].cb) {
                    requestCache.requests[requestId].cb(response);
                } else {
                    requestCache.requests[requestId].resolve(response);
                }
                delete requestCache.requests[requestId];
            }
        },

        /**
         * Rejects a request with an error.
         *
         * @param {string} requestId The request ID.
         * @param {*} error The error.
         */
        reject: (requestId, error) => {
            if (requestCache.requests[requestId]) {
                if (requestCache.requests[requestId].cb) {
                    requestCache.requests[requestId].cb(null, error);
                } else {
                    requestCache.requests[requestId].reject(error);
                }
                delete requestCache.requests[requestId];
            }
        },

        /**
         * Rejects all outstanding requests with a message.
         *
         * @param {*} message The message.
         */
        rejectAll: (message) => {
            for (const requestId in requestCache.requests) {
                if (requestCache.requests.hasOwnProperty(requestId)) {
                    requestCache.reject(requestId, message);
                }
            }
        }
    };

    return requestCache;
};
