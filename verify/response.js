'use strict';

var deepEqual = require('deep-equal');

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
  return function(req, res) {
    if (! deepEqual(res.body, body)) {
      return new Error(
        'response body was ' + JSON.stringify(res.body) +
        '. Expected ' + JSON.stringify(body));
    } else {
      return true;
    }
  }
};