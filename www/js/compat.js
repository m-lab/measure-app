
// patch onMessage for Cordova/Android
if (!chrome.runtime.onMessage) {
  chrome.runtime.onMessage = {
    "addListener": function addListener(fn) {
      var wrapper = function(e) {
        fn(e.data, { "origin": e.origin }, function() {});
      };
      window.addEventListener("message", wrapper, false);
    }
  };
}

// patch sendMessage for Cordova/Android
if (!chrome.runtime.sendMessage) {
  chrome.runtime.sendMessage = function sendMessage(msg) {
    chrome.runtime.getBackgroundPage(function(bgWindow) {
      bgWindow.postMessage(msg, "*");
    });
    if (window.parent) {
      window.parent.postMessage(msg, "*");
    }
  };
}
