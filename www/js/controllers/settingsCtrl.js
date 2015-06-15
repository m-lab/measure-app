angular.module('Measure.controllers.Settings', [])

.controller('SettingsCtrl', function($scope, $ionicPopup, SettingsService, HistoryService,
		MeasureConfig, DialogueMessages, MLabService) {
	$scope.dataConsumed = HistoryService.dataConsumed();

	$scope.changeSelection = SettingsService.setSetting;

	$scope.availableSettings = SettingsService.availableSettings;
	$scope.currentSettings = SettingsService.currentSettings;
	$scope.environmentCapabilities = MeasureConfig.environmentCapabilities;

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
		}
	);

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
