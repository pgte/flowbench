'use strict';

var Measured = require('measured');

module.exports = Stats;

function Stats(experiment) {
  var stats = {
    requestsPerSecond: new Measured.Meter(),
    latencyNs: new Measured.Histogram()
  };

  stats.requestsPerSecond.unref();

  experiment.on('request', function(req) {
    var start = process.hrtime();
    stats.requestsPerSecond.mark();
    req.once('response', function(response) {
      var diff = process.hrtime(start);
      stats.latencyNs.update(diff[0] * 1e9 + diff[1]);
    });
  });

  return {
    toJSON: function() {
      return {
        requestsPerSecond: stats.requestsPerSecond.toJSON(),
        latencyNs: stats.latencyNs.toJSON()
      };
    }
  };
}