angular.module('Measure.controllers.Measurement', [])

.controller('MeasureCtrl', function($scope, $interval, $ionicPopup, $ionicLoading,
		SettingsService, $rootScope, StorageService, ChromeAppSupport,
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
          $scope.$apply(function() {
            var interactionElement = document.querySelector('.interactionIcon');
            console.log(passedArguments.testStatus );
            $scope.measurementRunning = passedArguments.running;
            if (event.name === 'measurement:status') {
              if (passedArguments.testStatus === 'onstart') {
                progressGaugeService.gaugeReset();
                $scope.currentState = 'Starting';
                $scope.currentRate = undefined;
                interactionElement.src = 'img/interactions/waiting.svg';
                interactionElement.classList.add('spinIcon');
                interactionElement.classList.remove("testCompleted");
              } else if (passedArguments.testStatus === 'running_c2s') {
                $scope.currentState = 'Running Test (Upload)';
              } else if (passedArguments.testStatus === 'interval_c2s') {
                $scope.currentRate = passedArguments.passedResults.c2sRate;
              } else if (passedArguments.testStatus === 'running_s2c') {
                $scope.currentState = 'Running Test (Download)';
              } else if (passedArguments.testStatus === 'interval_s2c') {
                $scope.currentRate = passedArguments.passedResults.s2cRate;
              } else if (passedArguments.testStatus === 'complete') {
                $scope.currentState = 'Completed';
                $scope.currentRate = passedArguments.passedResults.s2cRate;
                interactionElement.src = 'img/interactions/okay.svg';
                interactionElement.classList.remove('spinIcon');
                interactionElement.classList.add('testCompleted');
                progressGaugeService.gaugeComplete();
              } else if (passedArguments.testStatus === 'onerror') {
                progressGaugeService.gaugeError();
                $ionicPopup.show(DialogueMessages.measurementFailure);
                $scope.currentState = undefined;
                $scope.currentRate = undefined;
                interactionElement.classList.remove('spinIcon');
                interactionElement.classList.remove('testCompleted');
                interactionElement.src = 'img/interactions/play.svg';
              }
              progressGaugeService.setGauge(passedArguments.progress);

            }
          });
        };

        var updateMLabServer = function () {
          SettingsService.get("metroSelection").then(MLabService.findServer).then(function(mlabAnswer) {
            $scope.mlabInformation = mlabAnswer;
            $scope.mlabInformation.metroSelection = SettingsService.currentSettings.metroSelection;
            $ionicLoading.hide();
          },
          function () {
            console.log("MlabNSLookupException");
            $ionicLoading.hide();
          });
        };

        updateMLabServer();

        accessInformation.getAccessInformation().then(function (accessInformationResponse) {
          $scope.accessInformation = accessInformationResponse;
        });

        $rootScope.$on('settings:changed', function(event, args) {
          if (args.name == 'metroSelection') {
            console.log('Found new Metro server selection');
            updateMLabServer();
          }
        });

	$rootScope.$on('measurement:status', driveGauge);

	$scope.MeasureConfig = MeasureConfig;

        function refreshHistory() {
          HistoryService.get().then(function(data) {
            $scope.lastMeasurementId = data.measurements.length - 1;
          });
        }

        $rootScope.$on("history:measurement:change", refreshHistory);
        refreshHistory();

	$scope.currentState = undefined;
	$scope.currentRate = undefined;

	$scope.progressGaugeConfig = progressGaugeService.gaugeConfig;
	$scope.progressGaugeState = progressGaugeService.gaugeStatus;

	$scope.connectionInformation = connectionInformation.current();

        $scope.interactionHover = function (mouseIn) {
          interactionElement = document.querySelector('.interactionIcon');
          if (interactionElement.classList.contains('testCompleted')) {
            if (mouseIn === true) {
              interactionElement.src = 'img/interactions/reload.svg';
            } else {
              interactionElement.src = 'img/interactions/okay.svg';
            }
          }
        };

        $scope.startNDT = function() {
          ChromeAppSupport.notify('measurement:start', {
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

