angular.module('Measure.services.Chart', [])
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
               return (Number(this.y)/1000).toFixed(2) + ' Mbit/s';
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
        return (Number(this.value)/1000).toFixed(0) + ' Mbit/s';
      }
    },
  },
  "credits": false,
  "loading": false,
  "size": {
    'height': 200
  }
})

.factory('historicalDataChartService', function(historicalDataChartConfig, HistoryService, gettextCatalog) {
  var historicalDataChartService = {};

  historicalDataChartService.config = historicalDataChartConfig;
  historicalDataChartService.config.title.text = gettextCatalog.getString(historicalDataChartService.config.title.text);

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
