'use strict';

var ejs = require('ejs');

module.exports = function eval(str, data) {
  return ejs.render(str, data);
};