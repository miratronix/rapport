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
        return promise.should.be.rejectedWith(Error, 'Websocket was closed locally with code: 1000 and message: Socket was closed');
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

    it('Encodes the close message', () => {
        const msg = { goodbye: 'world' };
        wrappedSocket.close(msg);
        mockSocket.closed.should.equal(true);
        mockSocket.closeCode.should.equal(1000);
        mockSocket.closeMessage.should.equal(JSON.stringify(msg));
    });

    it('Encodes a close Error', () => {
        const msg = new Error('closed');
        wrappedSocket.close(msg);
        mockSocket.closed.should.equal(true);
        mockSocket.closeCode.should.equal(1000);
        JSON.parse(mockSocket.closeMessage).should.have.a.property('message').that.equals('closed');
    });

    it('Adds a promise to the request cache when no callback is supplied', () => {
        const promise = wrappedSocket.close('Some message');
        requestCache.requests.should.have.a.property('close');
        promise.should.have.a.property('then').that.is.a('function');
        requestCache.requests['close'].should.have.a.property('resolve').that.is.a('function');
        requestCache.requests['close'].should.have.a.property('reject').that.is.a('function');
    });

    it('Adds a callback to the request cache when a callback is supplied', () => {
        wrappedSocket.close('Some message', 1000, 0, () => {});
        const key = Object.keys(requestCache.requests)[0];

        Object.keys(requestCache.requests).length.should.equal(1);
        requestCache.requests[key].should.have.a.property('cb').that.is.a('function');
    });

    it('Adds a timeout if one is specified', () => {
        return wrappedSocket.close('Hello', 1006, 10)
            .should.be.rejectedWith(Error, 'Timed out after 10 ms');
    });

    it('Throws an error if a callback is not supplied and there is no Promise object', () => {
        delete options.Promise;
        wrappedSocket = wrap(standardize(mockSocket), requestCache, options);
        (() => {
            wrappedSocket.close('something');
        }).should.throw(Error, 'Can\'t close without a Promise implementation or callback');
    });
});
