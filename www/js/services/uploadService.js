angular.module('Measure.services.Upload', [])
    .factory('UploadService', function ($q, $http, SettingsService) {
        var UploadService = {};

        UploadService.makeMeasurement = function (record) {
            // Creates a Measurement object from a history record.
            // Supports both versioned and unversioned records.
            ts = new Date(record.timestamp);
            var measurement = {
                "UUID": record.uuid,
                "Download": record.results.s2cRate,
                "Upload": record.results.c2sRate,
                "Latency": parseInt(record.results.MinRTT),
                "Results": record.results,
                "Annotation": record.note
            };

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

            if (record.hasOwnProperty("accessInformation")) {
                var clientInfo = record.accessInformation;
                measurement.ClientInfo = {};

                // In unversioned records, the accessInformation field comes
                // from the now-discontinued measure-location service, which
                // used to provide different field names.
                if (!record.hasOwnProperty("version")) {
                    measurement.ClientInfo.Country = clientInfo.country_name;
                    measurement.ClientInfo.Hostname = "";
                    measurement.ClientInfo.Latitude = clientInfo.latitude;
                    measurement.ClientInfo.Longitude = clientInfo.longitude;
                    measurement.ClientInfo.ISP = clientInfo.isp;
                    measurement.ClientInfo.Postal = clientInfo.postal_code;
                    measurement.ClientInfo.Region = clientInfo.region_code;
                    measurement.ClientInfo.Timezone = clientInfo.time_zone;
                } else if (record.version == 1) {
                    measurement.ClientInfo.Country = clientInfo.country;
                    measurement.ClientInfo.Hostname = clientInfo.hostname;

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

                measurement.ClientInfo.IP = clientInfo.ip;
                measurement.ClientInfo.ASN = clientInfo.asn;
                measurement.ClientInfo.City = clientInfo.city;
            }

            return measurement;
        };

        UploadService.uploadMeasurement = async function (record) {
            // This function should never be called if the upload feature is not
            // enabled in the extension's settings.
            if (!SettingsService.currentSettings.uploadEnabled) {
                return;
            }

            let uploadURL = await SettingsService.get("uploadURL");
            uploadURL += "/v0/measurements";
            const apiKey = await SettingsService.get("uploadAPIKey");
            const browserID = await SettingsService.get("browserID");
            const deviceType = await SettingsService.get("deviceType");
            const notes = await SettingsService.get("notes");

            // Generate a valid Measurement message for measure-saver.
            var measurement = UploadService.makeMeasurement(record);

            // Add measure-saver-specific metadata.
            measurement.BrowserID = browserID;
            measurement.SchoolID = apiKey;

            measurement.Timestamp = ts.toISOString();
            measurement.DeviceType = deviceType;
            measurement.Notes = notes;

            // Add API key if configured.
            if (apiKey != "") {
                uploadURL = uploadURL + "?key=" + apiKey;
            }

            return $http.post(uploadURL, measurement);
        };

        return UploadService;
    });
