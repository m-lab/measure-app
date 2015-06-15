angular.module('Measure.services.History', [])


.factory('HistoryService', function($q, StorageService) {
	var HistoryService = {};

	HistoryService.historicalData = {
		'schemaVersion': 1,
		'measurements': []
    };

	HistoryService.add = function (measurementRecord) {
		this.historicalData.measurements.push(measurementRecord);
		HistoryService.save();
		// In order to track the same measurement across sorts, I keep an
		// ephemeral key. I don't like this as a solution, so this should be
		// considered a hack to replace.
		this.historicalData.measurements[(this.historicalData.measurements.length-1)].index = (this.historicalData.measurements.length-1);
    };

    HistoryService.hide = function (measurementId) {
		this.historicalData.measurements[measurementId].hidden = true;
		HistoryService.save();
    };

    HistoryService.annonate = function (measurementId, measurementNote) {
		this.historicalData.measurements[measurementId].note = measurementNote;
		HistoryService.save();
    };

	HistoryService.get = function (measurementId) {
        var getDeferred = $q.defer();
        var foundResult;

        if (this.historicalData.measurements.length > 0) {
            getDeferred.resolve(this.historicalData.measurements[measurementId]);
        } else {
            StorageService.get('historicalData')
				.then(function (storedHistoricalData) {
					getDeferred.resolve(storedHistoricalData.measurements[measurementId]);
				});
        }
        return getDeferred.promise;
    };

    HistoryService.save = function () {
		StorageService.set('historicalData', this.historicalData);
    };

    HistoryService.reset = function () {
		this.historicalData.measurements = [];
		StorageService.set('historicalData', this.historicalData);
    };

    HistoryService.restore = function () {
      StorageService.get('historicalData').then(function (storedHistoricalData) {
          if (storedHistoricalData !== undefined) {
            HistoryService.schemaVersion = storedHistoricalData.schemaVersion;
            angular.forEach(storedHistoricalData.measurements,
					function (historicalRecord, historicalKey) {
				historicalRecord.index = historicalKey;
                HistoryService.historicalData.measurements.push(historicalRecord);
            });
          }
        });
    };

    HistoryService.dataConsumed = function () {
		var totalReceivedBytes = 0;
		angular.forEach(this.historicalData.measurements,
				function (measurementRecord) {
			totalReceivedBytes += measurementRecord.results.receivedBytes;
		});
		return totalReceivedBytes;
	};

	HistoryService.restore();

	return HistoryService;
});