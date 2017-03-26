'use strict';

const util = require('../index.js');
const standardize = require('../../lib/standardize.js');
const wrap = require('../../lib/websocket/index.js');
const createOptions = require('../../lib/options.js');
const createRequestCache = require('../../lib/request.cache.js');

describe('Websocket respond()', () => {

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

    it('Wraps the response and sends it', () => {
        wrappedSocket.respond('some ID', 'Some response');
        mockSocket.messagesSent.should.equal(1);
        const message = JSON.parse(mockSocket.lastSentMessage);

        message.should.have.a.property('_rs').that.equals('some ID');
        message.should.have.a.property('_b').that.equals('Some response');
    });

    it('Wraps an object response and sends it', () => {
        wrappedSocket.respond('some ID', { message: 'Some response' });
        mockSocket.messagesSent.should.equal(1);
        const message = JSON.parse(mockSocket.lastSentMessage);

        message.should.have.a.property('_rs').that.equals('some ID');
        message.should.have.a.property('_b');
        message._b.should.have.a.property('message').that.equals('Some response');
    });
});
