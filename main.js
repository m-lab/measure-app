/* vim: set ts=2 tw=80 sw=2 expandtab : */

chrome.runtime.onInstalled.addListener(function() {
  var storage = {
    'storeResults': false,
    'runBackground': false,
    'runEvery': 60,
    'ndtResults': []
  };      
  chrome.storage.local.set(storage);
});

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    'bounds': {
      'width': 500,
      'height': 500 
    }
  });
  chrome.storage.local.get('runBackground', function(result) {
    if (result['runBackground'] === true) {
      chrome.storage.local.get('runEvery', function(result) {
        if (Number(result['runEvery']) > 0) {
          window.ndtAlarm('set', Number(result['runEvery']));
        }
      });
    }
  });
});

function ndtAlarm(action, interval) {
  if (action == 'set') {
    chrome.alarms.clear('ndtAlarm');
    chrome.alarms.create('ndtAlarm', {'periodInMinutes': interval});
    chrome.alarms.onAlarm.addListener(function() {
      window.runNDT();
    });
  } else if (action == 'unset') {
    chrome.alarms.clear('ndtAlarm');
  }
}

function runNDT() {
  var server = "ndt.iupui.mlab1.nuq0t.measurement-lab.org";
  var port = "3001";
  var path = "/ndt_protocol";
  var callbacks = {
    'onstart': function() { return false; },
    'onstatechange': function() { return false; },
    'onprogress': function() { return false; },
    'onerror': function() { return false; },
    'onfinish': function(ndtResults) {
      var storageEntry = {
        'timestamp': Date.now(),
        'c2sRate': (ndtResults['c2sRate'] / 1000).toFixed(2),
        's2cRate': (ndtResults['s2cRate'] / 1000).toFixed(2),
        'MinRTT': ndtResults['MinRTT']
      };
      chrome.storage.local.get('storeResults', function(result) {
        if (result['storeResults'] === true) {
          chrome.storage.local.get('ndtResults', function(result) {
            result['ndtResults'].push(storageEntry);
            chrome.storage.local.set({'ndtResults': result['ndtResults']});
          });
        }
      });
    }
  };
  var NDT_client = new NDTjs(server, port, path, callbacks);
  NDT_client.startTest();
};
