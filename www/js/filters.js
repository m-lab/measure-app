angular.module('Measurement.filters', [])

.filter('capitalize', function() {
    return function(input, all) {
      return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
    };
})

.filter('formatThroughputMeasurement', function() {
  return function(input) {
    var filteredInput;

    if (input !== undefined) {
         filteredInput = String((Number(input) / 1000).toFixed(2)); // + " Mbit/s";
    } else {
        filteredInput = '';
    }
    return filteredInput;
  };
})

.filter('formatThroughputDisplay', function() {
  return function(input) {
    var filteredInput;

    if (input !== undefined) {
         filteredInput = String((Number(input) / 1000).toFixed(2)) + " Mbit/s";
    } else {
        filteredInput = '';
    }
    return filteredInput;
  };
})

.filter('formatLatencyMeasurement', function() {
  return function(input) {
    return String(Number(input)) + " ms";
  };
})

.filter('formatDataConsumptionMeasurement', function() {
  return function(input) {
    if (Number(input) > Math.pow(1000, 3)) {
        return String((Number(input) / Math.pow(1000, 3)).toFixed(2)) + " Gbit";
    }
    return String((Number(input) / Math.pow(1000, 2)).toFixed(2)) + " Mbit";
  };
})

.filter('formatProbabilityMeasurement', function() {
  return function(input) {
    return String((Number(input) * 100).toFixed(2)) + "%";
  };
});
