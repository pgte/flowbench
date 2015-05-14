'use strict';

var async = require('async');
var extend = require('xtend');
var uuid = require('node-uuid').v4;
var distributeProbabilities = require('./lib/distribute-flow-probabilities');
var debug = require('debug')('flowbench:flow');
var template = require('./lib/template');

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
  var lastRequest;
  var flowing = false;

  var flow = function(cb) {
    debug('executing flow');
    async.series(tasks, cb);
  };

  flow.options = options;
  flow.req = req;
  flow.res = res;

  flow.request = function(method, url, options) {
    checkNotFlowing();

    url = template.prepare(url);
    options = template.prepare(options);
    var data = extend({}, templateData, {
      fixtures: options && fixturize(options.fixtures)
    });
    var dataAsArray = [data.req, data.res, data.fixtures];

    tasks.push(function(cb) {
      options = extend({}, options, {
        uri: template.render(url, data, dataAsArray),
        method: method.toUpperCase()
      });
      options = template.render(options, data, dataAsArray);

      debug('options.body: %j', options.body);
      debug('options.json: %j', options.json);

      if (typeof options.json == 'undefined' &&
          typeof options.body == 'object')
      {
        options.json = true;
      }


      if (! options.id) {
        options.id = uuid();
      }

      lastRequest = options.id;

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
      experiment.emit('request', request);

      req[options.id] = extend({}, request, {
        body: options.body ? options.body : request.body,
        qs: options.qs ? options.qs : request.qs
      });
    });

    return flow;
  };

  ['get', 'post', 'delete', 'head', 'put'].forEach(function(method) {
    flow[method] = function(url, options) {
      return   flow.request(method.toUpperCase(), url, options);
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
          valid = verifier.call(null, req[lastRequest], res[lastRequest]);
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
          experiment.emit('verify-error', err, req[lastRequest], res[lastRequest]);
        }
        cb();
      });
    });

    return flow;
  };

  flow.wait = function(ms) {
    checkNotFlowing();
    tasks.push(function(cb) {
      setTimeout(cb, ms);
    });
    return flow;
  };

  flow.flow = function(options) {
    if (! flowing) {
      flowing = true;
      tasks.push(doFlows);
    }
    var flow = new Flow(this, options, experiment);
    flows.push(flow);
    return flow;
  };

  flow.end = function() {
    return parent;
  };

  flow.type = 'flow';

  function doFlows(cb) {
    distributeProbabilities(flows);
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
    fixtures.random = pickRandom;
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
  var i = Math.floor(Math.random() * this.length);
  return this[i];
}