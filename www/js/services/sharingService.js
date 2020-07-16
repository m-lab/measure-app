angular.module('Measure.services.Sharing', [])
.factory('SharingService', function($timeout, SettingsService) {
  var SharingService = {};

  SharingService.shareCSV = function (dataContent) {
    if(!dataContent || !dataContent.length) {
      return;
    }

    // regex for keys to blacklist
    var ignoredKeys = ['\\$\\$hashKey', 'hidden', 'mlabInformation\\.url', 'mlabInformation\\.ip\\.', 'index', 'snapLog\\.'];

    // key/function pairs for generating calculated values
    var calculatedKeys = [
      { "key": "Download", "fn": function(input) { return formatMbps(input["results.s2cRate"]); } },
      { "key": "Upload", "fn": function(input) { return formatMbps(input["results.c2sRate"]); } },
      { "key": "Latency", "fn": function(input) { return input["results.MinRTT"] + "ms"; } },
      { "key": "accessInformation.latitude", "fn": function(input) { return parseFloatSafe(input["accessInformation.latitude"], input["accessInformation.latitude"]).toFixed(4); } },
      { "key": "accessInformation.longitude", "fn": function(input) { return parseFloatSafe(input["accessInformation.longitude"], input["accessInformation.longitude"]).toFixed(4); } },
    ];

    uploadURL = SettingsService.currentSettings.uploadURL;
    browserID = SettingsService.currentSettings.browserID;
    deviceType = SettingsService.currentSettings.deviceType;
    notes = SettingsService.currentSettings.notes;

    var csvContents = dataContent.map(function (record) {
      var measurement = {
        "UUID": record.uuid,
        "BrowserID": browserID,
        "DeviceType": deviceType,
        "Notes": notes,
        "Download": record.results.s2cRate,
        "Upload": record.results.c2sRate,
        "Latency": parseInt(record.results.MinRTT),
        "Results": record.results
      };

      if (record.hasOwnProperty("accessInformation")) {
          // If we've got client data from ipinfo, add it to the Measurement
          // object.
          var clientInfo = record.accessInformation;
          measurement.ClientInfo = {}
          measurement.ClientInfo.ASN = clientInfo.asn;
          measurement.ClientInfo.City = clientInfo.city;
          measurement.ClientInfo.Country = clientInfo.country;
          measurement.ClientInfo.Hostname = clientInfo.hostname;
          measurement.ClientInfo.IP = clientInfo.ip;
          var coords = clientInfo.loc.split(",");
          if (coords.length == 2) {
              measurement.ClientInfo.Latitude = parseFloat(coords[0]);
              measurement.ClientInfo.Longitude = parseFloat(coords[1]);
          }
          measurement.ClientInfo.ISP = clientInfo.org;
          measurement.ClientInfo.Postal = clientInfo.postal;
          measurement.ClientInfo.Region = clientInfo.region;
          measurement.ClientInfo.Timezone = clientInfo.timezone;
      }
      if (record.hasOwnProperty("mlabInformation")) {
          // If we've got server data from mlab-ns, add it to the Measurement
          // object.
          var serverInfo = record.mlabInformation;
          measurement.ServerInfo = {}
          measurement.ServerInfo.FQDN = serverInfo.fqdn;
          measurement.ServerInfo.IPv4 = serverInfo.ip[0];
          measurement.ServerInfo.IPv6 = serverInfo.ip[1];
          measurement.ServerInfo.City = serverInfo.city;
          measurement.ServerInfo.Country = serverInfo.country;
          measurement.ServerInfo.Label = serverInfo.label;
          measurement.ServerInfo.Metro = serverInfo.metro;
          measurement.ServerInfo.Site = serverInfo.site;
          measurement.ServerInfo.URL = serverInfo.url;
      }

      return flatten(measurement);
    });

    var csvHeaders = Object.keys(csvContents[0]);
    csvHeaders.sort();
    moveElement(csvHeaders, 0, csvHeaders.indexOf("Download"));
    moveElement(csvHeaders, 1, csvHeaders.indexOf("Upload"));
    moveElement(csvHeaders, 2, csvHeaders.indexOf("Latency"));

    var csv = toCSV(csvHeaders, csvContents);
    var csvFile = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var csvUri = URL.createObjectURL(csvFile);
    if (window.plugins && window.plugins.socialsharing) {
      csvUri = "data:text/csv;charset=utf-8;base64," + window.btoa(csv);
      window.plugins.socialsharing.share('Attached is a spreadsheet from my performance measurement tests.', 'MeasureApp-Exported-Results.csv', csvUri, null);
    } else {
      var downloadLink = angular.element('<a></a>');
      downloadLink.attr('href', csvUri);
      downloadLink.attr('download', 'MeasureApp-Exported-Results.csv');

      $timeout(function () {
        downloadLink[0].click();
        downloadLink.remove();
      }, null);
    }
  };

  // private helpers
  var toCSV = function toCSV(headers, rows, options) {
    options = options || {};
    var delimiter = options.delimiter||",";
    var newline = options.newline||"\n";
    var quote = options.quote||"\"";
    var formatter = options.formatter||function(value) {
      value = (value||"").toString();
      return value.match(/[,\r\n]/) ? quote + value.replace("\"","\"\"") + quote : value.replace("\"","\"\"");
    };
    return [headers.join(delimiter)].concat(rows.map(function(row) { return headers.map(function(k) { return formatter(row[k]); }); })).join(newline);
  };

  var parseFloatSafe = function parseFloatSafe(input, def) {
    return !isNaN(parseFloat(input)) ? parseFloat(input) : def||NaN;
  };

  var formatMbps = function formatMbps(input) {
    return (parseFloatSafe(input) / 1000).toFixed(2) + " Mbit/s";
  };

  var flatten = function flatten(obj, prefix, tgt) {
    return Object.keys(obj).reduce(function(p,c) {
      if(!!obj[c] && typeof obj[c] == "object") {
        flatten(obj[c], (prefix||"") + c + ".", p);
      } else {
        p[(prefix||"") + c] = obj[c];
      }
      return p;
    }, tgt||{});
  };

  var transformObject = function transformObject(obj, blacklist, calculated) {
    return Object.keys(obj).reduce(function(p,c) {
      if(!blacklist.some(function(k) { return c.match(k); })) {
        p[c] = p[c] || obj[c]; // calculated values take priority
      }
      return p;
    }, (calculated||[]).reduce(function(p,c) {
      p[c.key] = c.fn(obj);
      return p;
    }, {}));
  };

  var moveElement = function moveElement(array, oldIndex, newIndex) {
    array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
  };

  return SharingService;
});
