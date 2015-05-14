'use strict';

var test = require('tape');
var nock = require('nock');

var flowbench = require('../');

test('chained flow combining verify and wait', function(t) {
  t.plan(1);

  var scope = nock('http://localhost:6000')
    .post('/abc')
    .reply(201, 'ABC')
    .post('/def')
    .reply(202, 'DEF')

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:6000'
    }
  });

  experiment
    .flow()
      .post('/abc')
      .verify(
        flowbench.verify.response.status(201),
        flowbench.verify.response.body('ABC'))
      .wait(300)
      .end()
    .flow()
      .post('/def')
      .verify(
        flowbench.verify.response.status(202),
        flowbench.verify.response.body('DEF'));

  experiment.begin(function(err) {
    if (err) { throw err; }
    t.notOk(scope.isDone());
  });
});


test('subflows after ops', function(t) {
  t.plan(1);

  var scope = nock('http://localhost:6001')
    .post('/abc')
    .reply(201, 'ABC')
    .post('/def')
    .reply(202, 'DEF')

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:6001'
    }
  });

  experiment
    .flow()
      .post('/abc')
      .verify(
        flowbench.verify.response.status(201),
        flowbench.verify.response.body('ABC'))
      .wait(300)
      .end()
    .flow()
      .post('/def')
      .verify(
        flowbench.verify.response.status(202),
        flowbench.verify.response.body('DEF'));

  experiment.begin(function(err) {
    if (err) { throw err; }
    t.notOk(scope.isDone());
  });
});


test('subflows after ops', function(t) {
  t.plan(1);

  var scope = nock('http://localhost:6002')
    .post('/abc')
    .reply(201, 'ABC')
    .post('/def')
    .reply(202, 'DEF')

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:6002'
    }
  });

  experiment
    .flow()
      .post('/abc')
      .verify(
        flowbench.verify.response.status(201),
        flowbench.verify.response.body('ABC'))
      .wait(300)
      .end()
    .flow()
      .post('/def')
      .verify(
        flowbench.verify.response.status(202),
        flowbench.verify.response.body('DEF'));

  experiment.begin(function(err) {
    if (err) { throw err; }
    t.notOk(scope.isDone());
  });
});

test('flows probability distribution', function(t) {
  t.plan(3);
  var scope;
  var max = 100;

  function setupMocks() {
    nock.cleanAll();
    scope = nock('http://localhost:6003')
      .post('/abc')
      .reply(201, 'ABC')
      .post('/def')
      .reply(202, 'DEF');
  }

  setupMocks();

  var experiment = flowbench({
    population: max,
    maxConcurrentFlows: 1,
    requestDefaults: {
      baseUrl: 'http://localhost:6003'
    }
  });

  var distribution = {
    '/abc': 0,
    '/def': 0
  }

  experiment
    .flow({probability: 0.9})
      .post('/abc')
      .end()
    .flow()
      .post('/def');

  var count = max + 1;
  experiment.on('request', function(req) {
    distribution[req.path] ++;
    if (--count > 0) {
      setupMocks();
    }
  });

  experiment.begin(function(err) {
    if (err) { throw err; }
    nock.cleanAll();
    t.ok(distribution['/abc'] > 0);
    t.ok(distribution['/def'] > 0);
    t.ok(distribution['/abc'] > 2 * distribution['/def']);
  });
});


test('subflows probability distribution', function(t) {
  t.plan(3);
  var scope;
  var max = 100;

  function setupMocks() {
    nock.cleanAll();
    scope = nock('http://localhost:6004')
      .post('/abc')
      .reply(201, 'ABC')
      .post('/def')
      .reply(202, 'DEF');
  }

  setupMocks();

  var experiment = flowbench({
    population: max,
    maxConcurrentFlows: 1,
    requestDefaults: {
      baseUrl: 'http://localhost:6004'
    }
  });

  var distribution = {
    '/abc': 0,
    '/def': 0
  }

  experiment
    .flow()
      .flow({probability: 0.9})
        .post('/abc')
        .end()
      .flow()
        .post('/def');

  var count = max + 1;
  experiment.on('request', function(req) {
    distribution[req.path] ++;
    if (--count > 0) {
      setupMocks();
    }
  });

  experiment.begin(function(err) {
    if (err) { throw err; }
    nock.cleanAll();
    t.ok(distribution['/abc'] > 0);
    t.ok(distribution['/def'] > 0);
    t.ok(distribution['/abc'] > 2 * distribution['/def']);
  });
});