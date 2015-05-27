'use strict';

var ejs = require('ejs');
var debug = require('debug')('flowbench:template');

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
  if (o !== null && isPlainObject(o)) {
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
      if (o !== null && isPlainObject(o)) {
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
        o = render(o.call(o, data), data, dataAsArray);
      }
      else {
        o = render(o.apply(data, dataAsArray), data, dataAsArray);
      }

      break;
  }

  return o;
}


function isPlainObject(o) {
  return o.constructor == Object;
}