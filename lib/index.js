'use strict';

const standardizeSocket = require('./standardize.js');
const wrapSocket = require('./websocket/index.js');
const createOptions = require('./options.js');
const createRequestCache = require('./request.cache.js');

const util = require('./util.js');

const globalPlugins = [];
let globalOptions;
let globalWsImplementation;

const executeConstructorPlugin = (constructor, ...plugins) => {
    for (let i = 0; i < plugins.length; i++) {
        if (util.isFunction(plugins[i].extendRapportConstructor)) {
            plugins[i].extendRapportConstructor(constructor);
        }
    }
};

const executeInstancePlugin = (instance, ...plugins) => {
    for (let i = 0; i < plugins.length; i++) {
        if (util.isFunction(plugins[i].extendRapportInstance)) {
            plugins[i].extendRapportInstance(instance);
        }
    }
};

const executeWebsocketPlugin = (ws, requestCache, options, ...plugins) => {
    for (let i = 0; i < plugins.length; i++) {
        if (util.isFunction(plugins[i].extendWebsocket)) {
            plugins[i].extendWebsocket(ws, requestCache, options);
        }
    }
};

const createInstance = (wsImplementation, options) => {
    const rapport = {

        plugins: [...globalPlugins],
        options: createOptions(options, globalOptions),
        Websocket: wsImplementation || globalWsImplementation,

        /**
         * Adds a plugin to this Rapport instance.
         *
         * @param {object} plugin The plugin object.
         * @return {RapportInstance} The rapport instance.
         */
        use: (plugin) => {
            rapport.plugins.push(plugin);
            executeInstancePlugin(rapport, plugin);
            return rapport;
        },

        /**
         * Sets the WS implementation for this instance.
         *
         * @param {object} wsImplementation
         * @return {RapportInstance} The rapport instance.
         */
        websocket: (wsImplementation) => {
            rapport.Websocket = wsImplementation;
            return rapport;
        },

        /**
         * Sets the configuration for this instance.
         *
         * @param {object} options The options to set.
         * @return {RapportInstance} The rapport instance.
         */
        configure: (options) => {
            rapport.options = createOptions(options, rapport.options);
            return rapport;
        },

        /**
         * Creates a rapport websocket connection.
         *
         * @param {string} url The URL to connect to.
         * @param {object} [options] Options for the websocket.
         * @param {string|string[]} [options.protocols] Sub protocol(s) to use.
         * @param {*} [options.connection] Connection options for the websocket (ignored for browser sockets).
         * @param {object} [options.router] The WS router to use.
         * @return {RapportWrapper} Wrapped WS object.
         */
        create: (url, options) => {
            if (!rapport.Websocket) {
                throw new Error('A websocket implementation must be supplied to create Rapport websockets');
            }

            const opts = createOptions(options, rapport.options);
            return rapport.wrap(new rapport.Websocket(url, opts.protocols, opts.connection), opts);
        },

        /**
         * Wraps a WS object for request/response functionality.
         *
         * @param {object} websocket Websocket to wrap.
         * @param {object} [options] Options for the websocket.
         * @return {RapportWrapper} The wrapped WS object.
         */
        wrap: (websocket, options) => {
            const opts = createOptions(options, rapport.options);
            const requestCache = createRequestCache();
            const wrappedSocket = wrapSocket(standardizeSocket(websocket), requestCache, opts);

            // Execute plugins that add to the websocket object
            executeWebsocketPlugin(wrappedSocket, requestCache, opts, ...rapport.plugins);

            // Add default handlers
            wrappedSocket.onMessage((msg) => {});
            wrappedSocket.onClose((code, reason) => {});

            return wrappedSocket;
        }
    };

    // Execute all instance plugins that were added globally
    executeInstancePlugin(rapport, ...rapport.plugins);

    return rapport;
};

/**
 * @typedef {object} RapportInstance
 * @property {function} use
 * @property {function} websocket
 * @property {function} configure
 * @property {function} create
 * @property {function} wrap
 */

/**
 * Creates a Rapport instance.
 *
 * @param wsImplementation The websocket implementation to wrap.
 * @param {object} [options] Optional options object.
 * @param {function} [options.stringify] The function to use to convert messages to strings. Defaults to JSON.stringify.
 * @param {function} [options.parse] The function to use to parse messages from strings. Defaults to JSON.parse.
 * @param {function} [options.Promise] The promise implementation to use. Defaults to the ES6 Promise if found.
 * @param {function} [options.generateRequestId] The function to use to generate request IDs. Defaults to a UUID.
 * @return {RapportInstance} Instance of the rapport library.
 */
const Rapport = createInstance;

/**
 * Adds global plugins.
 *
 * @param plugin
 * @return {function} Rapport constructor.
 */
Rapport.use = (plugin) => {
    globalPlugins.push(plugin);
    executeConstructorPlugin(Rapport, plugin);
    return Rapport;
};

/**
 * Adds global configuration options.
 *
 * @param options
 * @return {function} Rapport constructor.
 */
Rapport.configure = (options) => {
    globalOptions = createOptions(options, globalOptions);
    return Rapport;
};

/**
 * Set the websocket implementation globally.
 *
 * @param {object} wsImplementation The Websocket implementation to use.
 */
Rapport.websocket = (wsImplementation) => {
    globalWsImplementation = wsImplementation;
    return Rapport;
};

/**
 * Creates a socket using global options configured via `.websocket` and `.configure`.
 *
 * @param {string} url The url to connect to.
 * @param {object} options Options for the socket.
 * @return {RapportWrapper} The wrapped socket instance.
 */
Rapport.create = (url, options) => {
    return createInstance(globalWsImplementation, options).create(url);
};

/**
 * Wraps a socket using global options configured via `.configure`.
 *
 * @param {object} ws The websocket to wrap.
 * @param {object} options Options for the socket.
 * @return {RapportWrapper} The wrapped socket instance.
 */
Rapport.wrap = (ws, options) => {
    return createInstance(globalWsImplementation, options).wrap(ws);
};

if (typeof window !== 'undefined') {
    window.Rapport = Rapport;
}

if (typeof module !== 'undefined') {
    module.exports = Rapport;
}
