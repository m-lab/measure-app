angular.module('Measure.controllers.Measurement', [])

.controller('MeasureCtrl', function($scope, $interval, $ionicPopup,
    $cordovaNetwork, MeasurementService, SettingsService,
    MLabService, LocationService, HistoryService,
    speedGaugeService, MeasureConfig) {

  var showFailureModal = function () {
    $ionicPopup.show({
      title: 'Failure',
      templateUrl: 'templates/modals/messageTestFailure.html',
      buttons: [
        {
          text: 'Dismiss',
          type: 'button-outline button-assertive',
        }
      ]
    });
  };

    $scope.measurementProgressBar = {
        'current': 0,
        'maximum': 1
    };
  var updateLocationInformation = function () {
      LocationService.getAccessInformation().then(
          function (accessInformation) {
            $scope.accessInformation = accessInformation;
          }
        );
  };
  var updateConnectionInformation = function () {
    $scope.connectionType = $cordovaNetwork.getNetwork();

    switch ($scope.connectionType) {
      case Connection.WIFI:
        $scope.connectionTypeIcon = 'ion-wifi';
        break;
      case Connection.CELL_2G:
      case Connection.CELL_3G:
      case Connection.CELL_4G:
      case Connection.CELL:
        $scope.connectionTypeIcon = 'ion-radio-waves';
        break;
      case Connection.ETHERNET:
      default:
        $scope.connectionTypeIcon = '';
        break;
    }
  };
  var updateScope = function (mlabAnswer, callbackFunction) {
      $scope.mlabInformation = mlabAnswer;
      if (callbackFunction !== undefined) {
        callbackFunction();
      }
  }
  var updateMLabInformation = function (callbackFunction) {
    $scope.currentMetroSetting = SettingsService.getSetting('metroSelection').metro;
    MLabService.findServer($scope.currentMetroSetting).then(function(mlabAnswer, callbackFunction) {
      updateScope(mlabAnswer, callbackFunction);
    });
  };

  $interval(function() {
    var setMetroSelection = SettingsService.getSetting('metroSelection').metro;
    if ($scope.currentMetroSetting !== setMetroSelection) {
      updateMLabInformation();
    }
  }, 100);

  $scope.MeasureConfig = MeasureConfig;
  $scope.s2cRate = undefined;
  $scope.c2sRate = undefined;
  $scope.testSemaphore = function () { return MeasurementService.testSemaphore; };
  $scope.lastMeasurement = MeasurementService.lastMeasurement;
  $scope.currentMetroSetting = undefined;
  $scope.gaugeConfig = speedGaugeService.config;

  document.addEventListener("deviceready", function () {
    updateConnectionInformation();
  }, false);
  
  
  updateLocationInformation();
  updateMLabInformation();

  $scope.startNDT = function() {
    var measurementRecord = {
          'timestamp': Date.now(),
          'index': HistoryService.historicalData.measurements.length,
          'hidden': false,
          'metadata': {},
          'snapLog': {'s2cRate': [], 'c2sRate': []},
          'results': {},
          'accessInformation': undefined,
          'connectionInformation': undefined,
          'mlabInformation': undefined
    };

    updateMLabInformation($scope.startNDT);
    
    MeasurementService.start($scope.mlabInformation.fqdn, 3001, '/ndt_protocol', 200)
        .then(
          function (passedResults) {
            measurementRecord.results = passedResults;
            measurementRecord.accessInformation = $scope.accessInformation;
            measurementRecord.connectionInformation = $scope.connectionType;
            measurementRecord.mlabInformation = $scope.mlabInformation;

            HistoryService.add(measurementRecord);
            $scope.lastMeasurement = measurementRecord.index;
            $scope.measurementProgressBar.current = $scope.measurementProgressBar.maximum;
          }, function (passedError) {
              showFailureModal();
              return;
          }, function (deferredNotification) {
              var testStatus = deferredNotification.testStatus,
                  passedResults = deferredNotification.passedResults;
              $scope.measurementProgressBar.current += incrementProgressMeter(testStatus);
              if (testStatus === 'interval_c2s') {
                if (passedResults !== undefined) {
                  $scope.gaugeConfig.series[0].data = [(passedResults.c2sRate / 1000)];
                  $scope.c2sRate = passedResults.c2sRate;
                  measurementRecord.snapLog.c2sRate.push(passedResults.c2sRate);
                }
             } else if (testStatus === 'interval_s2c') {
                if (passedResults !== undefined) {
                  $scope.gaugeConfig.series[0].data = [(passedResults.s2cRate / 1000)];
                  $scope.s2cRate = passedResults.s2cRate;
                  measurementRecord.snapLog.s2cRate.push(passedResults.s2cRate);
                }
             }

          }
        );
  };
  
})

function incrementProgressMeter(testStatus) {
    var testProgressIncrements = {
        'start': .01,
        'preparing_c2s': .05,
        'running_c2s': .25,
        'finished_c2s': .05,
        'preparing_s2c': .05,
        'running_s2c': .25,
        'finished_s2c': .05,
        'preparing_meta': .05,
        'running_meta': .05,
        'finished_meta': .05,
        'finished_all': .05,
    }
    if (testProgressIncrements.hasOwnProperty(testStatus) === true) {
        return testProgressIncrements[testStatus];
    }
    return 0;
}