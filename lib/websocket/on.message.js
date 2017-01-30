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
 * @param {object} router The router to use for dispatching http style requests.
 * @param {string} requestId The request ID.
 * @param {*} request The request.
 * @param {function} handler The handler function.
 */
const handleRequest = (wrappedSocket, router, requestId, request, handler) => {
    const ws = {
        requestId,
        shouldRespond: true,
        hasResponded: false,
        respond: (msg) => {
            ws.hasResponded = true;
            wrappedSocket.respond(requestId, msg);
        },
        respondWithError: (msg) => {
            ws.hasResponded = true;
            wrappedSocket.respondWithError(requestId, msg);
        },
        send: wrappedSocket.send
    };

    if (router && request.verb && request.route) {
        ws.verb = request.verb;
        ws.route = request.route;
        router.dispatch(request.body, ws);
    } else {
        handler(request, ws);
    }
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
 * @param {object} router The router to use for http style requests.
 * @param {function} handler The message handler.
 */
module.exports = (standardSocket, wrappedSocket, router, handler) => {
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
            handleRequest(wrappedSocket, router, message.requestId, message.request, handler);
        } else {
            handleMessage(wrappedSocket, message, handler);
        }
    });
};
