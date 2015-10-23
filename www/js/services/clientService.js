angular.module('Measure.services.MeasurementClient', [])

.factory('MeasurementClientService', function($q, MeasurementService, HistoryService, SettingsService, MLabService, accessInformation, $rootScope) {

  var MeasurementClientService = {
    "start": function start(server, port, path, interval, backgroundInitiated) {

      var setMetroSelection = SettingsService.currentSettings.metroSelection;
      var clientDefer = $q.defer();
      var emitKey = (typeof backgroundInitiated !== 'undefined' ||
                     backgroundInitiated === false) ? 'measurement:foreground' :
                     'measurement:background';
      var measurementRecord = {
        'timestamp': Date.now(),
        'results': {},
        'mlabInformation': undefined,
        'connectionInformation': undefined,
        'accessInformation': undefined,
        'metadata': {},
        'snapLog': {'s2cRate': [], 'c2sRate': []}
      };

      accessInformation.getAccessInformation().then(function (accessInformation) {
        measurementRecord.accessInformation = accessInformation;
      });
      MLabService.findServer(setMetroSelection).then(function(mlabAnswer) {
        measurementRecord.mlabInformation = angular.copy(mlabAnswer);
        MeasurementService.start(measurementRecord.mlabInformation.fqdn, port, path, interval).then(function(passedResults) {
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
          measurementRecord.lastMeasurement = HistoryService.add(measurementRecord);
        },
        function () {
          $rootScope.$emit(emitKey, {'error': true});
          clientDefer.reject({'error': true});
          console.log('existing test running');
          return true;
        },
        function (deferredNotification) {
          var testStatus = deferredNotification.testStatus,
            passedResults = deferredNotification.passedResults;
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
