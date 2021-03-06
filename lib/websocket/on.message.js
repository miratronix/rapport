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
const handleResponse = (standardSocket, wrappedSocket, requestCache, options, responseId, response, error) => {
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
const handleRequest = (standardSocket, wrappedSocket, requestCache, options, requestId, request, handler) => {
    handler(
        onMessage.createRequestObject(standardSocket, wrappedSocket, requestCache, options, request, requestId),
        onMessage.createResponderObject(standardSocket, wrappedSocket, requestCache, options, requestId)
    );
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
const handleMessage = (standardSocket, wrappedSocket, requestCache, options, msg, handler) => {
    handler(onMessage.createRequestObject(standardSocket, wrappedSocket, requestCache, options, msg), wrappedSocket);
};

/**
 * Creates a request object, which is passed to handlers.
 *
 * @param {object} standardSocket The standard socket.
 * @param {object} wrappedSocket The wrapped socket.
 * @param {object} requestCache The request cache.
 * @param {object} options Websocket options.
 * @param {message} body The request body.
 * @param {string} [requestId] The request ID.
 * @return {object} The request object.
 */
const createRequestObject = (standardSocket, wrappedSocket, requestCache, options, body, requestId) => {
    if (!requestId) {
        return {
            isRequest: false,
            body
        };
    }

    return {
        id: requestId,
        isRequest: true,
        body
    };
};

/**
 * Creates a responder object, which is passed with the message to handlers.
 *
 * @param {object} standardSocket The standard socket.
 * @param {object} wrappedSocket The wrapped socket.
 * @param {object} requestCache The request cache.
 * @param {object} options Websocket options.
 * @param {string} requestId The request ID.
 * @return {object} The responder object.
 */
const createResponderObject = (standardSocket, wrappedSocket, requestCache, options, requestId) => {
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

// Create a copy of the on message function with everything attached to it, so replacing the copies underlying functions
// doesn't overwrite them for all subsequent sockets.
module.exports = () => {
    const onMessageFunction = onMessage;
    onMessageFunction.handleResponse = handleResponse;
    onMessageFunction.handleRequest = handleRequest;
    onMessageFunction.handleMessage = handleMessage;
    onMessageFunction.createRequestObject = createRequestObject;
    onMessageFunction.createResponderObject = createResponderObject;
    return onMessageFunction;
};
