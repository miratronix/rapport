'use strict';

const util = require('../index.js');
const standardize = require('../../lib/standardize.js');
const wrap = require('../../lib/websocket/index.js');
const createOptions = require('../../lib/options.js');
const createRequestCache = require('../../lib/request.cache.js');

describe('Websocket respondWithError()', () => {

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

    it('Wraps a string response and sends it', () => {
        wrappedSocket.respondWithError('some ID', 'Some error');
        mockSocket.messagesSent.should.equal(1);
        const message = JSON.parse(mockSocket.lastSentMessage);

        message.should.have.a.property('_rs').that.equals('some ID');
        message.should.have.a.property('_e').that.equals('Some error');
    });

    it('Wraps an object and sends it', () => {
        wrappedSocket.respondWithError('some ID', { message: 'error' });
        mockSocket.messagesSent.should.equal(1);
        const message = JSON.parse(mockSocket.lastSentMessage);

        message.should.have.a.property('_rs').that.equals('some ID');
        message.should.have.a.property('_e').that.is.an('object');
        message._e.should.have.a.property('message').that.equals('error');
    });

    it('Wraps an error object and sends it', () => {
        wrappedSocket.respondWithError('some ID', new Error('error message'));
        mockSocket.messagesSent.should.equal(1);
        const message = JSON.parse(mockSocket.lastSentMessage);

        message.should.have.a.property('_rs').that.equals('some ID');
        message.should.have.a.property('_e').that.is.an('object');
        message._e.should.have.a.property('message').that.equals('error message');
    });
});
