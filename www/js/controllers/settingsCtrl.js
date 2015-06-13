angular.module('Measure.controllers.Settings', [])

.controller('SettingsCtrl', function($scope, $ionicPopup, SettingsService, HistoryService,
		MeasureConfig, DialogueMessages) {
	$scope.dataConsumed = HistoryService.dataConsumed();

	$scope.changeSelection = SettingsService.setSetting;

	$scope.availableSettings = SettingsService.availableSettings;
	$scope.currentSettings = SettingsService.currentSettings;
	$scope.enviromentCapabilities = MeasureConfig.enviromentCapabilities;

	$scope.initiateHistoryReset = function() {
		var historyResetPopup = $ionicPopup.confirm(DialogueMessages.historyReset);

		historyResetPopup.then(function(resetDecision) {
			if(resetDecision === true) {
				HistoryService.reset();
			}
		});
	};

	$scope.metroSelectionSort = function(metroSelection) {
		return metroSelection.metro === 'automatic' ? 0 : metroSelection;
	};

})
