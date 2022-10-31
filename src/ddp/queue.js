"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
class Queue {
    constructor(consumer) {
        this.consumer = consumer;
        this.paused = false;
        this.queue = [];
    }
    pause() {
        this.paused = true;
    }
    continue() {
        this.paused = false;
        this.process();
    }
    push(element) {
        this.queue.push(element);
        this.process();
    }
    unshift(element) {
        this.queue.unshift(element);
        this.process();
    }
    process() {
        if (!this.paused && this.queue.length !== 0) {
            const ack = this.consumer(this.queue[0]);
            if (ack) {
                this.queue.shift();
                if (!this.paused)
                    this.process();
            }
        }
    }
    empty() {
        this.queue = [];
    }
}
exports.Queue = Queue;
exports.default = Queue;
