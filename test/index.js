'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

const TestUtil = {

    mockNodeWebsocket: () => {
        const ws = {
            messagesSent: 0,
            closed: false,
            handlers: {
                message: [],
                close: [],
                error: [],
                open: []
            },

            fire: (type, ...data) => {
                for (let i = 0; i < ws.handlers[type].length; i++) {
                    ws.handlers[type][i](...data);
                }
            },

            send: () => {
                ws.messagesSent++;
            },

            close: () => {
                ws.closed = true;
            },

            on: (type, handler) => {
                ws.handlers[type].push(handler);
            },

            removeAllListeners: (type) => {
                ws.handlers[type] = [];
            }
        };

        return ws;
    },

    mockBrowserWebsocket: () => {
        const ws = {
            messagesSent: 0,
            closed: false,
            onmessage: null,
            onopen: null,
            onerror: null,
            onclose: null,

            fire: (type, ...data) => {
                if (type === 'message') {
                    ws.onmessage(...data);
                } else if (type === 'open') {
                    ws.onopen(...data);
                } else if (type === 'close') {
                    ws.onclose(...data);
                } else {
                    ws.onerror(...data);
                }
            },

            send: () => {
                ws.messagesSent++;
            },

            close: () => {
                ws.closed = true;
            }
        };

        return ws;
    }
};

module.exports = TestUtil;
