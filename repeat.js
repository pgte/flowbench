'use strict';

var Flow = require('./flow');
var debug = require('debug')('flowbench:repeat');

var methods = ['request', 'get', 'post', 'delete', 'head', 'put', 'wait'];

module.exports = function(experiment, parentFlow, repeats) {
  var flow = Flow(parentFlow, {}, experiment);

  var whilst;
  if (typeof repeats == 'number') {
    whilst = function(idx) {
      debug('whilst %d', idx);
      return idx < repeats;
    };
  }
  else if (typeof repeats == 'function') {
    whilst = repeats;
  }
  else {
    throw new Error('Number of repeats is either number or function');
  }

  var repeat = function(cb) {
    debug('executing repeat');
    var self = this;
    var count = 0;
    var calledback = false;

    _repeat();

    function _repeat() {
      debug('calling child flow');


      flow.call(self, function(err) {
        count ++;
        debug('flow called back, count is %d', count);
        if (err) {
          callback(err);
        }
        else if (whilst.call(self, count)) {
          _repeat(cb);
        }
        else {
          debug('whilst returned false, terminating repeat');
          callback();
        }
      });
    }

    function callback() {
      if (!calledback) {
        calledback = true;
        cb.apply(null, arguments);
      }
    }
  };

  methods.forEach(function(method) {
    repeat[method] = function() {
      debug('client called %s', method);
      flow[method].apply(this, arguments);
      return repeat;
    };
  });

  repeat.end = function() {
    return flow;
  };


  return repeat;
};
