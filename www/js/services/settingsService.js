angular.module('Measure.services.Settings', [])

.factory('SettingsService', function($q, $rootScope, StorageService) {

  var SettingsService = {
    "get": function get(key) {
      return StorageService.get("savedSettings", SettingsService.availableSettings[key].default).then(function(settings) {
        return settings && key ? settings[key] : settings;
      });
    }
  };

  SettingsService.currentSettings = {};
  SettingsService.lastUpdatedTimestamp = undefined;

  SettingsService.availableSettings = {
    'onlyWifi': {
      'default': false,
      'type': 'boolean',
      'value': undefined
    },
    'applicationLanguage': {
      'default': {'code': 'en', 'label': 'English'},
      'options': []
    },
    'scheduledTesting': {
      'default': false,
      'type': 'boolean',
      'value': undefined
    },
    'trustedTester': {
      'default': false,
      'type': 'boolean',
    },
    'metroSelection': {
      'default': 'automatic',
      'options': [],
    },
    'scheduleInterval': {
      'default': 'daily',
      'options': ['constantly', 'hourly', 'daily', 'weekly', 'custom'],
    },
    'uploadEnabled': {
      'default': false,
      'type': 'boolean',
    },
    'uploadURL': {
      'default': '',
      'type': 'string',
    },
    'uploadApiKey': {
      'default': '',
      'type': 'string',
    },
    'browserID': {
      'default': '',
      'type': 'string',
    },
    'deviceType': {
      'default': '',
      'type': 'string',
    }
  };

  SettingsService.save = function () {
    var savedSettings = {};
    this.lastUpdatedTimestamp = Date.now();
    angular.forEach(this.currentSettings, function (settingValue, settingKey) {
      savedSettings[settingKey] = settingValue;
    });
    return StorageService.set('savedSettings', savedSettings);
  };

  SettingsService.restore = function () {
    var restoreDeferred = $q.defer();
    StorageService.get('savedSettings', {}).then(
      function (savedSettings) {
        angular.forEach(SettingsService.availableSettings, function (availableSettingsValue, availableSettingsKey) {
          if (savedSettings !== undefined && savedSettings[availableSettingsKey] !== undefined) {
            SettingsService.currentSettings[availableSettingsKey] = savedSettings[availableSettingsKey];

            if (availableSettingsKey === 'metroSelection' && typeof(savedSettings[availableSettingsKey]) === 'object') {
              SettingsService.currentSettings[availableSettingsKey] = savedSettings[availableSettingsKey].metro;
            }
          } else {
            SettingsService.currentSettings[availableSettingsKey] = availableSettingsValue.default;
          }
        });
        restoreDeferred.resolve();
      }
    );
    return restoreDeferred.promise;
  };
  SettingsService.setSetting = function (requestedSettingName, requestedSettingValue) {
    SettingsService.currentSettings[requestedSettingName] = requestedSettingValue;
    SettingsService.save().then(function() {
      $rootScope.$emit('settings:changed', {
        name: requestedSettingName,
        value: requestedSettingValue
      });
    });
  };

  SettingsService.restore();
  return SettingsService;
});
