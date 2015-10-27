angular.module('Measure.services.Storage', [])

.factory('StorageService', function ($q, MeasureConfig, ChromeAppSupport) {
  return {
    "set": function (key, value) {
      if (MeasureConfig.environmentType === 'ChromeApp') {
        return ChromeAppSupport.set(key, value);
      }
      throw "No storage backend available";
    },
    "get": function (key, defaultValue) {
      if (MeasureConfig.environmentType === 'ChromeApp') {
        return ChromeAppSupport.get(key, defaultValue);
      }
      throw "No storage backend available";
    }
  };
});
