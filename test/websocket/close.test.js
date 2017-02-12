'use strict';

const util = require('../index.js');
const standardize = require('../../lib/standardize.js');
const wrap = require('../../lib/websocket/index.js');
const createOptions = require('../../lib/options.js');
const createRequestCache = require('../../lib/request.cache.js');

describe('Websocket close()', () => {

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
        const promise = new Promise(requestCache.addPromise.bind(null, 'promise test'));
        wrappedSocket.close();
        return promise.should.be.rejectedWith(Error, 'Websocket was closed: with code 1000 and message Socket was closed');
    });

    it('Defaults the close code and message', () => {
        wrappedSocket.close();
        mockSocket.closed.should.equal(true);
        mockSocket.closeCode.should.equal(1000);
        mockSocket.closeMessage.should.equal('"Socket was closed"');
    });

    it('Closes the underlying socket with the specified code and message', () => {
        wrappedSocket.close('Closed', 200);
        mockSocket.closed.should.equal(true);
        mockSocket.closeCode.should.equal(200);
        mockSocket.closeMessage.should.equal('"Closed"');
    });

    it('Stringifies the close message', () => {
        const msg = { goodbye: 'world' };
        wrappedSocket.close(msg);
        mockSocket.closed.should.equal(true);
        mockSocket.closeCode.should.equal(1000);
        mockSocket.closeMessage.should.equal(JSON.stringify(msg));
    });

    it('Stringifies a close Error', () => {
        const msg = new Error('closed');
        wrappedSocket.close(msg);
        mockSocket.closed.should.equal(true);
        mockSocket.closeCode.should.equal(1000);
        JSON.parse(mockSocket.closeMessage).should.have.a.property('message').that.equals('closed');
    });
});
