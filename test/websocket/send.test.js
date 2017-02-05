'use strict';

const util = require('../index.js');
const standardize = require('../../lib/standardize.js');
const wrap = require('../../lib/websocket/index.js');

const options = require('../../lib/options.js')();
const requestCache = require('../../lib/request.cache.js')();

describe('Websocket Send', () => {

    let mockSocket;
    let wrappedSocket;

    beforeEach(() => {
        mockSocket = util.mockNodeWebsocket();
        wrappedSocket = wrap(standardize(mockSocket), requestCache, options);
    });

    it('Stringifies the message before sending', () => {
        const obj = { hello: 'world' };
        wrappedSocket.send(obj);
        mockSocket.messagesSent.should.equal(1);
        mockSocket.lastSentMessage.should.equal(options.stringify(obj));
    });
});
