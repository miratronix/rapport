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

    it('Wraps the response and sends it', () => {
        wrappedSocket.respondWithError('some ID', 'Some error');
        mockSocket.messagesSent.should.equal(1);
        const message = JSON.parse(mockSocket.lastSentMessage);

        message.should.have.a.property('responseId').that.equals('some ID');
        message.should.have.a.property('error').that.equals('Some error');
    });
});
