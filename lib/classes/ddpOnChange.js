'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ddpOnChange = exports.ddpOnChange = function () {
  function ddpOnChange(obj, inst) {
    var listenersArray = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'onChangeFuncs';

    _classCallCheck(this, ddpOnChange);

    this._obj = obj;
    this._inst = inst;
    this._isStopped = true;
    this._listenersArray = listenersArray;
    this.start();
  }

  _createClass(ddpOnChange, [{
    key: 'stop',
    value: function stop() {
      var i = this._inst[this._listenersArray].indexOf(this._obj);
      if (i > -1) {
        this._isStopped = true;
        this._inst[this._listenersArray].splice(i, 1);
      }
    }
  }, {
    key: 'start',
    value: function start() {
      if (this._isStopped) {
        this._inst[this._listenersArray].push(this._obj);
        this._isStopped = false;
      }
    }
  }]);

  return ddpOnChange;
}();