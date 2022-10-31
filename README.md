[![npm version](https://badge.fury.io/js/simpleddp.svg)](https://badge.fury.io/js/simpleddp)
[![Build Status](https://travis-ci.org/Gregivy/simpleddp.svg?branch=master)](https://travis-ci.org/Gregivy/simpleddp)
[![Dependency Status](https://david-dm.org/gregivy/simpleddp.svg)](https://david-dm.org/gregivy/simpleddp)
[![devDependency Status](https://david-dm.org/gregivy/simpleddp/dev-status.svg)](https://david-dm.org/gregivy/simpleddp#info=devDependencies)

<p align="center">
  <img width="300" height="300" src="https://github.com/Gregivy/simpleddp/raw/master/simpleddp.png">
</p>

# SimpleDDP 🥚

## Please note

### This is a reimplementation of DDPClient using TypeScript and other modern tools.

Under the hood is the DDPClient that everyone knows and loves, but with a new look and feel.
This is a work in progress, so please be patient with me as I work out the kinks.

---

### What this fork has to offer new?

Typescript safety, and a more modern codebase. I rewrote the codebase using TypeScript, and added a few TS feature like
Generics to collections. This means that you can now use the collection methods with a type definition, and get type
safety
when using the collection methods.
and calling methods in a safer way
_for collection_

```typescript
  const sub = server.subscribe('tasksByUser');
await sub.ready()
server
  .collection<Task>('tasks')
  .filter((t) => t) // t has the type of Tasks
  .onChange(({ prev, next, predicatePassed }) => { // prev and next have the type of Tasks
    if (predicatePassed) {
      // do something
    }
  });
const t = server.collection<Task>('tasks').fetch() // t has the type of Tasks[]

```

_for methods_

```typescript

const tasks = await server.call<[], Task[]>('fetchTasks') // Task[] is the return type
// the first argument is the arguments to the method, and the second is the return type
```

The aim of this library is to simplify the process of working with Meteor.js server over DDP protocol using external JS
environments (like Node.js, Cordova, Ionic, ReactNative, etc).

It is battle tested 🏰 in production and ready to use 🔨.

If you like this project ⭐ is always welcome.

**Important**

SimpleDDP is written in ES6 and uses modern features like *promises*. Though its precompiled with Babel, your js
environment must support ES6 features. So if you are planning to use SimpleDDP be sure that your js environment supports
ES6 features or include polyfills yourself (like Babel Polyfill).

Project uses [semantic versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

DDP (protocol) [specification](https://github.com/meteor/meteor/blob/devel/packages/ddp/DDP.md).

## [CHANGE LOG](https://github.com/Gregivy/simpleddp/blob/master/CHANGELOG.md)

## Install

`npm install meteor-sdk --save`

## [Documentation](https://gregivy.github.io/simpleddp/simpleDDP.html)

## Plugins

* [simpleddp-plugin-login](https://github.com/Gregivy/simpleddp-plugin-login)

## [Adding custom EJSON types](https://github.com/Gregivy/simpleddp/blob/master/custom_ejson.md) ⭐

## Example

First of all you need WebSocket implementation for your node app.
We will use [isomorphic-ws](https://www.npmjs.com/package/isomorphic-ws) package for this
since it works on the client and serverside.

`npm install isomorphic-ws ws --save`

Import/require `DDPClient`.

```javascript
const DDPClient = require("simpleddp"); // nodejs
const ws = require("isomorphic-ws");
```

or

```javascript
import DDPClient from 'DDPClient'; // ES6
import ws from 'isomorphic-ws';
```

Now you should make a new DDPClient instance.

```javascript
let opts = {
  endpoint: "ws://someserver.com/websocket",
  SocketConstructor: ws,
  reconnectInterval: 5000
};
const server = new DDPClient(opts);
```

Connection is not going to be established immediately after you create a DDPClient instance. If you need to check your
connection simply use `server.connected` property which is `true` if you are connected to the server, otherwise
it's `false`.

You can also add some events for connection status.

```javascript
server.on('connected', () => {
  // do something
});

server.on('disconnected', () => {
  // for example show alert to user
});

server.on('error', (e) => {
  // global errors from server
});
```

As an alternative you can use a *async/await* style (or `then(...)`).

```javascript
(async () => {
  await server.connect();
  // connection is ready here
})();
```

The next thing we are going to do is subscribing to some publications.

```javascript
let userSub = server.subscribe("user_pub");
let otherSub = server.subscribe("other_pub", 'param1', 2); // you can specify arguments for subscription

(async () => {
  await userSub.ready();
  let nextSub = server.subscribe("next_pub"); // subscribing after userSub is ready
  await nextSub.ready();
  //all subs are ready here
})();
```

You can fetch all things you've subscribed for
using [server.collection](https://gregivy.github.io/simpleddp/simpleDDP.html#collection) method.
Also you can get reactive data sources (plain js objects which will be automatically updated if something changes on the
server).

```javascript
(async () => {

  // call some method
  await server.call('somemethod');

  const userSub = server.subscribe("user", userId);
  await userSub.ready();

  // get non-reactive user object
  const user = server.collection('users').filter(newObjFullCopy, i - 1, this.collections[m.collection]).fetch()[0];

  // get reactive user object
  const userReactiveCursor = server.collection('users').filter(newObjFullCopy, i - 1, this.collections[m.collection]).reactive().one();
  const userReactiveObject = userReactiveCursor.data();

  // observing the changes
  server.collection('users').filter(newObjFullCopy, i - 1, this.collections[m.collection]).onChange(({
                                                                                                       prev,
                                                                                                       next
                                                                                                     }) => {
    console.log('previus user data', state.prev);
    console.log('next user data', state.next);
  });

  // observing changes in reactive data source
  userReactiveCursor.onChange((newData) => {
    console.log('new user state', newData);
  });

  const participantsSub = server.subscribe("participants");

  await participantsSub.ready();

  const reactiveCollection = server.collection('participants').reactive();

  // reactive reduce
  const reducedReactive = reactiveCollection.reduce((acc, val, i, arr) => {
    if (i < arr.length - 1) {
      return acc + val.age;
    } else {
      return (acc + val.age) / arr.length;
    }
  }, 0);

  // reactive mean age of all participants
  const meanAge = reducedReactive.data();

  // observing changes in reactive data source
  userReactiveCursor.onChange((newData) => {
    console.log('new user state', newData);
  });
})();
```
