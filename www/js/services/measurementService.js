angular.module('Measure.services.Measurement', [])

.factory("MeasurementService", ['$q', function ($q) {
  var MeasurementWorker = new Worker('js/measurements/ndt/ndt-worker.js');
  var workerDeferred;

  var state = {
    testSemaphore: false
  };

  MeasurementWorker.addEventListener('message', function (e) {
    var passedMessage = e.data;
    var deferredNotification;
    switch (passedMessage.cmd) {
      case 'onstart':
        deferredNotification = {
        'testStatus': 'onstart'
      };
      workerDeferred.notify(deferredNotification);
      break;
      case 'onstatechange':
        deferredNotification = {
        'testStatus': passedMessage.state,
        'passedResults': passedMessage.results
      };
      workerDeferred.notify(deferredNotification);
      break;
      case 'onprogress':
        deferredNotification = {
        'testStatus': passedMessage.state,
        'passedResults': passedMessage.results
      };
      workerDeferred.notify(deferredNotification);
      break;
      case 'onfinish':
        state.testSemaphore = false;
      passedMessage.results.packetRetransmissions = Number(passedMessage.results.PktsRetrans) /
        Number(passedMessage.results.PktsOut);
      workerDeferred.resolve(passedMessage.results);
      break;
      case 'onerror':
        state.testSemaphore = false;
      workerDeferred.reject(passedMessage.error_message);
      break;
    }
  }, false);

  MeasurementWorker.addEventListener('error', function (e) {
    state.testSemaphore = false;
    workerDeferred.reject(e.lineno, ' in ', e.filename, ': ', e.message);
  }, false);

  return {
    "start": function start(hostname, port, path, update_interval) {
      workerDeferred = $q.defer();
      if (state.testSemaphore === false) {
        state.testSemaphore = true;
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
    }
  };
}]);
