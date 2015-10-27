angular.module('Measure.controllers.Settings', [])
.controller('SettingsCtrl', function($scope, $rootScope, $state, $ionicPopup, SettingsService, HistoryService, MeasureConfig, DialogueMessages, ScheduleManagerService, CustomScheduleService) {
  $scope.changeSelection = SettingsService.setSetting;
  $scope.availableSettings = SettingsService.availableSettings;
  $scope.currentSettings = SettingsService.currentSettings;
  $scope.environmentCapabilities = MeasureConfig.environmentCapabilities;
  
  function refreshSchedule() {
    ScheduleManagerService.getSemaphore().then(function(semaphore) {
      $scope.scheduleSemaphore = semaphore;
    });
  }

  CustomScheduleService.onChange(refreshSchedule);

  $scope.setSchedule = function setSchedule() {
    SettingsService.setSetting('scheduledTesting', $scope.currentSettings.scheduledTesting);
    SettingsService.setSetting('scheduleInterval', $scope.currentSettings.scheduleInterval);
    refreshSchedule();
    if($scope.currentSettings.scheduledTesting && $scope.currentSettings.scheduleInterval == "custom") {
      // TODO: this default logic shouldn't really live in a controller
      CustomScheduleService.getSchedules().then(function(schedules) {
        // for new custom schedules, add current time/day
        if(schedules.length === 0) {
          var now = new Date();
          CustomScheduleService.addSchedule({ "timespan": now.getHours(), "date": now.getDay() }).then(function() {
            $state.go("app.customSchedule");
          });
        }
      });
    }
  };

  $scope.initiateHistoryReset = function() {
    var historyResetPopup = $ionicPopup.confirm(DialogueMessages.historyReset);

    historyResetPopup.then(function(resetDecision) {
      if(resetDecision === true) {
        HistoryService.reset();
      }
    });
  };

  if(SettingsService.currentSettings.scheduledTesting) {
    refreshSchedule();
  }
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
