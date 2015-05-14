'use strict';

var ejs = require('ejs');

exports.prepare = prepareForEval;

function prepareForEval(o) {
  switch(typeof o) {
    case 'string':
      o = ejs.compile(o);
      break;
    case 'object':
      prepareObject(o);
      break;
  }
  return o;
};

function prepareObject(o) {
  Object.keys(o).forEach(function(key) {
    if (key != 'fixtures' && o.hasOwnProperty(key)) {
      o[key] = prepareForEval(o[key]);
    }
  });
}

exports.render = render;

function render(o, data) {
  switch(typeof o) {
    case 'object':
      Object.keys(o).forEach(function(key) {
        if (key != 'fixtures' && o.hasOwnProperty(key)) {
          o[key] = render(o[key], data);
        }
      });
      break;
    case 'function':
      o = o.call(o, data);
      break;
  }

  return o;
};