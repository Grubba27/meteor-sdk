"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ddpReactiveCollection = void 0;
const ddpReducer_js_1 = require("./ddpReducer.js");
const ddpReactiveDocument_js_1 = require("./ddpReactiveDocument.js");
const ddpOnChange_js_1 = require("./ddpOnChange.js");
/**
 * A reactive collection class.
 * @constructor
 * @param {ddpCollection} ddpCollection - Instance of @see ddpCollection class.
 * @param {Object} [settings={skip:0,limit:Infinity,sort:false}] - Object for declarative reactive collection slicing.
 * @param {Function} [filter=undefined] - Filter function.
 */
class ddpReactiveCollection {
    constructor(ddpCollectionInstance, settings, filter) {
        this._length = { result: 0 };
        this._data = [];
        this._rawData = [];
        this._reducers = [];
        this._tickers = [];
        this._ones = [];
        this._first = {};
        this._skip = settings && typeof settings.skip === 'number' ? settings.skip : 0;
        this._limit = settings && typeof settings.limit === 'number' ? settings.limit : Infinity;
        this._sort = settings && typeof settings.sort === 'function' ? settings.sort : false;
        this._syncFunc = function (skip, limit, sort) {
            const options = {};
            if (typeof skip === 'number')
                options.skip = skip;
            if (typeof limit === 'number')
                options.limit = limit;
            if (sort) {
                options.sort = sort;
            }
            return ddpCollectionInstance.fetch.call(ddpCollectionInstance, options);
        };
        // @ts-ignore
        // @ts-ignore
        this._changeHandler = ddpCollectionInstance.onChange(({ prev, next, predicatePassed }) => {
            if (prev && next) {
                if (predicatePassed[0] == 0 && predicatePassed[1] == 1) {
                    // prev falling, next passing filter, adding new element with sort
                    this._smartUpdate(next);
                }
                else if (predicatePassed[0] == 1 && predicatePassed[1] == 0) {
                    // prev passing, next falling filter, removing old element
                    let i = this._rawData.findIndex((obj) => {
                        return obj._id == prev._id;
                    });
                    this._removeItem(i);
                }
                else if (predicatePassed[0] == 1 && predicatePassed[1] == 1) {
                    // both passing, should delete previous and add new
                    let i = this._rawData.findIndex((obj) => {
                        return obj._id == prev._id;
                    });
                    this._smartUpdate(next, i);
                }
            }
            else if (!prev && next) {
                // element was added and is passing the filter
                // adding new element with sort
                this._smartUpdate(next);
            }
            else if (prev && !next) {
                // element was removed and is passing the filter, so it was in newCollection
                // removing old element
                let i = this._rawData.findIndex((obj) => {
                    return obj._id == prev._id;
                });
                this._removeItem(i);
            }
            this._length.result = this._data.length;
            this._reducers.forEach((reducer) => {
                reducer.doReduce();
            });
            if (this._data[0] !== this._first) {
                this._updateReactiveObjects();
            }
            this._first = this._data[0];
            this._tickers.forEach((ticker) => {
                ticker(this.data());
            });
            //@ts-ignore
        }, filter ? filter : (_) => 1);
        this.started = false;
        this.start();
    }
    /**
     * Removes document from the local collection copies.
     * @private
     * @param {number} i - Document index in this._rawData array.
     */
    _removeItem(i) {
        this._rawData.splice(i, 1);
        if (i >= this._skip && i < this._skip + this._limit) {
            this._data.splice(i - this._skip, 1);
            if (this._rawData.length >= this._skip + this._limit) {
                this._data.push(this._rawData[this._skip + this._limit - 1]);
            }
        }
        else if (i < this._skip) {
            this._data.shift();
            if (this._rawData.length >= this._skip + this._limit) {
                this._data.push(this._rawData[this._skip + this._limit - 1]);
            }
        }
    }
    /**
     * Adds document to local the collection this._rawData according to used sorting if specified.
     * @private
     * @param {Object} newEl - Document to be added to the local collection.
     * @param j
     * @return {boolean} - The first element in the collection was changed
     */
    _smartUpdate(newEl, j) {
        let placement;
        if (!this._rawData.length) {
            placement = this._rawData.push(newEl) - 1;
            if (placement >= this._skip && placement < this._skip + this._limit) {
                this._data.push(newEl);
            }
            return;
        }
        if (this._sort) {
            for (let i = 0; i < this._rawData.length; i++) {
                if (this._sort(newEl, this._rawData[i]) < 1) {
                    placement = i;
                    if (i == j) {
                        // new position is the the same
                        this._rawData[i] = newEl;
                        if (j >= this._skip && j < this._skip + this._limit) {
                            this._data[j - this._skip] = newEl;
                        }
                    }
                    else {
                        // new position is different
                        // removing old element and adding new
                        this._removeItem(j);
                        this._rawData.splice(i, 0, newEl);
                        if (i >= this._skip && i < this._skip + this._limit) {
                            this._data.splice(i - this._skip, 0, newEl);
                            this._data.splice(this._limit);
                        }
                    }
                    break;
                }
                if (i == this._rawData.length - 1) {
                    placement = this._rawData.push(newEl) - 1;
                    if (placement >= this._skip && placement < this._skip + this._limit) {
                        this._data.push(newEl);
                    }
                    break;
                }
            }
        }
        else {
            // no sorting, trying to change existing
            if (typeof j === 'number') {
                placement = j;
                this._rawData[j] = newEl;
                if (j >= this._skip && j < this._skip + this._limit) {
                    this._data[j - this._skip] = newEl;
                }
            }
            else {
                placement = this._rawData.push(newEl) - 1;
                if (placement >= this._skip && placement < this._skip + this._limit) {
                    this._data.push(newEl);
                }
            }
        }
    }
    /**
     * Adds reducer.
     * @private
     * @param {ddpReducer} reducer - A ddpReducer object that needs to be updated on changes.
     */
    _activateReducer(reducer) {
        this._reducers.push(reducer);
    }
    /**
     * Adds reactive object.
     * @private
     * @param {ddpReactiveDocument} o - A ddpReactiveDocument object that needs to be updated on changes.
     */
    _activateReactiveObject(o) {
        this._ones.push(o);
    }
    /**
     * Removes reducer.
     * @private
     * @param {ddpReducer} reducer - A ddpReducer object that does not need to be updated on changes.
     */
    _deactivateReducer(reducer) {
        let i = this._reducers.indexOf(reducer);
        if (i > -1) {
            this._reducers.splice(i, 1);
        }
    }
    /**
     * Removes reactive object.
     * @private
     * @param {ddpReactiveDocument} o - A ddpReducer object that does not need to be updated on changes.
     */
    _deactivateReactiveObject(o) {
        let i = this._ones.indexOf(o);
        if (i > -1) {
            this._ones.splice(i, 1);
        }
    }
    /**
     * Sends new object state for every associated reactive object.
     * @public
     */
    _updateReactiveObjects() {
        this._ones.forEach((ro) => {
            ro._update(this.data()[0]);
        });
    }
    /**
     * Updates ddpReactiveCollection settings.
     * @public
     * @param {Object} [settings={skip:0,limit:Infinity,sort:false}] - Object for declarative reactive collection slicing.
     * @return {this}
     */
    settings(settings) {
        let skip, limit, sort;
        if (settings) {
            skip = settings.skip;
            limit = settings.limit;
            sort = settings.sort;
        }
        this._skip = skip !== undefined ? skip : this._skip;
        this._limit = limit !== undefined ? limit : this._limit;
        this._sort = sort !== undefined ? sort : this._sort;
        this._data.splice(0, this._data.length, ...this._syncFunc(this._skip, this._limit, this._sort));
        this._updateReactiveObjects();
        return this;
    }
    /**
     * Updates the skip parameter only.
     * @public
     * @param {number} n - A number of documents to skip.
     * @return {this}
     */
    skip(n) {
        return this.settings({ skip: n });
    }
    /**
     * Updates the limit parameter only.
     * @public
     * @param {number} n - A number of documents to observe.
     * @return {this}
     */
    limit(n) {
        return this.settings({ limit: n });
    }
    /**
     * Stops reactivity. Also stops associated reactive objects.
     * @public
     */
    stop() {
        if (this.started) {
            this._changeHandler.stop();
            this.started = false;
        }
    }
    /**
     * Starts reactivity. This method is being called on instance creation.
     * Also starts every associated reactive object.
     * @public
     */
    start() {
        if (!this.started) {
            this._rawData.splice(0, this._rawData.length, ...this._syncFunc(0, 0, this._sort));
            this._data.splice(0, this._data.length, ...this._syncFunc(this._skip, this._limit, this._sort));
            this._updateReactiveObjects();
            this._changeHandler.start();
            this.started = true;
        }
    }
    /**
     * Sorts local collection according to specified function.
     * Specified function form {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/sort}.
     * @public
     * @param {Function} f - A function used for sorting.
     * @return {this}
     */
    sort(f) {
        this._sort = f;
        if (this._sort) {
            this._rawData.splice(0, this._rawData.length, ...this._syncFunc(0, 0, this._sort));
            this._data.splice(0, this._data.length, ...this._syncFunc(this._skip, this._limit, this._sort));
            this._updateReactiveObjects();
        }
        return this;
    }
    /**
     * Returns reactive local collection with applied sorting, skip and limit.
     * This returned array is being mutated within this class instance.
     * @public
     * @return {Array} - Local collection with applied sorting, skip and limit.
     */
    data() {
        return this._data;
    }
    /**
     * Runs a function every time a change occurs.
     * @param {Function} f - Function which recieves new collection at each change.
     * @public
     */
    onChange(f) {
        const self = this;
        return (0, ddpOnChange_js_1.ddpOnChange)(f, self, '_tickers');
    }
    /**
     * Maps reactive local collection to another reactive array.
     * Specified function form {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/map}.
     * @public
     * @param {Function} f - Function that produces an element of the new Array.
     * @return {ddpReducer} - Object that allows to get reactive mapped data @see ddpReducer.
     */
    // @ts-ignore
    map(f) {
        return new ddpReducer_js_1.ddpReducer(this, function (accumulator, el, i, a) {
            return accumulator.concat(f(el, i, a));
        }, []);
    }
    /**
     * Reduces reactive local collection.
     * Specified function form {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce}.
     * @public
     * @param {Function} f - Function to execute on each element in the array.
     * @param {*} initialValue - Value to use as the first argument to the first call of the function.
     * @return {ddpReducer} - Object that allows to get reactive object based on reduced reactive local collection @see ddpReducer.
     */
    reduce(f, initialValue) {
        return new ddpReducer_js_1.ddpReducer(this, f, initialValue);
    }
    /**
     * Reactive length of the local collection.
     * @public
     * @return {Object} - Object with reactive length of the local collection. {result}
     */
    count() {
        return this._length;
    }
    /**
     * Returns a reactive object which fields are always the same as the first object in the collection.
     * @public
     * @param {Object} [settings={preserve:false}] - Settings for reactive object. Use {preserve:true} if you want to keep object on remove.
     * @return {ddpReactiveDocument} - Object that allows to get reactive object based on reduced reactive local collection @see ddpReactiveDocument.
     */
    one(settings) {
        return new ddpReactiveDocument_js_1.ddpReactiveDocument(this, settings);
    }
}
exports.ddpReactiveCollection = ddpReactiveCollection;
