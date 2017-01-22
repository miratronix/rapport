# rapport
Rapport is a simple websocket wrapper that adds request/response functionality.

## Features
* Callback and Promise support for requests.
* Wraps node WS objects as well as the browser Websocket object.
* Super small (240 lines with comments)
* Configurable promise implementation

## Browser Usage
Simply add `rapport.js` to your HTML page and start using it:

```javascript
const Rapport = Rapport(Websocket);
const ws = Rapport.create('ws:localhost');

ws.onOpen(() => {
    
    // If the browser supports ES6 promises or a promise library is configured
    ws.request('some request', timeout)
        .then((response) => {})
        .catch((err) => {});
    
    // If you prefer callbacks
    ws.request('some request', timeout, (response, error) => {})
});

// Replying to a request
ws.onMessage((msg) => {
    if (msg.isRequest) {
        msg.respond('hello');
    }
});

// Other functions are also wrapped:
ws.onError(...);
ws.onClose(...);
ws.send(...);
ws.close(...);
```

## Node.js Usage
Install with `npm install rapport`.

### Requesting from clients with an existing socket
```javascript
const Rapport = require('rapport')();
const wrappedSocket = Rapport.wrap(existingSocket);

ws.request('some request', timeout)
    .then((response) => {})
    .catch((err) => {});
    
ws.request('some request', timeout, (response, error) => {})
```

### Responding to clients with an existing socket
```javascript
const Rapport = require('rapport')();
const wrappedSocket = Rapport.wrap(existingSocket);

wrappedSocket.onMessage((msg) => {
    if (msg.isRequest) {   
        msg.respond('Hello');
    }
});
```

## Creating a new client
```javascript
const Websocket = require('ws');
const Rapport = require('rapport')(Websocket);
const ws = Rapport.create('ws:localhost');

ws.onOpen(() => {
    
    // If the browser supports ES6 promises or a promise library is configured
    ws.request('some request', timeout)
        .then((response) => {})
        .catch((err) => {});
    
    // If you prefer callbacks
    ws.request('some request', timeout, (response, error) => {})
});

// Replying to a request
ws.onMessage((msg) => {
    if (msg.isRequest) {
        msg.respond('hello');
    }
});

// Other functions are also wrapped:
ws.onError(...);
ws.onClose(...);
ws.send(...);
ws.close(...);
```
