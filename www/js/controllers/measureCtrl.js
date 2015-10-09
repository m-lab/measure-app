angular.module('Measure.controllers.Measurement', [])

.controller('MeasureCtrl', function($scope, $interval, $ionicPopup, $ionicLoading,
		MeasurementClientService, MeasurementService, SettingsService, $rootScope, StorageService, ChromeAppSupport,
		MLabService, accessInformation, HistoryService, DialogueMessages,
		progressGaugeService, MeasureConfig, connectionInformation) {


	$ionicLoading.show({
		templateUrl: 'templates/modals/findingServer.html',
		animation: 'fade-in',
		showBackdrop: true,
		maxWidth: 200,
		showDelay: 200
	});
  
  var driveGauge = function(event, passedArguments) {
    console.log(passedArguments.testStatus );
    if (event.name === 'measurement:background') {
      if (passedArguments.testStatus === 'onstart') {
        $scope.currentState = 'Running Background Test';
        $scope.currentRate = undefined;
        progressGaugeService.gaugeComplete();
        driveInteractions('start_scheduled', progressGaugeService, $interval);
      } else if (passedArguments.testStatus === 'complete') {
        $scope.currentState = 'Completed Background Test';
        $scope.currentRate = passedArguments.passedResults.s2cRate;
        progressGaugeService.gaugeReset();
        driveInteractions('finish_scheduled', progressGaugeService, $interval);
      } else if (passedArguments.testStatus === 'interval_c2s') {
        $scope.currentState = 'Running Background Test (Upload)';
        $scope.currentRate = passedArguments.passedResults.c2sRate;
      } else if (passedArguments.testStatus === 'interval_s2c') {
        $scope.currentState = 'Running Background Test (Download)';
        $scope.currentRate = passedArguments.passedResults.s2cRate;
      } else if (passedArguments.testStatus === 'onerror') {
        progressGaugeService.gaugeError();
        $ionicPopup.show(DialogueMessages.measurementFailure);
        $scope.currentState = undefined;
        $scope.currentRate = undefined;
      }
    } else if (event.name === 'measurement:foreground') {
      if (passedArguments.testStatus === 'onstart') {
        progressGaugeService.gaugeReset();
        $scope.currentState = 'Starting';
        $scope.currentRate = undefined;
        driveInteractions('start_test', progressGaugeService, $interval);
      } else if (passedArguments.testStatus === 'running_c2s') {
        $scope.currentState = 'Running Test (Upload)';
        driveInteractions('running_c2s', progressGaugeService, $interval);
      } else if (passedArguments.testStatus === 'interval_c2s') {
        $scope.currentRate = passedArguments.passedResults.c2sRate;
      } else if (passedArguments.testStatus === 'running_s2c') {
        $scope.currentState = 'Running Test (Download)';
        driveInteractions('running_s2c', progressGaugeService, $interval);
      } else if (passedArguments.testStatus === 'interval_s2c') {
        $scope.currentRate = passedArguments.passedResults.s2cRate;
      } else if (passedArguments.testStatus === 'complete') {
        $scope.currentState = 'Completed';
        $scope.currentRate = passedArguments.passedResults.s2cRate;
        progressGaugeService.gaugeComplete();
        driveInteractions('finished_all', progressGaugeService, $interval);
      }
    }
    if (passedArguments.testStatus === 'onerror') {
      progressGaugeService.gaugeError();
      $ionicPopup.show(DialogueMessages.measurementFailure);
      $scope.currentState = undefined;
      $scope.currentRate = undefined;
    }
	};

	var updateMLabServer = function () {
		StorageService.get('metroSelection').then(
			function (metroSelection) {
				if (metroSelection === undefined || typeof(metroSelection) === 'object') {
					metroSelection = 'automatic';
				}
				MLabService.findServer(SettingsService.currentSettings.metroSelection).then(
					function(mlabAnswer) {
						$scope.mlabInformation = mlabAnswer;
						$scope.mlabInformation.metroSelection = SettingsService.currentSettings.metroSelection;
						$ionicLoading.hide();
					},
					function () {
						console.log("MlabNSLookupException");
					}
				);
			}
		);
	}
	accessInformation.getAccessInformation().then(
		function (accessInformationResponse) {
			$scope.accessInformation = accessInformationResponse;
		}
	);
	
	updateMLabServer();
	
	$rootScope.$on('settings:changed', function(event, args) {
		if (args.name == 'metroSelection') {
			console.log('Found new Metro server selection');
			updateMLabServer();
		}
	});

	$rootScope.$on('measurement:foreground', driveGauge);
	$rootScope.$on('measurement:background', driveGauge);

	$scope.MeasureConfig = MeasureConfig;
	$scope.measurementState = MeasurementService.state;
	$scope.historyState = HistoryService.state;

	$scope.currentState = undefined;
	$scope.currentRate = undefined;

	$scope.progressGaugeConfig = progressGaugeService.gaugeConfig;
	$scope.progressGaugeState = progressGaugeService.gaugeStatus;

	$scope.connectionInformation = connectionInformation.current();

	$scope.interactionHover = function (mouseIn) {
		interactionElement = document.getElementsByClassName('interactionIcon')[0];
		
		if (interactionElement.classList.contains('testCompleted')) {
			if (mouseIn === true) {
				interactionElement.src = 'img/interactions/reload.svg';
			} else {
				interactionElement.src = 'img/interactions/okay.svg';
			}
		}
	};

	$scope.startNDT = function() {
		ChromeAppSupport.notify('measurement:foreground:start', {
							'server': $scope.mlabInformation.fqdn,
							'port': 3001,
							'path': '/ndt_protocol',
							'interval': 200
						});
		$scope.currentState = 'Starting';

		if ($scope.mlabInformation === undefined) {
			intervalPromise = $interval(function () {
				if ($scope.mlabInformation !== undefined) {
					$interval.cancel(intervalPromise);
					$scope.startNDT();
				}
			}, 100);
			return;
		}
	};
});

