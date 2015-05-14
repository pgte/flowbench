'use strict';

var Measured = require('measured');

module.exports = Stats;

function Stats(experiment) {
  var stats = {
    requestsPerSecond: new Measured.Meter(),
    latencyNs: new Measured.Histogram(),
    requests: {},
    statusCodes: {},
    errors: {}
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
        statusCodes: {},
        errors: {}
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

  experiment.on('request-error', function(req, err) {
    var code = err.code || err.message;

    var stat = stats.errors[code];
    if (! stat) {
      stat = stats.errors[code] = new Measured.Counter();
    }
    stat.inc();

    var key = req.method + ' ' + req.uri.href;
    var stat = stats.requests[key];
    if (! stat) {
      stat = stats.requests[key] = {
        latencyNs: new Measured.Histogram(),
        statusCodes: {},
        errors: {}
      };
    }

    var errorStat = stat.errors[code];
    if (! errorStat) {
      errorStat = stat.errors[code] = new Measured.Counter();
    }
    errorStat.inc();
  });

  function toJSON() {
    var ret = {
      requestsPerSecond: stats.requestsPerSecond.toJSON(),
      latencyNs: stats.latencyNs.toJSON(),
      requests: {},
      statusCodes: {},
      errors: {}
    };

    for(var req in stats.requests) {

      var statusCodes = {};
      for(var statusCode in stats.requests[req].statusCodes) {
        var count = stats.requests[req].statusCodes[statusCode].toJSON();
        statusCodes[statusCode] = {
          count: count,
          percentage: count / stats.requests[req].latencyNs.toJSON().count
        };
      }

      var errors = {};
      for(var error in stats.requests[req].errors) {
        var count = stats.requests[req].errors[error].toJSON();
        errors[error] = {
          count: count,
          percentage: count / stats.requests[req].latencyNs.toJSON().count
        };
      }

      ret.requests[req] = {
        latencyNs: stats.requests[req].latencyNs.toJSON(),
        statusCodes: statusCodes,
        errors: errors
      };
    }

    for(var code in stats.statusCodes) {
      var count = stats.statusCodes[code].toJSON();
      ret.statusCodes[code] = {
        count: count,
        percentage: count / ret.requestsPerSecond.count
      };
    }

    for(var error in stats.errors) {
      var count = stats.errors[error].toJSON();
      ret.errors[error] = {
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