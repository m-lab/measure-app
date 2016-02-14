// Measure.app

angular.module('Measure', ['ionic', 'gettext', 'ngSanitize',
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

.constant('CLIENT_APPLICATION', CLIENT_APPLICATION)
.constant('CLIENT_VERSION', CLIENT_VERSION)
.constant('ENVIRONMENT_CAPABILITIES', ENVIRONMENT_CAPABILITIES)

.value('MeasureConfig', {
	'environmentType': undefined,
	'environmentCapabilities': {},
})

.controller("manualTranslationStrings", function (gettext) {
    var translationStrings = {
        "Time": gettext("Time"),
        "Service Provider": gettext("Service Provider"),
        "Your Location": gettext("Your Location"),
        "M-Lab Site": gettext("M-Lab Site"),
        "Connection Type": gettext("Connection Type"),
        "Retransmissions": gettext("Retransmissions"),
        "Constantly": gettext("Constantly"),
        "Hourly": gettext("Hourly"),
        "Daily": gettext("Daily"),
        "Weekly": gettext("Weekly"),
        "Custom": gettext("Custom"),
        "Monday": gettext("Monday"),
        "Tuesday": gettext("Tuesday"),
        "Wednesday": gettext("Wednesday"),
        "Thursday": gettext("Thursday"),
        "Friday": gettext("Friday"),
        "Saturday": gettext("Saturday"),
        "Sunday": gettext("Sunday"),
        "Midnight": gettext("Midnight"),
        "Starting": gettext("Starting"),
        "Running Test (Upload)": gettext("Running Test (Upload)"),
        "Running Test (Download)": gettext("Running Test (Download)"),
        "Completed": gettext("Completed"),
        "{{timeofday}} hour, every {{dayofweek}}": gettext("{{timeofday}} hour, every {{dayofweek}}"),
        "Click and drag in the chart to zoom in" : gettext("Click and drag in the chart to zoom in"),
        "Pinch the chart to zoom in": gettext("Pinch the chart to zoom in")
    };
})

.config( ['$compileProvider', function( $compileProvider ) {
	if (window.chrome && chrome.app && chrome.app.runtime) {
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
	}
}])

.run(function($ionicPlatform) {
	$ionicPlatform.ready(function() {
		if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
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
			MeasureConfig.environmentCapabilities = ENVIRONMENT_CAPABILITIES.Browser;
		}

    });
})

.run(function (gettextCatalog, $rootScope, SettingsService) {
  var availableLanguages = ['en'];

  availableLanguages = availableLanguages.concat(Object.keys(gettextCatalog.strings));

  availableLanguages.forEach(function (languageCode) {
    SettingsService.availableSettings.applicationLanguage.options.push(
            {
              'code': languageCode,
              'label': getLanguageNativeName(languageCode)
            });
  });

  SettingsService.get('applicationLanguage').then(function(applicationLanguage) {
    //gettextCatalog.debug = true;
    if(applicationLanguage) {
      gettextCatalog.setCurrentLanguage(applicationLanguage.code);
    }
  });
  $rootScope.$on('settings:changed', function(event, nameValue) {
    if (nameValue.name == 'applicationLanguage') {
      gettextCatalog.setCurrentLanguage(nameValue.value.code);
    }
  });
})

.run(function ($ionicPlatform, $rootScope, MeasureConfig, ChromeAppSupport) {
  $ionicPlatform.ready(function() {
    if (MeasureConfig.environmentType === 'ChromeApp') {
      ChromeAppSupport.badge.reset();
      ChromeAppSupport.listen(function(msg) {
        $rootScope.$emit(msg.action, msg);
      });
    }
  });
})
.value('DialogueMessages', {
	'historyReset': {
		title: 'Confirm Reset',
		template: 'This action will permanently remove all stored results and cannot be undone. Are you sure?'
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
    controller: 'MenuCtrl'
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

  .state('app.customSchedule', {
    url: '/settings/customSchedule',
    views: {
      'menuContent': {
        templateUrl: "templates/customSchedule.html",
        controller: 'CustomScheduleCtrl'
      }
    }
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
        templateUrl: "templates/about.html"
      }
    }
  })

  .state('app.dataUsage', {
    url: "/information/data",
    views: {
      'menuContent': {
        templateUrl: "templates/static/dataUsage.html"
      }
    }
  })

  .state('app.aboutMeasure', {
    url: "/information/about",
    views: {
      'menuContent': {
        templateUrl: "templates/static/aboutMeasure.html"
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
});
