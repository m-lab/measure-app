angular.module('Measure.services.Upload', [])
.factory('UploadService', function ($q, $http, SettingsService) {
    var UploadService = {};

    UploadService.uploadMeasurement = function(record) {
        // This function should never be called if the upload feature is not
        // enabled in the extension's settings.
        if (!SettingsService.get("uploadEnabled")) {
            return;
        }

        uploadURL = SettingsService.get("uploadURL");
        browserID = SettingsService.get("browserID");

        // Generate a valid Measurement message for measure-saver.
        var measurement = {
            "BrowserID": browserID,
            "Download": record.results.s2cRate,
            "Upload": record.results.c2sRate,
            "Latency": parseInt(record.results.MinRTT),
            "Results": record.results,
        }
        chrome.extension.getBackgroundPage().console.log(measurement);
        return $http.post(uploadURL, measurement);
    };

    UploadService.testURL = function() {
        uploadURL = SettingsService.get("uploadURL")
        return $http.get(uploadURL)
    }

    return UploadService;
});
