angular.module('Measure.services.Upload', [])
.factory('UploadService', function ($q, $http, SettingsService) {
    var UploadService = {};

    UploadService.uploadMeasurement = function(record) {
        var settings = SettingsService.currentSettings

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
        }
        return $http.post(uploadURL, measurement);
    };

    return UploadService;
});
