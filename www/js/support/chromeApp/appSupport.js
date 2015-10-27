angular.module('Measure.support.ChromeApp', [])

.constant('CHROME_APP_CONFIG', {
  alarmName: 'measurementScheduler'
})

.factory('ChromeAppSupport', function($rootScope, $q, CHROME_APP_CONFIG) {

  var ChromeAppSupport = {};
  ChromeAppSupport.listen = function listen(fn) { chrome.runtime.onMessage.addListener(fn); };
  ChromeAppSupport.notify = function notify(passedEvent, passedProperties) {
    var constructedMessage = angular.extend({}, { action: passedEvent }, passedProperties);
    chrome.runtime.sendMessage(constructedMessage);
    console.log("sent message:", constructedMessage);
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

  ChromeAppSupport.get = function (key, defaultValue) {
    var defer = $q.defer();
    var req = {};
    req[key] = defaultValue;
    chrome.storage.local.get(req, function(state) {
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
