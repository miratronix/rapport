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
        throw new Error('Please supply at least one handler for the route');
    }

    for (let i = 0; i < handlers.length; i++) {
        const handler = { method };
        if (util.isFunction(handlers[i])) {
            handler.handle = handlers[i];
            chain.push(handler);
        } else {
            throw new Error('Please supply only handler functions to rapport route methods');
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
 * @param {function} doneCallback Callback for when the chain is finished.
 */
const traverseRouteChain = (req, res, chain, errorCallback, doneCallback) => {
    let handled = false;

    const next = () => {
        if (chain.length > 0) {
            const handler = chain.shift();

            if (handler.method === 'all' || handler.method === req.method) {
                try {
                    handled = true;
                    const returned = handler.handle(req, res, next);

                    // If the handler returned a promise, call next when it's done and error if it fails
                    if (returned && util.isFunction(returned.then)) {
                        returned.then(next, errorCallback);
                    }

                } catch (err) {
                    errorCallback(err);
                }
            }

        } else {
            doneCallback(handled);
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
     * Contains a map of all the routes -> their route chain.
     */
    const routes = {};

    /**
     * Contains an array of regex routes objects. These contain the following properties: {route, keys, regex, handledMethods, chain}.
     */
    const regexRoutes = [];

    /**
     * Array of router-wide handlers that is added to every new route.
     */
    const globalHandlers = [];

    /**
     * Contains an array of error handlers.
     */
    const errorHandlers = [];

    /**
     * Adds a single route with a specified route chain.
     *
     * @param {string} route The route.
     * @param {object[]} chain The route chain.
     */
    const addRoute = (route, chain) => {
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
            const fullChain = appendRouteChain([], globalHandlers, chain);
            const handledMethods = getHandledMethods(fullChain);

            // Push on a brand new regex route
            regexRoutes.push({ route, keys, regex, handledMethods, chain: fullChain });

        } else {
            if (!routes[cleanRoute]) {
                routes[cleanRoute] = [];
            }

            // Not a regex route, just push the new chain onto the routes
            appendRouteChain(routes[cleanRoute], globalHandlers, chain);
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
     * Adds the specified chain to all existing routes and add it to the global handlers array that is used as the baseline
     * when creating new routes.
     *
     * @param {object[]} chain The route chain.
     */
    const addGlobalHandlers = (chain) => {

        appendRouteChain(globalHandlers, chain);

        util.forEach(routes, (route, currentChain) => {
            appendRouteChain(currentChain, chain);
        });

        for (let i = 0; i < regexRoutes.length; i++) {
            appendRouteChain(regexRoutes[i].chain, chain);
            regexRoutes[i].handledMethods = getHandledMethods(regexRoutes[i].chain);
        }
    };

    /**
     * Adds all routes from a sub router.
     *
     * @param {string} route Base route for the added router.
     * @param {object} router The router to add.
     */
    const addRouter = (route, router) => {

        util.forEach(router.getRoutes(), (subRoute, subRouteChain) => {
            addRoute(combineRoutes(route, subRoute), subRouteChain);
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
         * @param {string|object|function} route The base path for the following router, the router itself, or a global handler function.
         * @param {object} router The router to add.
         */
        use: (route, router) => {

            // We have a string route as the first parameter
            if (util.isString(route)) {

                // We have a real router as the sub router
                if (util.isFunction(router.getRoutes)) {
                    addRouter(route, router);
                } else {
                    throw new Error(`Please supply a router as the second parameter in .use() for route ${route}`);
                }

            // We have a router as the only parameter, shortcut for ".use('', router)"
            } else if (util.isFunction(route.getRoutes)) {
                addRouter('', router);

            // We have a function as the only parameter, attach to the end of ALL routes
            } else if (util.isFunction(route)) {
                addGlobalHandlers(createRouteChain('all', route));

            // No idea what we have...
            } else {
                throw new Error(`Invalid first parameters ${route} for router.use()`);
            }
        },

        /**
         * Adds a series of handlers for a route covering all HTTP methods.
         *
         * @param {string} route The route to add.
         * @param {function[]} handlers The handlers to add.
         */
        all: (route, ...handlers) => {
            addRoute(route, createRouteChain('all', ...handlers));
        },

        /**
         * Adds a series of handlers for a PUT route.
         *
         * @param {string} route The route to add.
         * @param {function[]} handlers The handlers to add.
         */
        put: (route, ...handlers) => {
            addRoute(route, createRouteChain('put', ...handlers));
        },

        /**
         * Adds a series of handlers for a POST route.
         *
         * @param {string} route The route to add.
         * @param {function[]} handlers The handlers to add.
         */
        post: (route, ...handlers) => {
            addRoute(route, createRouteChain('post', ...handlers));
        },

        /**
         * Adds a series of handlers for a PATCH route.
         *
         * @param {string} route The route to add.
         * @param {function[]} handlers The handlers to add.
         */
        patch: (route, ...handlers) => {
            addRoute(route, createRouteChain('patch', ...handlers));
        },

        /**
         * Adds a series of handlers for a GET route.
         *
         * @param {string} route The route to add.
         * @param {function[]} handlers The handlers to add.
         */
        get: (route, ...handlers) => {
            addRoute(route, createRouteChain('get', ...handlers));
        },

        /**
         * Adds a series of handlers for a DELETE route.
         *
         * @param {string} route The route to add.
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

                // Send the original error if there is no error chain, if there's an error in the error handler, send that
                traverseRouteChain(err, res, chain, sendError, (handled) => {
                    if (!handled) {
                        sendError(err);
                    }
                });
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

                traverseRouteChain(req, res, chain, handleError, (handled) => {
                    if (!handled) {
                        const err = new Error('Not Found');
                        err.status = 404;
                        handleError(err);
                    }
                });
            };

            /**
             * Handles a regular route. If there are no matches, the regex routes are tried. If there is an error, it is
             * dispatched to the error handlers.
             */
            const handleRegularRoutes = () => {
                const routes = router.getRoutes()[route];
                const chain = routes ? appendRouteChain([], routes) : [];

                traverseRouteChain(req, res, chain, handleError, (handled) => {
                    if (!handled) {
                        handleRegexRoutes();
                    }
                });
            };

            handleRegularRoutes();
        }
    };

    return router;
};

module.exports = Router;
