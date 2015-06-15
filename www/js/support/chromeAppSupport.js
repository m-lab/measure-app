angular.module('Measure.support.ChromeApp', [])

.constant('CHROME_APP_CONFIG', {
    alarmName: 'measurementScheduler'
})

.factory('ChromeAppSupport', function($q, CHROME_APP_CONFIG) {
    var ChromeAppSupport = {};

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
