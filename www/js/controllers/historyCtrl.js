angular.module('Measure.controllers.History', [])

.controller('HistoryCtrl', function($scope, $rootScope, $interval, MeasureConfig, HistoryService,
		SharingService, historicalDataChartService) {

	$scope.MeasureConfig = MeasureConfig;
	$scope.historicalData = HistoryService.historicalData;
	$scope.historicalDataChartConfig = historicalDataChartService.config;

	$scope.shareCSV = SharingService.shareCSV;
	$scope.hideMeasurement = HistoryService.hide;
	
	$scope.scrollLimit = 4;
	$scope.increaseScrollLimit = function () {
		var scrollSize = 10;

		if (($scope.scrollLimit + scrollSize) < $scope.historicalData.measurements.length) {
			$scope.scrollLimit += scrollSize;
		} else {
			$scope.scrollLimit = $scope.historicalData.measurements.length;
		}
		$scope.$broadcast('scroll.infiniteScrollComplete');
	}
	/*
		Wait until after interface is draw to populate data for UX experience,
		and then poll recentSamples to reflect changes as the user interacts
		with the app.
	*/
	historicalDataChartService.populateData();
	$rootScope.$on('history:measurement:added',historicalDataChartService.populateData);
	$rootScope.$on('history:measurement:removed',historicalDataChartService.populateData);
	$rootScope.$on('history:clear',historicalDataChartService.populateData);
});
