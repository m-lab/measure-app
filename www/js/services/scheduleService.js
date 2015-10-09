angular.module('Measure.services.Schedule', [])

.factory('ScheduleService', function(MeasureConfig, ChromeAppSupport, ScheduleManagerService, CustomScheduleService) {
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

.factory('ScheduleManagerService' , function($q, MeasureConfig, SettingsService, MeasurementClientService, StorageService, CustomScheduleService) {

  var ScheduleManagerService = {};

  ScheduleManagerService.state = {
    'scheduleSemaphore': {}
  };

  // unused?
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

    if (scheduleSemaphore === undefined || currentTime < scheduleSemaphore.start || currentTime > scheduleSemaphore.end || scheduleInterval !== scheduleSemaphore.intervalType) {
      ScheduleManagerService.createScheduleSemaphore(scheduleInterval).then(function(scheduleSemaphore) {
        ScheduleManagerService.decide(scheduleSemaphore);
      });
    } else { 
      ScheduleManagerService.decide(scheduleSemaphore);
    }
  };

  ScheduleManagerService.decide = function (scheduleSemaphore) {
    console.log('On ' + new Date(currentTime).toUTCString() + ' found scheduled test covering ' +
                new Date(scheduleSemaphore.start).toUTCString() +
                ' and ' + new Date(scheduleSemaphore.end).toUTCString() +
                ' scheduled to run near ' + new Date(scheduleSemaphore.choice).toUTCString() +
                ' , with has run of [' + scheduleSemaphore.triggered + ']' );
    ScheduleManagerService.state.scheduleSemaphore = scheduleSemaphore;

    var currentTime = Date.now();
    if (scheduleSemaphore.choice !== undefined && scheduleSemaphore.triggered === false && currentTime > scheduleSemaphore.choice) {
      console.log('Found scheduled measurement ready, triggering.');

      // if we have a custom semaphore, clear it.  
      // These types should never persist, because there are multiple test periods, 
      // and a new semaphore must be created for each period.
      if (ScheduleManagerService.state.intervalType == 'custom') {
        ScheduleManagerService.state.scheduleSemaphore = {};
        StorageService.set('scheduleSemaphore', {});
      } else {
        scheduleSemaphore.triggered = true;
        ScheduleManagerService.state.scheduleSemaphore = scheduleSemaphore; // probably redundant
        StorageService.set('scheduleSemaphore', scheduleSemaphore);
      }
      MeasurementClientService.start(true);
    }
  };

  ScheduleManagerService.createScheduleSemaphore = function (scheduleInterval) {
    var defer = $q.defer();

    // local factories
    var createIntervalSemaphore = function createIntervalSemaphore(start, interval_ms) {
      var defer = $q.defer();
      defer.resolve({
        'start': start,
        'end': start + interval_ms,
        'choice': start + Math.floor(Math.random() * interval_ms),
        'triggered': false
      });
      return defer.promise;
    };

    var createCustomSemaphore = function createCustomSemaphore() {
      var defer = $q.defer();
      CustomScheduleService.getSchedules().then(function(schedules) {
        // bail if there is no schedule
        if(schedules.length == 0) {
          return defer.resolve({});
        }

        var now = new Date();
        var day = now.getDay();
        var hour = now.getHours();
        
        // eligible = the first schedule after "now" in the week, with wraparound (concat)
        schedules.sort(function(a,b) { return a.date*24+a.timespan < b.date*24+b.timespan ? 1 : -1; });
        var eligible = schedules.filter(function(s) { return day*24+hour < s.date*24+s.timespan; }).concat(schedules)[0];
        
        var eligibleHourOffset = eligible.date*24+eligible.timespan;
        var nowHourOffset = day*24+hour;
        var hoursToAdd = (eligibleHourOffset < nowHourOffset ? 168 /*one week in hours*/ : 0) + eligibleHourOffset - nowHourOffset;
        var start = Date.now() + (hoursToAdd * 60 * 60 * 1000);
        createIntervalSemaphore(start, 60 * 60 * 1000).then(defer.resolve);
      });
      return defer.promise;
    };
    
    var scheduleInitializers = {
      'constantly': function() { return createIntervalSemaphore(Date.now(), 60 * 5 * 1000); },
      'hourly': function() { return createIntervalSemaphore(Date.now(), 60 * 60 * 1000); },
      'daily': function() { return createIntervalSemaphore(Date.now(), 60 * 60 * 24 * 1000); },
      'weekly': function() { return createIntervalSemaphore(Date.now(), 60 * 60 * 24 * 7 * 1000); },
      'custom': function() { return createCustomSemaphore(); }
    };

    if (scheduleInitializers.hasOwnProperty(scheduleInterval) === true) {
      scheduleInitializers[scheduleInterval]().then(function(scheduleSemaphore) {
      scheduleSemaphore.intervalType = scheduleInterval;

      console.log('On ' + new Date().toUTCString() + ' created scheduled test covering ' +
                  new Date(scheduleSemaphore.start).toUTCString() +
                  ' and ' + new Date(scheduleSemaphore.end).toUTCString() +
                  ' scheduled to run near ' + new Date(scheduleSemaphore.choice).toUTCString() + '.');

      ScheduleManagerService.state.scheduleSemaphore = scheduleSemaphore;
      StorageService.set('scheduleSemaphore', scheduleSemaphore);
      defer.resolve(scheduleSemaphore);
      });
    }
    return defer.promise;
  };

  return ScheduleManagerService;
});



