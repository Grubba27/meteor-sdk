import { ddpOnChange } from './ddpOnChange.js';
import { ddpReactiveCollection } from "./ddpReactiveCollection";

/**
 * A reducer class for a reactive document.
 * @constructor
 * @param {ddpReactiveCollection} ddpReactiveCollectionInstance - Instance of @see ddpReactiveCollection class.
 * @param {Function} reducer - Function for a reduction.
 * @param {*} initialValue - Initial value for a reduction function.
 */

export class ddpReducer<RArgs extends [any[], any, number, any[] ], RResult, RInit, TCol> {
  private _ddpReactiveCollectionInstance: any;
  private readonly _reducer: (...args: RArgs) => RResult;
  private _started: boolean = false;
  private readonly _data: { result: null; } = { result: null };
  private _tickers: any[] = [];
  private readonly _initialValue: RInit;

  constructor(
    ddpReactiveCollectionInstance: ddpReactiveCollection<TCol>,
    reducer: (...args: RArgs) => RResult,
    initialValue: RInit
  ) {
    this._ddpReactiveCollectionInstance = ddpReactiveCollectionInstance;
    this._reducer = reducer;
    this._initialValue = initialValue;
    this.start();
  }

  /**
   * Forcibly reduces reactive data.
   * @public
   */
  doReduce() {
    if (this._started) {
      this._data.result = this._ddpReactiveCollectionInstance.data().reduce(this._reducer, this._initialValue);
      this._tickers.forEach((ticker) => {
        ticker(this.data().result);
      });
    }
  }

  /**
   * Starts reactiveness for the reduced value of the collection.
   * This method is being called on instance creation.
   * @public
   */
  start() {
    if (!this._started) {
      this.doReduce();
      this._ddpReactiveCollectionInstance._activateReducer(this);
      this._started = true;
    }
  }

  /**
   * Stops reactiveness.
   * @public
   */
  stop() {
    if (this._started) {
      this._ddpReactiveCollectionInstance._deactivateReducer(this);
      this._started = false;
    }
  }

  /**
   * Returns reactive reduce.
   * @public
   * @return {Object} - {result:reducedValue}
   */
  data() {
    return this._data;
  }

  /**
   * Runs a function every time a change occurs.
   * @param {Function} f - Function which recieves a reduced value at each change.
   * @public
   */
  onChange(f: {}) {
    const self = this as unknown as { [x: string]: any[] };
    return ddpOnChange(f, self, '_tickers');
  }

}
