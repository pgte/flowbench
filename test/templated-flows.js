'use strict';

var test = require('tape');
var nock = require('nock');

var flowbench = require('../');

test('templated flow can access req and res', function(t) {
  t.plan(1);

  var scope = nock('http://localhost:7000')
    .post('/abc')
    .reply(201, 'ABC')
    .post('/def', {a: 'ABCDEF', b: '/abc'})
    .reply(202, {b:'DEF'})

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:7000'
    }
  });

  experiment
    .flow()
      .post('/abc', {id: 'aaa'})
      .verify(flowbench.verify.response.body('ABC'))
      .post('/def', {
        body: {
          a: '<%= res.aaa.body %>DEF',
          b: '<%= req.aaa.path %>',
        }})
      .verify(flowbench.verify.response.body({b: 'DEF'}));

  experiment.begin(function() {
    t.ok(scope.isDone());
  });
});
