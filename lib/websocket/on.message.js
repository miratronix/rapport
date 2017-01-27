'use strict';

const util = require('../util.js');
const requestCache = require('../request.cache.js');

/**
 * Handles an incoming response.
 *
 * @param {string} responseId The response id.
 * @param {*} [response] The response.
 * @param {*} [error] The error object
 */
const handleResponse = (responseId, response, error) => {
    if (response) {
        requestCache.resolve(responseId, response);
    } else if (error) {
        requestCache.reject(responseId, error);
    } else {
        requestCache.reject(responseId, new Error('Got a response object without a response or error property'));
    }
};

/**
 * Handles an incoming request.
 *
 * @param {object} wrappedSocket The wrapped websocket.
 * @param {string} requestId The request ID.
 * @param {*} request The request.
 * @param {function} handler The handler function.
 */
const handleRequest = (wrappedSocket, requestId, request, handler) => {
    handler(request, {
        requestId,
        shouldRespond: true,
        respond: wrappedSocket.respond.bind(null, requestId),
        respondWithError: wrappedSocket.respondWithError.bind(null, requestId),
        send: wrappedSocket.send
    });
};

/**
 * Handles a standard message.
 *
 * @param {object} wrappedSocket The wrapped socket.
 * @param {*} msg The message.
 * @param {function} handler The handler function
 */
const handleMessage = (wrappedSocket, msg, handler) => {
    handler(msg, {
        shouldRespond: false,
        send: wrappedSocket.send
    });
};

/**
 * Adds a on message handler to the socket.
 *
 * @param {object} standardSocket The standard socket.
 * @param {object} wrappedSocket The wrapped socket.
 * @param {function} handler The message handler.
 */
module.exports = (standardSocket, wrappedSocket, handler) => {
    standardSocket.onMessage((msg) => {
        let message;

        try {
            message = util.parse(msg);
        } catch (err) {
            wrappedSocket.send(err);
            return;
        }

        if (message.responseId) {
            handleResponse(message.responseId, message.response, message.error);
        } else if (message.requestId) {
            handleRequest(wrappedSocket, message.requestId, message.request, handler);
        } else {
            handleMessage(wrappedSocket, message, handler);
        }
    });
};
