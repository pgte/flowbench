# flowbench

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
    "mean": 1553.1142913007939,
    "count": 2000,
    "currentRate": 1553.0690525094378,
    "1MinuteRate": 0,
    "5MinuteRate": 0,
    "15MinuteRate": 0
  },
  "latencyNs": {
    "min": 404579371,
    "max": 529651864,
    "sum": 909018533495,
    "variance": 1021644882835250.5,
    "mean": 454509266.7475,
    "stddev": 31963180.111422744,
    "count": 2000,
    "median": 449394340.5,
    "p75": 479035640,
    "p95": 518584514.75,
    "p99": 525746130.59,
    "p999": 529448875.953
  },
  "requests": {
    "GET http://localhost:9000/abc": {
      "latencyNs": {
        "min": 412764134,
        "max": 529651864,
        "sum": 459860721219,
        "variance": 1190561319227412.8,
        "mean": 459860721.219,
        "stddev": 34504511.5778707,
        "count": 1000,
        "median": 450906029.5,
        "p75": 488541572.25,
        "p95": 524400784.34999996,
        "p99": 528362707.71,
        "p999": 529651673.953
      }
    },
    "POST http://localhost:9000/def": {
      "latencyNs": {
        "min": 404579371,
        "max": 494960320,
        "sum": 449157812276,
        "variance": 796417650609005.2,
        "mean": 449157812.276,
        "stddev": 28220872.605378546,
        "count": 1000,
        "median": 447438629.5,
        "p75": 477294423.25,
        "p95": 493084183.55,
        "p99": 494412999.53,
        "p999": 494960179.19200003
      }
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


## About string interpolation and templating

In option you pass into the request (url, options), you can use strings as EJS templates. These templates can access these objects:

* req: an object with all requests performed, addressed by `id`.
* res: an object with all the responses received, addressed by `id`.

(see first example above of using ids and templates).


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

# License

ISC