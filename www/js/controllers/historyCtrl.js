angular.module('Measure.controllers.History', [])

	.controller('HistoryCtrl', function ($scope, $rootScope, MeasureConfig, HistoryService,
		SharingService, historicalDataChartService, $timeout, SettingsService, $ionicPopup) {

		$scope.currentSettings = SettingsService.currentSettings;
		$scope.MeasureConfig = MeasureConfig;
		$scope.series = ["download", "upload"];
		$scope.data = { "series": "download" };

		$scope.refreshData = function refreshData() {
			console.log("Called refreshData");
			historicalDataChartService.populateData($scope.data.series);
			HistoryService.get().then(function (historicalData) {
				$scope.historicalData = historicalData;
			});
		};

		$scope.historicalDataChartConfig = historicalDataChartService.config;
		$scope.shareCSV = SharingService.shareCSV;
		$scope.hideMeasurement = HistoryService.hide;
		$scope.retryUpload = function (idx) {
			return HistoryService.retryUpload(idx);
		}
		/*
			Wait until after interface is draw to populate data for UX experience,
			and then poll recentSamples to reflect changes as the user interacts
			with the app.
		*/
		$rootScope.$on('history:measurement:change', $scope.refreshData);
		$scope.refreshData();

		var footerTimeout = function () {
			$timeout(function () {
				$scope.uploadStatus = undefined;
			}, 3000);
		}


		// Upload error popup, shown when the upload fails.
		$scope.showErrorPopup = function() {
			$ionicPopup.show({
			template: '<span ng-if="uploadError.status == 0">Connection to the back-end service failed.' +
			' Please check that the measure-saver instance is reachable at the URL provided in the extension\'s settings.</span>' +
			'<span ng-if="uploadError.status != 0" ng-model="uploadError"></span>',
			title: "Upload failed",
			scope: $scope,
			buttons: [
				{
				text: 'Close'
				}
			]
			});
		}

		$rootScope.$on('upload:started', function () {
			console.log("upload started");
			$scope.uploadStatus = "started";
			$scope.footerClass = "stable"
			footerTimeout();
		});

		$rootScope.$on('upload:success', function () {
			console.log("upload success");
			$scope.uploadStatus = "success";
			$scope.footerClass = "balanced";
			footerTimeout();
		});
		$rootScope.$on('upload:failure', function(_, data) {
			console.log("upload failure");
			$scope.uploadStatus = "failure";
			$scope.footerClass = "assertive";
			$scope.uploadError = data;
			footerTimeout();
		  });
	});
