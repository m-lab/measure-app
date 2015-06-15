angular.module('Measure.services.Schedule', [])

.factory('ScheduleService', function(MeasureConfig, ChromeAppSupport,
        ScheduleManagerService) {

    var FIRST_ALARM_TIME = 1,
        PERIOD_IN_MINUTES = 1;
	var ScheduleService = {};

	ScheduleService.initiate = function () {
		if (MeasureConfig.environmentType === 'ChromeApp') {
			ChromeAppSupport.createAlarm(FIRST_ALARM_TIME, PERIOD_IN_MINUTES,
				ScheduleManagerService.watch);
		}
	};
	return ScheduleService;
})

.factory('ScheduleManagerService' , function(MeasureConfig, SettingsService,
        MeasurementBackgroundService, StorageService) {

	var ScheduleManagerService = {
		'scheduleSemaphore': undefined
	};

	ScheduleManagerService.watch = function () {
		var currentTime = Date.now();
		var scheduleInterval = SettingsService.currentSettings.scheduleInterval;
		var scheduledTesting = SettingsService.currentSettings.scheduledTesting;
		
		if (scheduledTesting === true) {
			if (this.scheduleSemaphore === undefined) {
				StorageService.get('scheduleSemaphore').then(
					function (storedScheduleSemaphore) {
						if (storedScheduleSemaphore === undefined ||
								currentTime < storedScheduleSemaphore.start ||
								currentTime > storedScheduleSemaphore.end ||
								scheduleInterval !== storedScheduleSemaphore.intervalType) {
							ScheduleManagerService.scheduleSemaphore = createScheduleSemaphore(scheduleInterval);
							StorageService.set('scheduleSemaphore',
									ScheduleManagerService.scheduleSemaphore);
						}
						ScheduleManagerService.decide(ScheduleManagerService.scheduleSemaphore);
					}
				);
			} else {
				ScheduleManagerService.decide(ScheduleManagerService.scheduleSemaphore);
			}
		}
	};

	ScheduleManagerService.decide = function (scheduleSemaphore) {
		var currentTime = Date.now();

		if (scheduleSemaphore.triggered === false &&
				currentTime > scheduleSemaphore.choice) {
			console.log('Founded scheduled measurement ready, triggering.');
			scheduleSemaphore.triggered = true;

			ScheduleManagerService.scheduleSemaphore = scheduleSemaphore;
			StorageService.set('scheduleSemaphore', scheduleSemaphore);

			MeasurementBackgroundService.startBackground();
		}
	};

	return ScheduleManagerService;
});


function createScheduleSemaphore(scheduleInterval) {
    var currentTime = Date.now();
    var scheduleSemaphore = {
        'start': undefined,
        'end': undefined,
        'choice': undefined,
        'intervalType': undefined,
        'triggered': false
    };
    var scheduleLabelToTimes = {
		'constantly': (60 * 5) * 1000,
        'hourly': (60 * 60) * 1000,
        'daily': (60 * 60 * 24) * 1000,
        'weekly': (60 * 60 * 24 * 7) * 1000
    }
    var scheduleIntervalinSeconds;
    var scheduleSemaphoreChoice;

    scheduleIntervalinSeconds = scheduleLabelToTimes[scheduleInterval]
    scheduleSemaphore.start = currentTime;
    scheduleSemaphore.end = currentTime + scheduleIntervalinSeconds;
    scheduleSemaphore.choice = currentTime + Math.floor(Math.random() * scheduleIntervalinSeconds);
    scheduleSemaphore.intervalType = scheduleInterval;

    return scheduleSemaphore;
}

