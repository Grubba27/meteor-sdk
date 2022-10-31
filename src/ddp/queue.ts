export class Queue<Q> {

  /*
  *   As the name implies, `consumer` is the (sole) consumer of the queue.
  *   It gets called with each element of the queue and its return value
  *   serves as stack, determining whether the element is removed or not from
  *   the queue, allowing then subsequent elements to be processed.
  */
  private readonly consumer: any;
  private paused: boolean;
  private queue: any[];

  constructor(consumer: Q) {
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

  push<T>(element: T) {
    this.queue.push(element);
    this.process();
  }

  unshift<T>(element: T) {
    this.queue.unshift(element);
    this.process();
  }

  process() {
    if (!this.paused && this.queue.length !== 0) {
      const ack = this.consumer(this.queue[0]);
      if (ack) {
        this.queue.shift();
        if (!this.paused) this.process();
      }
    }
  }

  empty() {
    this.queue = [];
  }

}

export default Queue;

