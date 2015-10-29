angular.module('Measure.services.Gauge', [])

.value('progressGaugeConfig', {
	'gaugeType': 'donut',
	'gaugeOptions': {
		angle: 0.5, // The length of each line
		lineWidth: 0.07, // The line thickness
		limitMax: 'true',   // If true, the pointer will not go past the end of the gauge
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
			'current': 0,
			'maximum': 1,
			'message': 'Start'
		}
	};

	progressGaugeService.gaugeStart = function () {
		this.gaugeStatus.current = 0;
	};
	progressGaugeService.gaugeReset = function () {
		this.gaugeStatus.current = 0;
	};
	progressGaugeService.gaugeComplete = function () {
		this.gaugeStatus.current = this.gaugeStatus.maximum;
	};
	progressGaugeService.gaugeError = function () {
		this.gaugeStatus.current = this.gaugeStatus.maximum;
		this.gaugeConfig.colorStart = '#D90000';
		this.gaugeConfig.colorStop = '#D90000';
	};
	progressGaugeService.setGauge = function(value) {
          this.gaugeStatus.current = Math.min(value, this.gaugeStatus.maximum);
        };
	return progressGaugeService;
})

.value('historicalDataChartConfig', {
  "options": {
    "chart": {
      "type": "areaspline",
      "zoomType": 'x'
    },
    "plotOptions": {
      "series": {
        "stacking": "",
        "enableMouseTracking": true,
        "tooltip": {
            headerFormat: '',
            pointFormatter: function() {
               return (Number(this.y)/1000).toFixed(2) + ' Mbps';
            }
          }
      },
      'dataLabels': true
    },
    legend: {
      enabled: false
    },
    tooltip: {
      enabled: true
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
      color: '#9fe8e7',
      states: { hover: { enabled: false } }
    }
  ],
  title: {
    text: document.ontouchstart === undefined ?
          'Click and drag in the chart to zoom in' : 'Pinch the chart to zoom in',
    style: { "fontSize": "12px" }
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
    },
    lineWidth: 0,
    minorGridLineWidth: 0,
    lineColor: 'transparent',
    minorTickLength: 0,
    tickLength: 0
  },
  yAxis: {
    title: {
      text: null
    },
    labels: {
      enabled: true,
      align: 'left',
      x: -2,
      y: -2,
      formatter: function() {
        return (Number(this.value)/1000).toFixed(0) + ' Mbps';
      }
    },
  },
  "credits": false,
  "loading": false,
  "size": {
    'height': 200
  }
})

.factory('historicalDataChartService', function(historicalDataChartConfig, HistoryService) {
  var historicalDataChartService = {};

  historicalDataChartService.config = historicalDataChartConfig;

  historicalDataChartService.populateData = function (series) {
    HistoryService.get().then(function(historicalData) {
      //var data = historicalData.measurements.slice(-10).map(function(measurement) {
      var data = historicalData.measurements.map(function(measurement) {
        if (series == "upload") {
          return measurement.results.c2sRate;
        } else {
          return measurement.results.s2cRate;
        } 
      });
      historicalDataChartService.config.series[0].data = data;
    });
  };

  return historicalDataChartService;
});
