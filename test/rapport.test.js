'use strict';

const util = require('./index.js');
const createOptions = require('../lib/options.js');

describe('Rapport', () => {

    context('Constructor', () => {

        let Rapport;

        beforeEach(() => {
            delete require.cache[require.resolve('../lib/index.js')];
            Rapport = require('../lib/index.js');
        });

        it('Can create a new instance', () => {
            const rapport = Rapport(util.mockNodeWebsocket);
            rapport.should.have.a.property('plugins').that.is.an('array');
            rapport.should.have.a.property('options').that.deep.equals(createOptions());
            rapport.should.have.a.property('Websocket').that.equals(util.mockNodeWebsocket);
            rapport.should.have.a.property('use').that.is.a('function');
            rapport.should.have.a.property('websocket').that.is.a('function');
            rapport.should.have.a.property('configure').that.is.a('function');
            rapport.should.have.a.property('create').that.is.a('function');
            rapport.should.have.a.property('wrap').that.is.a('function');
        });

        it('Can add a plugin to all new instances', () => {
            const testPlugin = {};
            Rapport.use(testPlugin);
            const rapport = Rapport();
            rapport.plugins.length.should.equal(1);
            rapport.plugins[0].should.deep.equal(testPlugin);
        });

        it('Executes a new constructor plugin immediately', () => {
            const testPlugin = {
                extendRapportConstructor: (constructor) => {
                    constructor.testMethod = () => {};
                }
            };
            Rapport.use(testPlugin);
            Rapport.should.have.a.property('testMethod').that.is.a('function');
        });

        it('Can add default configuration to all new instances', () => {
            Rapport.configure({ someConfig: 'hey there' });
            const rapport = Rapport();
            rapport.options.should.deep.equal(createOptions({ someConfig: 'hey there' }));
        });

        it('Can add a default Websocket implementation to all new instances', () => {
            Rapport.websocket('This is a websocket');
            const rapport = Rapport();
            rapport.Websocket.should.equal('This is a websocket');
        });

        it('Can create a new websocket object', () => {
            Rapport.websocket(util.mockSocketConstructor);
            const ws = Rapport.create('123');
            ws.should.have.a.property('onMessage').that.is.a('function');
        });

        it('Can wrap an existing websocket object', () => {
            const ws = Rapport.wrap(util.mockNodeWebsocket());
            ws.should.have.a.property('onMessage').that.is.a('function');
        });
    });

    context('Instance', () => {

        let rapport;

        beforeEach(() => {
            rapport = require('../lib/index.js')();
        });

        it('Can add plugins to the instance', () => {
            const testPlugin = {};
            rapport.use(testPlugin);
            rapport.plugins.length.should.equal(1);
            rapport.plugins[0].should.deep.equal(testPlugin);
        });

        it('Executes a new instance plugin immediately', () => {
            const testPlugin = {
                extendRapportInstance: (instance) => {
                    instance.testMethod = () => {};
                }
            };
            rapport.use(testPlugin);
            rapport.should.have.a.property('testMethod').that.is.a('function');
        });

        it('Can be configured', () => {
            rapport.configure({ someConfig: 'hey there' });
            rapport.options.should.deep.equal(createOptions({ someConfig: 'hey there' }));
        });

        it('Can have a websocket added to it', () => {
            rapport.websocket('This is a websocket');
            rapport.Websocket.should.equal('This is a websocket');
        });

        it('Can create a new websocket object', () => {
            rapport.websocket(util.mockSocketConstructor);
            const ws = rapport.create('123');
            ws.should.have.a.property('onMessage').that.is.a('function');
        });

        it('Can wrap an existing websocket object', () => {
            const ws = rapport.wrap(util.mockNodeWebsocket());
            ws.should.have.a.property('onMessage').that.is.a('function');
        });

        it('Can execute websocket plugins', () => {
            const testPlugin = {
                extendWebsocket: (websocket) => {
                    websocket.testMethod = () => {};
                }
            };
            rapport.use(testPlugin);
            const ws = rapport.wrap(util.mockNodeWebsocket());
            ws.should.have.a.property('testMethod').that.is.a('function');
        });

        it('Throws when a websocket implementation is not defined and creation is attempted', () => {
            (() => {
                rapport.create('Hello');
            }).should.throw(Error, 'A websocket implementation must be supplied to create Rapport websockets');
        });
    });
});
