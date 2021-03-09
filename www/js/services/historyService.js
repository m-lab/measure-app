angular.module('Measure.services.History', [])
.factory('HistoryService', function($q, StorageService, $rootScope, ChromeAppSupport, UploadService) {
  var DEFAULT_VALUE = { "measurements": [] };
  var HistoryService = {};

  function set(historicalData) {
    console.log("Called set");
    console.log(historicalData)
    return StorageService.set("historicalData", historicalData);
  }

  HistoryService.get = function() {
    return StorageService.get("historicalData", DEFAULT_VALUE);
  };

  HistoryService.add = function (measurementRecord) {
    console.log("Adding measurement:" + measurementRecord);
    return HistoryService.get().then(function(historicalData) {
      measurementRecord.index = historicalData.measurements.length; // surrogate key, "good nuff" for now
      historicalData.measurements.push(measurementRecord);
      $rootScope.$emit('history:measurement:change');
      return historicalData;
    })
    .then(set)
    .then(function() { ChromeAppSupport.notify('history:measurement:change', measurementRecord); });
  };

  HistoryService.hide = function (index) {
    return HistoryService.get().then(function(historicalData) {
      historicalData.measurements = historicalData.measurements.filter(function(measurement) {
        return measurement.index != index;
      });

      set(historicalData)
      console.log("Broadcast history change"); $rootScope.$emit('history:measurement:change', index);
      return historicalData;
    });
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

  HistoryService.retryUpload = function (index) {
    console.log("Called retryUpload");
    return HistoryService.get().then(function (historicalData) {
      historicalData.measurements.some(function (measurement) {
        if (measurement.index == index) {
          $rootScope.$broadcast('upload:started', index);
          UploadService.uploadMeasurement(measurement).then(
            function(response) {
              let data = response.data;
              $rootScope.$broadcast('upload:success', data);
              measurement.uploaded = true;
              set(historicalData);
              $rootScope.$broadcast("history:measurement:change", index);
            }, function (error) {
              let data = error.data;
              let status = error.status
              $rootScope.$broadcast('upload:failure', { "status": status, "data": data })
            });
          return true;
        } else {
          return false;
        }
      });
      return historicalData;
    });
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
