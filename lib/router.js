'use strict';

const util = require('./util.js');

const createRouteChain = (verb, ...handlers) => {
    const chain = [];

    if (!handlers || handlers.length === 0) {
        throw new Error('Please supply at least one handler for the route');
    }

    for (let i = 0; i < handlers.length; i++) {
        const handler = { verb };
        if (util.isFunction(handlers[i])) {
            handler.handle = handlers[i];
            chain.push(handler);
        } else {
            throw new Error('Please supply only handler methods to rapport route methods');
        }
    }

    return chain;
};

const traverseRouteChain = (req, res, chain, errorCallback, doneCallback) => {
    let handled = false;

    const next = () => {
        if (chain.length > 0) {
            const handler = chain.shift();

            if (handler.verb === 'all' || handler.verb === req.verb) {

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

const trimRoute = (route) => {
    let cleanRoute = route;

    if (util.endsWith(cleanRoute, '/')) {
        cleanRoute = cleanRoute.substring(0, cleanRoute.length - 1);
    }

    if (util.startsWith(cleanRoute, '/')) {
        cleanRoute = cleanRoute.substring(1, cleanRoute.length);
    }

    return cleanRoute;
};

const getParameterizedRouteInfo = (route) => {
    const regexParts = [];
    const paramNames = [];
    const routeParts = route.split('/');

    for (let i = 0; i < routeParts.length; i++) {
        if (util.startsWith(routeParts[i], ':')) {
            regexParts.push('([A-Za-z0-9_\-]+)');
            paramNames.push(routeParts[i].substr(1));
        } else {
            regexParts.push(util.regexEscape(routeParts[i]));
        }
    }

    return {
        paramNames,
        regex: new RegExp(`${regexParts.join(util.regexEscape('/'))}$`)
    };
};

const combineRoutes = (route, subRoute) => {
    const cleanRoute = trimRoute(route);
    const cleanSubRoute = trimRoute(subRoute);

    if (cleanRoute.length !== 0 && cleanSubRoute.length !== 0) {
        return `${cleanRoute}/${cleanSubRoute}`;
    } else if (cleanRoute.length === 0) {
        return cleanSubRoute;
    } else {
        return cleanRoute;
    }
};

const combineRouteChains = (pushChain = [], ...chains) => {
    for (let i = 0; i < chains.length; i++) {
        if (chains[i] && chains[i].length !== 0) {
            pushChain.push(...chains[i]);
        }
    }
    return pushChain;
};

const Router = () => {

    const routes = {};
    const parameterizedRouteInfo = {};
    const parameterizedRoutes = {};
    const errorHandlers = [];

    const addToAllRoutes = (chain) => {
        for (const existingRoute in routes) {
            if (routes.hasOwnProperty(existingRoute)) {
                combineRouteChains(routes[existingRoute], chain);
            }
        }

        for (const existingRoute in parameterizedRoutes) {
            if (parameterizedRoutes.hasOwnProperty(existingRoute)) {
                combineRouteChains(parameterizedRoutes[existingRoute], chain);
            }
        }
    };

    const addRoute = (route, chain) => {
        const cleanRoute = trimRoute(route);

        // Not a route with parameters
        if (cleanRoute.indexOf(':') < 0) {
            if (!routes[cleanRoute]) {
                routes[cleanRoute] = [];
            }

            combineRouteChains(routes[cleanRoute], chain);

        // Route with parameters
        } else {
            if (!parameterizedRoutes[cleanRoute]) {
                parameterizedRoutes[cleanRoute] = [];
            }

            combineRouteChains(parameterizedRoutes[cleanRoute], chain);
            parameterizedRouteInfo[cleanRoute] = getParameterizedRouteInfo(cleanRoute);
        }
    };

    const addRouter = (route, router) => {
        const addRoutes = (route, subRoutes) => {
            for (const subRoute in subRoutes) {
                if (subRoutes.hasOwnProperty(subRoute)) {
                    addRoute(combineRoutes(route, subRoute), subRoutes[subRoute]);
                }
            }
        };

        addRoutes(route, router.getRoutes());
        addRoutes(route, router.getParameterizedRoutes());
        addErrorHandlers(router.getErrorHandlers());
    };

    const addErrorHandlers = (chain) => {
        combineRouteChains(errorHandlers, chain);
    };

    const router = {

        getRoutes: () => {
            return routes;
        },

        getParameterizedRoutes: () => {
            return parameterizedRoutes;
        },

        getParameterizedRouteInfo: () => {
            return parameterizedRouteInfo;
        },

        getErrorHandlers: () => {
            return errorHandlers;
        },

        use: (route, router) => {

            // We have a string route as the first parameter
            if (util.isString(route)) {

                // We have a real router as the sub router
                if (util.isFunction(router.getRoutes)) {
                    addRouter(route, router);

                // We have a handler as the subrouter, shortcut for ".all".
                } else if (util.isFunction(router)) {
                    router.all(route, router);
                }

            // We have a router as the only parameter, shortcut for ".use('', router)"
            } else if (util.isFunction(route.getRoutes)) {
                addRouter('', router);

            // We have a function as the only parameter, attach to the end of ALL routes
            } else if (util.isFunction(route)) {
                addToAllRoutes(createRouteChain('all', route));

            // No idea what we have...
            } else {
                throw new Error(`Invalid first parameters ${route} for router.use()`);
            }
        },

        all: (route, ...handlers) => {
            addRoute(route, createRouteChain('all', ...handlers));
        },

        put: (route, ...handlers) => {
            addRoute(route, createRouteChain('put', ...handlers));
        },

        post: (route, ...handlers) => {
            addRoute(route, createRouteChain('post', ...handlers));
        },

        patch: (route, ...handlers) => {
            addRoute(route, createRouteChain('patch', ...handlers));
        },

        get: (route, ...handlers) => {
            addRoute(route, createRouteChain('get', ...handlers));
        },

        delete: (route, ...handlers) => {
            addRoute(route, createRouteChain('delete', ...handlers));
        },

        error: (...handlers) => {
            addErrorHandlers(createRouteChain('all', ...handlers));
        },

        handle: (req, res) => {
            const route = trimRoute(req.route);
            const routes = router.getRoutes()[route];
            const chain = routes ? combineRouteChains([], routes) : [];

            const dispatchError = (err) => {
                const chain = combineRouteChains([], router.getErrorHandlers());

                const sendError = (err) => {
                    const status = err.status || 500;
                    const message = err.message || err;
                    res.status(status).send(message);
                };

                // Send the original error if there is no error chain, if there's an error in the error handler, send that
                traverseRouteChain(err, res, chain, sendError,
                    (handled) => {
                        if (!handled) {
                            sendError(err);
                        }
                    });
            };

            const traverseParameterizedRoutes = () => {
                const routes = router.getParameterizedRoutes();
                const info = router.getParameterizedRouteInfo();
                let chain = [];

                let bestMatchLength = Infinity;
                let bestRoute;
                let bestMatches;

                // Find the most specific matching route (or the first route if they're just as specific)
                for (const potentialRoute in info) {
                    if (info.hasOwnProperty(potentialRoute)) {
                        const matches = route.match(info[potentialRoute].regex);

                        if (matches !== null && matches.length < bestMatchLength) {
                            bestMatchLength = matches.length;
                            bestRoute = potentialRoute;
                            bestMatches = matches;
                        }
                    }
                }

                // Get the chain for the best route and populate the req params
                if (bestRoute) {
                    const paramNames = info[bestRoute].paramNames;
                    chain = routes[bestRoute];

                    req.params = {};
                    for (let i = 0; i < paramNames.length; i++) {
                        req.params[paramNames[i]] = bestMatches[i + 1]; // matches[0] is the whole string
                    }
                }

                // Traverse the parameterized routes, if there is an error, dispatch it
                // If no matches are found, dispatch a 404 error
                traverseRouteChain(req, res, chain, dispatchError, (handled) => {
                    if (!handled) {
                        const err = new Error('Not Found');
                        err.status = 404;
                        dispatchError(err);
                    }
                });
            };

            // Traverse the chain for standard routes first, if there is an error, dispatch it
            // If no routes are found, try to traverse the parameterized routes
            traverseRouteChain(req, res, chain, dispatchError, (handled) => {
                if (!handled) {
                    traverseParameterizedRoutes();
                }
            });
        }
    };

    return router;
};

module.exports = Router;
