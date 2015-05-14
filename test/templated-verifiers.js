'use strict';

var test = require('tape');
var nock = require('nock');

var flowbench = require('../');

test('verify templated response body', function(t) {
  t.plan(1);

  var scope = nock('http://localhost:8000')
    .post('/abc', 'this is the request body')
    .reply(200, 'this is the request body plus the response');

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:8000'
    }
  });

  experiment
    .flow()
    .post('/abc', {
      body: 'this is the request body'
    })
    .verify(
      flowbench.verify.response.body('<%= req.body %> plus the response'))
    .end();

  experiment.begin(function() {
    t.ok(scope.isDone());
  });
});


test('verify templated response body', function(t) {
  t.plan(1);

  var scope = nock('http://localhost:8001')
    .post('/abc', {a:'this is the request body'})
    .reply(200, {b:'this is the request body plus the response'});

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:8001'
    }
  });

  experiment
    .flow()
    .post('/abc', {
      body: {a:'this is the request body'}
    })
    .verify(
      flowbench.verify.response.body({b: '<%= req.body.a %> plus the response'}))
    .end();

  experiment.begin(function() {
    t.ok(scope.isDone());
  });
});