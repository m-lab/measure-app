angular.module('Measure.services.MeasurementClient', [])

.factory('MeasurementClientService', function($q, MeasurementService, HistoryService, SettingsService, MLabService, accessInformation, $rootScope, ChromeAppSupport) {

  function incrementProgress(current, state) {
    var CEILINGS = {
      "interval_c2s": 0.48,
      "interval_s2c": 0.96,
      "complete": 1
    };

    var DELTAS = {
      'onstart': 0.01,

      'preparing_c2s': 0.01,
      'running_c2s': 0.01,
      "interval_c2s": 0.01,
      'finished_c2s': 0.02,

      'preparing_s2c': 0.01,
      'running_s2c': 0.01,
      "interval_s2c": 0.01,
      'finished_s2c': 0.01,

      'preparing_meta': 0.01,
      'finished_meta': 0.01,

      'complete': 0.01,
    };

    var next = Math.min(current + (DELTAS[state] || 0), CEILINGS[state] || 1);
    return next;
  }
  
  var MeasurementClientService = {
    "start": function start(server, port, path, interval, backgroundInitiated) {

      var setMetroSelection = SettingsService.currentSettings.metroSelection;
      var clientDefer = $q.defer();
      var emitKey = "measurement:status";
      var measurementRecord = {
        'timestamp': Date.now(),
        'results': {},
        'mlabInformation': undefined,
        'connectionInformation': undefined,
        'accessInformation': undefined,
        'metadata': {},
        'snapLog': {'s2cRate': [], 'c2sRate': []}
      };
      var progress = 0;

      accessInformation.getAccessInformation().then(function (accessInformation) {
        measurementRecord.accessInformation = accessInformation;
      });
      
      MLabService.findServer(setMetroSelection).then(function(mlabAnswer) {
        measurementRecord.mlabInformation = angular.copy(mlabAnswer);
        MeasurementService.start(measurementRecord.mlabInformation.fqdn, port, path, interval).then(function(passedResults) {
          progress = incrementProgress(progress, 'complete');
          ChromeAppSupport.notify("measurement:status", { 'testStatus': 'complete', 'passedResults': passedResults, "running": false, "progress": progress });
          $rootScope.$emit(emitKey, {
            'testStatus': 'complete',
            'passedResults': passedResults
          });
          clientDefer.resolve({
            'action': emitKey,
            'testStatus': 'complete',
            'passedResults': passedResults
          });
          measurementRecord.results = passedResults;
          HistoryService.add(measurementRecord);
        },
        function () {
          ChromeAppSupport.notify("measurement:status", {'error': true, "running": false });
          $rootScope.$emit(emitKey, {'error': true});
          clientDefer.reject({'error': true});
          console.log('existing test running');
          return true;
        },
        function (deferredNotification) {
          var testStatus = deferredNotification.testStatus,
            passedResults = deferredNotification.passedResults;
          progress = incrementProgress(progress, testStatus);
          ChromeAppSupport.notify("measurement:status", {'testStatus': testStatus, 'passedResults': passedResults, "running": true, "progress": progress });
          $rootScope.$emit(emitKey, {'testStatus': testStatus, 'passedResults': passedResults});
          clientDefer.notify({
            'action': emitKey,
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
        });

      });
      return clientDefer.promise;
    }
  };

  return MeasurementClientService;
});
