'use strict';

Object.defineProperty(exports, "__esModule", {
		value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ddpSubscription = exports.ddpSubscription = function () {
		function ddpSubscription(pubname, args, ddplink) {
				var _this = this;

				_classCallCheck(this, ddpSubscription);

				this._ddplink = ddplink;
				this.pubname = pubname;
				this.args = args;
				this._nosub = false;
				this._started = false;
				this._ready = false;

				this.selfReadyEvent = ddplink.on('ready', function (m) {
						if (m.subs.includes(_this.subscriptionId)) {
								_this._ready = true;
								_this._nosub = false;
						}
				});

				this.selfNosubEvent = ddplink.on('nosub', function (m) {
						if (m.id == _this.subscriptionId) {
								_this._ready = false;
								_this._nosub = true;
								_this._started = false;
						}
				});

				this.start();
		}

		_createClass(ddpSubscription, [{
				key: 'onNosub',
				value: function onNosub(f) {
						var _this2 = this;

						if (this.isStopped()) {
								f();
						} else {
								var onNs = this._ddplink.on('nosub', function (m) {
										if (m.id == _this2.subscriptionId) {
												f(m.error || m);
										}
								});
								return onNs;
						}
				}
		}, {
				key: 'onReady',
				value: function onReady(f) {
						var _this3 = this;

						if (this.isReady()) {
								f();
						} else {
								var onReady = this._ddplink.on('ready', function (m) {
										if (m.subs.includes(_this3.subscriptionId)) {
												f();
										}
								});
								return onReady;
						}
				}
		}, {
				key: 'isReady',
				value: function isReady() {
						return this._ready;
				}
		}, {
				key: 'isStopped',
				value: function isStopped() {
						return this._nosub;
				}
		}, {
				key: 'ready',
				value: function ready() {
						var _this4 = this;

						return new Promise(function (resolve, reject) {
								if (_this4.isReady()) {
										resolve();
								} else {
										var onReady = _this4._ddplink.on('ready', function (m) {
												if (m.subs.includes(_this4.subscriptionId)) {
														onReady.stop();
														_onNosub.stop();
														resolve();
												}
										});
										var _onNosub = _this4._ddplink.on('nosub', function (m) {
												if (m.id == _this4.subscriptionId) {
														_onNosub.stop();
														onReady.stop();
														reject(m.error || m);
												}
										});
								}
						});
				}
		}, {
				key: 'nosub',
				value: function nosub() {
						var _this5 = this;

						return new Promise(function (resolve, reject) {
								if (_this5.isStopped()) {
										resolve();
								} else {
										var _onNosub2 = _this5._ddplink.on('nosub', function (m) {
												if (m.id == _this5.subscriptionId) {
														_this5._nosub = true;

														_onNosub2.stop();
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
		}, {
				key: 'isOn',
				value: function isOn() {
						return this._started;
				}
		}, {
				key: 'remove',
				value: function remove() {
						this.selfNosubEvent.stop();

						this.stop();

						var i = this._ddplink.subs.indexOf(this);
						if (i > -1) {
								this._ddplink.subs.splice(i, 1);
						}
				}
		}, {
				key: 'stop',
				value: function stop() {
						if (this._started) {
								this.selfReadyEvent.stop();

								if (!this._nosub) this._ddplink.ddpConnection.unsub(this.subscriptionId);
								this._started = false;
								this._ready = false;
						}
						return this.nosub();
				}
		}, {
				key: '_getId',
				value: function _getId() {
						return this.subscriptionId;
				}
		}, {
				key: 'start',
				value: function start(args) {
						if (!this._started) {
								this.selfReadyEvent.start();

								if (Array.isArray(args)) this.args = args;
								this.subscriptionId = this._ddplink.ddpConnection.sub(this.pubname, this.args);
								this._started = true;
						}
						return this.ready();
				}
		}, {
				key: 'restart',
				value: function restart(args) {
						var _this6 = this;

						return new Promise(function (resolve, reject) {
								_this6.stop().then(function () {
										_this6.start(args).then(function () {
												resolve();
										}).catch(function (e) {
												reject(e);
										});
								}).catch(function (e) {
										reject(e);
								});
						});
				}
		}]);

		return ddpSubscription;
}();