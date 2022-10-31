"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ddpCollection = void 0;
const fullCopy_js_1 = require("../helpers/fullCopy.js");
const ddpOnChange_js_1 = require("./ddpOnChange.js");
const ddpReactiveCollection_1 = require("./ddpReactiveCollection");
const ejson_1 = __importDefault(require("ejson"));
/**
 * DDP collection class.
 * @constructor
 * @param {String} name - Collection name.
 * @param {simpleDDP} server - simpleDDP instance.
 */
class ddpCollection {
    constructor(name, server) {
        this._filter = false;
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
    filter(f = false) {
        this._filter = f;
        return this;
    }
    /**
     * Imports data inside the collection and emits all relevant events.
     * Both string and JS object types are supported.
     * @public
     * @param {string|Object} data - EJSON string or EJSON or js object.
     */
    importData(data) {
        const c = typeof data === 'string' ? ejson_1.default.parse(data) : data;
        if (c[this._name]) {
            c[this._name].forEach((doc, i, arr) => {
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
    exportData(format) {
        let collectionCopy = { [this._name]: this.fetch() };
        if (format === undefined || format == 'string') {
            return ejson_1.default.stringify(collectionCopy);
        }
        else if (format == 'raw') {
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
    fetch(settings) {
        let skip, limit, sort;
        if (settings) {
            skip = settings.skip;
            limit = settings.limit;
            sort = settings.sort;
        }
        let c = this._server.collections[this._name];
        let collectionCopy = c ? (0, fullCopy_js_1.fullCopy)(c) : [];
        if (this._filter)
            collectionCopy = collectionCopy.filter(this._filter);
        if (sort)
            collectionCopy.sort(sort);
        if (typeof skip === 'number')
            collectionCopy.splice(0, skip);
        if (typeof limit === 'number' || limit == Infinity)
            collectionCopy.splice(limit);
        return collectionCopy;
    }
    /**
     * Returns reactive collection object.
     * @see ddpReactiveCollection
     * @public
     * @param {Object} [settings={skip:0,limit:Infinity,sort:null}]
     * @return {ddpReactiveCollection}
     */
    reactive(settings) {
        return new ddpReactiveCollection_1.ddpReactiveCollection(this, settings, this._filter);
    }
    /**
     * Returns change observer.
     * @see ddpOnChange
     * @public
     * @param {Function} f
     * @param {Function} filter
     * @return {ddpOnChange}
     */
    onChange(f, filter) {
        let obj = {
            collection: this._name,
            f: f,
            filter
        };
        if (this._filter)
            obj.filter = this._filter;
        if (filter)
            obj.filter = filter;
        return (0, ddpOnChange_js_1.ddpOnChange)(obj, this._server);
    }
}
exports.ddpCollection = ddpCollection;
