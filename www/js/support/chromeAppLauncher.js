if (window.chrome && chrome.app && chrome.app.runtime) {
    chrome.app.window.create('index.html', {
        'bounds': {
          'width': 360,
          'height': 640
        }
    });
}
