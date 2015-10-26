angular.module('Measure.support.ChromeApp', [])

.constant('CHROME_APP_CONFIG', {
  alarmName: 'measurementScheduler'
})

.factory('ChromeAppSupport', function($rootScope, $q, CHROME_APP_CONFIG) {

  var ChromeAppSupport = {};
  var MeasureAppPort = chrome.runtime.connect({name: "MeasureAppBackend"});

  MeasureAppPort.onMessage.addListener(function(msg) {
    $rootScope.$emit(msg.action, msg);
  });

  ChromeAppSupport.backgroundQueue = [];

  ChromeAppSupport.initialize = function () {
    ChromeAppSupport.badge.reset();

    $rootScope.$on('settings:changed', function(event, args) {
      chrome.runtime.sendMessage({action: 'settings:changed', name: args.name, value: args.value}, function (responseMessage) {
        console.log("settings:changed", responseMessage);
      });
    });
  };

  ChromeAppSupport.notify = function (passedEvent, passedProperties) {
    var constructedMessage = angular.extend({}, { action: passedEvent }, passedProperties);
    MeasureAppPort.postMessage(constructedMessage);

    //		chrome.runtime.sendMessage(constructedMessage, function (responseMessage) {
    //		});
  };

  ChromeAppSupport.clearAlarm = function () {
    chrome.alarms.clear(CHROME_APP_CONFIG.alarmName);
  };
  ChromeAppSupport.createAlarm = function (alarmTime, alarmPeriod, alarmFunction) {
    chrome.alarms.create(CHROME_APP_CONFIG.alarmName, {
      'delayInMinutes': alarmTime,
      'periodInMinutes': alarmPeriod
    });
    chrome.alarms.onAlarm.addListener(alarmFunction);
  };

  ChromeAppSupport.get = function (key) {
    var defer = $q.defer();
    chrome.storage.local.get(key, function(state) {
      console.log("retrieved from storage:", key, state);
      defer.resolve(state[key]);
    });
    return defer.promise;
  };

  ChromeAppSupport.set = function (key, value) {
    var defer = $q.defer();
    var state = {};
    state[key] = value;
    chrome.storage.local.set(state, function() {
      console.log("saved to storage:", key, value);
      if(chrome.runtime.lastError) {
        defer.reject(chrome.runtime.lastError);
      } else {
        defer.resolve(value);
      }
    });
    return defer.promise;
  };

  ChromeAppSupport.badge = {
    'start': function () {
      chrome.browserAction.setBadgeText({text: '🕐'});
      chrome.browserAction.setBadgeBackgroundColor({color: '#FF5FD8'});
    },
    'finished': function () {
      chrome.browserAction.setBadgeText({text: '✓'});
      chrome.browserAction.setBadgeBackgroundColor({color: '#5B6FB2'});
    },
    'reset': function () {
      chrome.browserAction.setBadgeText({text: ''});
    }
  };

  return ChromeAppSupport;
});
