angular.module('Measure.services.History', [])


.factory('HistoryService', function($q, StorageService, $rootScope) {
	var HistoryService = {};

	HistoryService.historicalData = {
		'schemaVersion': 1,
		'measurements': []
    };

    HistoryService.state = {
		'lastMeasurement': undefined,
		'dataConsumed': 0,
		'recentSamples': []
	};

	HistoryService.reIndex = function() {
		// In order to track the same measurement across sorts, I keep an
		// ephemeral key. I don't like this as a solution, so this should be
		// considered a hack to replace.

		var measurementId;
		for (measurementId = 0; measurementId < this.historicalData.measurements.length; measurementId += 1) {
			this.historicalData.measurements[measurementId].index = measurementId;
		}
	};


    HistoryService.save = function () {
		StorageService.set('historicalData', this.historicalData);
    };

	HistoryService.add = function (measurementRecord) {
		HistoryService.historicalData.measurements.push(measurementRecord);
		HistoryService.save();

		HistoryService.state.lastMeasurement = this.historicalData.measurements.length - 1;
		HistoryService.state.dataConsumed += measurementRecord.results.receivedBytes;
		HistoryService.reIndex();
		HistoryService.populateRecentSamples();
		$rootScope.$emit('history:measurement:added', measurementRecord);
    };

    HistoryService.hide = function (measurementId) {
		if (measurementId !== undefined) {
			console.log('Removed measurement', measurementId);
			HistoryService.state.dataConsumed -= HistoryService.historicalData.measurements[measurementId].results.receivedBytes;
			HistoryService.historicalData.measurements.splice(measurementId, 1);
			HistoryService.save();
			HistoryService.reIndex();
			HistoryService.populateRecentSamples();
			$rootScope.$emit('history:measurement:removed', measurementId);
		}
    };

    HistoryService.annonate = function (measurementId, measurementNote) {
		HistoryService.historicalData.measurements[measurementId].note = measurementNote;
		HistoryService.save();
    };

    HistoryService.populateRecentSamples = function () {
		var that = HistoryService;
		this.state.recentSamples = [];
		angular.forEach(this.historicalData.measurements.slice(-10),
			function (historicalRecord) {
				  that.state.recentSamples.push(historicalRecord.results.s2cRate);
			}
		);
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

    HistoryService.reset = function () {
		HistoryService.historicalData.measurements = [];
		HistoryService.state.dataConsumed = 0;
		HistoryService.reIndex();
		HistoryService.save();
		$rootScope.$emit('history:cleared', measurementId);
    };

    HistoryService.restore = function () {
		var that = this;

		StorageService.get('historicalData').then(function (storedHistoricalData) {
			if (storedHistoricalData !== undefined) {
				that.schemaVersion = storedHistoricalData.schemaVersion;
				angular.forEach(storedHistoricalData.measurements,
					function (historicalRecord, historicalKey) {
						that.historicalData.measurements.push(historicalRecord);
						that.state.dataConsumed += historicalRecord.results.receivedBytes;
					}
				);
				that.reIndex();
				that.populateRecentSamples();
			}
			
        });
    };

	HistoryService.restore();

	return HistoryService;
});