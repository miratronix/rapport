'use strict';

const util = require('./util.js');

const requests = {};

/**
 * Controls the outstanding request cache.
 */
const RequestCache = {

    /**
     * Adds a new request with a callback.
     *
     * @param {string} requestId The request ID.
     * @param {function} cb The callback.
     */
    addCallback: (requestId, cb) => {
        requests[requestId] = { cb };
    },

    /**
     * Adds a new request with a Promise.
     *
     * @param {string} requestId The request ID.
     * @param {function} resolve The function to resolve the promise.
     * @param {function} reject The function to reject the promise.
     */
    addPromise: (requestId, resolve, reject) => {
        requests[requestId] = { resolve, reject };
    },

    /**
     * Resolves a request with a response.
     *
     * @param {string} requestId The request ID.
     * @param {*} response The response.
     */
    resolve: (requestId, response) => {
        if (requests[requestId]) {
            if (requests[requestId].cb) {
                requests[requestId].cb(response);
            } else {
                requests[requestId].resolve(response);
            }
            delete requests[requestId];
        }
    },

    /**
     * Rejects a request with an error.
     *
     * @param {string} requestId The request ID.
     * @param {*} error The error.
     */
    reject: (requestId, error) => {
        if (requests[requestId]) {
            if (requests[requestId].cb) {
                requests[requestId].cb(null, error);
            } else {
                requests[requestId].reject(error);
            }
            delete requests[requestId];
        }
    },

    /**
     * Rejects all outstanding requests with a code and message.
     *
     * @param {number} code The code.
     * @param {*} message The message.
     */
    rejectAll: (code, message) => {
        Object.keys(requests).forEach((requestId) => {
            RequestCache.reject(requestId, new Error(`Websocket has been closed: ${code} - ${util.stringify(message)}`));
        });
    }
};

module.exports = RequestCache;
