// Measure.app

angular.module('Measure', ['ionic', 'gettext', 'ngSanitize', 'ngCsv',
		'ngCordova', 'highcharts-ng', 'Measure.controllers', 'gaugejs',
		'Measurement.filters', 'Measure.services', 'Measure.support'],
		function ($provide) {
	// Prevent Angular from sniffing for the history API
	// since it's not supported in packaged apps.
	$provide.decorator('$window', function($delegate) {
		$delegate.history.pushState = null;
		return $delegate;
	});
})

.constant('CLIENT_APPLICATION', 'Measure.app')
.constant('CLIENT_VERSION', '0.1-alpha')
.constant('ENVIRONMENT_CAPABILITIES', {
	'iOS': {
		'schedulingSupported': false,
		'sharingSupported': true,
		'connectionInformation': true
	},
	'Android': {
		'schedulingSupported': false,
		'sharingSupported': true,
		'connectionInformation': true
	},
	'ChromeApp': {
		'schedulingSupported': true,
		'sharingSupported': false,
		'connectionInformation': false
	},
	'Browser': {
		'schedulingSupported': false,
		'sharingSupported': false,
		'connectionInformation': false
	}
})

.value('MeasureConfig', {
	'environmentType': undefined,
	'environmentCapabilities': {},
})

.config( ['$compileProvider', function( $compileProvider ) {
	if (window.chrome && chrome.app && chrome.app.runtime) {
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
	}
}])

.run(function($ionicPlatform) {
	$ionicPlatform.ready(function() {
		if (window.cordova && window.cordova.plugins.Keyboard) {
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		}
		if (window.StatusBar) {
			StatusBar.styleDefault();
		}
	});
})

.run(function ($ionicPlatform, MeasureConfig, ENVIRONMENT_CAPABILITIES) {
	if (window.chrome && chrome.runtime && chrome.runtime.id) {
		MeasureConfig.environmentType = 'ChromeApp';
	}
    $ionicPlatform.ready(function() {
		 if (MeasureConfig.environmentType === undefined && typeof(device) !== 'undefined') {
			switch(device.platform) {
				case 'iOS':
					MeasureConfig.environmentType = 'iOS';
					break;
				case 'Android':
					MeasureConfig.environmentType = 'Android';
					break;
				case 'Browser':
					MeasureConfig.environmentType = 'Browser';
					break;
				default:
					// We don't know anything about the current environment
					// so we fall back onto only what the browser can handle.
					MeasureConfig.environmentType = 'Browser';
					break;
			}
		}
		
		if (ENVIRONMENT_CAPABILITIES.hasOwnProperty(MeasureConfig.environmentType) === true) {
			MeasureConfig.environmentCapabilities = ENVIRONMENT_CAPABILITIES[MeasureConfig.environmentType];
		} else {
			MeasureConfig.environmentCapabilities = ENVIRONMENT_CAPABILITIES['Browser'];
		}

    });
})

.run(function ($ionicPlatform, MeasureConfig, ScheduleService) {
    $ionicPlatform.ready(function() {
		if (MeasureConfig.environmentCapabilities.schedulingSupported === true) {
			ScheduleService.initiate();
		}
	});
})

.value('DialogueMessages', {
	'historyReset': {
		title: 'Confirm Reset',
		template: 'This action will permanently removal all stored results and cannot be undone. Are you sure?'
	},
	'measurementFailure': {
		title: 'Failure',
		templateUrl: 'templates/modals/messageTestFailure.html',
		buttons: [
			{
				text: 'Dismiss',
				type: 'button-outline button-assertive',
			}
		]
    }
})


.service("$history", function($state, $rootScope, $window) {

  var history = [];

  angular.extend(this, {
    push: function(state, params) {
      history.push({ state: state, params: params });
    },
    all: function() {
      return history;
    },
    go: function(step) {
      // TODO:
      // (1) Determine # of states in stack with URLs, attempt to
      //    shell out to $window.history when possible
      // (2) Attempt to figure out some algorthim for reversing that,
      //     so you can also go forward

      var prev = this.previous(step || -1);
      return $state.go(prev.state, prev.params);
    },
    previous: function(step) {
      return history[history.length - Math.abs(step || 1)];
    },
    back: function() {
      return this.go(-1);
    }
  });

})
.run(function($history, $state, $rootScope) {

  $rootScope.$on("$stateChangeSuccess", function(event, to, toParams, from, fromParams) {
    if (!from.abstract) {
      $history.push(from, fromParams);
    }
  });

  $history.push($state.current, $state.params);

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

  .state('app.serverSelection', {
    url: "/settings/server",
    views: {
      'menuContent': {
        templateUrl: "templates/serverSelection.html",
        controller: 'ServerSelectionCtrl'
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

  .state('app.about', {
    url: "/information/about",
    views: {
      'menuContent': {
        templateUrl: "templates/static/about.html"
      }
    }
  })

  .state('app.privacy', {
    url: "/information/privacy",
    views: {
      'menuContent': {
        templateUrl: "templates/static/privacy.html"
      }
    }
  })

  .state('app.hostInformation', {
    url: "/information/hostInformation",
    views: {
      'menuContent': {
        templateUrl: "templates/static/hostInformation.html"
      }
    }
  })

  .state('app.findingServer', {
    url: "/dialogues/findingServer",
    views: {
      'menuContent': {
        templateUrl: "templates/modals/findingServer.html"
      }
    }
  })

  .state('app.measurementRecord', {
      url: "/record/:measurementId",
      views: {
        'menuContent': {
          templateUrl: "templates/record.html",
          controller: 'RecordCtrl'
        }
      }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/measure');
})
