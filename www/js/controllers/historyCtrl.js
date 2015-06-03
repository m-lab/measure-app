angular.module('Measure.controllers.History', [])

.controller('HistoryCtrl', function($scope, HistoryService, SharingService) {
  $scope.historicalData = HistoryService.historicalData;
  $scope.shareCSV = SharingService.shareCSV;

  $scope.hideMeasurement = function (measurementId) {
      HistoryService.hide(measurementId);
  };
})
