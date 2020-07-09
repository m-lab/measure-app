angular.module('Measure.controllers.Measurement', [])

.controller('MeasureCtrl', function($scope, $q, $interval, $ionicPopup, $ionicLoading, $timeout, SettingsService, $rootScope, StorageService, ChromeAppSupport, MLabService, accessInformation, HistoryService, DialogueMessages, MeasureConfig, connectionInformation) {

  $scope.currentState = undefined;
  $scope.currentRate = undefined;

  $scope.gaugeOptions = {
    angle: 0.5, // 0 for semicircle, 0.5 for full circle
    lineWidth: 0.07, // The line thickness, range [0, 1]
    bgLineWidth: 0.035,
    limitMax: 'true',   // If true, the pointer will not go past the end of the gauge
    colorStart: '#07DBD0',   // at '0' value
    colorStop: '#07DBD0',   // at currently set value
    strokeColor: '#CCCCCC',   // 'unfilled' negative space background color
    generateGradient: false
  };

  $scope.progressGaugeState = {
    'current': 0,
    'maximum': 1,
    'message': 'Start'
  };

  $scope.connectionInformation = connectionInformation.current();

  $ionicLoading.show({
    templateUrl: 'templates/modals/findingServer.html',
    animation: 'fade-in',
    showBackdrop: true,
    maxWidth: 200,
    showDelay: 200
  });

  function gaugeError() {
    $scope.progressGaugeState.current = $scope.progressGaugeState.maximum;
    $scope.progressGaugeState.colorStart = '#D90000';
    $scope.progressGaugeState.colorStop = '#D90000';
  }

  var driveGauge = function(event, data) {
    $scope.$apply(function() {
      var interactionElement = document.querySelector('.interactionIcon');
      console.log(data.testStatus );
      $scope.measurementRunning = data.running;
      if (event.name === 'measurement:status') {
        if (data.testStatus === 'onstart') {
          $scope.progressGaugeState.current = 0;
          $scope.currentState = 'Starting';
          $scope.currentRate = undefined;
          interactionElement.src = 'img/interactions/waiting.svg';
          interactionElement.classList.add('spinIcon');
          interactionElement.classList.remove('testCompleted');
        } else if (data.testStatus === 'running_c2s') {
          $scope.currentState = 'Running Test (Upload)';
        } else if (data.testStatus === 'interval_c2s') {
          $scope.currentRate = data.passedResults.c2sRate;
        } else if (data.testStatus === 'running_s2c') {
          $scope.currentState = 'Running Test (Download)';
        } else if (data.testStatus === 'interval_s2c') {
          $scope.currentRate = data.passedResults.s2cRate;
        } else if (data.testStatus === 'complete') {
          $scope.currentState = 'Completed';
          $scope.currentRate = data.passedResults.s2cRate;
          interactionElement.src = 'img/interactions/okay.svg';
          interactionElement.classList.remove('spinIcon');
          interactionElement.classList.add('testCompleted');
          $scope.progressGaugeState.current = $scope.progressGaugeState.maximum;
        } else if (data.testStatus === 'onerror') {
          gaugeError();
          $ionicPopup.show(DialogueMessages.measurementFailure);
          $scope.currentState = undefined;
          $scope.currentRate = undefined;
          interactionElement.classList.remove('spinIcon');
          interactionElement.classList.remove('testCompleted');
          interactionElement.src = 'img/interactions/play.svg';
        }
        $scope.progressGaugeState.current = data.progress;
      }
    });
  };

  var tryConnectivity = function tryConnectivity() {
    return $q.all({
      'accessInformation': accessInformation.getAccessInformation(),
      'mlabInformation': SettingsService.get('metroSelection').then(MLabService.findServer)
    }).then(function(info) {
      angular.merge($scope, info);
      $ionicLoading.hide();
    }, function() {
      var pollConnectivity = $interval(function() {
        tryConnectivity().then(function() { $interval.cancel(pollConnectivity); });
      }, 10000);
    });
  };

  tryConnectivity();

  $rootScope.$on('settings:changed', function(event, args) {
    if (args.name == 'metroSelection') {
      tryConnectivity();
    }
  });

  $rootScope.$on('measurement:status', driveGauge);

  $scope.MeasureConfig = MeasureConfig;

  function refreshHistory() {
    HistoryService.get().then(function(data) {
      $scope.lastMeasurementId = data.measurements.length - 1;
    });
  }

  $rootScope.$on('history:measurement:change', refreshHistory);
  refreshHistory();

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
    ChromeAppSupport.notify('measurement:start');
    $scope.currentState = 'Starting';
    $scope.uploadStatus = undefined;
  };

  var footerTimeout = function() {
    $timeout(function() {
      $scope.uploadStatus = undefined;
    }, 3000);
  }

  $rootScope.$on('upload:started', function() {
    console.log("upload started");
    $scope.uploadStatus = "started";
    $scope.footerClass = "stable"
    footerTimeout();
  });

  $rootScope.$on('upload:success', function() {
    console.log("upload success");
    $scope.uploadStatus = "success";
    $scope.footerClass = "balanced";
    footerTimeout();
  });
  $rootScope.$on('upload:failure', function() {
    console.log("upload failure");
    $scope.uploadStatus = "failure";
    $scope.footerClass = "assertive";
    footerTimeout();
  });
});
