"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const wolfy87_eventemitter_1 = __importDefault(require("wolfy87-eventemitter"));
const queue_1 = __importDefault(require("./queue"));
const socket_1 = __importDefault(require("./socket"));
const utils_1 = require("./utils");
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
class DDP extends wolfy87_eventemitter_1.default {
    constructor(options) {
        super();
        this.cleanQueue = false;
        this.autoConnect = false;
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
        this.messageQueue = new queue_1.default(message => {
            if (this.status === "connected") {
                this.socket.send(message);
                return true;
            }
            else {
                return false;
            }
        });
        this.socket = new socket_1.default(options.SocketConstructor, options.endpoint);
        this.socket.on("open", () => {
            // When the socket opens, send the `connect` message
            // to establish the DDP connection
            let params = {
                msg: "connect",
                version: DDP_VERSION,
                support: [DDP_VERSION],
                session: undefined
            };
            if (this.sessionId)
                params.session = this.sessionId;
            this.socket.send(params);
        });
        this.socket.on("close", () => {
            let oldStatus = this.status;
            this.status = "disconnected";
            if (this.cleanQueue)
                this.messageQueue.empty();
            if (oldStatus != "disconnected")
                this.emit("disconnected");
            if (this.autoReconnect) {
                // Schedule a reconnection
                setTimeout(this.socket.open.bind(this.socket), this.reconnectInterval);
            }
        });
        this.socket.on("message:in", (message) => {
            if (message.msg === "connected") {
                this.status = "connected";
                this.sessionId = message.session ? message.session : null;
                this.messageQueue.process();
                this.emit("connected", message);
            }
            else if (message.msg === "ping") {
                // Reply with a `pong` message to prevent the server from
                // closing the connection
                this.socket.send({ msg: "pong", id: message.id });
            }
            else if (PUBLIC_EVENTS.includes(message.msg)) {
                this.emit(message.msg, message);
            }
        });
        if (this.autoConnect) {
            this.connect();
        }
    }
    // @ts-ignore
    emit(event, ...args) {
        if (args === undefined)
            setTimeout(super.emit.bind(this, event), 0);
        else
            setTimeout(super.emit.bind(this, event, ...args), 0);
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
    method(name, params, atBeginning = false) {
        const id = (0, utils_1.generateId)();
        this.messageQueue[atBeginning ? 'unshift' : 'push']({
            msg: "method",
            id: id,
            method: name,
            params: params
        });
        return id;
    }
    sub(name, params, id = (0, utils_1.generateId)()) {
        this.messageQueue.push({
            msg: "sub",
            id: id,
            name: name,
            params: params
        });
        return id;
    }
    unsub(id) {
        this.messageQueue.push({
            msg: "unsub",
            id: id
        });
        return id;
    }
}
exports.default = DDP;
