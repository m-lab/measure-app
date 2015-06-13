angular.module('Measure.controllers.Measurement', [])

.controller('MeasureCtrl', function($scope, $interval, $ionicPopup,
    $cordovaNetwork, MeasurementService, SettingsService,
    MLabService, LocationService, HistoryService,
    SpeedGauge, MeasureConfig, connectionInformation) {

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

	LocationService.getAccessInformation().then(
		function (accessInformation) {
			$scope.accessInformation = accessInformation;
		}
	);

    $scope.measurementProgressBar = {
        'current': 0,
        'maximum': 1
    };

  var updateScope = function (mlabAnswer, callbackFunction) {
      $scope.mlabInformation = mlabAnswer;
      if (callbackFunction !== undefined) {
        callbackFunction();
      }
  }
  var updateMLabInformation = function (callbackFunction) {
    $scope.currentMetroSetting = SettingsService.currentSettings.metroSelection;
	if ($scope.currentMetroSetting !== undefined) {
		MLabService.findServer($scope.currentMetroSetting.metro).then(function(mlabAnswer, callbackFunction) {
		  updateScope(mlabAnswer, callbackFunction);
		});
	}
  };

  $interval(function() {
    if ($scope.currentMetroSetting !== SettingsService.currentSettings.metroSelection) {
      updateMLabInformation();
    }
  }, 100);

  $scope.MeasureConfig = MeasureConfig;
  $scope.s2cRate = undefined;
  $scope.c2sRate = undefined;
  $scope.testSemaphore = function () { return MeasurementService.testSemaphore; };
  $scope.lastMeasurement = MeasurementService.lastMeasurement;
  $scope.currentMetroSetting = undefined;
  $scope.gaugeConfig = SpeedGauge;

  document.addEventListener("deviceready", function () {
    $scope.connectionInformation = connectionInformation.current();
  }, false);
  
  
  updateMLabInformation();

  $scope.startNDT = function() {
    var measurementRecord = {
          'timestamp': Date.now(),
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
            $scope.lastMeasurement = (HistoryService.historicalData.measurements.length - 1);
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