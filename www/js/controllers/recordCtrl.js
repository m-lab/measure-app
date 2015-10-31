angular.module('Measure.controllers.Record', [])

.controller('RecordCtrl', function($scope, $history, $stateParams, $filter, $ionicModal,
        HistoryService, gettextCatalog) {

    var RESULTS_TO_DISPLAY = {
        's2cRate': {'label': 'Download', 'filter': 'formatThroughputDisplay'},
        'c2sRate': {'label': 'Upload', 'filter': 'formatThroughputDisplay'},
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
	$scope.hideMeasurement = function (measurementId) {
		HistoryService.hide(measurementId);
		$history.back();
	};

    HistoryService.getById(measurementId).then(function (measurementRecord) {
        var measurementSiteTemp;

        $scope.MeasurementNotes = measurementRecord.note;
        $scope.measurementRecord = {
            'information': {},
            'results': {},
        };
        $scope.measurementRecord.index = measurementRecord.index;

        if (measurementRecord.timestamp !== undefined) {
            $scope.measurementRecord.information['Time'] = $filter('date')(measurementRecord.timestamp, 'MMMM d, yyyy (H:mm)');
        }

        if (measurementRecord.accessInformation !== undefined) {
            $scope.measurementRecord.information['Service Provider'] = measurementRecord.accessInformation.isp;
        }
        if (measurementRecord.mlabInformation !== undefined && measurementRecord.mlabInformation !== null) {
            measurementSiteTemp = measurementRecord.mlabInformation.fqdn.split('.');
            $scope.measurementRecord.information['Your Location'] = measurementRecord.mlabInformation.label;
            $scope.measurementRecord.information['M-Lab Site'] = measurementSiteTemp[3] + ' (' + measurementSiteTemp[2] + ')';
        }
        if (measurementRecord.connectionInformation !== undefined) {
			$scope.measurementRecord.information['Connection Type'] = measurementRecord.connectionInformation.label;
        }
        angular.forEach(RESULTS_TO_DISPLAY, function(value, key) {
            $scope.measurementRecord.results[value.label] = $filter(value.filter)(measurementRecord.results[key]);
        });
    });
});
