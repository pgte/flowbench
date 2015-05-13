# flowbench


# Install

```
$ npm install flowbench
```


# Use

## Programatically

```js
var flowbench = require('flowbench');

var experiment = flowbench();

experiment
  .flow({probability: 0.6})
    .get('/', {id: 1})
    .verify(verifyResponse1Function)
    .wait(500)
    .post('/abc', {id: 2, json: '{"some": "static payload"'})
    .verify(verifyResponse1Function)
      .flow({probability: 0.5})
        .post('/abc/{{res.2.prop2}}',
              {json: '{"a":#{res.1.prop1}, "b": "#{res.2.prop2}"'})
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