var test = require('tape');
var nock = require('nock');

var flowbench = require('../');

test('verify returning true', function(t) {
  t.plan(1);

  var scope = nock('http://localhost:4000')
    .get('/abc')
    .reply(200, 'this is the response body');

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:4000'
    }
  });

  experiment
    .flow()
    .get('/abc')
    .verify(function() {
      return true;
    })
    .end();

  experiment.begin(function() {
    t.ok(scope.isDone());
  });
});

test('verify returning false', function(t) {
  t.plan(2);

  var scope = nock('http://localhost:4001')
    .get('/abc')
    .reply(200, 'this is the response body');

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:4001'
    }
  });

  experiment
    .flow()
    .get('/abc')
    .verify(function() {
      return false;
    })
    .end();

  experiment.once('error', function(err) {
    t.equal(err.message, 'unknown verification error');
  });

  experiment.begin(function() {
    t.ok(scope.isDone());
  });
});


test('verify returning an error', function(t) {
  t.plan(2);

  var scope = nock('http://localhost:4002')
    .get('/abc')
    .reply(200, 'this is the response body');

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:4002'
    }
  });

  experiment
    .flow()
    .get('/abc')
    .verify(function() {
      return new Error('some custom error message');
    })
    .end();

  experiment.once('error', function(err) {
    t.equal(err.message, 'some custom error message');
  });

  experiment.begin(function() {
    t.ok(scope.isDone());
  });
});


test('verify throwing an error', function(t) {
  t.plan(2);

  var scope = nock('http://localhost:4003')
    .get('/abc')
    .reply(200, 'this is the response body');

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:4003'
    }
  });

  experiment
    .flow()
    .get('/abc')
    .verify(function() {
      throw new Error('just threw this');
    })
    .end();

  experiment.once('error', function(err) {
    t.equal(err.message, 'just threw this');
  });

  experiment.begin(function() {
    t.ok(scope.isDone());
  });
});

test('verify has access to last request and response', function(t) {
  t.plan(3);

  var scope = nock('http://localhost:4004')
    .get('/abc')
    .reply(200, 'this is the response body');

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:4004'
    }
  });

  experiment
    .flow()
    .get('/abc')
    .verify(function(req, res) {
      t.equal(req.path, '/abc');
      t.equal(res.body, 'this is the response body');
      return true;
    })
    .end();

  experiment.begin(function() {
    t.ok(scope.isDone());
  });
});