'use strict';

var test = require('tape');
var nock = require('nock');
var URL = require('url');

var flowbench = require('../');

test('chained flow combining verify and wait', function(t) {
  t.plan(1);

  var scope = nock('http://localhost:9500')
    .filteringPath(/.*/, '*')
    .get('*')
    .reply(200, function(uri, requestBody) {
      return {airportcode: URL.parse(uri, true).query.airportcode};
    });

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:9500'
    }
  });

  experiment.flow()
    .get('/search', {
      qs: {
        'airportcode': '<%= fixtures.airports.random() %>'
      },
      json: true,
      fixtures: {
        airports: ['FNC', 'LIS', 'TRL', 'ORL']
      }
    })
    .verify(function(req, res) {
      if (res.body.airportcode != req.qs.airportcode) {
        return new Error('airport code mismatch');
      } else {
        return true;
      }
    });

  experiment.begin(function(err) {
    if (err) { throw err; }
    t.ok(scope.isDone());
  });
});

