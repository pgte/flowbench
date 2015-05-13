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

  experiment.begin(function() {
    t.notOk(scope.isDone());
  });
});