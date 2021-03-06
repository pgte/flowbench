'use strict';

var EventEmitter = require('events').EventEmitter;
var request = require('request');
var inherits = require('inherits');
var clone = require('lodash').clone;
var distributeProbabilities = require('./lib/distribute-flow-probabilities');
var debug = require('debug')('flowbench:flow');

var Flow = require('./flow');
var Stats = require('./stats');

module.exports = Experiment;

function Experiment(name, options) {
  if (! (this instanceof Experiment)) {
    return new Experiment(name, options);
  }

  if (! options) {
    options = {};
  }

  this.name = name;
  options.request = request.defaults(clone(options.requestDefaults, true));
  this.options = options;
  this.stats = Stats(this);
  this.flows = [];
  this._running = 0;
  this._done = 0;
}

inherits(Experiment, EventEmitter);


var E = Experiment.prototype;

E.prepare = function prepare() {
  distributeProbabilities(this.flows);
  this.flows.forEach(function(flow) {
    flow.prepare();
  });
};

E.push = function push(fn) {
  this.flows.push(fn);
};

E.flow = function flow(options) {
  var childFlow = Flow(this, options, this)
  this.push(childFlow);
  return childFlow;
}

E.one = function(cb) {
  var random = Math.random();
  var sum = 0;
  var flow;
  var idx = 0;
  while(sum < random && idx < this.flows.length) {
    flow = this.flows[idx];
    if (flow) {
      sum += flow.options.probability;
    }
    idx ++;
  }
  if (! flow) {
    throw new Error('No flow to select');
  }
  var session = {
    req: {},
    res: {}
  };
  flow.call(session, cb);
};

E.launchSome = function() {
  var self = this;
  var left = this.options.sessions - this._done - this._running;
  left = Math.min(left, this.options.maxConcurrentSessions);

  if (! left) {
    this.emit('end');
  } else {
    for(var i = 0 ; i < left ; i ++) {
      this._running ++;
      this.one(callback);
    }
  }


  function callback(err) {
    self._running --;
    self._done ++;
    if (err) {
      self.emit('error', err);
    }
    self.launchSome();
  }
};

E.begin = function(cb) {
  var self = this;

  if (cb) {
    var calledback = false;
    this.once('error', function(err) {
      if (! calledback) {
        calledback = true;
        cb(err);
      }
    })
    this.once('end', function() {
      if (! calledback) {
        calledback = true;
        var waitFor = Number(process.env.WAIT_BEFORE_STATS_MS) || 5e3;
        setTimeout(function() {
          cb(null, self.stats.toJSON());
        }, waitFor);
      }
    });
  }

  debug('beginning experiment, have %d tasks in pipeline', this.flows.length);

  this.prepare();
  this.launchSome();
};