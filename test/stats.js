'use strict';

var test = require('tape');
var nock = require('nock');

var flowbench = require('../');

test('stats', function(t) {
  var scope = nock('http://localhost:9000')
    .get('/abc')
    .times(1000)
    .delay(100)
    .reply(200)
    .post('/def')
    .times(1000)
    .delay(50)
    .reply(201);

  var experiment = flowbench('experiment name', {
    sessions: 1000,
    requestDefaults: {
      baseUrl: 'http://localhost:9000'
    }
  });

  experiment
    .flow()
      .get('/abc')
      .post('/def');

  experiment.begin(function(err, stats) {
    if (err) {
      throw err;
    }
    scope.done();

    t.equal(typeof stats, 'object');

    t.equal(stats.name, 'experiment name');

    t.equal(stats.options.maxConcurrentSessions, Infinity);
    t.equal(stats.options.sessions, 1000);
    t.equal(stats.options.requestDefaults.baseUrl, 'http://localhost:9000');

    t.equal(typeof stats.latencyNs, 'object', 'stats.latencyNs is object');
    t.equal(stats.latencyNs.count, 2000);
    t.ok(stats.latencyNs.max > 0, 'stats.latencyNs.max > 0');

    t.equal(typeof stats.requestsPerSecond, 'object');
    t.equal(stats.requestsPerSecond.count, 2000);
    t.ok(stats.requestsPerSecond.currentRate > 0,
        'stats.latencyNs.currentRate > 0');

    var stat = stats.requests['GET http://localhost:9000/abc']
    t.equal(typeof stat, 'object');
    t.equal(stat.latencyNs.count, 1000);
    t.ok(stat.latencyNs.max > 0, 'stats.latencyNs.max > 0');
    t.equal(stat.statusCodes[200].count, 1000);
    t.equal(stat.statusCodes[200].percentage, 1);

    stat = stats.requests['POST http://localhost:9000/def']
    t.equal(typeof stat, 'object');
    t.equal(stat.latencyNs.count, 1000);
    t.ok(stat.latencyNs.max > 0, 'stats.latencyNs.max > 0');
    t.equal(stat.statusCodes[201].count, 1000);
    t.equal(stat.statusCodes[201].percentage, 1);

    stat = stats.statusCodes[200];
    t.equal(typeof stat, 'object');
    t.equal(stat.count, 1000);
    t.equal(stat.percentage, 0.5);

    t.equal(typeof stats.lag, 'object');
    t.equal(typeof stats.lag.min, 'number');
    t.equal(typeof stats.lag.max, 'number');
    t.equal(typeof stats.lag.variance, 'number');
    t.equal(typeof stats.lag.p95, 'number');

    t.end();
  });
});
