'use strict';

var extend = require('xtend');
var debug = require('debug')('flowbench:flow');

var Experiment = require('./experiment');

var defaultOptions = {
  sessions: 1,
  maxConcurrentSessions: Infinity,
  requestDefaults: {
    pool: {
      maxSockets: Infinity
    },
    timeout: 10e3
  }
};

exports = module.exports = function Flowbench(name, options) {


  if (arguments.length < 2) {
    options = name;
    name = undefined;
  }

  debug('experiment with options %j', options);

  options = extend({}, defaultOptions, options);
  options.requestDefaults = extend(
    {}, defaultOptions.requestDefaults, options.requestDefaults);

  return Experiment(name, options);
}

exports.verify = require('./verify');

exports.humanize = require('./humanize');

function error(msg) {
  throw new Error(msg);
}