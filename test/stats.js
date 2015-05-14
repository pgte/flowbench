'use strict';

var test = require('tape');
var nock = require('nock');

var flowbench = require('../');

test('basic flow with one request', function(t) {
  var scope = nock('http://localhost:9000')
    .get('/abc')
    .times(1000)
    .delay(100)
    .reply(200);

  var experiment = flowbench({
    population: 1000,
    requestDefaults: {
      baseUrl: 'http://localhost:9000'
    }
  });

  experiment
    .flow()
      .get('/abc');

  experiment.begin(function(err, stats) {
    if (err) {
      throw err;
    }
    scope.done();

    t.equal(typeof stats, 'object');

    t.equal(typeof stats.latencyNs, 'object', 'stats.latencyNs is object');
    t.equal(stats.latencyNs.count, 1000);
    t.ok(stats.latencyNs.max > 0, 'stats.latencyNs.max > 0');

    t.equal(typeof stats.requestsPerSecond, 'object');
    t.equal(stats.requestsPerSecond.count, 1000);
    t.ok(stats.requestsPerSecond.currentRate > 0, 'stats.latencyNs.currentRate > 0');

    t.end();
  });
});
