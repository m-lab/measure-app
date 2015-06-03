angular.module('Measure.services.Settings', [])

.factory('SettingsService', function($q, StorageService, MLabService) {

  var service = {
    availableSettings: {
      'onlyWifi': {
        'default': false,
        'type': 'boolean',
        'value': undefined
      },
      'applicationLanguage': {
        'default': { 'code': 'en', 'label': 'English'},
        'options': [
            {'code': 'en', 'label': 'English'},
            {'code': 'fa_IR', 'label': 'فارسی (fa_IR)'},
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
        'options': ['hourly', 'daily', 'weekly'],
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
                if (savedSettings !== undefined && typeof(savedSettings) === 'object') {
                    angular.forEach(savedSettings, function (savedSettingsValue, savedSettingsKey) {
                        service.availableSettings[savedSettingsKey].value = savedSettingsValue;
                    });
                }
                restoreDeferred.resolve();
            }
        );
        return restoreDeferred.promise;
    },
    'getSetting': function (requestedSetting) {
      if (service.availableSettings.hasOwnProperty(requestedSetting) === true) {
        if (service.availableSettings[requestedSetting].value !== undefined) {
          return service.availableSettings[requestedSetting].value;
        } else {
          return service.availableSettings[requestedSetting].default;
        }
      }
      return undefined;
    },
    'setSetting': function (requestedSettingName, requestedSettingValue) {
      this.availableSettings[requestedSettingName].value = requestedSettingValue;
      service.save();
    }
    
    
  };

  MLabService.findAll().then(
    function (mlabAnswer) {
      var seenMetroKeys = [];

      service.availableSettings.metroSelection.options = [service.availableSettings.metroSelection.default];
      angular.forEach(mlabAnswer, function (mlabSite) {
        var mlabSiteOption = {
          'metro': undefined,
          'label': undefined,
        };

        mlabSiteOption.metro = mlabSite.metro;
        mlabSiteOption.label = mlabSite.country + ' (' + mlabSite.label + ')';
        
        if (seenMetroKeys.indexOf(mlabSiteOption.metro) === -1) {
          service.availableSettings.metroSelection.options.push(mlabSiteOption);
          seenMetroKeys.push(mlabSiteOption.metro);
        }
      });
    }
  );

  return service;
})
