'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ddpCollection = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fullCopy = require('../helpers/fullCopy.js');

var _ddpOnChange = require('./ddpOnChange.js');

var _ddpReactiveCollection = require('./ddpReactiveCollection.js');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ddpCollection = exports.ddpCollection = function () {
  function ddpCollection(name, server) {
    _classCallCheck(this, ddpCollection);

    this._name = name;
    this._server = server;
    this._filter = false;
  }

  _createClass(ddpCollection, [{
    key: 'filter',
    value: function filter(f) {
      this._filter = f;
      return this;
    }
  }, {
    key: 'importData',
    value: function importData(data) {
      var _this = this;

      var c = typeof data === 'string' ? EJSON.parse(data) : data;

      if (c[this._name]) {
        c[this._name].forEach(function (doc, i, arr) {
          if (!_this._filter || _this._filter && _this._filter(doc, i, arr)) {
            _this.ddpConnection.emit('added', {
              msg: 'added',
              _id: doc._id,
              collection: _this._name,
              fields: doc.fields
            });
          }
        });
      }
    }
  }, {
    key: 'exportData',
    value: function exportData(format) {
      var collectionCopy = _defineProperty({}, this._name, this.fetch());
      if (format === undefined || format == 'string') {
        return EJSON.stringify(collectionCopy);
      } else if (format == 'raw') {
        return collectionCopy;
      }
    }
  }, {
    key: 'fetch',
    value: function fetch(settings) {
      var skip = void 0,
          limit = void 0,
          sort = void 0;

      if (settings) {
        skip = settings.skip;
        limit = settings.limit;
        sort = settings.sort;
      }

      var c = this._server.collections[this._name];
      var collectionCopy = c ? (0, _fullCopy.fullCopy)(c) : [];
      if (this._filter) collectionCopy = collectionCopy.filter(this._filter);
      if (sort) collectionCopy.sort(sort);
      if (typeof skip === 'number') collectionCopy.splice(0, skip);
      if (typeof limit === 'number' || limit == Infinity) collectionCopy.splice(limit);
      return collectionCopy;
    }
  }, {
    key: 'reactive',
    value: function reactive(settings) {
      return new _ddpReactiveCollection.ddpReactiveCollection(this, settings, this._filter);
    }
  }, {
    key: 'onChange',
    value: function onChange(f, filter) {
      var obj = {
        collection: this._name,
        f: f
      };

      if (this._filter) obj.filter = this._filter;
      if (filter) obj.filter = filter;

      return new _ddpOnChange.ddpOnChange(obj, this._server);
    }
  }]);

  return ddpCollection;
}();
