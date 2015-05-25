'use strict';

var test = require('tape');
var nock = require('nock');

var flowbench = require('../');

test('locals with a factory function', function(t) {
  var scope = nock('http://localhost:11000')
    .filteringRequestBody(function(body) {
      t.equal(body, '11');
      return '*';
    })
    .post('/locals', '*')
    .twice()
    .reply(200);

  var experiment = flowbench({
    population: 2,
    requestDefaults: {
      baseUrl: 'http://localhost:11000'
    }
  });

  experiment.flow()
    .locals(function() {
      return {
        counter: 10
      };
    })
    .post('/locals', {
      body: '<%= ++locals.counter %>'
    })
    .end();

  experiment.begin(function(err) {
    if (err) { throw err; }
    scope.done();
    t.end();
  });

});


test('locals with an object', function(t) {
  var scope = nock('http://localhost:11001')
    .filteringRequestBody(function(body) {
      t.equal(body, '21');
      return '*';
    })
    .post('/locals', '*')
    .twice()
    .reply(200);

  var experiment = flowbench({
    population: 2,
    requestDefaults: {
      baseUrl: 'http://localhost:11001'
    }
  });

  experiment.flow()
    .locals({
      counter: 20
    })
    .post('/locals', {
      body: '<%= ++locals.counter %>'
    })
    .end();

  experiment.begin(function(err) {
    if (err) { throw err; }
    scope.done();
    t.end();
  });

});
