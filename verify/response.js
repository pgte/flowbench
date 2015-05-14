'use strict';

var deepEqual = require('deep-equal');
var template = require('../lib/template');

exports.status = function(status) {
  return function(req, res) {
    if (res.statusCode != status) {
      return new Error(
        'response status code was ' + res.statusCode +
        '. Expected ' + status);
    } else {
      return true;
    }
  };
};

exports.body = function(body) {
  var tpl = template.prepare(body);
  return function(req, res) {
    var body = template.render(tpl, {req: req, res: res});
    if (res.body != body && !deepEqual(res.body, body)) {
      return new Error(
        'response body was ' + JSON.stringify(res.body) +
        '. Expected ' + JSON.stringify(body));
    } else {
      return true;
    }
  }
};