'use strict';

var EventEmitter = require('events').EventEmitter;
var request = require('request');
var inherits = require('inherits');
var async = require('async');
var debug = require('debug')('flowbench:flow');

var Flow = require('./flow');

module.exports = Experiment;

function Experiment(options) {
  if (! (this instanceof Experiment)) {

    return new Experiment(options);
  }

  options.request = request.defaults(options.requestDefaults);
  this.options = options;
  this._pipeline = [];
  this._running = 0;
  this._done = 0;
};

inherits(Experiment, EventEmitter);


var E = Experiment.prototype;

E.push = function push(fn) {
  this._pipeline.push(fn);
};

E.flow = function flow(options) {
  var flow = Flow(this, options, this)
  this.push(flow);
  return flow;
}

E.one = function(cb) {
  async.series(this._pipeline, cb);
};

E.launchSome = function() {
  var self = this;
  var left = this.options.population - this._done - this._running;
  left = Math.min(left, this.options.maxConcurrentFlows);

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
    this.once('end', cb);
  }

  debug('beginning experiment, have %d tasks in pipeline', this._pipeline.length);

  this.launchSome();
};