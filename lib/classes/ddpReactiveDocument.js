'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.ddpReactiveDocument = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ddpOnChange = require('./ddpOnChange.js');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ddpReactiveDocument = exports.ddpReactiveDocument = function () {
	function ddpReactiveDocument(ddpReactiveCollectionInstance, settings) {
		_classCallCheck(this, ddpReactiveDocument);

		this._ddpReactiveCollectionInstance = ddpReactiveCollectionInstance;
		this._started = false;
		this._data = {};
		this._tickers = [];
		this._preserve = false;
		if ((typeof settings === 'undefined' ? 'undefined' : _typeof(settings)) === 'object' && settings !== null) this.settings(settings);
		this.start();
	}

	_createClass(ddpReactiveDocument, [{
		key: '_update',
		value: function _update(newState) {
			var _this = this;

			if (newState) {
				Object.keys(this._data).forEach(function (key) {
					delete _this._data[key];
				});

				Object.assign(this._data, newState);
			} else {
				if (!this._preserve) {
					Object.keys(this._data).forEach(function (key) {
						delete _this._data[key];
					});
				}
			}

			this._tickers.forEach(function (ticker) {
				ticker(_this.data());
			});
		}
	}, {
		key: 'start',
		value: function start() {
			if (!this._started) {
				this._update(this._ddpReactiveCollectionInstance.data()[0]);
				this._ddpReactiveCollectionInstance._activateReactiveObject(this);
				this._started = true;
			}
		}
	}, {
		key: 'stop',
		value: function stop() {
			if (this._started) {
				this._ddpReactiveCollectionInstance._deactivateReactiveObject(this);
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
	}, {
		key: 'settings',
		value: function settings(_ref) {
			var preserve = _ref.preserve;

			this._preserve = !!preserve;
		}
	}]);

	return ddpReactiveDocument;
}();