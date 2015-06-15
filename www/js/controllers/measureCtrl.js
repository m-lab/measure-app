angular.module('Measure.controllers.Measurement', [])

.controller('MeasureCtrl', function($scope, $interval, $ionicPopup,
		MeasurementService, SettingsService,
		MLabService, accessInformation, HistoryService, DialogueMessages,
		progressGaugeService, MeasureConfig, connectionInformation) {

	var showFailureModal = function () {
		$ionicPopup.show(DialogueMessages.measurementFailure);
	};

	accessInformation.getAccessInformation().then(
		function (accessInformationResponse) {
			$scope.accessInformation = accessInformationResponse;
		}
	);

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
	$scope.currentState = undefined;
	$scope.currentRate = undefined;
	$scope.testSemaphore = function () { return MeasurementService.testSemaphore; };
	$scope.lastMeasurement = MeasurementService.lastMeasurement;
	$scope.currentMetroSetting = undefined;
	$scope.progressGaugeConfig = progressGaugeService.gaugeConfig;
	$scope.progressGaugeState = progressGaugeService.gaugeStatus;
	$scope.connectionInformation = connectionInformation.current();
  
  
	updateMLabInformation();

	$scope.startNDT = function() {
		if (MeasurementService.testSemaphore === true) {
			return;
		}
		progressGaugeService.gaugeReset();
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
				progressGaugeService.gaugeComplete();
			  }, function (passedError) {
					progressGaugeService.gaugeError();
					showFailureModal();
					return;
			  }, function (deferredNotification) {
					var testStatus = deferredNotification.testStatus,
						passedResults = deferredNotification.passedResults;
					
					progressGaugeService.incrementGauge(testStatus);

				  if (testStatus === 'interval_c2s') {
					if (passedResults !== undefined) {
						$scope.currentState = 'Upload';
						$scope.currentRate = passedResults.c2sRate;
						measurementRecord.snapLog.c2sRate.push(passedResults.c2sRate);
					}
				 } else if (testStatus === 'interval_s2c') {
					if (passedResults !== undefined) {
						$scope.currentState = 'Download';
						$scope.currentRate = passedResults.s2cRate;
						measurementRecord.snapLog.s2cRate.push(passedResults.s2cRate);
					}
				 }

			  }
			);
	  };
});