'use strict';

var test = require('tape');
var nock = require('nock');

var flowbench = require('../');

test('repeat with number', function(t) {
  var scope = nock('http://localhost:12000')
    .get('/repeat/1')
    .times(4)
    .reply(200)
    .get('/repeat/2')
    .times(4)
    .reply(200);

  var experiment = flowbench({
    population: 2,
    requestDefaults: {
      baseUrl: 'http://localhost:12000'
    }
  });

  experiment.flow()
    .repeat(2)
      .get('/repeat/1')
      .get('/repeat/2')
    .end();

  experiment.begin(function(err) {
    if (err) { throw err; }
    scope.done();
    t.end();
  });

});

test('repeat with function', function(t) {
  var scope = nock('http://localhost:12001')
    .get('/repeat/1')
    .times(4)
    .reply(200)
    .get('/repeat/2')
    .times(4)
    .reply(200);

  var experiment = flowbench({
    population: 2,
    requestDefaults: {
      baseUrl: 'http://localhost:12001'
    }
  });

  var count = 0;

  experiment.flow()
    .repeat(function(idx) {
      count ++;
      t.equal(idx, Math.ceil(count / 2));
      return idx < 2;
    })
      .get('/repeat/1')
      .get('/repeat/2')
    .end();

  experiment.begin(function(err) {
    if (err) { throw err; }
    scope.done();
    t.end();
  });

});


test('repeat with function has access to locals', function(t) {
  var scope = nock('http://localhost:12002')
    .get('/repeat/1')
    .times(4)
    .reply(200)
    .get('/repeat/2')
    .times(4)
    .reply(200);

  var experiment = flowbench({
    population: 2,
    requestDefaults: {
      baseUrl: 'http://localhost:12002'
    }
  });

  var count = 0;

  experiment.flow()
    .locals({
      abc: 'def'
    })
    .repeat(function(idx) {
      t.equals(this.abc, 'def');
      count ++;
      t.equal(idx, Math.ceil(count / 2));
      return idx < 2;
    })
      .get('/repeat/1')
      .get('/repeat/2')
    .end();

  experiment.begin(function(err) {
    if (err) { throw err; }
    scope.done();
    t.end();
  });

});


