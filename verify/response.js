'use strict';

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