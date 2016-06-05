angular.module('Measure.services.MeasurementClient', [])

.factory('MeasurementClientService', function($q, MeasurementService, HistoryService, SettingsService, MLabService, accessInformation, $rootScope, ChromeAppSupport) {

  function incrementProgress(current, state) {
    var CEILINGS = {
      'interval_c2s': 0.48,
      'interval_s2c': 0.96,
      'complete': 1
    };

    // necessary because intervals are not emitted when measuring in background mode
    var FLOORS = {
      'preparing_c2s': 0.01,
      'running_c2s': 0.02,
      'finished_c2s': 0.48,
      'preparing_s2c': 0.50,
      'running_s2c': 0.51,
      'finished_s2c': 0.96,
      'complete': 1
    };

    var DELTAS = {
      'onstart': 0.01,

      'preparing_c2s': 0.01,
      'running_c2s': 0.01,
      'interval_c2s': 0.01,
      'finished_c2s': 0.02,

      'preparing_s2c': 0.01,
      'running_s2c': 0.01,
      'interval_s2c': 0.01,
      'finished_s2c': 0.01,

      'preparing_meta': 0.01,
      'finished_meta': 0.01,

      'complete': 0.01,
    };

    var next = Math.max(Math.min(current + (DELTAS[state] || 0), CEILINGS[state] || 1), FLOORS[state] || 0);
    return Math.round(next + 'e2') * 1e-2;
  }

  var MeasurementClientService = {
    'start': function start() {

      var clientDefer = $q.defer();
      var emitKey = 'measurement:status';
      var measurementRecord = {
        'timestamp': Date.now(),
        'results': {},
        'snapLog': {'s2cRate': [], 'c2sRate': []}
      };
      var progress = 0;

      $q.all({
        'accessInformation': accessInformation.getAccessInformation(),
        'mlabInformation': SettingsService.get('metroSelection').then(MLabService.findServer)
      })
      .then(function(info) {
        angular.merge(measurementRecord, info);
        MeasurementService.start(measurementRecord.mlabInformation.fqdn, 3001, '/ndt_protocol', 200).then(function(passedResults) {
          progress = incrementProgress(progress, 'complete');
          ChromeAppSupport.notify('measurement:status', { 'testStatus': 'complete', 'passedResults': passedResults, 'running': false, 'progress': progress });
          clientDefer.resolve({
            'action': emitKey,
            'testStatus': 'complete',
            'passedResults': passedResults
          });
          measurementRecord.results = passedResults;
          HistoryService.add(measurementRecord);
        },
        function () {
          ChromeAppSupport.notify('measurement:status', {'error': true, 'running': false });
          clientDefer.reject({'error': true});
          console.log('existing test running');
          return true;
        },
        function (deferredNotification) {
          var testStatus = deferredNotification.testStatus,
            passedResults = deferredNotification.passedResults;
          progress = incrementProgress(progress, testStatus);
          ChromeAppSupport.notify('measurement:status', {'testStatus': testStatus, 'passedResults': passedResults, 'running': true, 'progress': progress });
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
