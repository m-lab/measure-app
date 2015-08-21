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
}]);