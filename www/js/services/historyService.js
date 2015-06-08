angular.module('Measure.services.History', [])


.factory('HistoryService', function($q, StorageService) {
  var HistoryService = {
    historicalData: {
      'schemaVersion': 1,
      'measurements': [],
    },
    'add': function (measurementRecord) {
      this.historicalData.measurements.push(measurementRecord);
      this.save();
    },
    'hide': function (measurementId) {
      this.historicalData.measurements[measurementId].hidden = true;
      this.save();
    },
    'annonate': function (measurementId, measurementNote) {
      this.historicalData.measurements[measurementId].note = measurementNote;
      this.save();
    },
    'get': function (measurementId) {
        var getDeferred = $q.defer();
        var foundResult;

        if (this.historicalData.measurements.length > 0) {
            getDeferred.resolve(this.historicalData.measurements[measurementId]);
        } else {
            StorageService.get('historicalData').then(function (storedHistoricalData) {
                angular.forEach(storedHistoricalData.measurements, function (historicalRecord) {
                    if (historicalRecord.index === Number(measurementId)) {
                        foundResult = historicalRecord;
                    }
                });
                console.log(foundResult);
                getDeferred.resolve(foundResult);
            });
        }
        return getDeferred.promise;
    },
    'save': function () {
      StorageService.set('historicalData', this.historicalData);
    },
    'reset': function () {
      this.historicalData.measurements = [];
      StorageService.set('historicalData', this.historicalData);
    },
    'restore': function () {
      StorageService.get('historicalData').then(function (storedHistoricalData) {
          if (storedHistoricalData !== undefined) {
            HistoryService.schemaVersion = storedHistoricalData.schemaVersion;
            angular.forEach(storedHistoricalData.measurements, function (historicalRecord) {
                HistoryService.historicalData.measurements.push(historicalRecord);
            });
          }
        });
    },
    'dataConsumed': function () {
      var totalReceivedBytes = 0;
      angular.forEach(this.historicalData.measurements, function (measurementRecord) {
        totalReceivedBytes += measurementRecord.results.receivedBytes;
      });
      return totalReceivedBytes;
    }
  };
  return HistoryService;
})
