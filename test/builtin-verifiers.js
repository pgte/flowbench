'use strict';

var test = require('tape');
var nock = require('nock');

var flowbench = require('../');

test('verify response code builtin', function(t) {
  t.plan(2);

  var scope = nock('http://localhost:5000')
    .post('/abc')
    .reply(200, 'this is the response body');

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:5000'
    }
  });

  experiment
    .flow()
    .post('/abc')
    .verify(flowbench.verify.response.status(201))
    .end();

  experiment.once('error', function(err) {
    t.equal(err.message, 'response status code was 200. Expected 201');
  });

  experiment.begin(function() {
    t.ok(scope.isDone());
  });
});

test('verify response code builtin 2', function(t) {
  t.plan(1);

  var scope = nock('http://localhost:5001')
    .post('/abc')
    .reply(201, 'this is the response body');

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:5001'
    }
  });

  experiment
    .flow()
    .post('/abc')
    .verify(flowbench.verify.response.status(201))
    .end();

  experiment.begin(function() {
    t.ok(scope.isDone());
  });
});