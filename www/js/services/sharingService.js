angular.module('Measure.services.Sharing', [])
.factory('SharingService', function($cordovaSocialSharing, $timeout, MeasureConfig) {
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

    var csvContents = dataContent.map(function (dataRow) {
      return transformObject(flatten(dataRow), ignoredKeys, calculatedKeys);
    });

    var csvHeaders = Object.keys(csvContents[0]);
    csvHeaders.sort();
    moveElement(csvHeaders, 0, csvHeaders.indexOf("Download"));
    moveElement(csvHeaders, 1, csvHeaders.indexOf("Upload"));
    moveElement(csvHeaders, 2, csvHeaders.indexOf("Latency"));

    var csvStringified = toCSV(csvHeaders, csvContents);
    
    //CSV.stringify(csvContents, csvOptions).then(function (csvStringified) {
      var charset = "utf-8";
      var downloadLink, csvFile;
      if (MeasureConfig.environmentCapabilities.sharingSupported === false) {
        downloadLink = angular.element('<a></a>');
        csvFile = new Blob([csvStringified], {
          type: "text/csv;charset=" + charset + ";"
        });
        downloadLink.attr('href', window.URL.createObjectURL(csvFile));
        downloadLink.attr('download', 'MeasureApp-Exported-Results.csv');

        $timeout(function () {
          downloadLink[0].click();
          downloadLink.remove();
        }, null);
      } else {
        csvFile = "data:text/csv;charset=" + charset + ";base64," + window.btoa(csvStringified);
        $cordovaSocialSharing.share('Attached is a spreadsheet from my performance measurement tests.', 'Check Out My Measure Results', csvFile, null);
      }
    //});
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
    return (parseFloatSafe(input) / 1000).toFixed(2) + " Mbps";
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
