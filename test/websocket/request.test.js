'use strict';

const util = require('../index.js');
const standardize = require('../../lib/standardize.js');
const wrap = require('../../lib/websocket/index.js');
const createOptions = require('../../lib/options.js');
const createRequestCache = require('../../lib/request.cache.js');

describe('Websocket request()', () => {

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

    it('Adds a promise to the request cache when no callback is supplied', () => {
        const promise = wrappedSocket.request('Some request');
        const key = Object.keys(requestCache.requests)[0];

        Object.keys(requestCache.requests).length.should.equal(1);
        promise.should.have.a.property('then').that.is.a('function');
        requestCache.requests[key].should.have.a.property('resolve').that.is.a('function');
        requestCache.requests[key].should.have.a.property('reject').that.is.a('function');
    });

    it('Adds a callback to the request cache when a callback is supplied', () => {
        wrappedSocket.request('Some request', 0, () => {});
        const key = Object.keys(requestCache.requests)[0];

        Object.keys(requestCache.requests).length.should.equal(1);
        requestCache.requests[key].should.have.a.property('cb').that.is.a('function');
    });

    it('Wraps the request before sending', () => {
        wrappedSocket.request('Some request', 0, () => {});
        mockSocket.messagesSent.should.equal(1);
        const message = JSON.parse(mockSocket.lastSentMessage);

        message.should.have.a.property('_req').that.is.a('string');
        message.should.have.a.property('_b').that.equals('Some request');
    });

    it('Adds a timeout if one is specified', () => {
        return wrappedSocket.request('Hello', 10)
            .should.be.rejectedWith(Error, 'Timed out after 10 ms');
    });

    it('Throws an error if a callback is not supplied and there is no Promise object', () => {
        delete options.Promise;
        wrappedSocket = wrap(standardize(mockSocket), requestCache, options);
        (() => {
            wrappedSocket.request('something');
        }).should.throw(Error, 'Can\'t make a request without a Promise implementation or callback');
    });
});
