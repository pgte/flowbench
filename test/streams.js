'use strict';

var fs = require('fs');
var join = require('path').join;
var test = require('tape');
var nock = require('nock');

var flowbench = require('../');

var bodyFilePath = join(__dirname, 'fixtures', 'body.bin');
var body = fs.readFileSync(bodyFilePath, {encoding: 'hex'});

test('supports stream as body', function(t) {
  var scope = nock('http://localhost:10000')
    .post('/streaming', body)
    .reply(200);

  var experiment = flowbench({
    requestDefaults: {
      baseUrl: 'http://localhost:10000'
    }
  });

  experiment
    .flow()
    .post('/streaming', {
      body: fs.createReadStream(bodyFilePath)
    })
    .end();

  experiment.begin(function(err) {
    if (err) { throw err; }
    scope.done();
    t.end();
  });
});
