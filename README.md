# flowbench

[![Build Status](https://travis-ci.org/pgte/flowbench.svg?branch=master)](https://travis-ci.org/pgte/flowbench)

HTTP traffic generator. Supports user flows with alternative paths.
Stores stats on latency.

# Install

```
$ npm install flowbench
```


# Use

## Programatically

```js
var flowbench = require('flowbench');

var experiment = flowbench({
  base: 'http://localhost:3000',
  population: 100,
  maxConcurrentFlows: 50,
  requestDefaults: {
    timeout: 10000,
    jar: false
  }
});

experiment
  .flow({probability: 0.6})
    .get('/', {id: 1})
    .verify(verifyResponse1Function)
    .wait(500)
    .post('/abc', {
      id: 2,
      body: {a: "static value", b: "<%=fixtures.b.random()%>"},
      fixtures: {
        b: ['VALUE1', 'VALUE2', 'VALUE3']},
      timeout: 4000
    })
    .verify(
      flowbench.verify.response.status(200),
      flowbench.verify.response.body({a: '#{req.body.b}'}))
    .flow({probability: 0.5})
      .post('/abc/<%= res[2].prop2 %>',
            {body: {a: "<%= res[1].prop1 %>", "b": "<%= res[2].prop2} %>"}})
      .verify(...)
      .end()
    .flow({probability: 0.5})
      .get('/abc')
      .verify(...)
      .end()
    .end()
  .flow({probability: 0.4})
    .get('/')
    .verify(verifyResponse1Function);


experiment.begin(function(err, stats) {
  
});
experiment.once('end', function(results) {
  console.log('results:', results);
});
```

# API

## flowbench(options)

Options defaults:

```js
{
  population: 1,
  maxConcurrentFlows: Infinity,
  requestDefaults: {
    pool: {
      maxSockets: Infinity
    },
    timeout: 10e3
  }
};
```

the `requestDefaults` object is the options for creating a [scoped request](https://github.com/request/request#requestdefaultsoptions).

Returns an Experiment

## Experiment

### experient.flow(options)

Adds an alternative flow to the experiment.

Options:

* `probability` - when more than one sibiling flow is present, this represents the probability of this flow getting executed.

All flows within an experiment are alternative, and are given equal probability (unless otherwise specified.)

Returns an instance of a Flow.

### experiment.begin(cb)

Begins an experiment. Callsback when there is an error or the experiment finishes.

The callback has the following signature:

```
function callback(err, stats) {}
```

The `stats` object is something like this:

```js
{
  "requestsPerSecond": {
    "mean": 1651.547543071806,
    "count": 2000,
    "currentRate": 1651.4908801787194,
    "1MinuteRate": 0,
    "5MinuteRate": 0,
    "15MinuteRate": 0
  },
  "latencyNs": {
    "min": 397537333,
    "max": 489818898,
    "sum": 881597582934,
    "variance": 493325414798874.75,
    "mean": 440798791.467,
    "stddev": 22210930.07505257,
    "count": 2000,
    "median": 446440646.5,
    "p75": 454043121.5,
    "p95": 478719555.34999996,
    "p99": 488775828.4,
    "p999": 489641718.259
  },
  "requests": {
    "GET http://localhost:9000/abc": {
      "latencyNs": {
        "min": 429215073,
        "max": 489818898,
        "sum": 454618892085,
        "variance": 201579551941901.38,
        "mean": 454618892.085,
        "stddev": 14197871.387708137,
        "count": 1000,
        "median": 449254332.5,
        "p75": 463742870,
        "p95": 486903385.4,
        "p99": 488928787.48,
        "p999": 489818732.511
      },
      "statusCodes": {
        "200": {
          "count": 1000,
          "percentage": 1
        }
      }
    },
    "POST http://localhost:9000/def": {
      "latencyNs": {
        "min": 397537333,
        "max": 459961256,
        "sum": 426978690849,
        "variance": 403192361971691.8,
        "mean": 426978690.849,
        "stddev": 20079650.44445973,
        "count": 1000,
        "median": 419389668,
        "p75": 445073831.5,
        "p95": 459471652.6,
        "p99": 459851196.18,
        "p999": 459961244.691
      },
      "statusCodes": {
        "201": {
          "count": 1000,
          "percentage": 1
        }
      }
    }
  },
  "statusCodes": {
    "200": {
      "count": 1000,
      "percentage": 0.5
    },
    "201": {
      "count": 1000,
      "percentage": 0.5
    }
  }
}
```

## Flow

One flow executes the requests added to it in sequence. You can add subflows to a flow (only after the requests have been specified).

### flow.flow(options)

Creates a child flow.

Options:

* `probability` - when more than one sibiling flow is present, this represents the probability of this flow getting executed.

Returns a flow.


### flow.end()

Returns the parent flow (or experiment, if at root).

### flow.request(method, url[, options])

Add a request to a flow.

Options:

* id: a string identifying the request. Can access it later inside templates.
* fixtures: See the [Fixtures](#fixtures) section below.
* body: object or string, representing the request body
* headers: object with headers
* qs: an object with the query string names and values
* form: sets the body to a querystring representation
* jar: cookie jar or `false`
* ... all other options supported by [request](https://github.com/request/request).

### flow.get(url[, options]), flow.post, flow.put, flow.delete, flow.head

Helpers for `flow.request()`.


### flow.verify(fn)

Pass in a verification function. This function has the following signature:

```js
function(req, res) {}
```

This function will then be responsible for verifying the latest request and response.

If the verification fails, this function can either:

* return an `Error` object
* return `false`
* throw an `Error` object

Otherwise, if verification passed, this function should return `true`.

### flow builtin verifiers

You can use the following verifiers:

* flowbench.verify.response.status(201)
* flowbench.verify.response.body({a:1, b:2})


## About string interpolation and templating

In option you pass into the request (url, options), you can use strings as EJS templates. These templates can access these objects:

* req: an object with all requests performed, addressed by `id`.
* res: an object with all the responses received, addressed by `id`.

(see first example above of using ids and templates).


### Functions instead of values

In any of the `url` or `options` for a request, you can pass in a function with the followig signature to be evaluated at run time:

```js
function (req, res, fixtures) {}
```

## Fixtures

You can define fixtures for any given request, and you can use these fixtures in your request options.

For instance, you can have a given set of airports as fixtures that you can use randomly throughout the request like this:

```js
experiment
  .flow.get('/search', {
    qs: {
      'airportcode': '<%= fixtures.airports.random() %>'
    },
    fixtures: {
      airports: require('./airport-codes.json')
    }
  });
```

If you wish, you can then verify the response by looking at the request:

```js
experiment
  .flow.get('/search', {
    qs: {
      'airportcode': '<%= fixtures.airports.random() %>'
    },
    fixtures: {
      airports: require('./airport-codes.json')
    }
  })
  .verify(function(req, res) {
    return res.body.airportcode == req.qs.airportcode
  });
```

## flowbench.humanize (experimental)

Once you get the stats, you can get a more humanized version of it by passing it through `flowbench.humanize` like this:

```js
experiment.begin(function(err, stats) {
  if (err) {
    throw err;
  }
  stats = flowbench.humanize(stats);
  console.log(JSON.stringify(stats, null, '  '));
});
```

# License

ISC