angular.module('Measure.services.Schedule', [])

.factory('ScheduleService', function(MeasureConfig, ChromeAppSupport,
        ScheduleManagerService, SettingsService) {
    var FIRST_ALARM_TIME = 1,
        PERIOD_IN_MINUTES = 1;
  var ScheduleService = {};


  ScheduleService.schedule = function () {
    if (MeasureConfig.isChromeApp === true) {
        MeasureConfig.schedulingSupported = true;
        ChromeAppSupport.createAlarm(FIRST_ALARM_TIME, PERIOD_IN_MINUTES, ScheduleManagerService.watch);
    } else {

    }
  };
  
  return ScheduleService;
})

.factory('ScheduleManagerService' , function(MeasureConfig, SettingsService,
        MeasurementBackgroundService, StorageService) {
  var ScheduleManagerService = {};
  var scheduleInterval;
  var currentTime = Date.now();

  ScheduleManagerService.watch = function () {
    scheduleInterval = SettingsService.getSetting('scheduleInterval');
    scheduleSemaphore = StorageService.get('scheduleSemaphore').then(
        function (scheduleSemaphore) {
            if (scheduleSemaphore === undefined || currentTime < scheduleSemaphore.start ||
                    currentTime > scheduleSemaphore.end || scheduleInterval !== scheduleSemaphore.intervalType) {
                scheduleSemaphore = createScheduleSemaphore(scheduleInterval);
                StorageService.set('scheduleSemaphore', scheduleSemaphore);
            }

            if (shouldSchedulerFire(scheduleSemaphore) === true) {
                scheduleSemaphore.triggered = true;
                StorageService.set('scheduleSemaphore', scheduleSemaphore);
                MeasurementBackgroundService.startBackground();
            }
        }
    );
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
        'hourly': (60*60) * 1000,
        'daily': (60*60*24) * 1000,
        'weekly': (60*60*24*7) * 1000
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

function shouldSchedulerFire(scheduleSemaphore) {
    var currentTime = Date.now();

    if (scheduleSemaphore.triggered === false &&
            currentTime > scheduleSemaphore.choice) {
        return true;
    }
    
    return false;
}