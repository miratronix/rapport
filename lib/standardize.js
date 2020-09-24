'use strict';

/**
 * Standardizes a browser websocket implementation.
 *
 * @param {object} ws The websocket instance.
 * @return {object} The standardized websocket.
 */
const standardizeBrowserSocket = (ws) => {

    // Set the binaryType to ArrayBuffer to match the node one
    ws.binaryType = 'arraybuffer';

    return {
        onOpen: (handler) => {
            ws.onopen = handler;
        },
        onClose: (handler) => {
            ws.onclose = (event) => {
                if (event) {
                    return handler(event.code, event.reason);
                }
                return handler(1006, 'Socket was closed without a close event');
            };
        },
        onError: (handler) => {
            ws.onerror = handler;
        },
        onMessage: (handler) => {
            ws.onmessage = (msg) => {
                handler(msg.data);
            };
        },
        send: ws.send.bind(ws),
        close: ws.close.bind(ws),
        socket: ws
    };
};

/**
 * Standardizes a node event emitter based websocket implementation.
 *
 * @param {object} ws The websocket instance.
 * @return {object} The standardized websocket.
 */
const standardizeNodeSocket = (ws) => {

    // Create a helper function for ensuring we only have one handler per event type
    const oneHandler = (standardized, oldHandler, event, handler) => {

        // Remove the previously attached handler if there is one
        if (standardized[oldHandler]) {
            ws.removeEventListener(event, standardized[oldHandler]);
        }

        // Save the new handler and attach it to the websocket
        standardized[oldHandler] = handler;
        ws.on(event, handler);
    };

    const standardized = {

        // Keep the current event handlers on hand so we can replace them
        _openHandler: null,
        _closeHandler: null,
        _errorHandler: null,
        _messageHandler: null,

        onOpen: (handler) => oneHandler(standardized, '_openHandler', 'open', handler),
        onClose: (handler) => oneHandler(standardized, '_closeHandler', 'close', handler),
        onError: (handler) => oneHandler(standardized, '_errorHandler', 'error', handler),
        onMessage: (handler) => oneHandler(standardized, '_messageHandler', 'message', handler),
        send: ws.send.bind(ws),
        close: ws.close.bind(ws),
        socket: ws,
    };

    return standardized;
};

/**
 * Standardizes a websocket implementation.
 *
 * @param {object} ws The websocket instance.
 * @return {object} The standardized websocket instance.
 */
module.exports = (ws) => {
    if (ws.on) {
        return standardizeNodeSocket(ws);
    }
    return standardizeBrowserSocket(ws);
};
