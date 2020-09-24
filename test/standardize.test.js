'use strict';

const util = require('./index.js');
const standardize = require('../lib/standardize.js');

const addOne = (variable) => {
    return () => {
        variable.count++;
    };
};

const addTwo = (variable) => {
    return () => {
        variable.count += 2;
    };
};

describe('Standardize', () => {

    context('Can standardize a event emitter based socket', () => {

        let mockSocket;
        let standardSocket;

        beforeEach(() => {
            mockSocket = util.mockNodeWebsocket();
            standardSocket = standardize(mockSocket);
        });

        it('Only allows for one open handler', () => {
            const opens = { count: 0 };
            standardSocket.onOpen(addTwo(opens));
            standardSocket.onOpen(addOne(opens));
            mockSocket.fire('open');
            return opens.count.should.equal(1);
        });

        it('Only allows for one message handler', () => {
            const messages = { count: 0 };
            standardSocket.onMessage(addTwo(messages));
            standardSocket.onMessage(addOne(messages));
            mockSocket.fire('message');
            return messages.count.should.equal(1);
        });

        it('Only allows for one close handler', () => {
            const closes = { count: 0 };
            standardSocket.onClose(addTwo(closes));
            standardSocket.onClose(addOne(closes));
            mockSocket.fire('close');
            return closes.count.should.equal(1);
        });

        it('Only allows for one error handler', () => {
            const errors = { count: 0 };
            standardSocket.onError(addTwo(errors));
            standardSocket.onError(addOne(errors));
            mockSocket.fire('error');
            return errors.count.should.equal(1);
        });

        it('Can send a message', () => {
            standardSocket.send('something');
            mockSocket.messagesSent.should.equal(1);
        });

        it('Can be closed', () => {
            standardSocket.close('error');
            mockSocket.closed.should.equal(true);
        });

        it('Exposes the underlying socket object', () => {
            standardSocket.should.have.a.property('socket').that.equals(mockSocket);
        });
    });

    context('Can standardize a browser websocket', () => {

        let mockSocket;
        let standardSocket;

        beforeEach(() => {
            mockSocket = util.mockBrowserWebsocket();
            standardSocket = standardize(mockSocket);
        });

        it('Only allows for one open handler', () => {
            const opens = { count: 0 };
            standardSocket.onOpen(addTwo(opens));
            standardSocket.onOpen(addOne(opens));
            mockSocket.fire('open');
            return opens.count.should.equal(1);
        });

        it('Only allows for one message handler', () => {
            const messages = { count: 0 };
            standardSocket.onMessage(addTwo(messages));
            standardSocket.onMessage(addOne(messages));
            mockSocket.fire('message', 'Hello world');
            return messages.count.should.equal(1);
        });

        it('Unwraps the message data', () => {
            let receivedMessage = '';
            standardSocket.onMessage((msg) => {
                receivedMessage = msg;
            });
            mockSocket.fire('message', { data: 'Hello world' });
            return receivedMessage.should.equal('Hello world');
        });

        it('Only allows for one close handler', () => {
            const closes = { count: 0 };
            standardSocket.onClose(addTwo(closes));
            standardSocket.onClose(addOne(closes));
            mockSocket.fire('close');
            return closes.count.should.equal(1);
        });

        it('Unwraps the event code and message', () => {
            return new Promise((resolve) => {
                standardSocket.onClose((code, msg) => {
                    code.should.equal(1000);
                    msg.should.equal('Goodbye');
                    resolve();
                });
                mockSocket.fire('close', { code: 1000, reason: 'Goodbye'});
            });
        });

        it('Defaults the code and message when no event is supplied', () => {
            return new Promise((resolve) => {
                standardSocket.onClose((code, msg) => {
                    code.should.equal(1006);
                    msg.should.equal('Socket was closed without a close event');
                    resolve();
                });
                mockSocket.fire('close');
            });
        });

        it('Only allows for one error handler', () => {
            const errors = { count: 0 };
            standardSocket.onError(addTwo(errors));
            standardSocket.onError(addOne(errors));
            mockSocket.fire('error');
            return errors.count.should.equal(1);
        });

        it('Can send a message', () => {
            standardSocket.send('something');
            mockSocket.messagesSent.should.equal(1);
        });

        it('Can be closed', () => {
            standardSocket.close('error');
            mockSocket.closed.should.equal(true);
        });

        it('Sets the binary type to arraybuffer', () => {
            mockSocket.should.have.a.property('binaryType').that.equals('arraybuffer');
        });

        it('Exposes the underlying socket object', () => {
            standardSocket.should.have.a.property('socket').that.equals(mockSocket);
        });
    });
});
