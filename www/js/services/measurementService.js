angular.module('Measure.services.Measurement', [])

.factory("MeasurementService", ['$q', function ($q) {
    var MeasurementService = {};
    var MeasurementWorker = new Worker('js/measurements/ndt/ndt-worker.js');
    var workerDeferred;

    MeasurementService.state = {
		testSemaphore: false
	};

    MeasurementWorker.addEventListener('message', function (e) {
        var passedMessage = e.data;
        switch (passedMessage.cmd) {
            case 'onstart':
                var deferredNotification = {
                    'testStatus': 'onstart'
                };
                workerDeferred.notify(deferredNotification);
                break;
            case 'onstatechange':
                var deferredNotification = {
                    'testStatus': passedMessage.state,
                    'passedResults': passedMessage.results
                };
                workerDeferred.notify(deferredNotification);
                break;
            case 'onprogress':
                var deferredNotification = {
                    'testStatus': passedMessage.state,
                    'passedResults': passedMessage.results
                };
                workerDeferred.notify(deferredNotification);
                break;
            case 'onfinish':
                MeasurementService.state.testSemaphore = false;
                passedMessage.results.packetRetransmissions = Number(passedMessage.results.PktsRetrans) /
                    Number(passedMessage.results.PktsOut);
                workerDeferred.resolve(passedMessage.results);
                break;
            case 'onerror':
                MeasurementService.state.testSemaphore = false;
                workerDeferred.reject(passedMessage.error_message);
                break;
        }
    }, false);
    
    MeasurementWorker.addEventListener('error', function (e) {
        MeasurementService.state.testSemaphore = false;
        workerDeferred.reject(e.lineno, ' in ', e.filename, ': ', e.message);
    }, false);

    MeasurementService.start = function (hostname, port, path, update_interval) {
        workerDeferred = $q.defer();
        if (MeasurementService.state.testSemaphore === false) {
            MeasurementService.state.testSemaphore = true;
            MeasurementWorker.postMessage({
                'cmd': 'start',
                'hostname': hostname,
                'port': port,
                'path': path,
                'update_interval': update_interval
            });
        } else {
            workerDeferred.reject('test_running');
        }
        return workerDeferred.promise;
    };

    return MeasurementService;
}])

.factory('MeasurementBackgroundService', function(MeasurementService,
        HistoryService, SettingsService, MLabService, accessInformation,
		$rootScope) {

    var MeasurementBackgroundService = {};

    MeasurementBackgroundService.startBackground = function () {
        var setMetroSelection = SettingsService.currentSettings.metroSelection;
        var measurementRecord = {
              'timestamp': Date.now(),
              'index': HistoryService.historicalData.measurements.length,
              'hidden': false,
              'mlabInformation': undefined,
              'connectionInformation': undefined,
              'accessInformation': undefined,
              'metadata': {},
              'snapLog': {'s2cRate': [], 'c2sRate': []}
        };
        var backgroundClient;

        if (MeasurementService.state.testSemaphore !== true) {
            accessInformation.getAccessInformation().then(
                function (accessInformation) {
                    measurementRecord.accessInformation = accessInformation;
                }
            );
            MLabService.findServer(setMetroSelection).then(
                function(mlabAnswer) {
                    measurementRecord.mlabInformation = mlabAnswer;
                    MeasurementService.start(measurementRecord.mlabInformation.fqdn,
                            3001, '/ndt_protocol', 2000).then(
                        function(passedResults) {
							$rootScope.$emit('measurement:background', {
								'testStatus': 'complete',
								'passedResults': passedResults
							});
                            measurementRecord.results = passedResults;
                            HistoryService.add(measurementRecord);
                        },
                        function () {
							$rootScope.$emit('measurement:background:error');
							return true;
						},
                        function (deferredNotification) {
                            var testStatus = deferredNotification.testStatus,
                                passedResults = deferredNotification.passedResults;
							$rootScope.$emit('measurement:background', {
								'testStatus': testStatus,
								'passedResults': passedResults
							});
                            if (testStatus === 'interval_c2s') {
                                if (passedResults !== undefined) {
                                    measurementRecord.snapLog.c2sRate.push(passedResults.c2sRate);
                                }
                            } else if (testStatus === 'interval_s2c') {
                                if (passedResults !== undefined) {
                                    measurementRecord.snapLog.s2cRate.push(passedResults.s2cRate);
                                }
                            }
                        }
                    );
                });
        }
    }
    return MeasurementBackgroundService;
});
