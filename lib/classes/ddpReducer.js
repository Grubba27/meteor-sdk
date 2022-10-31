'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ddpReducer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ddpOnChange = require('./ddpOnChange.js');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ddpReducer = exports.ddpReducer = function () {
  function ddpReducer(ddpReactiveCollectionInstance, reducer, initialValue) {
    _classCallCheck(this, ddpReducer);

    this._ddpReactiveCollectionInstance = ddpReactiveCollectionInstance;
    this._reducer = reducer;
    this._started = false;
    this._data = { result: null };
    this._tickers = [];
    this._initialValue = initialValue;
    this.start();
  }

  _createClass(ddpReducer, [{
    key: 'doReduce',
    value: function doReduce() {
      var _this = this;

      if (this._started) {
        this._data.result = this._ddpReactiveCollectionInstance.data().reduce(this._reducer, this._initialValue);
        this._tickers.forEach(function (ticker) {
          ticker(_this.data().result);
        });
      }
    }
  }, {
    key: 'start',
    value: function start() {
      if (!this._started) {
        this.doReduce();
        this._ddpReactiveCollectionInstance._activateReducer(this);
        this._started = true;
      }
    }
  }, {
    key: 'stop',
    value: function stop() {
      if (this._started) {
        this._ddpReactiveCollectionInstance._deactivateReducer(this);
        this._started = false;
      }
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
  }]);

  return ddpReducer;
}();