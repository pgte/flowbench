'use strict';

var extend = require('xtend');
var debug = require('debug')('flowbench:flow');

var Experiment = require('./experiment');

var defaultOptions = {
  population: 1,
  maxConcurrentFlows: Infinity,
  requestDefaults: {
    pool: true,
    timeout: 10e3
  }
};

module.exports = function Flowbench(options) {

  debug('experiment with options %j', options);
  options = extend({}, defaultOptions, options);
  options.requestDefaults = extend(
    {}, defaultOptions.requestDefaults, options.requestDefaults);

  return Experiment(options);
}

function error(msg) {
  throw new Error(msg);
}