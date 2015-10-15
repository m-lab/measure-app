angular.module('Measure.controllers.Settings', [])
.controller('SettingsCtrl', function($scope, $ionicPopup, SettingsService, HistoryService, MeasureConfig, DialogueMessages, ScheduleManagerService) {

  $scope.changeSelection = SettingsService.setSetting;
  $scope.createScheduleSemaphore = ScheduleManagerService.createScheduleSemaphore;

  $scope.availableSettings = SettingsService.availableSettings;
  $scope.currentSettings = SettingsService.currentSettings;
  $scope.environmentCapabilities = MeasureConfig.environmentCapabilities;
  $scope.historyState = HistoryService.state;
  $scope.scheduleSemaphore = ScheduleManagerService.state.scheduleSemaphore;

  $scope.initiateHistoryReset = function() {
    var historyResetPopup = $ionicPopup.confirm(DialogueMessages.historyReset);

    historyResetPopup.then(function(resetDecision) {
      if(resetDecision === true) {
        HistoryService.reset();
      }
    });
  };
})

.controller('ServerSelectionCtrl', function($scope, $history, $ionicLoading, SettingsService, MLabService) {

  $scope.changeSelection = function(selectionKey, selectionValue) {
    SettingsService.setSetting(selectionKey, selectionValue);
    $history.back();
  };
  $scope.availableSettings = SettingsService.availableSettings;
  $scope.currentSettings = SettingsService.currentSettings;

  $ionicLoading.show({
    content: 'Finding Servers',
    animation: 'fade-in',
    showBackdrop: false,
    maxWidth: 200,
  });

  MLabService.findAll().then(
    function (mlabAnswer) {

      var seenMetroKeys = [];
      SettingsService.availableSettings.metroSelection.options = [SettingsService.availableSettings.metroSelection.default];

      angular.forEach(mlabAnswer, function (mlabSite) {
        var mlabSiteOption = {
          'metro': undefined,
          'label': undefined,
        };

        mlabSiteOption.metro = mlabSite.metro;
        mlabSiteOption.label = mlabSite.country + ' (' + mlabSite.label + ')';

        if (seenMetroKeys.indexOf(mlabSiteOption.metro) === -1) {
          SettingsService.availableSettings.metroSelection.options.push(mlabSiteOption);
          seenMetroKeys.push(mlabSiteOption.metro);
        }
      });
      $ionicLoading.hide();
    }
  );
  $scope.metroSelectionSort = function(metroSelection) {
    return metroSelection.metro === 'automatic' ? 0 : metroSelection;
  };
});
