angular.module('Measure.services.CustomSchedule', [])
.factory('CustomScheduleService', function($q, StorageService) {
  var service = {
    "TIMESPANS": [ 
      { "value": 0, "label": "midnight" },
      { "value": 1, "label": "1am" },
      { "value": 2, "label": "2am" },
      { "value": 3, "label": "3am" },
      { "value": 4, "label": "4am" },
      { "value": 5, "label": "5am" },
      { "value": 6, "label": "6am" },
      { "value": 7, "label": "7am" },
      { "value": 8, "label": "8am" },
      { "value": 9, "label": "9am" },
      { "value": 10, "label": "10am" },
      { "value": 11, "label": "11am" },
      { "value": 12, "label": "12pm" },
      { "value": 13, "label": "1pm" },
      { "value": 14, "label": "2pm" },
      { "value": 15, "label": "3pm" },
      { "value": 16, "label": "4pm" },
      { "value": 17, "label": "5pm" },
      { "value": 18, "label": "6pm" },
      { "value": 19, "label": "7pm" },
      { "value": 20, "label": "8pm" },
      { "value": 21, "label": "9pm" },
      { "value": 22, "label": "10pm" },
      { "value": 23, "label": "11pm" }
    ],
    "DATES": [
      { "value": 0, "label": "Sunday" },
      { "value": 1, "label": "Monday" },
      { "value": 2, "label": "Tuesday" },
      { "value": 3, "label": "Wednesday" },
      { "value": 4, "label": "Thursday" },
      { "value": 5, "label": "Friday" },
      { "value": 6, "label": "Saturday" }
    ],
    "getSchedules": function getSchedules() {
      var defer = $q.defer();
      StorageService.get('customSchedule').then(function(customSchedule) {
        defer.resolve(customSchedule || []);
      });
      return defer.promise;
    },
    "addSchedule": function addSchedule(schedule) {
      var defer = $q.defer();
      // validate input
      if(schedule.timespan === null || schedule.date === null) {
        defer.resolve(null);
      }
      // get stored state
      StorageService.get('customSchedule').then(function(customSchedule) {
        var newSchedule = customSchedule || [];
        
        // validate not already existing
        var exists = newSchedule.some(function(s) {
          return (s.timespan == schedule.timespan && s.date == schedule.date);
        });
        
        if(exists) {
          defer.resolve(null);
        } else {
          newSchedule.push(angular.extend({}, schedule));
          StorageService.set('customSchedule', newSchedule);
          defer.resolve(schedule);
        }
      });
      return defer.promise;
    },
    "removeSchedule": function removeSchedule(schedule) {
      var defer = $q.defer();
      StorageService.get('customSchedule').then(function(customSchedule) {
        // filter based on equality
        var newSchedule = (customSchedule || []).filter(function(s) {
          return !(s.timespan == schedule.timespan && s.date == schedule.date);
        });
        StorageService.set('customSchedule', newSchedule);
        defer.resolve(newSchedule);
      });
      return defer.promise;
    }
  };
  return service;
});
