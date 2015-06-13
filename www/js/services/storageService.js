angular.module('Measure.services.Storage', [])

.factory('StorageService', function ($q, MeasureConfig, ChromeAppSupport) {
    var StorageService = {};
    var isJsonString = function (str) {
        try {
            angular.fromJson(str);
        } catch (e) {
            return false;
        }
        return true;
    }
    StorageService.set = function (keyName, storedValue) {
        if (MeasureConfig.environmentType === 'ChromeApp') {
            ChromeAppSupport.set(keyName, storedValue);
        } else {
            if (typeof(storedValue) === 'object') {
                storedValue = angular.toJson(storedValue);
            }
            localStorage[keyName] = storedValue;
        }
        return;
    };
    StorageService.get = function (keyName) {
        var restoreDeferred = $q.defer();
        var retrievedValue, temporaryValue;
        if (MeasureConfig.environmentType === 'ChromeApp') {
            retrievedValue = ChromeAppSupport.get(keyName);
        } else if (localStorage !== undefined) {
            temporaryValue = localStorage.getItem(keyName);
            if (temporaryValue != undefined && isJsonString(temporaryValue) === true) {
                temporaryValue = angular.fromJson(temporaryValue);
            }
            restoreDeferred.resolve(temporaryValue);
            retrievedValue = restoreDeferred.promise;
        } else {
            restoreDeferred.resolve(undefined);
            retrievedValue = restoreDeferred.promise;
        }
        return retrievedValue;
    };
    return StorageService;
});
