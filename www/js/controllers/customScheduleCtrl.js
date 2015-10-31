angular.module('Measure.controllers.CustomSchedule', [])
// TODO: make this nicer.
.filter("formatCustomSchedule", function(CustomScheduleService, gettextCatalog) {
  return function(s) {
    return gettextCatalog.getString("{{timeofday}} hour, every {{dayofweek}}",
      { "timeofday": gettextCatalog.getString(CustomScheduleService.TIMESPANS[s.timespan].label),
        "dayofweek": gettextCatalog.getString(CustomScheduleService.DATES[s.date].label)});
  };
})
.controller('CustomScheduleCtrl', function($scope, $ionicPopup, ScheduleManagerService, SettingsService, CustomScheduleService){
  $scope.showDelete = true;
  $scope.deleteCaption = "Edit";
  $scope.timespans = CustomScheduleService.TIMESPANS;
  $scope.dates = CustomScheduleService.DATES;
  $scope.selected = { "timespan": null, "date": null };

  $scope.toggleDelete = function toggleDelete() {
    $scope.showDelete = !$scope.showDelete;
    $scope.deleteCaption = $scope.showDelete ? "Done" : "Edit";
  };
  
  $scope.addSchedule = function addSchedule() {
    if ($scope.selected.timespan !== null && $scope.selected.date !== null) {
      CustomScheduleService.addSchedule($scope.selected).then(function(added) {
        if (!added) {
          showExistsPopup();
        } else {
          loadSchedules();
        }
      });
    }
  };

  $scope.removeSchedule = function removeSchedule(schedule) {
    CustomScheduleService.removeSchedule(schedule).then(loadSchedules);
  };

  function loadSchedules() {
    CustomScheduleService.getSchedules().then(function(schedules) {
      $scope.schedules = schedules;
    }).then(function() {
      ScheduleManagerService.getSemaphore();
    });
  }

  function showExistsPopup() {
   var alertPopup = $ionicPopup.alert({
     title: 'Test Already Scheduled',
     template: '<p class="text-center">A test is already scheduled for<br>that time period.</p>'
   });
  }

  loadSchedules();
});
