'use strict';

require('./index.js');
const createOptions = require('../lib/options.js');

describe('Options', () => {

    context('Creation', () => {

        it('Defaults to the standard options', () => {
            const options = createOptions();
            options.should.have.a.property('decode').that.is.a('function');
            options.should.have.a.property('encode').that.is.a('function');
            options.should.have.a.property('Promise').that.is.a('function');
            options.should.have.a.property('generateRequestId').that.is.a('function');
        });

        it('Allows for additional options', () => {
            const options = createOptions({ something: 'yup' });
            options.should.have.a.property('decode').that.is.a('function');
            options.should.have.a.property('encode').that.is.a('function');
            options.should.have.a.property('Promise').that.is.a('function');
            options.should.have.a.property('generateRequestId').that.is.a('function');
            options.should.have.a.property('something').that.equals('yup');
        });

        it('Can override default options', () => {
            const options = createOptions({ decode: 1 });
            options.should.have.a.property('decode').that.equals(1);
            options.should.have.a.property('encode').that.is.a('function');
            options.should.have.a.property('Promise').that.is.a('function');
            options.should.have.a.property('generateRequestId').that.is.a('function');
        });

        it('Can override options based on parameter location', () => {
            const options = createOptions({ decode: 1 }, { decode: 2, encode: 3 });
            options.should.have.a.property('decode').that.equals(1);
            options.should.have.a.property('encode').that.equals(3);
            options.should.have.a.property('Promise').that.is.a('function');
            options.should.have.a.property('generateRequestId').that.is.a('function');
        });

        it('Can add additional options in additional parameters', () => {
            const options = createOptions({ something: 'yup' }, { stuff: 'yeah' });
            options.should.have.a.property('decode').that.is.a('function');
            options.should.have.a.property('encode').that.is.a('function');
            options.should.have.a.property('Promise').that.is.a('function');
            options.should.have.a.property('generateRequestId').that.is.a('function');
            options.should.have.a.property('something').that.equals('yup');
            options.should.have.a.property('stuff').that.equals('yeah');
        });
    });

    context('Default encode', () => {

        it('Can encode a JS object', () => {
            const obj = { hello: 'world' };
            createOptions().encode(obj).should.equal(JSON.stringify(obj));
        });

        it('Encodes a string', () => {
            const obj = 'hello';
            createOptions().encode(obj).should.equal(`"${obj}"`);
        });

        it('Encodes an error', () => {
            const obj = new Error('error');
            createOptions().encode(obj).should.equal(JSON.stringify({
                name: obj.name,
                message: obj.message,
                stack: obj.stack
            }));
        });
    });

    context('Default decode', () => {

        it('Can decode a JSON string', () => {
            const obj = { hello: 'world' };
            createOptions().decode(JSON.stringify(obj)).should.deep.equal(obj);
        });

        it('Doesn\'t decode an object', () => {
            const obj = { hello: 'world' };
            createOptions().decode(obj).should.deep.equal(obj);
        });

        it('Throws when invalid JSON is decoded', () => {
            (() => {
                createOptions().decode('hello');
            }).should.throw(SyntaxError);
        });
    });

    context('Default promise', () => {

        it('Should be there when Promise is defined', () => {
            createOptions().Promise.should.be.a('function');
        });
    });

    context('Default generateRequestId', () => {

        it('Generates a UUID', () => {
            createOptions().generateRequestId().should.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
        });
    });
});
