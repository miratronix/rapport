'use strict';

/**
 * Adds a on message handler to the socket.
 *
 * @param {object} standardSocket The standard socket.
 * @param {object} wrappedSocket The wrapped socket.
 * @param {object} requestCache The request cache to use.
 * @param {object} options Websocket options.
 * @param {function} handler The message handler.
 */
const onMessage = (standardSocket, wrappedSocket, requestCache, options, handler) => {
    standardSocket.onMessage((msg) => {
        let message;

        try {
            message = options.decodeMessage(msg);
        } catch (err) {
            wrappedSocket.send(err);
            return;
        }

        if (message._rs) {
            onMessage.handleResponse(standardSocket, wrappedSocket, requestCache, options, message._rs, message._b, message._e);
        } else if (message._rq) {
            onMessage.handleRequest(standardSocket, wrappedSocket, requestCache, options, message._rq, message._b, handler);
        } else {
            onMessage.handleMessage(standardSocket, wrappedSocket, requestCache, options, message, handler);
        }
    });
};

/**
 * Handles an incoming response.
 *
 * @param {object} standardSocket The standard socket.
 * @param {object} wrappedSocket The wrapped socket.
 * @param {object} requestCache The request cache to use.
 * @param {object} options Websocket options.
 * @param {string} responseId The response id.
 * @param {*} [response] The response.
 * @param {*} [error] The error object
 */
onMessage.handleResponse = (standardSocket, wrappedSocket, requestCache, options, responseId, response, error) => {
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
 * @param {object} standardSocket The standard socket.
 * @param {object} wrappedSocket The wrapped socket.
 * @param {object} requestCache The request cache to use.
 * @param {object} options Websocket options.
 * @param {string} requestId The request ID.
 * @param {*} request The request.
 * @param {function} handler The handler function.
 */
onMessage.handleRequest = (standardSocket, wrappedSocket, requestCache, options, requestId, request, handler) => {

    const req = {
        id: requestId,
        isRequest: true,
        body: request
    };

    handler(req, onMessage.createResponderObject(standardSocket, wrappedSocket, requestCache, options, requestId));
};

/**
 * Handles a standard message.
 *
 * @param {object} standardSocket The standard socket.
 * @param {object} wrappedSocket The wrapped socket.
 * @param {object} requestCache The request cache to use.
 * @param {object} options Websocket options.
 * @param {*} msg The message.
 * @param {function} handler The handler function
 */
onMessage.handleMessage = (standardSocket, wrappedSocket, requestCache, options, msg, handler) => {

    const req = {
        isRequest: false,
        body: msg
    };

    handler(req, wrappedSocket);
};

/**
 * Creates a responder object, which is passed with the message to handlers.
 *
 * @param standardSocket The standard socket.
 * @param wrappedSocket The wrapped socket.
 * @param requestCache The request cache.
 * @param options Websocket options.
 * @param requestId The request ID.
 * @return {object} The responder object.
 */
onMessage.createResponderObject = (standardSocket, wrappedSocket, requestCache, options, requestId) => {
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

    return res;
};

module.exports = onMessage;
