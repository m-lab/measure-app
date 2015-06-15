angular.module('Measure.controllers.History', [])

.controller('HistoryCtrl', function($scope, MeasureConfig, HistoryService,
		SharingService, historicalDataChartConfig, historicalDataChartService) {
	$scope.MeasureConfig = MeasureConfig;
	$scope.historicalData = HistoryService.historicalData;
	$scope.historicalDataChartConfig = historicalDataChartService.config;
	historicalDataChartService.populate();

	$scope.shareCSV = SharingService.shareCSV;
	$scope.hideMeasurement = HistoryService.hide;
});
