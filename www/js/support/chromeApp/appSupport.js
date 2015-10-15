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
        console.log(responseMessage);
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
  ChromeAppSupport.storageState = {};
  ChromeAppSupport.set = function (keyName, storedValue) {
    this.storageState[keyName] = storedValue;
    return chrome.storage.local.set(this.storageState);
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
  }

  ChromeAppSupport.get = function (keyName) {
    var restoreDeferred = $q.defer();

    if (ChromeAppSupport.storageState.hasOwnProperty(keyName) === true) {
      restoreDeferred.resolve(ChromeAppSupport.storageState[keyName]);
    } else {
      chrome.storage.local.get(keyName, function (storageObject) {
        restoreDeferred.resolve(storageObject[keyName]);
      })
    };
    return restoreDeferred.promise;
  };

  return ChromeAppSupport;
});
