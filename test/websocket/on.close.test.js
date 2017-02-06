'use strict';

const util = require('../index.js');
const standardize = require('../../lib/standardize.js');
const wrap = require('../../lib/websocket/index.js');
const createOptions = require('../../lib/options.js');
const createRequestCache = require('../../lib/request.cache.js');

describe('Websocket onClose()', () => {

    let options;
    let requestCache;
    let mockSocket;
    let wrappedSocket;

    beforeEach(() => {
        options = createOptions();
        requestCache = createRequestCache();
        mockSocket = util.mockNodeWebsocket();
        wrappedSocket = wrap(standardize(mockSocket), requestCache, options);
    });

    it('Rejects all outstanding requests', () => {
        wrappedSocket.onClose(() => {});
        const promise = new Promise(requestCache.addPromise.bind(null, 'promise test'));
        mockSocket.fire('close', 1000, 'test');
        return promise.should.be.rejectedWith(Error, 'Websocket was closed: with code 1000 and message "test"');
    });

    it('Calls the specified handler', () => {
        return new Promise((resolve) => {
            wrappedSocket.onClose(resolve);
            mockSocket.fire('close');
        });
    });

    it('Passes the code and message to the specified handler', () => {
        return new Promise((resolve) => {
            wrappedSocket.onClose((msg, code) => {
                msg.should.equal('Goodbye');
                code.should.equal(1000);
                resolve();
            });
            mockSocket.fire('close', 1000, 'Goodbye');
        });
    });

    it('Attempts to parse the message before passing it to the handler', () => {
        return new Promise((resolve) => {
            wrappedSocket.onClose((msg) => {
                msg.should.have.a.property('goodbye').that.equals('world');
                resolve();
            });
            mockSocket.fire('close', 1000, JSON.stringify({ goodbye: 'world' }));
        });
    });
});
