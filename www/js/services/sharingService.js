angular.module('Measure.services.Sharing', [])

.factory('SharingService', function($cordovaSocialSharing, CSV, $document,
        $timeout, MeasureConfig) {
    var SharingService = {};
    
    SharingService.shareCSV = function (dataContent) {
        var csvOptions = {'decimalSep': '.', 'txtDelim': '"'},
            csvContents = [],
			csvHeaders = [],
			flattenedHistory = [],
            headerArray = [],
			ignoredKeys = ['$$hashKey', 'hidden', 'mlabInformation.url', 'index'];
		var temporaryRow,
			temporaryKey;

        angular.forEach(dataContent, function (dataRow) {
            temporaryRow = {};
            angular.forEach(dataRow, function (dataColumn, dataColumnKey) {
                if (typeof(dataColumn) === 'object') {
                    angular.forEach(dataColumn, function (dataColumnItem, dataColumnItemKey) {
                        temporaryKey = dataColumnKey + '.' + dataColumnItemKey;
                        if (headerArray.indexOf(temporaryKey) === -1) headerArray.push(temporaryKey);
                        temporaryRow[temporaryKey] = dataColumnItem;
                    });
                } else {
                    if (headerArray.indexOf(dataColumnKey) === -1) headerArray.push(dataColumnKey);
                    temporaryRow[dataColumnKey] = dataColumn;
                }
            });
            flattenedHistory.push(temporaryRow);
        });
        angular.forEach(flattenedHistory, function (csvContentRow, csvContentRowKey) {
            temporaryRow = {};
            angular.forEach(headerArray, function (headerRow) {
                if (csvContentRow.hasOwnProperty(headerRow) === true &&
                        typeof(csvContentRow[headerRow]) !== 'object' &&
						ignoredKeys.indexOf(headerRow) === -1) {
                    temporaryRow[headerRow] = csvContentRow[headerRow];
					
					if (csvHeaders.indexOf(headerRow) === -1) {
						csvHeaders.push(headerRow);
					}
                }
            });
            csvContents.push(temporaryRow);
        });

        csvOptions.header = csvHeaders;
        CSV.stringify(csvContents, csvOptions).then(function (csvStringified) {
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
        });
    };

    return SharingService;
});
