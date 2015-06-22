angular.module('Measure.services.Settings', [])

.factory('SettingsService', function($q, $rootScope, StorageService) {

	var SettingsService = {};
  
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
		},
		'metroSelection': {
			'default': {'metro': 'automatic', 'label': 'Automatic'},
			'options': [],
		},
		'scheduleInterval': {
			'default': 'daily',
			'options': ['constantly', 'hourly', 'daily', 'weekly'],
		}
    };
	
    SettingsService.save = function () {
		var savedSettings = {}
		this.lastUpdatedTimestamp = Date.now();
		angular.forEach(this.currentSettings, function (settingValue, settingKey) {
			savedSettings[settingKey] = settingValue;
		});
		StorageService.set('savedSettings', savedSettings);
    };

    SettingsService.restore = function () {
		var restoreDeferred = $q.defer();
		StorageService.get('savedSettings').then(
            function (savedSettings) {
				angular.forEach(SettingsService.availableSettings, function (availableSettingsValue, availableSettingsKey) {
					if (savedSettings !== undefined && savedSettings[availableSettingsKey] !== undefined) {
						SettingsService.currentSettings[availableSettingsKey] = savedSettings[availableSettingsKey];
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
		$rootScope.$emit('settings:changed', {
			name: requestedSettingName,
			value: requestedSettingValue
		});
		SettingsService.currentSettings[requestedSettingName] = requestedSettingValue;
		SettingsService.save();
    };
		 
	SettingsService.restore();
	return SettingsService;
})