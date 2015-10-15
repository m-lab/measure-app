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

.run(function ($ionicPlatform, MeasureConfig, ScheduleService) {

  $ionicPlatform.ready(function() {
    if (MeasureConfig.environmentCapabilities.schedulingSupported === true) {
      ScheduleService.initiate();
    }
  });
})

.run(function($rootScope, ChromeAppSupport, SettingsService, MeasurementClientService, BackgroundService) {

  console.log("Setup Background listener port...");
  BackgroundService.eventState.mlabInformation = false;
  BackgroundService.eventState.accessInformation = false;

  $rootScope.$on('measurement:background', function(event, passedArguments) {

    if (passedArguments.testStatus === 'onstart') {
      ChromeAppSupport.badge.start();
    } else if (passedArguments.testStatus === 'complete') {
      ChromeAppSupport.badge.finished();
      BackgroundService.eventQueue.push({
        'event': 'measurement:background',
        'persistent': false,
        'state': {
          'test_status': 'complete',
          'results': passedArguments.results
        }
      });
    }
  });

  chrome.runtime.onConnect.addListener(function(listenerPort) {

    var listenerConnected = true;

    console.assert(listenerPort.name == "MeasureAppBackend");
    console.log('Frontend Listener Connected');

    listenerPort.onDisconnect.addListener(function () {

      console.log('Frontend Listener Disconnected');
      listenerConnected = false;
    });

    listenerPort.onMessage.addListener(function (request) {

      switch (request.action) {
        case 'settings:changed':

        $rootScope.$emit('settings:changed', {
          name: request.name,
          value: request.value
        });

        SettingsService.currentSettings[request.name] = request.value;
        break;
        case 'measurement:foreground:start':
          MeasurementClientService.start(request.server, request.port, request.path, request.interval, false)
        .then(
          function(passedMessage) { if (listenerConnected === true) { listenerPort.postMessage(passedMessage); } },
          function(passedMessage) { if (listenerConnected === true) { listenerPort.postMessage(passedMessage); } },
          function(passedMessage) { if (listenerConnected === true) { listenerPort.postMessage(passedMessage); } }
        );
        break;
        case 'queue:request':
        angular.forEach(BackgroundService.eventQueue, function(queuedEvent, queuedEventKey) {
          listenerPort.postMessage(queuedEvent);
          if (queuedEvent.persistent === false) {
            BackgroundService.eventQueue.splice(queuedEventKey, 1);
          }
        });
        break;
      }
    });
  });
});

angular.element(document).ready(function () {
  angular.bootstrap(document, ['Measure']);
  console.log("Bootstrapped Measure module");
});

