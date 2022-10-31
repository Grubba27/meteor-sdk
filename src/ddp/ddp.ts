import EventEmitter from "wolfy87-eventemitter";
import Queue from "./queue";
import Socket from "./socket";
import { generateId } from "./utils";
import { SimpleDDPConnectOptions } from "../DDPClient";

const DDP_VERSION = "1";
const PUBLIC_EVENTS = [
  // Subscription messages
  "ready", "nosub", "added", "changed", "removed",
  // Method messages
  "result", "updated",
  // Error messages
  "error"
];
const DEFAULT_RECONNECT_INTERVAL = 10000;

type DDPConnectOptions = {
  cleanQueue: boolean;
  autoConnect: boolean;
  autoReconnect: boolean;
  reconnectInterval: number;
  SocketConstructor: {
    new(url: string | URL, protocols?: string | string[] | undefined): WebSocket;
    prototype: WebSocket;
    readonly CLOSED: number;
    readonly CLOSING: number;
    readonly CONNECTING: number;
    readonly OPEN: number;
  };
  endpoint: URL;
}
export default class DDP extends EventEmitter {
  status: string;
  sessionId: null;
  cleanQueue: boolean = false;
  autoConnect: boolean = false;
  autoReconnect: boolean;
  autoReconnectUserValue: boolean;
  reconnectInterval: number;
  messageQueue: Queue<(message: any) => boolean>;
  socket: Socket;


  // @ts-ignore
  emit(event: string, ...args?: any[]) {
    if (args === undefined) setTimeout(super.emit.bind(this, event), 0);
    else setTimeout(super.emit.bind(this, event, ...args), 0);
  }

  constructor(options: SimpleDDPConnectOptions) {
    super();

    this.status = "disconnected";

    //DDP session id
    this.sessionId = null;

    //clean queue on disconnect or not, default to false
    this.cleanQueue = options.cleanQueue || false;

    // Default `autoConnect` and `autoReconnect` to true
    this.autoConnect = options.autoConnect !== false;
    this.autoReconnect = options.autoReconnect !== false;
    this.autoReconnectUserValue = this.autoReconnect;
    this.reconnectInterval = options.reconnectInterval || DEFAULT_RECONNECT_INTERVAL;

    this.messageQueue = new Queue(message => {
      if (this.status === "connected") {
        this.socket.send(message);
        return true;
      } else {
        return false;
      }
    });

    this.socket = new Socket(options.SocketConstructor, options.endpoint);

    this.socket.on("open", () => {
      // When the socket opens, send the `connect` message
      // to establish the DDP connection
      let params = {
        msg: "connect",
        version: DDP_VERSION,
        support: [DDP_VERSION],
        session: undefined
      };
      if (this.sessionId) params.session = this.sessionId;
      this.socket.send(params);
    });

    this.socket.on("close", () => {
      let oldStatus = this.status;
      this.status = "disconnected";
      if (this.cleanQueue) this.messageQueue.empty();
      if (oldStatus != "disconnected") this.emit("disconnected");
      if (this.autoReconnect) {
        // Schedule a reconnection
        setTimeout(
          this.socket.open.bind(this.socket),
          this.reconnectInterval
        );
      }
    });

    this.socket.on("message:in", (message: { msg: string; session: null; id: any; }) => {
      if (message.msg === "connected") {
        this.status = "connected";
        this.sessionId = message.session ? message.session : null;
        this.messageQueue.process();
        this.emit("connected", message);
      } else if (message.msg === "ping") {
        // Reply with a `pong` message to prevent the server from
        // closing the connection
        this.socket.send({ msg: "pong", id: message.id });
      } else if (PUBLIC_EVENTS.includes(message.msg)) {
        this.emit(message.msg, message);
      }
    });

    if (this.autoConnect) {
      this.connect();
    }

  }

  connect() {
    this.autoReconnect = this.autoReconnectUserValue;
    this.socket.open();
  }


  disconnect() {
    /*
    *   If `disconnect` is called, the caller likely doesn't want the
    *   the instance to try to auto-reconnect. Therefore we set the
    *   `autoReconnect` flag to false.
    *   Also we should remember autoReconnect value to restore it on connect.
    */
    this.autoReconnectUserValue = this.autoReconnect;
    this.autoReconnect = false;
    this.sessionId = null;
    this.socket.close();
  }

  pauseQueue() {
    this.messageQueue.pause();
  }

  continueQueue() {
    this.messageQueue.continue();
  }

  method(name: string, params: any[], atBeginning = false) {
    const id = generateId();
    this.messageQueue[atBeginning ? 'unshift' : 'push']({
      msg: "method",
      id: id,
      method: name,
      params: params
    });
    return id;
  }

  sub(name: string, params: any[], id = generateId()) {
    this.messageQueue.push({
      msg: "sub",
      id: id,
      name: name,
      params: params
    });
    return id;
  }

  unsub(id: string | number) {
    this.messageQueue.push({
      msg: "unsub",
      id: id
    });
    return id;
  }

}
