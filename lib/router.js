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
            handler.dispatch = handlers[i];
            chain.push(handler);
        } else {
            throw new Error('Please supply only handler methods to rapport route methods');
        }
    }

    return chain;
};

const traverseRouteChain = (req, res, chain, errorCallback) => {
    let handled = false;

    const next = () => {
        if (chain.length > 0) {
            const handler = chain.shift();

            if (handler.verb === 'all' || handler.verb === req.verb) {

                try {
                    handled = true;
                    const returned = handler.dispatch(req, res, next);

                    // If the handler returned a promise, call next when it's done and error if it fails
                    if (returned && util.isFunction(returned.then)) {
                        returned.then(next, errorCallback);
                    }

                } catch (err) {
                    errorCallback(err);
                }
            }

        } else if (!handled) {
            errorCallback(new Error('Not Found'));
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
    const errorHandlers = [];

    const addRoute = (route, chain) => {
        const cleanRoute = trimRoute(route);

        if (!routes[cleanRoute]) {
            routes[cleanRoute] = [];
        }

        combineRouteChains(routes[cleanRoute], chain);
    };

    const addErrorHandlers = (chain) => {
        combineRouteChains(errorHandlers, chain);
    };

    const router = {

        getRoutes: () => {
            return routes;
        },

        getErrorHandlers: () => {
            return errorHandlers;
        },

        use: (route, subRouter) => {

            // We have a string route as the first parameter
            if (util.isString(route)) {

                // We have a real router as the sub router
                if (util.isFunction(subRouter.getRoutes)) {
                    const subRoutes = subRouter.getRoutes();
                    for (const subRoute in subRoutes) {
                        if (subRoutes.hasOwnProperty(subRoute)) {
                            addRoute(combineRoutes(route, subRoute), subRoutes[subRoute]);
                        }
                    }

                    addErrorHandlers(subRouter.getErrorHandlers());

                // We have a handler as the subrouter, shortcut for ".all".
                } else if (util.isFunction(subRouter)) {
                    router.all(route, subRouter);
                }

            // We have a router as the only parameter, shortcut for ".use('', router)"
            } else if (util.isFunction(route.getRoutes)) {
                router.use('', subRouter);

            // We have a function as the only parameter, attach to the end of ALL routes
            } else if (util.isFunction(route)) {
                const chain = createRouteChain('all', route);
                for (const existingRoute in routes) {
                    if (routes.hasOwnProperty(existingRoute)) {
                        addRoute(route, chain);
                    }
                }

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

        dispatch: (req, res) => {
            const route = trimRoute(req.route);
            const routes = router.getRoutes()[route];
            const chain = routes ? combineRouteChains([], routes) : [];

            traverseRouteChain(req, res, chain, (err) => {
                router.dispatchError(err, res);
            });
        },

        dispatchError: (err, res) => {
            const chain = combineRouteChains([], router.getErrorHandlers());

            // No error handler middleware, respond with the error from the route
            if (chain.length === 0) {
                res.status(500).send(err);
                return;
            }

            traverseRouteChain(err, res, chain, (errorHandlerError) => {
                res.status(500).send(errorHandlerError);
            });
        }
    };

    return router;
};

module.exports = Router;
