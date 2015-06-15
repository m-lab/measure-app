angular.module('Measure.services.Settings', [])

.factory('SettingsService', function($q, StorageService, MLabService) {

  var service = {
	currentSettings: {},
    availableSettings: {
      'onlyWifi': {
        'default': false,
        'type': 'boolean',
        'value': undefined
      },
      'applicationLanguage': {
        'default': {'code': 'en', 'label': 'English'},
        'options': [
            {'code': 'en', 'label': 'English'},
            {'code': 'fa_IR', 'label': 'فارسی'},
        ]
      },
      'scheduledTesting': {
        'default': false,
        'type': 'boolean',
        'value': undefined
      },
      'trustedTester': {
        'default': false,
        'type': 'boolean',
        'value': undefined
      },
      'metroSelection': {
        'default': {'metro': 'automatic', 'label': 'Automatic'},
        'options': [],
        'value': undefined
      },
      'scheduleInterval': {
        'default': 'daily',
        'options': ['constantly', 'hourly', 'daily', 'weekly'],
        'value': undefined
      }
    },
    lastUpdatedTimestamp: undefined,
    savedSettings: {},
    save: function() {
      this.lastUpdatedTimestamp = Date.now();
      angular.forEach(service.availableSettings, function (availableSettingValue, availableSettingKey) {
        service.savedSettings[availableSettingKey] = availableSettingValue.value;
      });
      StorageService.set('savedSettings', service.savedSettings);
    },
    lastUpdated: function () { return this.lastUpdatedTimestamp; },
    restore: function () {
      var restoreDeferred = $q.defer();
      StorageService.get('savedSettings').then(
            function (savedSettings) {
				angular.forEach(service.availableSettings, function (availableSettingsValue, availableSettingsKey) {
					if (savedSettings[availableSettingsKey] !== undefined) {
						service.currentSettings[availableSettingsKey] = savedSettings[availableSettingsKey];
						service.availableSettings[availableSettingsKey].value = savedSettings[availableSettingsKey];
					} else {
						service.currentSettings[availableSettingsKey] = availableSettingsValue.default;
					}
				});
                restoreDeferred.resolve();
            }
        );
        return restoreDeferred.promise;
    },
    'setSetting': function (requestedSettingName, requestedSettingValue) {
      service.availableSettings[requestedSettingName].value = requestedSettingValue;
      service.save();
    }
    
    
  };

	service.restore();
	return service;
})
