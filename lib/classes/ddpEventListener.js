"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ddpEventListener = exports.ddpEventListener = function () {
	function ddpEventListener(eventname, f, ddplink) {
		_classCallCheck(this, ddpEventListener);

		this._ddplink = ddplink;
		this._eventname = eventname;
		this._f = f;
		this._started = false;
		this.start();
	}

	_createClass(ddpEventListener, [{
		key: "stop",
		value: function stop() {
			if (this._started) {
				this._ddplink.ddpConnection.removeListener(this._eventname, this._f);
				this._started = false;
			}
		}
	}, {
		key: "start",
		value: function start() {
			if (!this._started) {
				this._ddplink.ddpConnection.on(this._eventname, this._f);
				this._started = true;
			}
		}
	}]);

	return ddpEventListener;
}();