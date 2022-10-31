'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _core = require('../core');

var _core2 = _interopRequireDefault(_core);

var _ejson = require('ejson');

var _ejson2 = _interopRequireDefault(_ejson);

var _isequal = require('./helpers/isequal.js');

var _fullCopy = require('./helpers/fullCopy.js');

var _ddpEventListener = require('./classes/ddpEventListener.js');

var _ddpSubscription = require('./classes/ddpSubscription.js');

var _ddpCollection = require('./classes/ddpCollection.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function uniqueIdFuncGen() {
	var idCounter = 0;

	return function () {
		return idCounter++;
	};
}

var simpleDDPcounter = uniqueIdFuncGen();

function connectPlugins(plugins) {
	var _this = this;

	for (var _len = arguments.length, places = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
		places[_key - 1] = arguments[_key];
	}

	if (Array.isArray(plugins)) {
		plugins.forEach(function (p) {
			places.forEach(function (place) {
				if (p[place]) {
					p[place].call(_this);
				}
			});
		});
	}
}

var simpleDDP = function () {
	function simpleDDP(opts, plugins) {
		var _this2 = this;

		_classCallCheck(this, simpleDDP);

		this._id = simpleDDPcounter();
		this._opGenId = uniqueIdFuncGen();
		this._opts = opts;
		this.ddpConnection = new _core2.default(opts);
		this.subs = [];

		this.collections = {};

		this.onChangeFuncs = [];

		this.connected = false;

		this.maxTimeout = opts.maxTimeout;
		this.clearDataOnReconnection = opts.clearDataOnReconnection === undefined ? true : opts.clearDataOnReconnection;
		this.tryingToConnect = opts.autoConnect === undefined ? true : opts.autoConnect;
		this.tryingToDisconnect = false;
		this.willTryToReconnect = opts.autoReconnect === undefined ? true : opts.autoReconnect;

		var pluginConnector = connectPlugins.bind(this, plugins);

		pluginConnector('init', 'beforeConnected');

		this.connectedEvent = this.on('connected', function (m) {
			_this2.connected = true;
			_this2.tryingToConnect = false;
		});

		pluginConnector('afterConnected', 'beforeSubsRestart');

		this.connectedEventRestartSubs = this.on('connected', function (m) {
			if (_this2.clearDataOnReconnection) {
				_this2.clearData().then(function () {
					_this2.ddpConnection.emit('clientReady');
					_this2.restartSubs();
				});
			} else {
				_this2.ddpConnection.emit('clientReady');
				_this2.restartSubs();
			}
		});

		pluginConnector('afterSubsRestart', 'beforeDisconnected');

		this.disconnectedEvent = this.on('disconnected', function (m) {
			_this2.connected = false;
			_this2.tryingToDisconnect = false;
			_this2.tryingToConnect = _this2.willTryToReconnect;
		});

		pluginConnector('afterDisconnected', 'beforeAdded');

		this.addedEvent = this.on('added', function (m) {
			return _this2.dispatchAdded(m);
		});
		pluginConnector('afterAdded', 'beforeChanged');
		this.changedEvent = this.on('changed', function (m) {
			return _this2.dispatchChanged(m);
		});
		pluginConnector('afterChanged', 'beforeRemoved');
		this.removedEvent = this.on('removed', function (m) {
			return _this2.dispatchRemoved(m);
		});
		pluginConnector('afterRemoved', 'after');
	}

	_createClass(simpleDDP, [{
		key: 'restartSubs',
		value: function restartSubs() {
			this.subs.forEach(function (sub) {
				if (sub.isOn()) {
					sub.restart();
				}
			});
		}
	}, {
		key: 'collection',
		value: function collection(name) {
			return new _ddpCollection.ddpCollection(name, this);
		}
	}, {
		key: 'dispatchAdded',
		value: function dispatchAdded(m) {
			var _this3 = this;

			if (this.collections.hasOwnProperty(m.collection)) {
				var _i = this.collections[m.collection].findIndex(function (obj) {
					return obj.id == m.id;
				});
				if (_i > -1) {
					this.collections[m.collection].splice(_i, 1);
				}
			}
			if (!this.collections.hasOwnProperty(m.collection)) this.collections[m.collection] = [];
			var newObj = Object.assign({ id: m.id }, m.fields);
			var i = this.collections[m.collection].push(newObj);
			var fields = {};
			if (m.fields) {
				Object.keys(m.fields).map(function (p) {
					fields[p] = 1;
				});
			}
			this.onChangeFuncs.forEach(function (l) {
				if (l.collection == m.collection) {
					var hasFilter = l.hasOwnProperty('filter');
					var newObjFullCopy = (0, _fullCopy.fullCopy)(newObj);
					if (!hasFilter) {
						l.f({ changed: false, added: newObjFullCopy, removed: false });
					} else if (hasFilter && l.filter(newObjFullCopy, i - 1, this.collections[m.collection])) {
						l.f({ changed: false, added: newObjFullCopy, removed: false });
					}
				}
			});
		}
	}, {
		key: 'dispatchChanged',
		value: function dispatchChanged(m) {
			var _this4 = this;

			if (!this.collections.hasOwnProperty(m.collection)) this.collections[m.collection] = [];
			var i = this.collections[m.collection].findIndex(function (obj) {
				return obj.id == m.id;
			});
			if (i > -1) {
				var prev = (0, _fullCopy.fullCopy)(this.collections[m.collection][i]);
				var fields = {},
				    fieldsChanged = {},
				    fieldsRemoved = [];
				if (m.fields) {
					fieldsChanged = m.fields;
					Object.keys(m.fields).map(function (p) {
						fields[p] = 1;
					});
					Object.assign(this.collections[m.collection][i], m.fields);
				}
				if (m.cleared) {
					fieldsRemoved = m.cleared;
					m.cleared.forEach(function (fieldName) {
						fields[fieldName] = 0;
						delete _this4.collections[m.collection][i][fieldName];
					});
				}
				var next = this.collections[m.collection][i];
				this.onChangeFuncs.forEach(function (l) {
					if (l.collection == m.collection) {
						var hasFilter = l.hasOwnProperty('filter');
						if (!hasFilter) {
							l.f({ changed: false, added: newObjFullCopy, removed: false });
						} else {
							var fCopyNext = (0, _fullCopy.fullCopy)(next);
							var prevFilter = l.filter(newObjFullCopy, i - 1, this.collections[m.collection]);
							var nextFilter = l.filter(newObjFullCopy, i - 1, this.collections[m.collection]);
							if (prevFilter || nextFilter) {
								l.f({ changed: false, added: newObjFullCopy, removed: false });
							}
						}
					}
				});
			} else {
				this.dispatchAdded(m);
			}
		}
	}, {
		key: 'dispatchRemoved',
		value: function dispatchRemoved(m) {
			var _this5 = this;

			if (!this.collections.hasOwnProperty(m.collection)) this.collections[m.collection] = [];
			var i = this.collections[m.collection].findIndex(function (obj) {
				return obj.id == m.id;
			});
			if (i > -1) {
				var prevProps = void 0;
				var removedObj = this.collections[m.collection].splice(i, 1)[0];
				this.onChangeFuncs.forEach(function (l) {
					if (l.collection == m.collection) {
						var hasFilter = l.hasOwnProperty('filter');
						if (!hasFilter) {
							l.f({ changed: false, added: newObjFullCopy, removed: false });
						} else {
							if (l.filter(newObjFullCopy, i - 1, this.collections[m.collection])) {
								l.f({ changed: false, added: newObjFullCopy, removed: false });
							}
						}
					}
				});
			}
		}
	}, {
		key: 'connect',
		value: function connect() {
			var _this6 = this;

			this.willTryToReconnect = this._opts.autoReconnect === undefined ? true : this._opts.autoReconnect;
			return new Promise(function (resolve, reject) {
				if (!_this6.tryingToConnect) {
					_this6.ddpConnection.connect();
					_this6.tryingToConnect = true;
				}
				if (!_this6.connected) {
					var stoppingInterval = void 0;

					var connectionHandler = _this6.on('connected', function () {
						clearTimeout(stoppingInterval);
						connectionHandler.stop();
						_this6.tryingToConnect = false;
						resolve();
					});

					if (_this6.maxTimeout) {
						stoppingInterval = setTimeout(function () {
							connectionHandler.stop();
							_this6.tryingToConnect = false;
							reject(new Error('MAX_TIMEOUT_REACHED'));
						}, _this6.maxTimeout);
					}
				} else {
					resolve();
				}
			});
		}
	}, {
		key: 'disconnect',
		value: function disconnect() {
			var _this7 = this;

			this.willTryToReconnect = false;
			return new Promise(function (resolve, reject) {
				if (!_this7.tryingToDisconnect) {
					_this7.ddpConnection.disconnect();
					_this7.tryingToDisconnect = true;
				}
				if (_this7.connected) {
					var connectionHandler = _this7.on('disconnected', function () {
						connectionHandler.stop();
						_this7.tryingToDisconnect = false;
						resolve();
					});
				} else {
					resolve();
				}
			});
		}
	}, {
		key: 'apply',
		value: function apply(method, args) {
			var _this8 = this;

			var atBeginning = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

			return new Promise(function (resolve, reject) {
				var methodId = _this8.ddpConnection.method(method, args ? args : [], atBeginning);
				var _self = _this8;

				var stoppingInterval = void 0;

				function onMethodResult(message) {
					if (message.id == methodId) {
						clearTimeout(stoppingInterval);
						if (!message.error) {
							resolve(message.result);
						} else {
							reject(message.error);
						}
						_self.ddpConnection.removeListener('result', onMethodResult);
					}
				}

				_this8.ddpConnection.on("result", onMethodResult);

				if (_this8.maxTimeout) {
					stoppingInterval = setTimeout(function () {
						_this8.ddpConnection.removeListener('result', onMethodResult);
						reject(new Error('MAX_TIMEOUT_REACHED'));
					}, _this8.maxTimeout);
				}
			});
		}
	}, {
		key: 'call',
		value: function call(method) {
			for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
				args[_key2 - 1] = arguments[_key2];
			}

			return this.apply(method, args);
		}
	}, {
		key: 'sub',
		value: function sub(pubname, args) {
			var hasSuchSub = this.subs.find(function (sub) {
				return sub.pubname == pubname && (0, _isequal.isEqual)(sub.args, Array.isArray(args) ? args : []);
			});
			if (!hasSuchSub) {
				var i = this.subs.push(new _ddpSubscription.ddpSubscription(pubname, Array.isArray(args) ? args : [], this));
				return this.subs[i - 1];
			} else {
				if (hasSuchSub.isStopped()) hasSuchSub.start();
				return hasSuchSub;
			}
		}
	}, {
		key: 'subscribe',
		value: function subscribe(pubname) {
			for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
				args[_key3 - 1] = arguments[_key3];
			}

			return this.sub(pubname, args);
		}
	}, {
		key: 'on',
		value: function on(event, f) {
			return new _ddpEventListener.ddpEventListener(event, f, this);
		}
	}, {
		key: 'stopChangeListeners',
		value: function stopChangeListeners() {
			this.onChangeFuncs = [];
		}
	}, {
		key: 'clearData',
		value: function clearData() {
			var _this9 = this;

			return new Promise(function (resolve, reject) {
				var totalDocuments = 0;
				Object.keys(_this9.collections).forEach(function (collection) {
					totalDocuments += Array.isArray(_this9.collections[collection]) ? _this9.collections[collection].length : 0;
				});

				if (totalDocuments === 0) {
					resolve();
				} else {
					var counter = 0;
					var uniqueId = _this9._id + "-" + _this9._opGenId();

					var listener = _this9.on('removed', function (m, id) {
						if (id == uniqueId) {
							counter++;
							if (counter == totalDocuments) {
								listener.stop();
								resolve();
							}
						}
					});

					Object.keys(_this9.collections).forEach(function (collection) {
						_this9.collections[collection].forEach(function (doc) {
							_this9.ddpConnection.emit('removed', {
								msg: 'removed',
								id: doc.id,
								collection: collection
							}, uniqueId);
						});
					});
				}
			});
		}
	}, {
		key: 'importData',
		value: function importData(data) {
			var _this10 = this;

			return new Promise(function (resolve, reject) {
				var c = typeof data === 'string' ? _ejson2.default.parse(data) : data;

				var totalDocuments = 0;
				Object.keys(c).forEach(function (collection) {
					totalDocuments += Array.isArray(c[collection]) ? c[collection].length : 0;
				});

				var counter = 0;
				var uniqueId = _this10._id + "-" + _this10._opGenId();

				var listener = _this10.on('added', function (m, id) {
					if (id == uniqueId) {
						counter++;
						if (counter == totalDocuments) {
							listener.stop();
							resolve();
						}
					}
				});

				Object.keys(c).forEach(function (collection) {
					c[collection].forEach(function (doc) {

						var docFields = Object.assign({}, doc);
						delete docFields['id'];

						_this10.ddpConnection.emit('added', {
							msg: 'added',
							id: doc.id,
							collection: collection,
							fields: docFields
						}, uniqueId);
					});
				});
			});
		}
	}, {
		key: 'exportData',
		value: function exportData(format) {
			if (format === undefined || format == 'string') {
				return _ejson2.default.stringify(this.collections);
			} else if (format == 'raw') {
				return (0, _fullCopy.fullCopy)(this.collections);
			}
		}
	}, {
		key: 'markAsReady',
		value: function markAsReady(subs) {
			var _this11 = this;

			return new Promise(function (resolve, reject) {
				var uniqueId = _this11._id + "-" + _this11._opGenId();

				_this11.ddpConnection.emit('ready', {
					msg: 'ready',
					subs: subs.map(function (sub) {
						return sub._getId();
					})
				}, uniqueId);

				var listener = _this11.on('ready', function (m, id) {
					if (id == uniqueId) {
						listener.stop();
						resolve();
					}
				});
			});
		}
	}]);

	return simpleDDP;
}();

exports.default = simpleDDP;
module.exports = exports.default;
