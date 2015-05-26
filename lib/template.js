'use strict';

var ejs = require('ejs');
var debug = require('debug')('flowbench:template');
var isStream = require('isstream');

exports.prepare = prepareForEval;

function prepareForEval(o) {
  switch(typeof o) {
    case 'string':
      o = ejs.compile(o);
      o.ejs = true;
      break;
    case 'object':
      o = prepareObject(o);
      break;
  }
  return o;
}

function prepareObject(o) {
  if (o !== null && !isStream(o)) {
    var original = o;
    o = {};
    Object.keys(original).forEach(function(key) {
      if (original.hasOwnProperty(key)) {
        if (key != 'fixtures') {
          o[key] = prepareForEval(original[key]);
        }
        else {
          o[key] = original[key];
        }
      }
    });
  }

  return o;
}

exports.render = render;

function render(o, data, dataAsArray) {
  switch(typeof o) {
    case 'object':
      if (o !== null && !isStream(o)) {
        var original = o;
        o = {};
        Object.keys(original).forEach(function(key) {
          if (original.hasOwnProperty(key) && key != 'fixtures') {
            o[key] = render(original[key], data, dataAsArray);
          }
        });
      }
      break;
    case 'function':
      if (o.ejs) {
        debug('rendering with data %j', data);
        o = o.call(o, data);
      }
      else {
        o = o.apply(data, dataAsArray);
      }

      break;
  }

  return o;
}
