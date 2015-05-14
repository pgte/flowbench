'use strict';

var Measured = require('measured');

module.exports = Stats;

function Stats(experiment) {
  var stats = {
    requestsPerSecond: new Measured.Meter(),
    latencyNs: new Measured.Histogram(),
    requests: {}
  };

  stats.requestsPerSecond.unref();

  experiment.on('request', function(req) {
    var start = process.hrtime();
    stats.requestsPerSecond.mark();

    var key = req.method + ' ' + req.uri.href;
    var stat = stats.requests[key];
    if (! stat) {
      stat = stats.requests[key] = {
        latencyNs: new Measured.Histogram()
      };
    }

    req.once('response', function(response) {
      var diff = process.hrtime(start);
      var ns = diff[0] * 1e9 + diff[1];
      stats.latencyNs.update(ns);
      stat.latencyNs.update(ns);
    });
  });

  function toJSON() {
    var ret = {
      requestsPerSecond: stats.requestsPerSecond.toJSON(),
      latencyNs: stats.latencyNs.toJSON(),
      requests: {}
    };

    for(var req in stats.requests) {
      ret.requests[req] = {
        latencyNs: stats.requests[req].latencyNs.toJSON()
      };
    }

    return ret;
  };

  return {
    toJSON: toJSON
  };
}