angular.module('Measure.services.Schedule', [])

.factory('ScheduleService', function(MeasureConfig, ChromeAppSupport, ScheduleManagerService) {
  var PERIOD_IN_MINUTES = 1;
  var ScheduleService = {};

  ScheduleService.initiate = function () {
    if (MeasureConfig.environmentType === 'ChromeApp') {
      ScheduleManagerService.watch();
      ChromeAppSupport.createAlarm(PERIOD_IN_MINUTES, PERIOD_IN_MINUTES, ScheduleManagerService.watch);
    }
  };
  return ScheduleService;
})

.factory('ScheduleManagerService' , function(MeasureConfig, SettingsService, MeasurementClientService, StorageService) {

  var ScheduleManagerService = {};

  ScheduleManagerService.state = {
    'scheduleSemaphore': {}
  };

  ScheduleManagerService.initialize = function () {
    var currentTime = Date.now();
    var scheduleInterval = SettingsService.currentSettings.scheduleInterval;
    var scheduledTesting = SettingsService.currentSettings.scheduledTesting;
  };

  ScheduleManagerService.watch = function (eventInformation, scheduledTesting) {
    scheduledTesting = typeof scheduledTesting !== 'undefined' ? scheduledTesting : SettingsService.currentSettings.scheduledTesting;

    if (scheduledTesting === true) {
      if (ScheduleManagerService.state.scheduleSemaphore.choice === undefined) {
        StorageService.get('scheduleSemaphore').then(
          function (storedScheduleSemaphore) {
            ScheduleManagerService.validateThenDecide(storedScheduleSemaphore);
          }
        );
      } else {
        ScheduleManagerService.validateThenDecide(ScheduleManagerService.state.scheduleSemaphore);
      }
    } else if (scheduledTesting === undefined) {
      StorageService.get('scheduledTesting').then(
        function (storedScheduledTesting) {
          ScheduleManagerService.watch(undefined, storedScheduledTesting);
        }
      );
    }
  };

  ScheduleManagerService.validateThenDecide = function (scheduleSemaphore) {
    var currentTime = Date.now();
    var scheduleInterval = SettingsService.currentSettings.scheduleInterval;

    if (scheduleSemaphore === undefined ||
        currentTime < scheduleSemaphore.start ||
          currentTime > scheduleSemaphore.end ||
            scheduleInterval !== scheduleSemaphore.intervalType) {
      scheduleSemaphore = ScheduleManagerService.createScheduleSemaphore(scheduleInterval);
    }

    console.log('On ' + new Date(currentTime).toUTCString() + ' found scheduled test covering ' +
                new Date(scheduleSemaphore.start).toUTCString() +
                ' and ' + new Date(scheduleSemaphore.end).toUTCString() +
                ' scheduled to run near ' + new Date(scheduleSemaphore.choice).toUTCString() +
                ' , with has run of [' + scheduleSemaphore.triggered + ']' );
    ScheduleManagerService.state.scheduleSemaphore = scheduleSemaphore;
    ScheduleManagerService.decide(ScheduleManagerService.state.scheduleSemaphore);
  };

  ScheduleManagerService.decide = function (scheduleSemaphore) {
    var currentTime = Date.now();
    if (scheduleSemaphore.choice !== undefined &&
        scheduleSemaphore.triggered === false &&
          currentTime > scheduleSemaphore.choice) {
      console.log('Found scheduled measurement ready, triggering.');
    scheduleSemaphore.triggered = true;

    ScheduleManagerService.state.scheduleSemaphore = scheduleSemaphore;
    StorageService.set('scheduleSemaphore', scheduleSemaphore);

    MeasurementClientService.start(true);
    }
  };

  ScheduleManagerService.createScheduleSemaphore = function (scheduleInterval) {
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
    };
    var scheduleIntervalinSeconds;
    var scheduleSemaphoreChoice;

    if (scheduleLabelToTimes.hasOwnProperty(scheduleInterval) === true) {
      scheduleIntervalinSeconds = scheduleLabelToTimes[scheduleInterval];
      scheduleSemaphore.start = currentTime;
      scheduleSemaphore.end = currentTime + scheduleIntervalinSeconds;
      scheduleSemaphore.choice = currentTime +
        Math.floor(Math.random() * scheduleIntervalinSeconds);
      scheduleSemaphore.intervalType = scheduleInterval;

      console.log('On ' + new Date(currentTime).toUTCString() + ' created scheduled test covering ' +
                  new Date(scheduleSemaphore.start).toUTCString() +
                  ' and ' + new Date(scheduleSemaphore.end).toUTCString() +
                  ' scheduled to run near ' + new Date(scheduleSemaphore.choice).toUTCString() + '.');

      ScheduleManagerService.state.scheduleSemaphore = scheduleSemaphore;
      StorageService.set('scheduleSemaphore', scheduleSemaphore);
    }
    return scheduleSemaphore;
  };

  return ScheduleManagerService;
});



