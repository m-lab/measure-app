// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('Measure', ['ionic', 'gettext', 'ngSanitize', 'ngCsv',
    'ngCordova', 'highcharts-ng',
    'Measure.controllers', 'Measurement.filters', 'Measure.services', 'Measure.support'])

.value('MeasureConfig', {
  'isChromeApp': false,
  'schedulingSupported': false,
})

.run(function (MeasureConfig, SettingsService, ScheduleService, HistoryService,
        gettextCatalog, $ionicPlatform) {
    if (window.chrome && chrome.runtime && chrome.runtime.id) {
        MeasureConfig.isChromeApp = true;
    }
    $ionicPlatform.ready(function() {
        if (typeof(device) !== 'undefined' && device.platform === 'iOS') {
            MeasureConfig.isIOS = true;
        } else if (typeof(device) !== 'undefined' && device.platform === 'Android') {
            MeasureConfig.isAndroid = true;
        } else if (MeasureConfig.isChromeApp !== true) {
            MeasureConfig.isBrowser = true;
        }
        HistoryService.restore();
        SettingsService.restore().then(
            function () {
                ScheduleService.schedule();
                MeasureConfig.currentLanguage = SettingsService.getSetting('applicationLanguage');
                gettextCatalog.setCurrentLanguage(MeasureConfig.currentLanguage);
            }
        );
    });
})

.config( ['$compileProvider', function( $compileProvider ) {
    if (window.chrome && chrome.app && chrome.app.runtime) {
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }
}])

.run(function($ionicPlatform, MeasureConfig) {
  $ionicPlatform.ready(function() {
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
  })
  
  .state('app.settings', {
    url: "/settings",
    views: {
      'menuContent': {
        templateUrl: "templates/settings.html",
        controller: 'SettingsCtrl'
      }
    },
  })

  .state('app.history', {
    url: "/history",
    views: {
      'menuContent': {
        templateUrl: "templates/history.html",
        controller: 'HistoryCtrl'
      }
    }
  })

  .state('app.measure', {
    url: "/measure",
    views: {
      'menuContent': {
        templateUrl: "templates/measure.html",
        controller: 'MeasureCtrl'
      }
    }
  })

  .state('app.measurementRecord', {
      url: "/measurement/:measurementId",
      views: {
        'menuContent': {
          templateUrl: "templates/measurementrecord.html",
          controller: 'RecordCtrl'
        }
      }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/measure');
})
