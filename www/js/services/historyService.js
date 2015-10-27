angular.module('Measure.services.History', [])
.factory('HistoryService', function($q, StorageService, $rootScope, ChromeAppSupport) {
  var DEFAULT_VALUE = { "measurements": [] };  
  var HistoryService = {};

  function set(historicalData) {
    return StorageService.set("historicalData", historicalData);
  }

  HistoryService.get = function() {
    return StorageService.get("historicalData", DEFAULT_VALUE);
  };

  HistoryService.add = function (measurementRecord) {
    return HistoryService.get().then(function(historicalData) {
      measurementRecord.index = historicalData.measurements.length; // surrogate key, "good nuff" for now
      historicalData.measurements.push(measurementRecord);
      return historicalData;
    })
    .then(set)
    .then(function() { ChromeAppSupport.notify('history:measurement:change', measurementRecord); });
  };

  HistoryService.hide = function (index) {
    return HistoryService.get().then(function(historicalData) {
      if (index >= 0 && index < historicalData.measurements.length) {
        historicalData.measurements = historicalData.measurements.filter(function(measurement) {
          return measurement.index != index;
        });
      }
      return historicalData;
    })
    .then(set)
    .then(function() { ChromeAppSupport.notify('history:measurement:change', index); });
  };

  HistoryService.annonate = function (index, measurementNote) {
    return HistoryService.get().then(function(historicalData) {
      historicalData.measurements.some(function(measurement) {
        if(measurement.index == index) {
          measurement.note = measurementNote;
          return true;
        } else {
          return false;
        }
      });
      return historicalData;
    }).then(set);
  };

  HistoryService.getById = function (index) {
    return HistoryService.get().then(function(historicalData) {
      var measurement = null;
      if (index >= 0 && index < historicalData.measurements.length) {
        measurement = historicalData.measurements[index];
      }
      return measurement;
    });
  };

  HistoryService.reset = function () {
    set(DEFAULT_VALUE).then(function() { ChromeAppSupport.notify('history:measurement:change', null); });
  };
  
  return HistoryService;
});
