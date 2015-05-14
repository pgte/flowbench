'use strict';

var test = require('tape');
var template = require('../lib/template');

test('works on strings', function(t) {
  t.plan(1);
  var tpl = template.prepare('abc');
  t.equal(template.render(tpl), 'abc');
});

test('works on numbers', function(t) {
  t.plan(1);
  var tpl = template.prepare(123);
  t.equal(template.render(tpl), 123);
});

test('works on interpolated strings', function(t) {
  t.plan(1);
  var tpl = template.prepare('<%= a %>bc');
  t.equal(template.render(tpl, {a: 'A'}), 'Abc');
});

test('works on object', function(t) {
  t.plan(1);
  var tpl = template.prepare({a:1, b:"c"});
  t.deepEqual(template.render(tpl), {a:1, b:"c"});
});

test('works on objects with interpolated strings', function(t) {
  t.plan(1);
  var tpl = template.prepare({a:1, b:"c", d: "<%= d %>EF"});
  t.deepEqual(template.render(tpl, {d: 'D'}), {a:1, b:"c", d: "DEF"});
});

test('works on functions', function(t) {
  t.plan(1);
  var tpl = template.prepare({a:1, b:"c", d: function(a, b, c) {
    return [a,b,c].join(',');
  }});
  t.deepEqual(template.render(tpl, {d: 'D'}, ['A', 'B', 'C']), {a:1, b:"c", d: "A,B,C"});
});
