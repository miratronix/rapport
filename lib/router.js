'use strict';

const pathToRegex = require('path-to-regexp');
const util = require('./util.js');

/**
 * Converts an array of handlers to a handler chain.
 *
 * @param {string} method HTTP method for chain entries.
 * @param {...function} handlers Handler functions to use.
 * @return {object[]} Array of handler objects (AKA a Route Chain).
 */
const createRouteChain = (method, ...handlers) => {
    const chain = [];

    if (!handlers || handlers.length === 0) {
        throw new TypeError('At least one handler function must be supplied');
    }

    for (let i = 0; i < handlers.length; i++) {
        const handler = { method };
        if (util.isFunction(handlers[i])) {
            handler.handle = handlers[i];
            chain.push(handler);
        } else {
            throw new TypeError('Handlers must be functions');
        }
    }

    return chain;
};

/**
 * Gets an object of HTTP methods supported by a route chain.
 *
 * @param {object[]} chain The route chain to check.
 * @return {object} An object containing a key for every supported HTTP method with a value of true.
 */
const getHandledMethods = (chain) => {
    const handledMethods = {};

    for (let i = 0; i < chain.length; i++) {
        handledMethods[chain[i].method] = true;
    }
    return handledMethods;
};

/**
 * Steps through a route chain, calling each handler in turn.
 *
 * @param {object} req The request object to give to the handlers.
 * @param {object} res The response object to give to the handlers.
 * @param {object[]} chain The route chain to traverse.
 * @param {function} errorCallback Callback for when an error occurs.
 */
const traverseRouteChain = (req, res, chain, errorCallback) => {

    const next = () => {

        if (chain.length > 0) {
            const handler = chain.shift();

            if (handler.method === 'all' || handler.method === req.method) {
                try {
                    const returned = handler.handle(req, res, next);

                    // If the handler returned a promise, call next when it's done and error if it fails
                    if (returned && util.isFunction(returned.then)) {
                        returned.then(next, errorCallback);
                    }

                } catch (err) {
                    errorCallback(err);
                }
            }
        }
    };

    next();
};

/**
 * Pushes route chains onto an existing chain.
 *
 * @param {object[]} pushChain The chain to push onto.
 * @param {...object[]} chains Chains to push onto the pushChain.
 * @return {object[]} The push chain after pushing is complete
 */
const appendRouteChain = (pushChain = [], ...chains) => {
    for (let i = 0; i < chains.length; i++) {
        if (chains[i] && chains[i].length !== 0) {
            pushChain.push(...chains[i]);
        }
    }
    return pushChain;
};

/**
 * Determines if a route is a regex route (contains any regex).
 *
 * @param {string} route The route to check.
 * @return {boolean} True if the route contains regex, false otherwise.
 */
const isRegexRoute = (route) => {
    const keys = [];
    pathToRegex(route, keys);
    return keys.length !== 0;
};

/**
 * Combines two route strings, with a '/' in between if required.
 *
 * @param {string} route The base route.
 * @param {string} subRoute The route to add to the base route.
 * @return {string} The combined route.
 */
const combineRoutes = (route, subRoute) => {
    const cleanRoute = util.trimSlashes(route);
    const cleanSubRoute = util.trimSlashes(subRoute);

    if (cleanRoute.length !== 0 && cleanSubRoute.length !== 0) {
        return `${cleanRoute}/${cleanSubRoute}`;
    } else if (cleanRoute.length === 0) {
        return cleanSubRoute;
    } else {
        return cleanRoute;
    }
};

/**
 * Creates the main router object.
 *
 * @return {object} The router.
 */
