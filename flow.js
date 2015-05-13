'use strict';

var async = require('async');
var extend = require('xtend');
var uuid = require('node-uuid').v4;
var debug = require('debug')('flowbench:flow');

var defaultOptions = {
  probability: 1
};

module.exports = function Flow(parent, options, experiment) {
  var parentOptions = extend({}, parent.options);

  options = extend({
    request: parentOptions.request
  }, defaultOptions, options);

  var tasks = [];
  var req = {};
  var res = {};
  var lastRequest;

  var flow = function(cb) {
    debug('executing flow');
    if (options.probability < 1 && Math.random() > options.probability) {
      debug('bypassing flow');
      cb();
    } else {
      debug('executing flow');
      async.series(tasks, cb);
    }
  };

  flow.options = options;

  ['get', 'post', 'delete', 'head', 'put'].forEach(function(method) {
    flow[method] = function(url, options) {
      tasks.push(function(cb) {
        options = extend({}, options, {
          uri: url,
          method: method.toUpperCase()
        });
        options.json = options.body;

        if (! options.id) {
          options.id = uuid();
        }

        lastRequest = options.id;

        debug('request options:', options);

        experiment.emit('request', options);
        var request = parentOptions.request(options, function(err, resp, body) {
          experiment.emit('response', res);
          if (resp) {
            resp.body = body;
            res[options.id] = resp;
          }
          cb(err);
        });

        req[options.id] = request;

      });

      return flow;
    };
  });

  flow.verify = function() {
    var verifiers = Array.prototype.slice.call(arguments);
    verifiers.forEach(function(verifier) {
      tasks.push(function(cb) {
        var valid = false;
        var err;
        try {
          valid = verifier.call(null, req[lastRequest], res[lastRequest]);
        } catch(_err) {
          err = _err;
        }

        if (! err && valid instanceof Error) {
          err = valid;
        }

        if (err) {
          cb(err);
        } else if (! valid) {
          cb(new Error('unknown verification error'));
        } else {
          cb();
        }
      });
    });

    return flow;
  };

  flow.flow = function(options) {
    return new Flow(this, options, experiment);
  };

  flow.end = function() {
    return parent;
  };

  return flow;
}