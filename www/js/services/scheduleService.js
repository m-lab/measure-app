angular.module('Measure.services.Schedule', [])

.factory('ScheduleService', function(MeasureConfig, ChromeAppSupport, ScheduleManagerService, CustomScheduleService) {
  var PERIOD_IN_MINUTES = 1;
  var ScheduleService = {};

  ScheduleService.initiate = function () {
    if (MeasureConfig.environmentType === 'ChromeApp') {
      ChromeAppSupport.createAlarm(PERIOD_IN_MINUTES, PERIOD_IN_MINUTES, ScheduleManagerService.watch);
      console.log("Created ChromeApp alarm with " + PERIOD_IN_MINUTES + " minute(s) intervals");
    }
  };
  return ScheduleService;
})

.factory('ScheduleManagerService', function($q, MeasureConfig, SettingsService, MeasurementClientService, StorageService, CustomScheduleService) {

  // private helpers
  var scheduleInitializers = {
    'daily': function() { return createIntervalSemaphore(Date.now(), 60 * 60 * 24 * 1000); },
    'weekly': function() { return createIntervalSemaphore(Date.now(), 60 * 60 * 24 * 7 * 1000); },
    'custom': function() { return createCustomSemaphore(); }
  };

  function setSemaphore(semaphore) {
    return StorageService.set('scheduleSemaphore', semaphore);
  }

  function decide(scheduleSemaphore) {
    var currentTime = Date.now();
    if (scheduleSemaphore.choice !== undefined && currentTime > scheduleSemaphore.choice) {
      console.log('On ' + new Date(currentTime).toUTCString() + ' found scheduled test covering ' +
                new Date(scheduleSemaphore.start).toUTCString() +
                ' and ' + new Date(scheduleSemaphore.end).toUTCString() +
                ' scheduled to run near ' + new Date(scheduleSemaphore.choice).toUTCString());
      console.log('Found scheduled measurement ready, triggering.');
      MeasurementClientService.start();
      // clear semaphore when triggered
      setSemaphore({});
    }
  }

  function createIntervalSemaphore(start, interval_ms) {
    return {
      'start': start,
      'end': start + interval_ms,
      'choice': start + Math.floor(Math.random() * interval_ms),
    };
  }

  function createCustomSemaphore() {
    return CustomScheduleService.getSchedules().then(function(schedules) {
      // bail if there is no schedule
      if(!schedules || schedules.length === 0) {
        return {};
      }

      var now = new Date();
      var nowHour = { "date": now.getDay(), "timespan": now.getHours() };
      var INTERVAL_MS = 60 * 60 * 1000;
      var epochHour = now.getTime() - (now.getTime() % INTERVAL_MS);

      // next = the first schedule after "now" in the week, with wraparound (concat)
      function hourOfWeek(s) { return s.date*24+s.timespan; }
      schedules.sort(function(a,b) { return hourOfWeek(a) < hourOfWeek(b) ? 1 : -1; });
      var next = schedules.filter(function(s) { return hourOfWeek(s) - hourOfWeek(nowHour) > 0; }).concat(schedules)[0];

      var hoursToAdd = (hourOfWeek(nowHour) >= hourOfWeek(next) ? 169 /*one week in hours, plus 1 */ : 0) + hourOfWeek(next) - hourOfWeek(nowHour);
      var start = epochHour + (hoursToAdd * INTERVAL_MS);
      return createIntervalSemaphore(start, INTERVAL_MS);
    });
  }

  function createScheduleSemaphore() {
    var defer = $q.defer();
    SettingsService.get("scheduleInterval").then(function(scheduleInterval) {
      if (scheduleInitializers[scheduleInterval]) {
        $q.when(scheduleInitializers[scheduleInterval]()).then(function(scheduleSemaphore) {
          scheduleSemaphore.intervalType = scheduleInterval;
          defer.resolve(scheduleSemaphore);
        });
      } else {
        defer.reject({});
      }
    });
    return defer.promise;
  }

  // exports
  function getSemaphore() {
    return $q.all({
      "scheduledTesting": SettingsService.get("scheduledTesting"),
      "current": StorageService.get("scheduleSemaphore", {}),
      "next": createScheduleSemaphore()
    }).then(function(scheduled) {
      if (!scheduled.scheduledTesting) {
        console.log("Cleared scheduled tests.");
        return setSemaphore({});
      } else if (scheduled.current && scheduled.current.choice && scheduled.current.intervalType == scheduled.next.intervalType && scheduled.next.start >= scheduled.current.start) {
        return scheduled.current;
      } else {
        console.log('On ' + new Date().toUTCString() + ' created ' + scheduled.next.intervalType + ' scheduled test covering ' +
                    new Date(scheduled.next.start).toUTCString() +
                    ' and ' + new Date(scheduled.next.end).toUTCString() +
                    ' scheduled to run near ' + new Date(scheduled.next.choice).toUTCString() + '.');
        return setSemaphore(scheduled.next);
      }
    });
  }

  function watch(e) {
    console.log("Woke up at " + new Date().toISOString());
    getSemaphore().then(decide);
  }

  return {
    "getSemaphore": getSemaphore,
    "watch": watch
  };
});