function driveInteractions(newState, progressGaugeService, $interval) {
	var displayArea = document.getElementsByClassName('displayArea')[0];
	var	interactionElement,
		temporaryElement,
		previousElement;

	if (newState === 'start_test') {
		interactionElement = document.getElementsByClassName('interactionIcon')[0];
		interactionElement.src = 'img/interactions/waiting.svg';
		interactionElement.classList.add('spinIcon');
	} else if (newState === 'start_scheduled') {
		interactionElement = document.getElementsByClassName('interactionIcon')[0];
		interactionElement.src = 'img/interactions/hold.svg';
	 } else if (newState === 'finish_scheduled') {
		interactionElement = document.getElementsByClassName('interactionIcon')[0];
		interactionElement.src = 'img/interactions/okay.svg';
		interactionElement.classList.remove('removedIcon');
		interactionElement.classList.add('currentIcon');
		interactionElement.classList.add('testCompleted');
	 } else if (newState === 'interval_c2s') {
		interactionElement = document.getElementsByClassName('interactionIcon')[0];
		interactionElement.classList.remove('spinIcon');
		interactionElement.classList.remove('currentIcon');
		interactionElement.classList.add('removedIcon');

		temporaryElement = new Image();
		temporaryElement.src = 'img/interactions/up.svg';
	} else if (newState === 'interval_s2c') {
		previousElement = document.getElementsByClassName('currentIcon')[0];

		temporaryElement = new Image();
		temporaryElement.src = 'img/interactions/down.svg';
	} else if (newState === 'finished_all') {
		previousElement = document.getElementsByClassName('currentIcon')[0];

		interactionElement = document.getElementsByClassName('interactionIcon')[0];
		interactionElement.src = 'img/interactions/okay.svg';
		interactionElement.classList.remove('removedIcon');
		interactionElement.classList.add('currentIcon');
		interactionElement.classList.add('testCompleted');
	}
	
	if (temporaryElement !== undefined) {
		temporaryElement.classList.add('gaugeIcon');
		displayArea.appendChild(temporaryElement);
		temporaryElement.classList.add('currentIcon');
	}

	var incrementalValue = incrementProgressMeter(newState);
	var testPeriod = 10000,
		intervalDelay = 100;
	var intervalCount;
	if (newState == 'running_s2c' || newState == 'running_c2s') {
		intervalCount = (testPeriod / intervalDelay);
		$interval(function () {
			progressGaugeService.incrementGauge(incrementalValue / intervalCount);
		}, intervalDelay, intervalCount);
	} else {
		progressGaugeService.incrementGauge(incrementalValue);
	}

}



function incrementProgressMeter(testStatus) {
    var testProgressIncrements = {
        'start': .02,

        'preparing_c2s': .06,
        'running_c2s': .40,
        'finished_c2s': .02,

        'preparing_s2c': .06,
        'running_s2c': .40,
        'finished_s2c': .01,

        'preparing_meta': .01,
        'finished_meta': .01,
		
        'finished_all': .01,
    }
    if (testProgressIncrements.hasOwnProperty(testStatus) === true) {
        return testProgressIncrements[testStatus];
    }
    return 0;
}

