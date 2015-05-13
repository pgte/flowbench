var test = require('tape');
var nock = require('nock');

var flowbench = require('../');

test('basic flow', function(t) {
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