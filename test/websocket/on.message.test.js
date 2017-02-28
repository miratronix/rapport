'use strict';

const util = require('../index.js');
const standardize = require('../../lib/standardize.js');
const wrap = require('../../lib/websocket/index.js');
const createOptions = require('../../lib/options.js');
const createRequestCache = require('../../lib/request.cache.js');

describe('Websocket onMessage()', () => {

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

    it('Responds with an error when an incoming message can\'t be decoded', () => {
        wrappedSocket.onMessage(() => {});
        mockSocket.fire('message', 'broken message');
        mockSocket.messagesSent.should.equal(1);
        options.decodeMessage(mockSocket.lastSentMessage).should.have.a.property('name').that.equals('SyntaxError');
    });

    it('Can handle string messages', () => {
        return new Promise((resolve) => {
            wrappedSocket.onMessage((msg, ws) => {
                msg.isRequest.should.equal(false);
                msg.should.have.a.property('body');
                msg.body.should.equal('Hello world');
                ws.should.deep.equal(wrappedSocket);
                resolve();
            });
            mockSocket.fire('message', JSON.stringify('Hello world'));
        });
    });

    context('Handles regular messages', () => {

        it('Calls the specified handler', () => {
            return new Promise((resolve) => {
                wrappedSocket.onMessage((msg, ws) => {
                    msg.isRequest.should.equal(false);
                    msg.should.have.a.property('body');
                    msg.body.should.have.a.property('hello').that.equals('world');
                    ws.should.deep.equal(wrappedSocket);
                    resolve();
                });
                mockSocket.fire('message', JSON.stringify({ hello: 'world' }));
            });
        });
    });

    context('Handles responses', () => {

        it('Resolves an outstanding request with a successful response', () => {
            wrappedSocket.onMessage(() => {});
            const promise = new Promise(requestCache.addPromise.bind(null, 'test id'));
            mockSocket.fire('message', JSON.stringify({ responseId: 'test id', body: 'some response' }));
            return promise.should.become('some response');
        });

        it('Rejects an outstanding request with a failed response', () => {
            wrappedSocket.onMessage(() => {});
            const promise = new Promise(requestCache.addPromise.bind(null, 'test id'));
            mockSocket.fire('message', JSON.stringify({ responseId: 'test id', error: 'some error' }));
            return promise.should.be.rejectedWith('some error');
        });

        it('Rejects an outstanding request with a broken response', () => {
            wrappedSocket.onMessage(() => {});
            const promise = new Promise(requestCache.addPromise.bind(null, 'test id'));
            mockSocket.fire('message', JSON.stringify({ responseId: 'test id' }));
            return promise.should.be.rejectedWith('Got a response object without a response or error property');
        });
    });

    context('Handles requests', () => {

        it('Calls the specified handler', () => {
            return new Promise((resolve) => {
                wrappedSocket.onMessage((msg) => {
                    msg.isRequest.should.equal(true);
                    msg.should.have.a.property('id').equals('hey');
                    msg.should.have.a.property('body').that.equals('yeah');
                    resolve();
                });
                mockSocket.fire('message', JSON.stringify({ requestId: 'hey', body: 'yeah' }));
            });
        });

        it('Creates a response object', () => {
            return new Promise((resolve) => {
                wrappedSocket.onMessage((msg, res) => {
                    res.should.have.a.property('sent').that.equals(false);
                    res.should.have.a.property('send').that.equals(wrappedSocket.send);
                    res.should.have.a.property('respond').that.is.a('function');
                    res.should.have.a.property('respondWithError').that.is.a('function');
                    resolve();
                });
                mockSocket.fire('message', JSON.stringify({ requestId: 'hey', body: 'yeah' }));
            });
        });

        it('Creates a response object that can respond', () => {
            return new Promise((resolve) => {
                wrappedSocket.onMessage((msg, res) => {
                    res.respond('yup');
                    options.decodeMessage(mockSocket.lastSentMessage).should.have.a.property('responseId').that.equals('hey');
                    options.decodeMessage(mockSocket.lastSentMessage).should.have.a.property('body').that.equals('yup');
                    res.sent.should.equal(true);
                    mockSocket.messagesSent.should.equal(1);
                    resolve();
                });
                mockSocket.fire('message', JSON.stringify({ requestId: 'hey', body: 'yeah' }));
            });
        });

        it('Creates a response object that can respond with an error', () => {
            return new Promise((resolve) => {
                wrappedSocket.onMessage((msg, res) => {
                    res.respondWithError('error');
                    options.decodeMessage(mockSocket.lastSentMessage).should.have.a.property('responseId').that.equals('hey');
                    options.decodeMessage(mockSocket.lastSentMessage).should.have.a.property('error').that.equals('error');
                    res.sent.should.equal(true);
                    mockSocket.messagesSent.should.equal(1);
                    resolve();
                });
                mockSocket.fire('message', JSON.stringify({ requestId: 'hey', body: 'yeah' }));
            });
        });
    });
});
