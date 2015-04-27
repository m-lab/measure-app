/* vim: set ts=2 tw=80 sw=2 expandtab : */

// Make the Event Page object available to the App
var eventPage;
chrome.runtime.getBackgroundPage(function(page) {
  eventPage = page;
});

document.addEventListener('DOMContentLoaded', function() {
  var server = "ndt.iupui.mlab1.nuq0t.measurement-lab.org";
  var port = "3001";
  var path = "/ndt_protocol";
  var NDT_meter,
      NDT_client,
      sheet,
      svgDiv,
      msgTextSize,
      infoTextSize,
      resultsTextSize;

  svgDiv = document.getElementById('svg');

  // Make the font size proportional to the container
  sheet = document.createElement('style');
  msgTextSize = Math.round(svgDiv.offsetWidth * 0.04) + 'px';
  infoTextSize = Math.round(svgDiv.offsetWidth * 0.032) + 'px';
  resultsTextSize = Math.round(svgDiv.offsetWidth * 0.028) + 'px';
  sheet.innerHTML = '#progress-meter {font-size: ' + msgTextSize + ';} ' +
    '#progress-meter .result-value, #progress-meter .result-label ' +
    '{font-size: ' + resultsTextSize + ';} ' +
    '#progress-meter text.information {font-size: ' + infoTextSize + ';}';
  document.head.appendChild(sheet);

  // If the document's body is smaller than the width and height assigned to the
  // #svg div, then adjust the width to fit.
  var bodyWidth = document.body.offsetWidth;
  if (bodyWidth < svgDiv.offsetWidth) {
    svgDiv.style.width = bodyWidth - 5 + 'px';
    svgDiv.style.height = bodyWidth - 5 + 'px';
  }

  NDT_meter = new NDTmeter('#svg');
  NDT_client = new NDTjs(server, port, path, NDT_meter);
  NDT_meter.meter.on("click", function () {
    NDT_client.startTest();
  });

  // Close the options box if the user clicks the Options link or anywhere
  // out side the options-content box.  This would be easier with jQuery.
  document.body.addEventListener('click', function(evt) {
    var insideOptions = false;
    evt.path.forEach(function(path) {
      if (path.id == 'options-content') {
        insideOptions = true;
      }
    });
    if (evt.target.id != 'options-link' && insideOptions !== true) {
      var options = document.getElementById('options-content');
      options.style.height = 0;
      options.style.padding = 0;
    }
  });

  document.getElementById('options-link').addEventListener('click', function(evt) {
    var options = document.getElementById('options-content');
    if ( options.offsetHeight > 0 ) {
      options.style.height = 0;
      options.style.padding = 0;
    } else {
      options.style.height = '50px';
      options.style.padding = '1ex';
    }
  });

  chrome.storage.local.get('storeResults', function(result) {
    document.getElementById('store-results').checked = result['storeResults'];
  });
  document.getElementById('store-results').addEventListener('change', function(evt) {
    chrome.storage.local.set({'storeResults': evt.target.checked});
  });

  chrome.storage.local.get('runBackground', function(result) {
    document.getElementById('run-background').checked = result['runBackground'];
  });
  document.getElementById('run-background').addEventListener('change', function(evt) {
    chrome.storage.local.set({'runBackground': evt.target.checked});
    if (evt.target.checked === true) {
      eventPage.ndtAlarm('set', Number(document.getElementById('run-every').value));
    } else {
      eventPage.ndtAlarm('unset');
    }
  });

  chrome.storage.local.get('runEvery', function(result) {
    document.getElementById('run-every').value = result['runEvery'];
  });
  document.getElementById('run-every').addEventListener('click', function(evt) {
    evt.target.select();
  });
  document.getElementById('run-every').addEventListener('keyup', function(evt) {
    chrome.storage.local.set({'runEvery': evt.target.value});
  });

});
