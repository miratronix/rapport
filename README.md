# rapport
A simple websocket wrapper that adds request/response functionality.

## Features
* Callback and Promise support for requests
* Wraps node WS objects as well as the browser Websocket object
* Super small (275 lines with comments)
* Configurable promise implementation
* Configurable serialization functions
* Zero dependencies

## Browser Usage
Simply add `rapport.js` to your HTML page and start using it:

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
ws.onMessage((msg) => {
    if (msg.isRequest) {
        msg.respond('hello');
        msg.respondWithError('Error!');
    }
});

// Other functions are also wrapped:
ws.onError((err) => {});
ws.onClose((code, msg) => {});
ws.send(msg);
ws.close(closeMsg);
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

wrappedSocket.onMessage((msg) => {
    if (msg.isRequest) {   
        msg.respond('Hello');
        msg.respondWithError('Error!');
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
ws.onMessage((msg) => {
    if (msg.isRequest) {
        msg.respond('hello');
        msg.respondWithError('Error!');
    }
});

// Other functions are also wrapped:
ws.onError((err) => {});
ws.onClose((code, msg) => {});
ws.send(msg);
ws.close(closeMsg);
```

## Configuration Options
There are 4 configurable options for the Rapport library, with the following defaults:

```javascript
Rapport(Websocket, {
    
    // Set the function for stringifying messages
    stringify: (msg) => { return JSON.stringify(msg); },
    
    // Set the function for parsing messages
    parse: (msg) => { return JSON.parse(msg); },
    
    // Set the Promise implementation to use
    Promise: Promise,
    
    // Set the request ID generation function
    generateRequestId: () => { return uuid.v4(); }
});
```
