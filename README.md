# Meteor SDK

> Please note

### This is a re-implementation of DDPClient using TypeScript and other modern tools.

Under the hood is the DDPClient that everyone knows and loves, but with a new look and feel.

---

### What this fork has to offer new?

Typescript safety, and a more modern codebase. I rewrote the codebase using TypeScript, and added a few TS feature like
Generics to collections. This means that you can now use the collection methods with a type definition, and get type
safety
when using the collection methods.
and calling methods in a safer way

_for collections:_

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

_for methods:_

```typescript

const tasks = await server.call<[], Task[]>('fetchTasks') // Task[] is the return type
// the first argument is the arguments to the method, and the second is the return type
```

The aim of this library is to simplify the process of working with Meteor.js server over DDP protocol using external JS
environments (like Node.js, Cordova, Ionic, ReactNative, etc).

It is battle tested 🏰 in production and ready to use 🔨.

**Important**

Meteor SDK is written in TypeScript and shipped with type definitions.

DDP (protocol) [specification](https://github.com/meteor/meteor/blob/devel/packages/ddp/DDP.md).

## Install

`npm install meteor-sdk --save`

## Documentation

For methods and full documentation you can check simpleddp [Documentation](https://gregivy.github.io/simpleddp/simpleDDP.html)

## Plugins

Meteor SDK supports _all_ simpleddp plugins:

* [simpleddp-plugin-login](https://github.com/Gregivy/simpleddp-plugin-login)

## Example

You can check this Nuxt + Meteor app example repo: https://github.com/Grubba27/nuxtandmeteor

## Usage

You can use use [isomorphic-ws](https://www.npmjs.com/package/isomorphic-ws) or simply `WebSocket`
For our usage example we will use `isomorphic-ws`.

Ensure you have installed `isomorphic-ws` and `ws` packages:

`npm install isomorphic-ws ws --save`


```typescript
import MeteorSDK from "meteor-sdk";
import ws from 'isomorphic-ws';

export const server = new MeteorSDK({ // this will be used across the app
  endpoint: "ws://localhost:4000/websocket", // localhost:4000 is the default for this project but you can change it
  SocketConstructor: ws,
  reconnectInterval: 5000
})

```

Connection is not going to be established immediately after you create a DDPClient instance. If you need to check your
connection simply use `server.connected` property which is `true` if you are connected to the server, otherwise
it's `false`.

You can also add some events for connection status.

```javascript
server.on('connected', () => {
  console.log('Connected to Meteor server!')
})

server.on('disconnected', () => {
  // for example show alert to user
});

server.on('error', (e) => {
  // global errors from server
});
```

As an alternative you can use a *async/await* style (or `then(...)`).

```javascript
(async () => { // this can be your mounting function(useEffect/onMounted) or similar
  await server.connect();
  // connection is ready here
})();
```

The next thing we are going to do is subscribing to some publications.

```javascript
const sub = server.subscribe('tasksByUser', userId); // you can pass arguments to your publication
const otherSub = server.subscribe("other_pub", 'param1', 2);

(async () => {
  await sub.ready();
  let nextSub = server.subscribe("next_pub"); // subscribing after userSub is ready
  await nextSub.ready();
  //all subs are ready here
})();
```

You can fetch all things you've subscribed for using collection methods.
Also you can get reactive data sources (plain js objects which will be automatically updated if something changes on the
server).

```javascript
(async () => {

  // call some method
  await server.call('someMethod');
  const pong: "pong" = await server.call<["ping"], "pong">("Example.ping", "ping");

  const userSub = server.subscribe("user", userId);
  await userSub.ready();

  // get non-reactive user object
  const user = server.collection<User>('users').filter(newObjFullCopy, i - 1, this.collections[m.collection]).fetch()[0];
  // User has type of collection ^


  // get reactive user object
  const userReactiveCursor = server.collection<User>('users').filter(newObjFullCopy, i - 1, this.collections[m.collection]).reactive().one();
  const userReactiveObject = userReactiveCursor.data();

  // observing the changes
  server.collection<User>('users').filter(newObjFullCopy, i - 1, this.collections[m.collection]).onChange(({
                                                                                                       prev,
                                                                                                       next
                                                                                                     }) => {
    console.log('prev user data', prev);
    console.log('next user data', next);
  });

  // observing changes in reactive data source
  userReactiveCursor.onChange((newData) => {
    console.log('new user state', newData);
  });

  const participantsSub = server.subscribe("participants");

  await participantsSub.ready();

  const reactiveCollection = server.collection<Participants>('participants').reactive();

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
