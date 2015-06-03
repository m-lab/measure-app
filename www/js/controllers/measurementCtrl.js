angular.module('Measure.controllers.Record', [])

.controller('RecordCtrl', function($scope, $stateParams, $filter, $ionicModal,
        HistoryService) {
    var RESULTS_TO_DISPLAY = {
        's2cRate': {'label': 'Download', 'filter': 'formatThroughputMeasurement'},
        'c2sRate': {'label': 'Upload', 'filter': 'formatThroughputMeasurement'},
        'MinRTT': {'label': 'Latency', 'filter': 'formatLatencyMeasurement'},
        'packetRetransmissions': {'label': 'Retransmissions', 'filter': 'formatProbabilityMeasurement'},
      };
    var measurementId = $stateParams.measurementId;

    $ionicModal.fromTemplateUrl('templates/modals/annotateMeasurement.html', function($ionicModal) {
            $scope.annotateModal = $ionicModal;
            $scope.annotateModal.MeasurementNotes = $scope.MeasurementNotes;
        }, {
            scope: $scope,
            animation: 'slide-in-up'
        }
    );
    $scope.saveMeasurementNotes = function (measurementNote) {
        $scope.MeasurementNotes = measurementNote;
        HistoryService.annonate(measurementId, measurementNote);
    };

    HistoryService.get(measurementId).then(function (measurementRecord) {
        var measurementSiteTemp;

        $scope.MeasurementNotes = measurementRecord.note;
        $scope.measurementRecord = {
            'information': {},
            'results': {},
        };
        
        if (measurementRecord.timestamp !== undefined) {
            $scope.measurementRecord.information['Time'] = $filter('date')(measurementRecord.timestamp, 'MMMM d, yyyy');
        }

        if (measurementRecord.accessInformation !== undefined) {
            $scope.measurementRecord.information['Service Provider'] = measurementRecord.accessInformation.isp;
        }
        if (measurementRecord.mlabInformation !== undefined) {
            measurementSiteTemp = measurementRecord.mlabInformation.fqdn.split('.');
            $scope.measurementRecord.information['Test City'] = measurementRecord.mlabInformation.label;
            $scope.measurementRecord.information['Test Site'] = measurementSiteTemp[3] + ' (' + measurementSiteTemp[2] + ')';
        }
        if (measurementRecord.connectionInformation !== undefined) {
            $scope.measurementRecord.information['Connection Type'] = connectionTypeLabel(measurementRecord.connectionInformation.connectionType)
        }
        angular.forEach(RESULTS_TO_DISPLAY, function(value, key) {
            $scope.measurementRecord.results[value.label] = $filter(value.filter)(measurementRecord.results[key]);
        });
    });
});

function connectionTypeLabel(connectionType) {
    switch (connectionType) {
        case Connection.WIFI:
            return 'Wi-Fi';
            break;
        case Connection.CELL_2G:
            return 'Mobile Data (2G)';
            break;
        case Connection.CELL_3G:
            return 'Mobile Data (3G)';
            break;
        case Connection.CELL_4G:
            return 'Mobile Data (4G)';
            break;
        case Connection.CELL:
            return 'Mobile Data';
            break;
        case Connection.ETHERNET:
            return 'Ethernet';
            break;
        default:
            return 'Unknown';
            break;
    }
    return 'Unknown';
}