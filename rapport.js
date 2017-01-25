'use strict';

/**
 * @typedef {object} Rapport
 * @property {function} create
 * @property {function} wrap
 */

/**
 * @typedef {object} RapportWrapper
 * @property {function} onOpen
 * @property {function} onError
 * @property {function} onClose
 * @property {function} onMessage
 * @property {function} close
 * @property {function} send
 * @property {function} request
 */

(function() {

    /**
     * Creates a Rapport instance.
     *
     * @param wsImplementation The websocket implementation to wrap.
     * @param {object} [options] Optional options object.
     * @param {function} [options.stringify] The function to use to convert messages to strings. Defaults to JSON.stringify.
     * @param {function} [options.parse] The function to use to parse messages from strings. Defaults to JSON.parse.
     * @param {function} [options.Promise] The promise implementation to use. Defaults to the ES6 Promise if found.
     * @param {function} [options.generateRequestId] The function to use to generate request IDs. Defaults to a UUID.
     * @return {Rapport} Rapport library.
     */
    function Rapport(wsImplementation, options) {
        const userOptions = options || {};
        const opts = {
            stringify: userOptions.stringify || JSON.stringify,
            parse: userOptions.parse || JSON.parse,
            Promise: userOptions.Promise || (typeof Promise !== 'undefined') ? Promise : null,
            generateRequestId: userOptions.generateRequestId || function() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var d = Date.now();
                    var r = (d + Math.random() * 16) % 16 | 0;
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
            }
        };

        function standardizeWebsocket(ws) {

            // Helper function for event emitter based websockets that limits the handler count to 1
            // This lets us add a default handler without doubling up on messages
            function oneHandler(event, handler) {
                ws.removeAllListeners(event);
                ws.on(event, handler);
            }

            if (ws.on) {
                return {
                    onOpen: oneHandler.bind(null, 'open'),
                    onClose: oneHandler.bind(null, 'close'),
                    onError: oneHandler.bind(null, 'error'),
                    onMessage: oneHandler.bind(null, 'message'),
                    send: ws.send.bind(ws),
                    close: ws.close.bind(ws)
                };
            }
            return {
                onOpen: function onOpen(handler) {
                    ws.onopen = handler;
                },
                onClose: function onClose(handler) {
                    ws.onclose = handler;
                },
                onError: function onError(handler) {
                    ws.onerror = handler;
                },
                onMessage: function onMessage(handler) {
                    ws.onmessage = function onMessage(msg) {
                        handler(msg.data);
                    };
                },
                send: ws.send.bind(ws),
                close: ws.close.bind(ws)
            };
        }

        /**
         * Creates a rapport websocket connection.
         *
         * @param {string} url The URL to connect to.
         * @param {object} opts Options for the websocket.
         * @return {RapportWrapper} Wrapped WS object.
         */
        function create(url, opts) {
            return wrap(new wsImplementation(url, opts));
        }

        /**
         * Wraps a WS object for request/response functionality.
         *
         * @param {object} websocket Websocket to wrap.
         * @return {RapportWrapper} The wrapped WS object.
         */
        function wrap(websocket) {
            const underlyingSocket = standardizeWebsocket(websocket);
            const requests = {};

            function completeRequest(requestId, response, error) {
                if (requests[requestId]) {
                    if (requests[requestId].cb) {
                        if (error) {
                            requests[requestId].cb(null, error);
                        } else {
                            requests[requestId].cb(response);
                        }
                    } else {
                        if (error) {
                            requests[requestId].reject(error);
                        } else {
                            requests[requestId].resolve(response);
                        }
                    }

                    delete requests[requestId];
                }
            }

            function rejectRequestsWithClose(code, message) {
                var requestId;
                for (requestId in Object.keys(requests)) {
                    completeRequest(requestId, null, new Error('Websocket has been closed: ' + code + ' - ' + message));
                }
            }

            /**
             * Sends a message on the socket.
             *
             * @param {*} msg The message.
             */
            function send(msg) {
                if (msg !== null) {
                    if (typeof msg === 'string') {
                        underlyingSocket.send(msg);
                    } else {
                        underlyingSocket.send(opts.stringify(msg));
                    }
                }
            }

            /**
             * Sends a request on the socket.
             *
             * @param {*} request The request to send.
             * @param {int} [timeout] request timeout, in ms.
             * @param {function} cb The callback function to call with response and error if promises are not enabled.
             * @return {Promise|undefined} A promise that resolves when the request is resolved, or undefined if promises are not enabled.
             */
            function request(request, timeout, cb) {
                const req = {
                    requestId: opts.generateRequestId(),
                    request: request
                };

                if (timeout) {
                    setTimeout(function timedOut() {
                        completeRequest(req.requestId, null, new Error('Timed out after ' + timeout + 'ms'));
                    }, timeout);
                }

                if (cb) {
                    requests[req.requestId] = { cb: cb };
                    send(req);

                } else if (opts.Promise) {
                    return new opts.Promise(function(resolve, reject) {
                        requests[req.requestId] = { resolve: resolve, reject: reject };
                        send(req);
                    });

                } else {
                    throw new Error('Can\t make a request without a Promise implementation or callback');
                }
            }

            /**
             * Closes the socket connection.
             *
             * @param {*} message The message to send with the close.
             */
            function close(message) {
                var msg;

                if (message) {
                    if (typeof message === 'string') {
                        msg = message;
                    } else {
                        msg = opts.stringify(message);
                    }
                }

                rejectRequestsWithClose(1000, msg);
                underlyingSocket.close(1000, msg);
            }

            /**
             * Attaches a message handler to the socket.
             *
             * @param {function} handler The handler.
             */
            function onMessage(handler) {
                underlyingSocket.onMessage(function(msg) {
                    var message;

                    try {
                        message = opts.parse(msg);
                    } catch (err) {
                        send(err);
                        return;
                    }

                    if (message.responseId) {
                        completeRequest(message.responseId, message.response, message.error);

                    } else if (message.requestId) {
                        message.request.isRequest = true;
                        message.request.respond = function respond(response) {
                            send({
                                responseId: message.requestId,
                                response: response
                            });
                        };
                        message.request.respondWithError = function respond(error) {
                            send({
                                responseId: message.requestId,
                                error: error
                            });
                        };
                        handler(message.request);

                    } else {
                        message.isRequest = false;
                        handler(message);
                    }
                });
            }

            /**
             * Attaches a close handler to the socket.
             *
             * @param {function} handler The handler.
             */
            function onClose(handler) {
                underlyingSocket.onClose(function(code, msg) {
                    var message;

                    try {
                        message = opts.parse(msg);
                    } catch (err) {
                        message = msg;
                    }

                    rejectRequestsWithClose(code, message);
                    handler(code, message);
                });
            }

            onMessage(function(msg) {});
            onClose(function(code, reason) {});

            return {
                onOpen: underlyingSocket.onOpen,
                onError: underlyingSocket.onError,
                onClose: onClose,
                onMessage: onMessage,
                close: close,
                send: send,
                request: request
            };
        }

        return {
            create: create,
            wrap: wrap
        };
    }

    if (typeof window !== 'undefined') {
        window.Rapport = Rapport;
    }

    if (typeof module !== 'undefined') {
        module.exports = Rapport;
    }
})();
