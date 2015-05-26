'use strict';

var Flow = require('./flow');
var debug = require('debug')('flowbench:repeat');

var methods = [
 'verify',
 'wait',
 'request',
 'get', 'post', 'delete', 'head', 'put'];

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
    var session = this;
    debug('executing repeat, session is %j', session);
    var count = 0;
    var calledback = false;

    _repeat();

    function _repeat() {
      debug('calling child flow');


      flow.call(session, function(err) {
        count ++;
        debug('flow called back, count is %d', count);
        if (err) {
          callback(err);
        }
        else if (whilst.call(session, count)) {
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
