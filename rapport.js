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
        const opts = {
            stringify: options.stringify || JSON.stringify,
            parse: options.parse || JSON.parse,
            Promise: options.Promise || (typeof Promise !== 'undefined') ? Promise : null,
            generateRequestId: options.generateRequestId || function() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var d = Date.now().getTime();
                    var r = (d + Math.random() * 16) % 16 | 0;
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
            }
        };

        function standardizeWebsocket(ws) {
            if (ws.onopen) {
                return {
                    onOpen: ws.onopen.bind(ws),
                    onClose: ws.onclose.bind(ws),
                    onError: ws.onerror.bind(ws),
                    onMessage: ws.onmessage.bind(ws),
                    send: ws.send.bind(ws),
                    close: ws.close.bind(ws)
                };
            }
            return {
                onOpen: ws.on.bind(ws, 'open'),
                onClose: ws.on.bind(ws, 'close'),
                onError: ws.on.bind(ws, 'error'),
                onMessage: ws.on.bind(ws, 'message'),
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
                    throw new Error('No callback supplied and a Promise implementation could not be found');
                }
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
                        send(new Error('Failed to parse message:' + err.message));
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
                underlyingSocket.onClose(function() {
                    var requestId;
                    for (requestId in Object.keys(requests)) {
                        completeRequest(requestId, null, new Error('Websocket has been closed'));
                    }
                    handler();
                });
            }

            return {
                onOpen: underlyingSocket.onOpen,
                onError: underlyingSocket.onError,
                onClose: onClose,
                onMessage: onMessage,
                close: underlyingSocket.close,
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
