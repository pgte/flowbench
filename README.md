# flowbench


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
      body: {a: "static value", b: "#{fixtures.b.random()}"},
      fixtures: {
        b: ['VALUE1', 'VALUE2', 'VALUE3']
      },
      timeout: 4000
    })
    .verify(
      flowbench.verify.response.statusCode(200),
      flowbench.verify.response.body({a: '#{req.body.b}'})
      )
    .flow({probability: 0.5})
      .post('/abc/#{res.2.prop2}',
            {body: {a: "#{res.1.prop1}", "b": "#{res.2.prop2}"}})
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


experiment.begin();
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
      maxSockets: 5
    },
    timeout: 10e3
  }
};
```

the `requestDefaults` object is the options for creating a [scoped request](https://github.com/request/request#requestdefaultsoptions).

# License

ISC