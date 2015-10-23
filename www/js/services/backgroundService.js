angular.module('Measure.services.Background', [])

.factory('BackgroundService', function($q) {

	BackgroundService = {};

	BackgroundService.eventQueue = [{
		'event': 'background:started',
		'persistent': false,
		'state': {}
	}];
	BackgroundService.eventState = {};

	return BackgroundService;
});
