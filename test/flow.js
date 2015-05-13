var test = require('tape');
var nock = require('nock');

var flowbench = require('../');

test('basic flow with one request', function(t) {
  var scope = nock('http://localhost:3001')
    .get('/abc')
    .reply(200);

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:3001'
    }
  });

  experiment
    .flow()
    .get('/abc')
    .end();

  experiment.begin(function() {
    scope.done();
    t.end();
  });
});

test('basic flow with two requests', function(t) {
  var scope = nock('http://localhost:3002')
    .get('/abc')
    .reply(200)
    .post('/def')
    .reply(201);

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:3002'
    }
  });

  experiment
    .flow()
    .get('/abc')
    .post('/def')
    .end();

  experiment.begin(function() {
    scope.done();
    t.end();
  });

});


test('basic population > 1 flow with one request', function(t) {
  var scope = nock('http://localhost:3003')
    .get('/abc')
    .times(10)
    .reply(200);

  var experiment = flowbench({
    population: 10,
    requestDefaults: {
      baseUrl: 'http://localhost:3003'
    }
  });

  experiment
    .flow()
    .get('/abc')
    .end();

  experiment.begin(function() {
    scope.done();
    t.end();
  });
});

test('basic population > 1 concurrency', function(t) {
  var scope = nock('http://localhost:3003')
    .get('/abc')
    .reply(200);

  var experiment = flowbench({
    population: 10,
    maxConcurrentFlows: 1,
    requestDefaults: {
      baseUrl: 'http://localhost:3003'
    }
  });

  experiment
    .flow()
    .get('/abc')
    .end();

  var countdown = 10;
  experiment.on('response', function() {
    if (-- countdown > 0) {
      scope
        .get('/abc')
        .reply(200);
    }
  });

  experiment.begin(function() {
    scope.done();
    t.end();
  });
});