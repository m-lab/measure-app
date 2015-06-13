angular.module('Measure.controllers.History', [])

.controller('HistoryCtrl', function($scope, MeasureConfig, HistoryService, SharingService) {
  $scope.MeasureConfig = MeasureConfig;
  $scope.historicalData = HistoryService.historicalData;
  $scope.shareCSV = SharingService.shareCSV;

	console.log(HistoryService.historicalData);
  $scope.hideMeasurement = function (measurementId) {
      HistoryService.hide(measurementId);
  };
})
