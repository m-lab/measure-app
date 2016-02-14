// Measure.app
/*
todo:
	retain state
	inform about new tests
	launch front-facing tests in backgroundjs to preserve
*/
angular.module('Measure', ['ionic', 'ngCordova', 'Measure.services.Background', 'Measure.services', 'Measure.support'], function ($provide) {

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
.run(function ($ionicPlatform, MeasureConfig, ENVIRONMENT_CAPABILITIES) {
  if (window.chrome && chrome.runtime && chrome.runtime.id) {
    MeasureConfig.environmentType = 'ChromeApp';
  }
  MeasureConfig.environmentCapabilities = ENVIRONMENT_CAPABILITIES[MeasureConfig.environmentType] || {};
  console.log("MeasureConfig", JSON.stringify(MeasureConfig, null, "  "));
})
.run(function($rootScope, ChromeAppSupport, SettingsService, MeasurementClientService, BackgroundService, MeasureConfig, ScheduleService) {
  var LISTENERS = {
    'settings:changed': function(msg) {
      $rootScope.$emit('settings:changed', {
        name: msg.name,
        value: msg.value
      });

      SettingsService.currentSettings[msg.name] = msg.value;
    },
    'measurement:start': function(msg) {
      MeasurementClientService.start(msg.server, msg.port, msg.path, msg.interval, false);
    },
    'measurement:status': function(msg) {
      if (msg.testStatus === 'onstart') {
        ChromeAppSupport.badge.start();
      } else if (msg.testStatus === 'complete') {
        ChromeAppSupport.badge.finished();
      }
    },
    'queue:request': function(msg) {
      angular.forEach(BackgroundService.eventQueue, function(queuedEvent, queuedEventKey) {
        listenerPort.postMessage(queuedEvent);
        if (queuedEvent.persistent === false) {
          BackgroundService.eventQueue.splice(queuedEventKey, 1);
        }
      });

    }
  };

  ChromeAppSupport.listen(function(msg) {
    if(typeof LISTENERS[msg.action] == "function") {
      LISTENERS[msg.action](msg);
    } else {
      $rootScope.$emit(msg.action, msg);
    }
  });

  if (MeasureConfig.environmentCapabilities.schedulingSupported === true) {
    ScheduleService.initiate();
  }
});

angular.element(document).ready(function () {
  angular.bootstrap(document, ['Measure']);
  console.log("Bootstrapped Measure module");
});

