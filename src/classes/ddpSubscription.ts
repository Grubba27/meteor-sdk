/**
 * DDP subscription class.
 * @constructor
 * @param {String} pubname - Publication name.
 * @param {Array} args - Subscription arguments.
 * @param {DDPClient} ddplink - simpleDDP instance.
 */
import DDPClient from "../DDPClient";

export class ddpSubscription {
  private _ddplink: any;
  args: any[];
  readonly pubname: string;
  private _nosub = false;
  private _started = false;
  private _ready = false;

  selfReadyEvent: {
    start: () => void
    stop(): void;
  } = {
    start: () => {
    },
    stop: () => {
    }
  }

  selfNosubEvent: {
    start: () => void
    stop(): void;
  } = {
    start: () => {
    },
    stop: () => {
    }
  }

  private subscriptionId!: string;

  constructor(pubname: string, args: any[], ddplink: DDPClient) {
    this._ddplink = ddplink;
    this.pubname = pubname;
    this.args = args;

    this.selfReadyEvent = ddplink.on('ready', (m: { subs: string | string[]; }) => {
      if (m.subs.includes(<string>this.subscriptionId)) {
        this._ready = true;
        this._nosub = false;
      }
    });

    this.selfNosubEvent = ddplink.on('nosub', (m: { id: string; }) => {
      if (m.id == this.subscriptionId) {
        this._ready = false;
        this._nosub = true;
        this._started = false;
      }
    });

    this.start();
  }

  /**
   * Runs everytime when `nosub` message corresponding to the subscription comes from the server.
   * @public
   * @param {Function} f - Function, event handler.
   * @return {ddpEventListener}
   */
  onNosub(f: (m?: { id: string | undefined; error: any; }) => void) {
    if (this.isStopped()) {
      f();
    } else {
      return this._ddplink.on('nosub', (m: { id: string | undefined; error: any; }) => {
        if (m.id == this.subscriptionId) {
          f(m.error || m);
        }
      });
    }
  }

  /**
   * Runs everytime when `ready` message corresponding to the subscription comes from the server.
   * @public
   * @param {Function} f - Function, event handler.
   * @return {ddpEventListener}
   */
  onReady(f: () => void) {
    // может приходить несколько раз, нужно ли сохранять куда-то?
    if (this.isReady()) {
      f();
    } else {
      return this._ddplink.on('ready', (m: { subs: (string | undefined)[]; }) => {
        if (m.subs.includes(this.subscriptionId)) {
          f();
        }
      });
    }
  }

  /**
   * Returns true if subsciprtion is ready otherwise false.
   * @public
   * @return {boolean}
   */
  isReady() {
    return this._ready;
  }

  /**
   * Returns true if subscription is stopped otherwise false.
   * @public
   * @return {boolean}
   */
  isStopped() {
    return this._nosub;
  }

  /**
   * Returns a promise which resolves when subscription is ready or rejects when `nosub` message arrives.
   * @public
   * @return {Promise}
   */
  ready() {
    return new Promise<void>((resolve, reject) => {
      if (this.isReady()) {
        resolve();
      } else {
        let onReady = this._ddplink.on('ready', (m: { subs: (string | undefined)[]; }) => {
          if (m.subs.includes(this.subscriptionId)) {
            onReady.stop();
            onNosub.stop();
            resolve();
          }
        });
        let onNosub = this._ddplink.on('nosub', (m: { id: string | undefined; error: any; }) => {
          if (m.id == this.subscriptionId) {
            onNosub.stop();
            onReady.stop();
            reject(m.error || m);
          }
        });
      }
    });
  }

  /**
   * Returns a promise which resolves when corresponding `nosub` message arrives.
   * Rejects when `nosub` comes with error.
   * @public
   * @return {Promise}
   */
  nosub() {
    return new Promise<void>((resolve, reject) => {
      if (this.isStopped()) {
        resolve();
      } else {
        let onNosub = this._ddplink.on('nosub', (m: { id: string | undefined; error: any; }) => {
          if (m.id == this.subscriptionId) {
            this._nosub = true;

            onNosub.stop();
            if (m.error) {
              reject(m.error);
            } else {
              resolve();
            }
          }
        });
      }
    });
  }

  /**
   * Returns true if subscription is active otherwise false.
   * @public
   * @return {Promise}
   */
  isOn() {
    return this._started;
  }

  /**
   * Completly removes subscription.
   * @public
   */
  remove() {
    // stopping nosub listener
    this.selfNosubEvent.stop();
    // stopping the subscription and ready listener
    this.stop();
    // removing from sub list inside simpleDDP instance
    let i = this._ddplink.subs.indexOf(this);
    if (i > -1) {
      this._ddplink.subs.splice(i, 1);
    }
  }

  /**
   * Stops subscription and return a promise which resolves when subscription is stopped.
   * @public
   * @return {Promise}
   */
  stop() {
    if (this._started) {
      // stopping ready listener
      this.selfReadyEvent.stop();
      // unsubscribing
      if (!this._nosub) this._ddplink.ddpConnection.unsub(this.subscriptionId);
      this._started = false;
      this._ready = false;
    }
    return this.nosub();
  }

  /**
   * Returns subscription id.
   * @private
   * @return {Promise}
   */
  _getId() {
    return this.subscriptionId;
  }

  /**
   * Start the subscription. Runs on class creation.
   * Returns a promise which resolves when subscription is ready.
   * @public
   * @param {Array} args - Subscription arguments.
   * @return {Promise}
   */
  start(args ?: any[]) {
    if (!this._started) {
      // starting ready listener
      this.selfReadyEvent.start();
      // subscribing
      if (Array.isArray(args)) this.args = args;
      this.subscriptionId = this._ddplink.ddpConnection.sub(this.pubname, this.args);
      this._started = true;
    }
    return this.ready();
  }

  /**
   * Restart the subscription. You can also change subscription arguments.
   * Returns a promise which resolves when subscription is ready.
   * @public
   * @param {Array} [args] - Subscription arguments.
   * @return {Promise}
   */
  restart(args?: any[]) {
    return new Promise<void>((resolve, reject) => {
      this.stop().then(() => {
        this.start(args).then(() => {
          resolve();
        }).catch((e) => {
          reject(e)
        });
      }).catch((e) => {
        reject(e)
      });
    });
  }
}
