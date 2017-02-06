'use strict';

const util = require('../index.js');
const standardize = require('../../lib/standardize.js');
const wrap = require('../../lib/websocket/index.js');

const wrappedSocket = wrap(standardize(util.mockNodeWebsocket()), {}, {});

describe('Websocket Wrapper', () => {

    it('Wraps all standard socket functions', () => {
        wrappedSocket.should.have.a.property('_functions').that.is.a('object');
        wrappedSocket._functions.should.have.a.property('send').that.is.a('function');
        wrappedSocket._functions.should.have.a.property('close').that.is.a('function');
        wrappedSocket._functions.should.have.a.property('onOpen').that.is.a('function');
        wrappedSocket._functions.should.have.a.property('onError').that.is.a('function');
        wrappedSocket._functions.should.have.a.property('onMessage').that.is.a('function');
        wrappedSocket._functions.should.have.a.property('onClose').that.is.a('function');

        wrappedSocket.should.have.a.property('send').that.is.a('function');
        wrappedSocket.should.have.a.property('close').that.is.a('function');
        wrappedSocket.should.have.a.property('onOpen').that.is.a('function');
        wrappedSocket.should.have.a.property('onError').that.is.a('function');
        wrappedSocket.should.have.a.property('onMessage').that.is.a('function');
        wrappedSocket.should.have.a.property('onClose').that.is.a('function');
    });

    it('Adds request, respond, and respondWithError functions', () => {
        wrappedSocket.should.have.a.property('_functions').that.is.a('object');
        wrappedSocket._functions.should.have.a.property('request').that.is.a('function');
        wrappedSocket._functions.should.have.a.property('respond').that.is.a('function');
        wrappedSocket._functions.should.have.a.property('respondWithError').that.is.a('function');

        wrappedSocket.should.have.a.property('request').that.is.a('function');
        wrappedSocket.should.have.a.property('respond').that.is.a('function');
        wrappedSocket.should.have.a.property('respondWithError').that.is.a('function');
    });
});
