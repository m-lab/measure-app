angular.module('Measure.services.Upload', [])
.factory('UploadService', function ($q, $http, SettingsService) {
    var UploadService = {};

    UploadService.uploadMeasurement = function(record) {
        var settings = SettingsService.currentSettings;

        // This function should never be called if the upload feature is not
        // enabled in the extension's settings.
        if (!settings.uploadEnabled) {
            return;
        }

        uploadURL = settings.uploadURL;
        browserID = settings.browserID;
        deviceType = settings.deviceType;

        // Generate a valid Measurement message for measure-saver.
        var measurement = {
            "BrowserID": browserID,
            "DeviceType": deviceType,
            "Download": record.results.s2cRate,
            "Upload": record.results.c2sRate,
            "Latency": parseInt(record.results.MinRTT),
            "Results": record.results,
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

        return $http.post(uploadURL, measurement);
    };

    return UploadService;
});
