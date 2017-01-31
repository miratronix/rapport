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
 * Handles an HTTP style request.
 *
 * @param {object} wrappedSocket The wrapped websocket.
 * @param {object} router The rapport router.
 * @param {string} requestId The request ID.
 * @param {*} request The request.
 */
const handleHttpRequest = (wrappedSocket, router, requestId, request) => {

    const req = {
        id: requestId,
        verb: request.verb,
        route: request.route,
        body: request
    };

    const res = {
        _status: 200,
        sent: false,
        status: (status) => {
            res._status = status;
            return res;
        },
        respond: (msg) => {
            res.sent = true;
            wrappedSocket.respond(requestId, msg);
        },
        respondWithError: (msg) => {
            res.sent = true;
            wrappedSocket.respondWithError(requestId, msg);
        },
        send: (body) => {
            const response = { status: res._status, body };

            if (res._status >= 200 && res._status < 300) {
                res.respond(response);
            } else {
                res.respondWithError(response);
            }
        }
    };

    router.dispatch(req, res);
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

    const req = {
        id: requestId,
        isRequest: true,
        body: request
    };

    const res = {
        sent: false,
        respond: (msg) => {
            res.sent = true;
            wrappedSocket.respond(requestId, msg);
        },
        respondWithError: (msg) => {
            res.sent = true;
            wrappedSocket.respondWithError(requestId, msg);
        },
        send: wrappedSocket.send
    };

    handler(req, res);
};

/**
 * Handles a standard message.
 *
 * @param {object} wrappedSocket The wrapped socket.
 * @param {*} msg The message.
 * @param {function} handler The handler function
 */
const handleMessage = (wrappedSocket, msg, handler) => {

    const req = {
        isRequest: false,
        body: msg
    };

    handler(req, wrappedSocket);
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
            if (router && message.request && message.request.verb && message.request.route) {
                handleHttpRequest(wrappedSocket, router, message.requestId, message.request);
            } else {
                handleRequest(wrappedSocket, message.requestId, message.request, handler);
            }
        } else {
            handleMessage(wrappedSocket, message, handler);
        }
    });
};
