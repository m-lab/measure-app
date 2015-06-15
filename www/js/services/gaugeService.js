angular.module('Measure.services.Gauge', [])

.value('progressGaugeConfig', {
	'gaugeType': 'donut',
	'gaugeOptions': {
		angle: 0.5, // The length of each line
		lineWidth: 0.13, // The line thickness
		limitMax: 'false',   // If true, the pointer will not go past the end of the gauge
		colorStart: '#07DBD0',   // Colors
		colorStop: '#07DBD0',    // just experiment with them
		strokeColor: '#FFF',   // to see which ones work best for you
		generateGradient: true
    }
})

.factory('progressGaugeService', function(progressGaugeConfig, $interval) {

	var progressGaugeService = {
		'gaugeConfig': angular.copy(progressGaugeConfig),
		'gaugeStatus': {
			'current': 0.0001,
			'maximum': 1,
			'message': 'Start'
		}
	};

	progressGaugeService.gaugeStart = function () {
		this.gaugeStatus.message = '...';
		this.gaugeStatus.current = 0;
	}
	progressGaugeService.gaugeReset = function () {
		this.gaugeStatus.message = 'Start';
		this.gaugeStatus.current = 0;
	}
	progressGaugeService.gaugeComplete = function () {
		this.gaugeStatus.message = 'Complete';
		this.gaugeStatus.current = this.gaugeStatus.maximum;
	}
	progressGaugeService.gaugeError = function () {
		this.gaugeStatus.message = 'Error!';
		this.gaugeStatus.current = this.gaugeStatus.maximum;
		this.gaugeConfig.colorStart = '#D90000';
		this.gaugeConfig.colorStop = '#D90000';
	}
	progressGaugeService.incrementGauge = function (testStatus) {
		var incrementalValue = incrementProgressMeter(testStatus);
		var testPeriod = 10000,
			intervalDelay = 100,
			that = this;
		var intervalCount;
		this.gaugeStatus.message = '...';
		if (testStatus == 'running_s2c' || testStatus == 'running_c2s') {
			intervalCount = (testPeriod / intervalDelay);
			$interval(function () {
				if (that.gaugeStatus.current < that.gaugeStatus.maximum) {
					that.gaugeStatus.current += (incrementalValue / intervalCount);
				}
			}, intervalDelay, intervalCount);
		} else {
			if (this.gaugeStatus.current < this.gaugeStatus.maximum) {
				this.gaugeStatus.current += incrementalValue;
			}
		}
	}
	
	return progressGaugeService;
})

.value('historicalDataChartConfig', {
	"options": {
		"chart": {
			"type": "areaspline"
		},
		"plotOptions": {
			"series": {
				"stacking": ""
			},
			'dataLabels': false
		},
		legend: {
			enabled: false
		},
		tooltip: {
			enabled: false
		}

	},
	"series": [
		{
			title: {
				text: null
			},
			"data": [],
			"id": "series-0",
			marker: { enabled: false },
			states: { hover: { enabled: false } }
		}
	],
	title: {
		text: null
	},
	subtitle: {
		text: null
	},
	xAxis: {
		title: {
			text: null
		},
		labels: {
			enabled:false
		}
	},
	yAxis: {
		title: {
			text: null
		},
		labels: {
			enabled:false
		}
	},
	"credits": false,
	"loading": false,
	"size": {
		'height': 200
	}
})

.factory('historicalDataChartService', function(historicalDataChartConfig,
		HistoryService) {
	var historicalDataChartService = {};

	historicalDataChartService.config = historicalDataChartConfig
	historicalDataChartService.populate = function () {
		var historicalRecords = []
		angular.forEach(HistoryService.historicalData.measurements,
				function(historicalRecord) {
			historicalRecords.push(historicalRecord.results.s2cRate);
		});
		console.log(historicalRecords);
		historicalDataChartConfig.series[0].data = historicalRecords;
	};


	return historicalDataChartService;
})

function incrementProgressMeter(testStatus) {
    var testProgressIncrements = {
        'start': .01,

        'preparing_c2s': .04,
        'running_c2s': .35,
        'finished_c2s': .01,

        'preparing_s2c': .04,
        'running_s2c': .35,
        'finished_s2c': .01,

        'preparing_meta': .03,
        'running_meta': .03,
        'finished_meta': .01,
		
        'finished_all': .01,
    }
    if (testProgressIncrements.hasOwnProperty(testStatus) === true) {
        return testProgressIncrements[testStatus];
    }
    return 0;
}

