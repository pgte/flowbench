'use strict';

var Stream = require('stream').Stream;
var async = require('async');
var extend = require('xtend');
var distributeProbabilities = require('./lib/distribute-flow-probabilities');
var debug = require('debug')('flowbench:flow');
var template = require('./lib/template');
var humanInterval = require('human-interval');

var defaultOptions = {};

module.exports = function Flow(parent, options, experiment) {
  var parentOptions = extend({}, parent.options);

  options = extend({
    request: parentOptions.request
  }, defaultOptions, options);

  var tasks = [];
  var flows = [];
  var req = parent.options.req || {};
  var res = parent.options.res || {};
  var templateData = {
    req: req,
    res: res
  };

  var locals;
  var lastRequest;
  var lastResponse;

  var flowing = false;


  var flow = function(cb) {
    debug('executing flow');
    var l;
    var t = tasks;

    if (locals) {
      t = wrapTasks(locals(), tasks)
    }

    async.series(t, cb);
  };

  flow.options = options;
  flow.req = req;
  flow.res = res;

  flow.prepare = function() {
    distributeProbabilities(flows);
    flows.forEach(function(flow) {
      flow.prepare();
    });
  };

  flow.locals = function(fn) {
    if (locals) {
      throw new Error('already had defined flow locals');
    }
    if (typeof fn == 'object') {
      var l = fn;
      fn = function() {
        return extend({}, l);
      };
    }
    locals = fn;
    return flow;
  };

  flow.request = function(method, url, options) {
    checkNotFlowing();

    url = template.prepare(url);
    options = template.prepare(options);
    var data = extend({}, templateData, {
      fixtures: options && options.fixtures && fixturize(options.fixtures)
    });
    var dataAsArray = [data.req, data.res, data.fixtures];

    tasks.push(function(cb) {
      options = extend({}, options, {
        uri: template.render(url, data, dataAsArray),
        method: method.toUpperCase()
      });

      var d;

      if (locals) {
        d = extend({
          locals: this
        }, data);
      }
      else {
        d = data;
      }

      options = template.render(options, d, dataAsArray);

      debug('options.body: %j', options.body);
      debug('options.json: %j', options.json);

      var stream = (options.body instanceof Stream) && options.body;

      if (stream) {
        delete options.body;
      }
      else if (typeof options.json == 'undefined' &&
               typeof options.body == 'object')
      {
        options.json = true;
      }

      debug('request options:', options);

      var request = parentOptions.request(options, function(err, resp, body) {
        if (resp) {
          experiment.emit('response', resp);
          resp.body = body;
          res[options.id] = resp;
        }
        if (err) {
          experiment.emit('request-error', request, err);
        }
        cb();
      });
      lastRequest = request;

      request.once('response', function(res) {
        lastResponse = res;
      });

      experiment.emit('request', request);

      if (stream) {
        stream.pipe(request);
      }

      if (options.id) {
        req[options.id] = extend({}, request, {
          body: options.body ? options.body : request.body,
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
          valid = verifier.call(null, lastRequest, lastResponse);
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
            lastRequest,
            lastResponse);
        }
        cb();
      });
    });

    return flow;
  };

  flow.wait = function(time) {
    if (typeof time == 'string') {
      time = humanInterval(time);
    }
    checkNotFlowing();
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

function wrapTasks(locals, tasks) {
  return tasks.map(function(task) {
    return function() {
      task.apply(locals, arguments);
    };
  });
}
