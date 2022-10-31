'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ddpReactiveCollection = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ddpReducer = require('./ddpReducer.js');

var _ddpReactiveDocument = require('./ddpReactiveDocument.js');

var _ddpOnChange = require('./ddpOnChange.js');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ddpReactiveCollection = function () {
  function ddpReactiveCollection(ddpCollectionInstance, settings, filter) {
    var _this = this;

    _classCallCheck(this, ddpReactiveCollection);

    this._skip = settings && typeof settings.skip === 'number' ? settings.skip : 0;
    this._limit = settings && typeof settings.limit === 'number' ? settings.limit : Infinity;
    this._sort = settings && typeof settings.sort === 'function' ? settings.sort : false;

    this._length = { result: 0 };

    this._data = [];
    this._rawData = [];

    this._reducers = [];
    this._tickers = [];
    this._ones = [];

    this._first = {};

    this._syncFunc = function (skip, limit, sort) {
      var options = {};
      if (typeof skip === 'number') options.skip = skip;
      if (typeof limit === 'number') options.limit = limit;
      if (sort) options.sort = sort;
      return ddpCollectionInstance.fetch.call(ddpCollectionInstance, options);
    };

    this._changeHandler = ddpCollectionInstance.onChange(function (_ref) {
      var prev = _ref.prev,
          next = _ref.next,
          predicatePassed = _ref.predicatePassed;

      if (prev && next) {
        if (predicatePassed[0] == 0 && predicatePassed[1] == 1) {
          _this._smartUpdate(next);
        } else if (predicatePassed[0] == 1 && predicatePassed[1] == 0) {
          var i = _this._rawData.findIndex(function (obj) {
            return obj.id == prev.id;
          });
          _this._removeItem(i);
        } else if (predicatePassed[0] == 1 && predicatePassed[1] == 1) {
          var _i = _this._rawData.findIndex(function (obj) {
            return obj.id == prev.id;
          });
          _this._smartUpdate(next, _i);
        }
      } else if (!prev && next) {
        _this._smartUpdate(next);
      } else if (prev && !next) {
        var _i2 = _this._rawData.findIndex(function (obj) {
          return obj.id == prev.id;
        });
        _this._removeItem(_i2);
      }
      _this._length.result = _this._data.length;

      _this._reducers.forEach(function (reducer) {
        reducer.doReduce();
      });

      if (_this._data[0] !== _this._first) {
        _this._updateReactiveObjects();
      }

      _this._first = _this._data[0];

      _this._tickers.forEach(function (ticker) {
        ticker(_this.data());
      });
    }, filter ? filter : function (_) {
      return true;
    });

    this.started = false;

    this.start();
  }

  _createClass(ddpReactiveCollection, [{
    key: '_removeItem',
    value: function _removeItem(i) {
      this._rawData.splice(i, 1);

      if (i >= this._skip && i < this._skip + this._limit) {
        this._data.splice(i - this._skip, 1);

        if (this._rawData.length >= this._skip + this._limit) {
          this._data.push(this._rawData[this._skip + this._limit - 1]);
        }
      } else if (i < this._skip) {
        this._data.shift();
        if (this._rawData.length >= this._skip + this._limit) {
          this._data.push(this._rawData[this._skip + this._limit - 1]);
        }
      }
    }
  }, {
    key: '_smartUpdate',
    value: function _smartUpdate(newEl, j) {
      var placement = void 0;
      if (!this._rawData.length) {
        placement = this._rawData.push(newEl) - 1;
        if (placement >= this._skip && placement < this._skip + this._limit) {
          this._data.push(newEl);
        }
        return;
      }

      if (this._sort) {
        for (var i = 0; i < this._rawData.length; i++) {
          if (this._sort(newEl, this._rawData[i]) < 1) {
            placement = i;
            if (i == j) {
              this._rawData[i] = newEl;
              if (j >= this._skip && j < this._skip + this._limit) {
                this._data[j - this._skip] = newEl;
              }
            } else {
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
      } else {
        if (typeof j === 'number') {
          placement = j;
          this._rawData[j] = newEl;
          if (j >= this._skip && j < this._skip + this._limit) {
            this._data[j - this._skip] = newEl;
          }
        } else {
          placement = this._rawData.push(newEl) - 1;
          if (placement >= this._skip && placement < this._skip + this._limit) {
            this._data.push(newEl);
          }
        }
      }
    }
  }, {
    key: '_activateReducer',
    value: function _activateReducer(reducer) {
      this._reducers.push(reducer);
    }
  }, {
    key: '_activateReactiveObject',
    value: function _activateReactiveObject(o) {
      this._ones.push(o);
    }
  }, {
    key: '_deactivateReducer',
    value: function _deactivateReducer(reducer) {
      var i = this._reducers.indexOf(reducer);
      if (i > -1) {
        this._reducers.splice(i, 1);
      }
    }
  }, {
    key: '_deactivateReactiveObject',
    value: function _deactivateReactiveObject(o) {
      var i = this._ones.indexOf(o);
      if (i > -1) {
        this._ones.splice(i, 1);
      }
    }
  }, {
    key: '_updateReactiveObjects',
    value: function _updateReactiveObjects() {
      var _this2 = this;

      this._ones.forEach(function (ro) {
        ro._update(_this2.data()[0]);
      });
    }
  }, {
    key: 'settings',
    value: function settings(_settings) {
      var _data;

      var skip = void 0,
          limit = void 0,
          sort = void 0;

      if (_settings) {
        skip = _settings.skip;
        limit = _settings.limit;
        sort = _settings.sort;
      }

      this._skip = skip !== undefined ? skip : this._skip;
      this._limit = limit !== undefined ? limit : this._limit;
      this._sort = sort !== undefined ? sort : this._sort;

      (_data = this._data).splice.apply(_data, [0, this._data.length].concat(_toConsumableArray(this._syncFunc(this._skip, this._limit, this._sort))));
      this._updateReactiveObjects();
      return this;
    }
  }, {
    key: 'skip',
    value: function skip(n) {
      return this.settings({ skip: n });
    }
  }, {
    key: 'limit',
    value: function limit(n) {
      return this.settings({ limit: n });
    }
  }, {
    key: 'stop',
    value: function stop() {
      if (this.started) {
        this._changeHandler.stop();
        this.started = false;
      }
    }
  }, {
    key: 'start',
    value: function start() {
      if (!this.started) {
        var _rawData, _data2;

        (_rawData = this._rawData).splice.apply(_rawData, [0, this._rawData.length].concat(_toConsumableArray(this._syncFunc(false, false, this._sort))));
        (_data2 = this._data).splice.apply(_data2, [0, this._data.length].concat(_toConsumableArray(this._syncFunc(this._skip, this._limit, this._sort))));
        this._updateReactiveObjects();
        this._changeHandler.start();
        this.started = true;
      }
    }
  }, {
    key: 'sort',
    value: function sort(f) {
      this._sort = f;
      if (this._sort) {
        var _rawData2, _data3;

        (_rawData2 = this._rawData).splice.apply(_rawData2, [0, this._rawData.length].concat(_toConsumableArray(this._syncFunc(false, false, this._sort))));
        (_data3 = this._data).splice.apply(_data3, [0, this._data.length].concat(_toConsumableArray(this._syncFunc(this._skip, this._limit, this._sort))));
        this._updateReactiveObjects();
      }
      return this;
    }
  }, {
    key: 'data',
    value: function data() {
      return this._data;
    }
  }, {
    key: 'onChange',
    value: function onChange(f) {
      return new _ddpOnChange.ddpOnChange(f, this, '_tickers');
    }
  }, {
    key: 'map',
    value: function map(f) {
      return new _ddpReducer.ddpReducer(this, function (accumulator, el, i, a) {
        return accumulator.concat(f(el, i, a));
      }, []);
    }
  }, {
    key: 'reduce',
    value: function reduce(f, initialValue) {
      return new _ddpReducer.ddpReducer(this, f, initialValue);
    }
  }, {
    key: 'count',
    value: function count() {
      return this._length;
    }
  }, {
    key: 'one',
    value: function one(settings) {
      return new _ddpReactiveDocument.ddpReactiveDocument(this, settings);
    }
  }]);

  return ddpReactiveCollection;
}();

exports.ddpReactiveCollection = ddpReactiveCollection;