'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

const TestUtil = {

    mockSocketConstructor: function mockSocketConstructor() {
        return TestUtil.mockNodeWebsocket();
    },

    mockNodeWebsocket: () => {
        const ws = {
            messagesSent: 0,
            lastSentMessage: '',

            closed: false,
            closeCode: 0,
            closeMessage: '',

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

            send: (msg) => {
                ws.messagesSent++;
                ws.lastSentMessage = msg;
            },

            close: (code, msg) => {
                ws.closed = true;
                ws.closeCode = code;
                ws.closeMessage = msg;
            },

            on: (type, handler) => {
                ws.handlers[type].push(handler);
            },

            removeEventListener: (type, handler) => {
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
