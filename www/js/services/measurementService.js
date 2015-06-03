angular.module('Measure.services.Measurement', [])

.factory("MeasurementService", ['$q', function ($q) {
    var MeasurementService = {};
    var MeasurementWorker = new Worker('js/measurements/ndt/ndt-worker.js');
    var workerDeferred;

    MeasurementService.testSemaphore = false;
    MeasurementService.lastMeasurement = undefined;

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
                MeasurementService.testSemaphore = false;
                passedMessage.results.packetRetransmissions = Number(passedMessage.results.PktsRetrans) /
                    Number(passedMessage.results.PktsOut);
                workerDeferred.resolve(passedMessage.results);
                break;
            case 'onerror':
                MeasurementService.testSemaphore = false;
                workerDeferred.reject(passedMessage.error_message);
                break;
        }
    }, false);
    
    MeasurementWorker.addEventListener('error', function (e) {
        MeasurementService.testSemaphore = false;
        workerDeferred.reject(e.lineno, ' in ', e.filename, ': ', e.message);
    }, false);

    MeasurementService.start = function (hostname, port, path, update_interval) {
        workerDeferred = $q.defer();
        if (MeasurementService.testSemaphore === false) {
            MeasurementService.testSemaphore = true;
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
        HistoryService, SettingsService, MLabService, LocationService) {

    var MeasurementBackgroundService = {};

    MeasurementBackgroundService.startBackground = function () {
        var setMetroSelection = SettingsService.getSetting('metroSelection').metro;
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

        if (MeasurementService.testSemaphore !== true) {
            LocationService.getAccessInformation().then(
                function (accessInformation) {
                    measurementRecord.accessInformation = accessInformation;
                }
            );
            MLabService.findServer(setMetroSelection).then(
                function(mlabAnswer) {
                    measurementRecord.mlabInformation = mlabAnswer;
                    MeasurementService.start(mlabAnswer.fqdn,
                            3001, '/ndt_protocol', 2000).then(
                        function(passedResults) {
                            MeasurementService.lastMeasurement = measurementRecord.index;
                            MeasurementService.testSemaphore = false;
                            measurementRecord.results = passedResults;
                            HistoryService.add(measurementRecord);
                        },
                        function () { return true; },
                        function (deferredNotification) {
                            var testStatus = deferredNotification.testStatus,
                                passedResults = deferredNotification.passedResults;
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
