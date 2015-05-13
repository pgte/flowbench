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

return;

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