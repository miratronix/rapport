# rapport [![CircleCI](https://circleci.com/gh/miratronix/rapport.svg?style=shield)](https://circleci.com/gh/miratronix/rapport) [![Coverage Status](https://coveralls.io/repos/github/miratronix/rapport/badge.svg)](https://coveralls.io/github/miratronix/rapport)
[![NPM](https://nodei.co/npm/rapport.png)](https://npmjs.org/package/rapport)

A simple websocket wrapper that adds request/response functionality.

## Features
* Callback and Promise support for requests
* Wraps node WS objects as well as the browser Websocket object
* Small footprint (7.4kb minified)
* Configurable promise implementation
* Configurable serialization functions
* Zero dependencies

## Browser Usage
Simply add `rapport.min.js` to your HTML page and start using it:

```javascript
const Rapport = Rapport(Websocket);
const ws = Rapport.create('ws:localhost', wsOptions);

ws.onOpen(() => {
    
    // If the browser supports ES6 promises or a promise library is configured
    ws.request('some request', timeout)
        .then((response) => {})
        .catch((err) => {});
    
    // If you prefer callbacks
    ws.request('some request', timeout, (response, error) => {});
});

// Replying to a request
ws.onMessage((msg, ws) => {
    
    // The message content is in the body
    const content = msg.body;
    
    if (msg.isRequest) {
        ws.respond('hello');
        ws.respondWithError('Error!');
    }
});

// Closes are resolved when onClose is called, with an optional timeout
ws.close(optionalMessage, optionalWsCode, optionalTimeout)
    .then()
    .catch();

// Other functions are also wrapped:
ws.onError((err) => {});
ws.onClose((msg, code) => {});
ws.send(message);
```

## Node.js Usage
Install with `npm install --save rapport`.

### Requesting from clients with an existing socket
```javascript
const Rapport = require('rapport')();
const wrappedSocket = Rapport.wrap(existingSocket);

wrappedSocket.request('some request', timeout)
    .then((response) => {})
    .catch((err) => {});
    
wrappedSocket.request('some request', timeout, (response, error) => {});
```

### Responding to clients with an existing socket
```javascript
const Rapport = require('rapport')();
const wrappedSocket = Rapport.wrap(existingSocket);

wrappedSocket.onMessage((msg, ws) => {
    
    // The message content is in the body
    const content = msg.body;
    
    if (msg.isRequest) {   
        ws.respond('Hello');
        ws.respondWithError('Error!');
    }
});
```

### Creating a new client
```javascript
const Rapport = require('rapport')(require('ws'));
const ws = Rapport.create('ws:localhost', wsOptions);

ws.onOpen(() => {    
    ws.request('some request', timeout)
        .then((response) => {})
        .catch((err) => {});
});

// Replying to a request
ws.onMessage((msg, ws) => {
    
    // The message content is in the body
    const content = msg.body;
    
    if (msg.isRequest) {
        ws.respond('hello');
        ws.respondWithError('Error!');
    }
});

// Closes are resolved when onClose is called, with an optional timeout
ws.close(optionalMessage, optionalWsCode, optionalTimeout)
    .then()
    .catch();

// Other functions are also wrapped:
ws.onError((err) => {});
ws.onClose((msg, code) => {});
ws.send(message);
```

## Configuration Options
There are 6 configurable options for the Rapport library, with the following defaults:

```javascript
Rapport(Websocket, {
    
    // Set the function for encoding messages
    encodeMessage: (msg) => { return JSON.stringify(msg); },
    
    // Set the function for decoding messages
    decodeMessage: (msg) => { return JSON.parse(msg); },
    
    // Set the function for encoding close messages. This MUST return a string.
    encodeCloseMessage: (msg) => { return JSON.stringify(msg); },
    
    // Set the function for decoding messages. This will always receive a string.
    decodeCloseMessage: (msg) => { return JSON.parse(msg); },
    
    // Set the Promise implementation to use. Set to false to turn off promises.
    Promise: Promise,
    
    // Set the request ID generation function
    generateRequestId: () => { return uuid.v4(); }
});
```
