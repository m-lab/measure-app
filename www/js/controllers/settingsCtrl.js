angular.module('Measure.controllers.Settings', [])

.controller('SettingsCtrl', function($scope, SettingsService, HistoryService,
        MeasureConfig) {
  $scope.dataConsumed = HistoryService.dataConsumed();

  $scope.changeSelection = SettingsService.setSetting;

  $scope.availableSettings = SettingsService.availableSettings;
  $scope.metroSelection = SettingsService.getSetting('metroSelection');
  $scope.applicationLanguage = SettingsService.getSetting('applicationLanguage');
  $scope.scheduledTesting = SettingsService.getSetting('scheduledTesting');
  $scope.onlyWifi = SettingsService.getSetting('onlyWifi');
  $scope.trustedTester = SettingsService.getSetting('trustedTester');
  $scope.scheduleInterval = SettingsService.getSetting('scheduleInterval');
  $scope.schedulingSupported = MeasureConfig.schedulingSupported;
  $scope.save = function() {
    UserService.save();
  }
})
