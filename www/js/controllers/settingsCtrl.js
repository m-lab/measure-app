angular.module('Measure.controllers.Settings', [])

.controller('SettingsCtrl', function($scope, $ionicPopup, SettingsService, HistoryService,
        MeasureConfig) {
  $scope.dataConsumed = HistoryService.dataConsumed();

  $scope.changeSelection = SettingsService.setSetting;
  $scope.toggleTestingOptions = function (rawr) {
      $scope.showTestingOptions = rawr;
  };

  $scope.availableSettings = SettingsService.availableSettings;
  $scope.metroSelection = SettingsService.getSetting('metroSelection');
  $scope.applicationLanguage = SettingsService.getSetting('applicationLanguage');
  $scope.scheduledTesting = SettingsService.getSetting('scheduledTesting');
  $scope.onlyWifi = SettingsService.getSetting('onlyWifi');
  $scope.trustedTester = SettingsService.getSetting('trustedTester');
  $scope.scheduleInterval = SettingsService.getSetting('scheduleInterval');
  $scope.schedulingSupported = MeasureConfig.schedulingSupported;

  $scope.showTestingOptions = $scope.scheduledTesting;

  $scope.initiateHistoryReset = function() {
    var historyResetPopup = $ionicPopup.confirm({
        title: 'Confirm Reset',
        template: 'This action will removal all stored results permenantly and cannot be undone. Are you sure?',
    });

    historyResetPopup.then(function(resetDecision) {
        if(resetDecision === true) {
            HistoryService.reset();
        }
    });
  };

})
