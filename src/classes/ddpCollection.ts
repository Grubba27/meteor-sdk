import { fullCopy } from '../helpers/fullCopy.js';
import { ddpOnChange } from './ddpOnChange.js';
import { ddpReactiveCollection } from './ddpReactiveCollection';
import EJSON from "ejson";
import simpleDDP from "../simpleDDP";

/**
 * DDP collection class.
 * @constructor
 * @param {String} name - Collection name.
 * @param {simpleDDP} server - simpleDDP instance.
 */

export class ddpCollection<T> {

  private _filter: boolean | ((value: T, index: number, array: T[]) => any) = false;
  private _name: string;
  private _server: any;
  private ddpConnection: any;

  constructor(name: string, server: simpleDDP) {
    this._name = name;
    this._server = server;
  }

  /**
   * Allows to specify specific documents inside the collection for reactive data and fetching.
   * Important: if you change filter function it won't change for the already created reactive objects.
   * @public
   * @param {Function} f - Filter function, recieves as arguments object, index and array.
   * @return {this}
   */
  filter<S extends any>(f: boolean | ((value: T, index: number, array: T[]) => S) = false) {
    this._filter = f;
    return this;
  }

  /**
   * Imports data inside the collection and emits all relevant events.
   * Both string and JS object types are supported.
   * @public
   * @param {string|Object} data - EJSON string or EJSON or js object.
   */
  importData(data: string | object) {
    const c = typeof data === 'string' ? EJSON.parse(data) : data;

    if (c[this._name]) {
      c[this._name].forEach((doc: { _id: string; fields: {}; }, i: number, arr: { _id: string; fields: {}; }[]) => {
        // @ts-ignore
        if (!this._filter || (this._filter && typeof this._filter === 'function' && this._filter(doc, i, arr))) {
          this.ddpConnection.emit('added', {
            msg: 'added',
            _id: doc._id,
            collection: this._name,
            fields: doc.fields
          });
        }
      });
    }
  }

  /**
   * Exports data from the collection.
   * @public
   * @param {string} [format='string'] - If 'string' then returns EJSON string, if 'raw' returns js object.
   * @return {string|Object}
   */
  exportData(format: string | undefined) {
    let collectionCopy = { [this._name]: this.fetch() };
    if (format === undefined || format == 'string') {
      return EJSON.stringify(collectionCopy);
    } else if (format == 'raw') {
      return collectionCopy;
    }
  }

  /**
   * Returns collection data based on filter and on passed settings. Supports skip, limit and sort.
   * Order is 'filter' then 'sort' then 'skip' then 'limit'.
   * @public
   * @param {Object} [settings={skip:0,limit:Infinity,sort:null}] - Skip and limit are numbers or Infinity,
   * sort is a standard js array sort function.
   * @return {Object}
   */
  fetch(settings?: { skip?: number; limit?: number; sort?: ((a: T, b: T) => number) | boolean }) {
    let skip, limit, sort;

    if (settings) {
      skip = settings.skip;
      limit = settings.limit;
      sort = settings.sort;
    }

    let c = this._server.collections[this._name];
    let collectionCopy = c ? fullCopy(c) : [];
    if (this._filter) collectionCopy = collectionCopy.filter(this._filter);
    if (sort) collectionCopy.sort(sort);
    if (typeof skip === 'number') collectionCopy.splice(0, skip);
    if (typeof limit === 'number' || limit == Infinity) collectionCopy.splice(limit);
    return collectionCopy as T[];
  }

  /**
   * Returns reactive collection object.
   * @see ddpReactiveCollection
   * @public
   * @param {Object} [settings={skip:0,limit:Infinity,sort:null}]
   * @return {ddpReactiveCollection}
   */
  reactive(settings: { skip?: number | undefined; limit?: number | undefined; sort?: false | ((a: T, b: T) => number) | undefined; } | undefined) {
    return new ddpReactiveCollection<T>(this, settings, this._filter);
  }

  /**
   * Returns change observer.
   * @see ddpOnChange
   * @public
   * @param {Function} f
   * @param {Function} filter
   * @return {ddpOnChange}
   */
  onChange(f: <P extends { _id: string } & T, N extends { _id: string } & T, PP extends any[]>(args: { prev?: P, next?: N, predicatePassed: PP }) => any, filter?: typeof this._filter) {
    let obj = {
      collection: this._name,
      f: f,
      filter
    };

    if (this._filter) obj.filter = this._filter;
    if (filter) obj.filter = filter;

    return ddpOnChange(obj, this._server);
  }

}
