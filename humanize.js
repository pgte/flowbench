'use strict';

var extend = require('xtend');
var humanize = require('humanize-duration');

module.exports = function humanize(stats) {
  return _humanize(extend({}, stats), false);
};

function _humanize(o, isNs, key) {
  switch (typeof o) {

    case 'object':
      Object.keys(o).forEach(function(key) {
        if (key == 'latencyNs') {
          o['latency'] = _humanize(o[key], true, key);
          delete o[key];
        } else {
          o[key] = _humanize(o[key], isNs, key);
        }
      });
      break;

    case 'number':
      if (isNs) {
        if (key == 'variance') {
          o = Math.round(o / 1e6);
        } else {
          o = humanize(Math.round(o / 1e6));
        }
      } else if (key == 'percentage') {
        o = Math.round(o * 100).toString() + '%';
      } else {
        o = Math.round(o * 10) / 10;
      }

      break;
  }

  return o;
}
