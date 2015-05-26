'use strict';

var Stream = require('stream').Stream;
var async = require('async');
var extend = require('xtend');
var distributeProbabilities = require('./lib/distribute-flow-probabilities');
var debug = require('debug')('flowbench:flow');
var template = require('./lib/template');
var humanInterval = require('human-interval');
var isStream = require('isstream');

var defaultOptions = {};

module.exports = function Flow(parent, options, experiment) {

  var tasks = [];
  var flows = [];
  var localsFactory;
  var flowing = false;
  var parentOptions = extend({}, parent.options);

  options = extend({
    request: parentOptions.request
  }, defaultOptions, options);

  var flow = function(cb) {
    debug('executing flow', this);

    var session = extend({}, this, {
      locals: localsFactory && localsFactory() ||
              this && this.locals || {}
    });

    debug('session:', session);

    async.series(wrapTasks(session, tasks), cb);
  };

  flow.options = options;

  flow.prepare = function() {
    distributeProbabilities(flows);
    flows.forEach(function(flow) {
      flow.prepare();
    });
  };

  flow.locals = function(fn) {
    if (localsFactory) {
      throw new Error('already had defined flow locals');
    }
    if (typeof fn == 'object') {
      var l = fn;
      fn = function() {
        return extend({}, l);
      };
    }
    localsFactory = fn;
    return flow;
  };

  flow.repeat = function(repeats) {
    var repeat = Repeat(experiment, flow, repeats);
    tasks.push(repeat);
    return repeat;
  };

  flow.request = function(method, url, options) {
    debug('request options:', options);
    checkNotFlowing();

    var requestId = options && options.id;
    if (options && requestId !== undefined) {
      debug('request id:', requestId);
      delete options.id;
    }

    url = template.prepare(url);
    options = template.prepare(options) || {};
    debug('request options after prepare:', options);
    var fixtures = options && options.fixtures && fixturize(options.fixtures);


    debug('fixtures:', fixtures);

    tasks.push(function(cb) {
      var session = this;
      debug('current session:', session);

      var data = extend({}, session, {
        fixtures: fixtures
      });

      var dataAsArray = [data.req, data.res, data.fixtures];

      debug('options before rendering:', options);

      var opt = extend({}, options, {
        uri: template.render(url, data, dataAsArray),
        method: method.toUpperCase()
      });

      opt = template.render(opt, data, dataAsArray);

      debug('options.body: %j', opt.body);
      debug('options.json: %j', opt.json);

      var stream = isStream(opt.body) && opt.body;

      if (stream) {
        debug('body is a stream');
        delete opt.body;
      } else {
        debug('body is NOT a stream');
      }

      if (!stream &&
          typeof opt.json == 'undefined' &&
          typeof opt.body == 'object')
      {
        opt.json = true;
      }

      debug('request options:', opt);

      var request = parentOptions.request(opt, function(err, resp, body) {
        if (resp) {
          debug('have response');
          experiment.emit('response', resp);
          resp.body = body;
          if (requestId) {
            session.res[requestId] = resp;
          }
        }
        if (err) {
          debug('request errored:', err);
          experiment.emit('request-error', request, err);
        }
        cb();
      });
      session._lastRequest = request;

      request.once('response', function(res) {
        session._lastResponse = res;
      });

      experiment.emit('request', request);

      if (stream) {
        stream.pipe(request);
      }

      if (requestId) {
        session.req[requestId] = extend({}, request, {
          body: options.body ? !stream && options.body : request.body,
          qs: options.qs ? options.qs : request.qs
        });
      }
    });

    return flow;
  };

  ['get', 'post', 'delete', 'head', 'put'].forEach(function(method) {
    flow[method] = function(url, options) {
      return flow.request(method.toUpperCase(), url, options);
    };
  });

  flow.verify = function() {
    checkNotFlowing();
    var verifiers = Array.prototype.slice.call(arguments);
    verifiers.forEach(function(verifier) {
      tasks.push(function(cb) {
        var valid = false;
        var err;
        try {
          valid = verifier.call(null, this._lastRequest, this._lastResponse);
        } catch(_err) {
          err = _err;
        }

        if (! err && valid instanceof Error) {
          err = valid;
        }
        if (! err && (typeof valid == 'boolean') && ! valid) {
          err = new Error('unknown verification error');
        }

        if (err) {
          experiment.emit(
            'verify-error',
            err,
            this._lastRequest,
            this._lastResponse);
        }
        cb();
      });
    });

    return flow;
  };

  flow.wait = function(time) {
    checkNotFlowing();
    if (typeof time == 'string') {
      time = humanInterval(time);
    }
    tasks.push(function(cb) {
      setTimeout(cb, time);
    });
    return flow;
  };

  flow.flow = function(options) {
    if (! flowing) {
      flowing = true;
      tasks.push(doFlows);
    }
    var flow = Flow(this, options, experiment);
    flows.push(flow);
    return flow;
  };

  flow.end = function() {
    return parent;
  };

  flow.type = 'flow';

  function doFlows(cb) {
    var random = Math.random();
    var sum = 0;
    var flow;
    var idx = 0;
    while(sum < random && idx < flows.length) {
      flow = flows[idx];
      if (flow) {
        sum += flow.options.probability;
      }
      idx ++;
    }
    if (! flow) {
      throw new Error('No flow to select');
    }
    flow(cb);
  }

  function checkNotFlowing() {
    if (flowing) {
      throw new Error('Adding more tasks after flows is not allowed');
    }
  }

  return flow;
}

function isFlow(task) {
  return task.type == 'flow';
}

function fixturize(fixtures) {
  if (Array.isArray(fixtures)) {
    Object.defineProperty(fixtures, 'random', {
      enumerable: false,
      value: pickRandom
    });
  } else if(typeof fixtures == 'object') {
    Object.keys(fixtures).forEach(function(key) {
      if (fixtures.hasOwnProperty(key)) {
        fixtures[key] = fixturize(fixtures[key]);
      }
    });
  }

  return fixtures;
}

function pickRandom() {
  /* jshint validthis:true */
  var i = Math.floor(Math.random() * this.length);
  return this[i];
}

function wrapTasks(session, tasks) {
  return tasks.map(function(task) {
    return function() {
      task.apply(session, arguments);
    };
  });
}

var Repeat = require('./repeat');
