'use strict';

var Measured = require('measured');

module.exports = Stats;

function Stats(experiment) {
  var stats = {
    requestsPerSecond: new Measured.Meter(),
    latencyNs: new Measured.Histogram(),
    requests: {},
    statusCodes: {}
  };

  stats.requestsPerSecond.unref();

  experiment.on('request', function(req) {
    var start = process.hrtime();
    stats.requestsPerSecond.mark();

    var key = req.method + ' ' + req.uri.href;
    var stat = stats.requests[key];
    if (! stat) {
      stat = stats.requests[key] = {
        latencyNs: new Measured.Histogram(),
        statusCodes: {}
      };
    }

    req.once('response', function(response) {
      var diff = process.hrtime(start);
      var ns = diff[0] * 1e9 + diff[1];
      stats.latencyNs.update(ns);
      stat.latencyNs.update(ns);

      var statusCodeStat = stat.statusCodes[response.statusCode];
      if (! statusCodeStat) {
        statusCodeStat =
          stat.statusCodes[response.statusCode] =
          new Measured.Counter();
      }
      statusCodeStat.inc();

      var statusCode = response.statusCode;
      var statusCodeStats = stats.statusCodes[statusCode];
      if (! statusCodeStats) {
        statusCodeStats = stats.statusCodes[statusCode] = new Measured.Counter();
      }
      statusCodeStats.inc();
    });
  });

  function toJSON() {
    var ret = {
      requestsPerSecond: stats.requestsPerSecond.toJSON(),
      latencyNs: stats.latencyNs.toJSON(),
      requests: {},
      statusCodes: {}
    };

    for(var req in stats.requests) {
      ret.requests[req] = {
        latencyNs: stats.requests[req].latencyNs.toJSON()
      };
    }

    for(var code in stats.statusCodes) {
      var count = stats.statusCodes[code].toJSON();
      ret.statusCodes[code] = {
        count: count,
        percentage: count / ret.requestsPerSecond.count
      };
    }

    return ret;
  };

  return {
    toJSON: toJSON
  };
}