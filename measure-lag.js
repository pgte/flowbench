'use strict';

var EventEmitter = require('events').EventEmitter;

var toobusy = require('toobusy-js');

var lagReporter = new EventEmitter();

module.exports = lagReporter;

setInterval(function() {
  lagReporter.emit('max lag', toobusy.maxLag());
}, Number(process.env.EVENT_LOOP_LAG_POLL_INTERVAL_MS) || 500).unref();