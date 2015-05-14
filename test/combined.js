'use strict';

var test = require('tape');
var nock = require('nock');

var flowbench = require('../');

test('chained flow combining verify and wait', function(t) {
  t.plan(1);

  var scope = nock('http://localhost:5000')
    .post('/abc')
    .reply(201, 'ABC')
    .post('/def')
    .reply(202, 'DEF')

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:5000'
    }
  });

  experiment
    .flow()
    .post('/abc')
    .verify(
      flowbench.verify.response.status(201),
      flowbench.verify.response.body('ABC'))
    .wait(300)
    .post('/def')
    .verify(
      flowbench.verify.response.status(202),
      flowbench.verify.response.body('DEF'))
    .end();

  experiment.begin(function(err) {
    if (err) { throw err; }
    t.ok(scope.isDone());
  });
});

test('nested flow', function(t) {
  t.plan(1);

  var scope = nock('http://localhost:5000')
    .post('/abc')
    .reply(201, 'ABC')
    .post('/def')
    .reply(202, 'DEF')

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:5000'
    }
  });

  experiment
    .flow()
    .post('/abc')
    .verify(
      flowbench.verify.response.status(201),
      flowbench.verify.response.body('ABC'))
    .wait(300)
    .flow()
      .post('/def')
      .verify(
        flowbench.verify.response.status(202),
        flowbench.verify.response.body('DEF'));

  experiment.begin(function(err) {
    if (err) { throw err; }
    t.ok(scope.isDone());
  });
});