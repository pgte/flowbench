module.exports = function distributeProbabilities(flows) {
    var probability = 1;
    var forcedProbability = 0;

    flows.forEach(function(flow) {
      var p = flow.options.probability;
      if (p) {
        forcedProbability += p;
      }
    });

    if (forcedProbability > 1) {
      throw new Error('Children flows probability sums > 1: ' + forcedProbability);
    }

    probability -= forcedProbability;

    var remainingFlows = flows.filter(function(flow) {
      return typeof flow.options.probability == 'undefined';
    });

    probability = probability / remainingFlows.length;

    remainingFlows.forEach(function(flow) {
      flow.options.probability = probability;
    });
  }