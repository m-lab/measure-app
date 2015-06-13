angular.module('Measure.support.ChromeApp', [])

.constant('ChromeAppConfig', {
    window : {width: 360, height: 640},
    alarmName: 'measurementScheduler'
})

.factory('ChromeAppSupport', function($q, ChromeAppConfig) {
    var ChromeAppSupport = {};

    ChromeAppSupport.clearAlarm = function () {
        chrome.alarms.clear(ChromeAppConfig.alarmName);
    };
    ChromeAppSupport.createAlarm = function (alarmTime, alarmPeriod, alarmFunction) {
        chrome.alarms.create(ChromeAppConfig.alarmName, {
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
//    ChromeAppSupport.restore = function () {
//        var restoreDeferred = $q.defer();
//        chrome.storage.local.get(null, function (storageObject) {
//            restoreDeferred.resolve(storageObject);
//        });
//        return restoreDeferred.promise;
//    };
//
//    if (MeasureConfig.environmentType === 'ChromeApp') {
//        ChromeAppSupport.restore().then(function (storageObject) {
//            ChromeAppSupport.storageState = storageObject;
//        });
//    }

    return ChromeAppSupport;
});