const Router = () => {

    /**
     * Contains a map of all the routes -> their route info object. This contains the chain and handledMethods properties.
     */
    const routes = {};

    /**
     * Contains an array of regex routes objects. These contain the following properties: {route, keys, regex, handledMethods, chain}.
     */
    const regexRoutes = [];

    /**
     * Array of middleware functions that are added to every new route.
     */
    const middleware = [];

    /**
     * Contains an array of error handlers.
     */
    const errorHandlers = [];

    /**
     * Adds a single route or array of routes with a specified route chain.
     *
     * @param {string|string[]} route The route(s).
     * @param {object[]} chain The route chain.
     */
    const addRoute = (route, chain) => {

        // If the route is an array of routes, add em all
        if (util.isArray(route)) {
            for (let i = 0; i < route.length; i++) {
                addRoute(route[i], chain);
            }
            return;
        }

        if (!util.isString(route)) {
            throw new TypeError('Routes must be strings');
        }

        const cleanRoute = util.trimSlashes(route);

        if (isRegexRoute(route)) {

            // Add chain to existing route if it's there and update the handled methods for the route
            for (let i = 0; i < regexRoutes.length; i++) {
                if (regexRoutes[i].route === route) {
                    appendRouteChain(regexRoutes[i].chain, chain);
                    regexRoutes[i].handledMethods = getHandledMethods(regexRoutes[i].chain);
                    return;
                }
            }

            const keys = [];
            const regex = pathToRegex(route, keys);
            const fullChain = appendRouteChain([], middleware, chain);
            const handledMethods = getHandledMethods(fullChain);

            // Push on a brand new regex route
            regexRoutes.push({ route, keys, regex, handledMethods, chain: fullChain });

        } else {

            // Create a new route info entry if required
            if (!routes[cleanRoute]) {
                routes[cleanRoute] = { chain: appendRouteChain([], middleware) };
            }

            // Not a regex route, just push the new chain onto the existing chain and recompute the handled methods
            appendRouteChain(routes[cleanRoute].chain, chain);
            routes[cleanRoute].handledMethods = getHandledMethods(routes[cleanRoute].chain);
        }
    };

    /**
     * Add a chain of error handlers.
     *
     * @param {object[]} chain The route chain.
     */
    const addErrorHandlers = (chain) => {
        appendRouteChain(errorHandlers, chain);
    };

    /**
     * Adds the specified chain to all existing routes and add it to the middleware array that is used as the baseline
     * when creating new routes.
     *
     * @param {object[]} chain The route chain.
     */
    const addMiddleware = (chain) => {

        appendRouteChain(middleware, chain);

        util.forEach(routes, (route, routeInfo) => {
            appendRouteChain(routeInfo.chain, chain);
            routeInfo.handledMethods = getHandledMethods(routeInfo.chain);
        });

        for (let i = 0; i < regexRoutes.length; i++) {
            appendRouteChain(regexRoutes[i].chain, chain);
            regexRoutes[i].handledMethods = getHandledMethods(regexRoutes[i].chain);
        }
    };

    /**
     * Adds all routes from a sub router.
     *
     * @param {string|string[]} route Base route(s) for the added router(s).
     * @param {object|object[]} router The router(s) to add.
     */
    const addRouter = (route, router) => {

        // If the route is an array of routes, add the router to all of them
        if (util.isArray(route)) {
            for (let i = 0; i < route.length; i++) {
                addRouter(route[i], router);
            }
            return;
        }

        // If the router is an array of routers, add all of them
        if (util.isArray(router)) {
            for (let i = 0; i < router.length; i++) {
                addRouter(route, router[i]);
            }
            return;
        }

        // Only string routes are allowed
        if (!util.isString(route)) {
            throw new TypeError('Routes must be strings');
        }

        // Only router objects are allowed
        if (!util.isObject(router) || !util.isFunction(router.getRoutes) || !util.isFunction(router.getRegexRoutes) || !util.isFunction(router.getErrorHandlers)) {
            throw new TypeError('Router must be a Rapport router');
        }

        util.forEach(router.getRoutes(), (subRoute, subRouteInfo) => {
            addRoute(combineRoutes(route, subRoute), subRouteInfo.chain);
        });

        const subRegexRoutes = router.getRegexRoutes();
        for (let i = 0; i < subRegexRoutes.length; i++) {
            addRoute(combineRoutes(route, subRegexRoutes[i].route), subRegexRoutes[i].chain);
        }

        addErrorHandlers(router.getErrorHandlers());
    };

    /**
     * The exported router object.
     */
    const router = {

        /**
         * Gets the route object in this router.
         *
         * @return {object} The object containing routes.
         */
        getRoutes: () => {
            return routes;
        },

        /**
         * Gets all the regex routes in this router.
         *
         * @return {object[]} The array of regex route objects.
         */
        getRegexRoutes: () => {
            return regexRoutes;
        },

        /**
         * Gets the error handlers associated with this router.
         *
         * @return {object[]} The error route chain for this router.
         */
        getErrorHandlers: () => {
            return errorHandlers;
        },

        /**
         * Adds a router to this router, or adds a router-wide handler function.
         *
         * @param {string|object|function} route The base path for the following router, the router itself, or a middleware function.
         * @param {...object|...function} router The routers or middleware functions to add.
         */
        use: (route, ...router) => {

            // We have a string route or array of routes as the first parameter, add the routers
            if (util.isString(route) || util.isArray(route)) {
                if (!router || router.length === 0) {
                    throw new TypeError('At least one Rapport router must be supplied');
                } else {
                    addRouter(route, router);
                }

            // We have a router as the first parameter, shortcut for ".use('', router)"
            } else if (util.isObject(route)) {
                addRouter('', [route, ...router]);

            // We have functions as the only parameters, attach to the end of ALL routes
            } else if (util.isFunction(route)) {
                addMiddleware(createRouteChain('all', ...[route, ...router]));

            // No idea what we have...
            } else {
                throw new TypeError('First parameter must be a string, Rapport router, or function');
            }
        },

        /**
         * Adds a series of handlers for a route covering all HTTP methods.
         *
         * @param {string|string[]} route The route(s) to add.
         * @param {function[]} handlers The handlers to add.
         */
        all: (route, ...handlers) => {
            addRoute(route, createRouteChain('all', ...handlers));
        },

        /**
         * Adds a series of handlers for a PUT route.
         *
         * @param {string|string[]} route The route(s) to add.
         * @param {function[]} handlers The handlers to add.
         */
        put: (route, ...handlers) => {
            addRoute(route, createRouteChain('put', ...handlers));
        },

        /**
         * Adds a series of handlers for a POST route.
         *
         * @param {string|string[]} route The route(s) to add.
         * @param {function[]} handlers The handlers to add.
         */
        post: (route, ...handlers) => {
            addRoute(route, createRouteChain('post', ...handlers));
        },

        /**
         * Adds a series of handlers for a PATCH route.
         *
         * @param {string|string[]} route The route(s) to add.
         * @param {function[]} handlers The handlers to add.
         */
        patch: (route, ...handlers) => {
            addRoute(route, createRouteChain('patch', ...handlers));
        },

        /**
         * Adds a series of handlers for a GET route.
         *
         * @param {string|string[]} route The route(s) to add.
         * @param {function[]} handlers The handlers to add.
         */
        get: (route, ...handlers) => {
            addRoute(route, createRouteChain('get', ...handlers));
        },

        /**
         * Adds a series of handlers for a DELETE route.
         *
         * @param {string|string[]} route The route(s) to add.
         * @param {function[]} handlers The handlers to add.
         */
        delete: (route, ...handlers) => {
            addRoute(route, createRouteChain('delete', ...handlers));
        },

        /**
         * Adds a series of error handlers. These are used when any route in this router throws an error.
         *
         * @param {function[]} handlers The handlers to add.
         */
        error: (...handlers) => {
            addErrorHandlers(createRouteChain('all', ...handlers));
        },

        /**
         * Handles a request, dispatching req and res to the correct route chain.
         *
         * @param {object} req The request object.
         * @param {object} res The response object.
         */
        handle: (req, res) => {
            const route = util.trimSlashes(req.url);

            /**
             * Dispatches an error to the routers error route chain.
             *
             * @param err The error to dispatch.
             */
            const handleError = (err) => {
                const chain = appendRouteChain([], router.getErrorHandlers());

                const sendError = (err) => {
                    let status = 500;

                    if (util.isObject(err) && err.status) {
                        status = err.status;
                        delete err.status;
                    }

                    res.status(status).send(err);
                };

                // No handlers defined, send the original error
                if (chain.length === 0) {
                    sendError(err);
                    return;
                }

                // Traverse the error chain. If there's an error in the error handler, send it
                traverseRouteChain(err, res, chain, sendError);
            };

            /**
             * Dispatches the request/response to the FIRST matching regex route. If there are no matches, a 404 is
             * thrown. If there is an error, it is dispatched to the error handlers.
             */
            const handleRegexRoutes = () => {
                const routes = router.getRegexRoutes();
                const chain = [];

                for (let i = 0; i < routes.length; i++) {
                    const routeInfo = routes[i];
                    const matches = route.match(routeInfo.regex);

                    if (matches !== null) {
                        matches.shift(); // Shift away the first parameter that matches the whole route

                        // Make sure the route supports the method
                        if (routeInfo.handledMethods.all || routeInfo.handledMethods[req.method]) {

                            // Construct the route params
                            req.params = {};
                            for (let i = 0; i < routeInfo.keys.length; i++) {
                                req.params[routeInfo.keys[i].name] = matches[i];
                            }

                            appendRouteChain(chain, routeInfo.chain);
                            break;
                        }
                    }
                }

                // If a matching route is not found, dispatch a 404
                if (chain.length === 0) {
                    const err = new Error('Not Found');
                    err.status = 404;

                    handleError(err);
                    return;
                }

                // Traverse the route chain, if an error is encountered, dispatch it to the error chain
                traverseRouteChain(req, res, chain, handleError);
            };

            /**
             * Handles a regular route. If there are no matches, the regex routes are tried. If there is an error, it is
             * dispatched to the error handlers.
             */
            const handleRegularRoutes = () => {
                const routeInfo = router.getRoutes()[route];
                const chain = routeInfo ? appendRouteChain([], routeInfo.chain) : [];

                // No route that matches exactly, or a route that matches but doesn't support the request method, try regex
                if (chain.length === 0 || (!routeInfo.handledMethods.all && !routeInfo.handledMethods[req.method])) {
                    handleRegexRoutes();
                    return;
                }

                traverseRouteChain(req, res, chain, handleError);
            };

            handleRegularRoutes();
        }
    };

    return router;
};

module.exports = Router;
