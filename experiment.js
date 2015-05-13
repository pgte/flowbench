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
};

inherits(Experiment, EventEmitter);


var E = Experiment.prototype;

E.push = function push(fn) {
  this._pipeline.push(fn);
};

E.flow = function flow(options) {
  var flow = Flow(this, options)
  this.push(flow);
  return flow;
}

E.begin = function(cb) {
  var self = this;

  if (cb) {
    this.once('end', cb);
  }

  debug('beginning experiment, have %d tasks in pipeline', this._pipeline.length);

  async.series(this._pipeline, function(err) {
    debug('finished experiment', err);
    if (err) {
      self.emit('error', err);
    } else {
      self.emit('end');
    }
  });
};