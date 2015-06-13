angular.module('Measure.services.Gauge', [])

.value('SpeedGauge', {
        options: {
            chart: {
                type: 'gauge',
                backgroundColor: 'transparent',
                plotBorderWidth: 0,
                plotShadow: false,
                spacingTop: 0,
                spacingLeft: 0,
                spacingRight: 0,
                spacingBottom: 0,
                credits: { enabled: false },
                legend: { enabled: false },
                tooltip: { enabled: false },
                margin: [0,0,0,0]
            },
            title: { text: null, display: 'none' },
            pane: {
                startAngle: -100,
                endAngle: 180,
                background: null,
                center: ['50%', '50%'],
            },
            dataLabels: { borderWidth: 0 },
      },
      size: {height: '260'},
      credits: { enabled: false },
	    yAxis: {
          type: 'logarithmic',
	        min: 1,
	        max: 1000,
          tickPositioner: function () {
            var targets = [1, 2, 4, 8, 15, 25, 50, 100, 250, 500, 1000];
            var i;
            for (i in targets) {
              targets[i] = Math.log10(targets[i]);
            }
            return targets;
          },
	        minorTickLength: 0,
	        tickWidth: 3,
	        tickPosition: 'inside',
	        tickLength: 12,
	        tickColor: '#666',
          lineColor: null,
          title: { text: null, style: { display: 'none' } },
          labels: { format: '{value}'}
	    },
	    series: [{
          name: 'Speed',
          data: [.00000001],
          tooltip: { valueSuffix: null, enabled: false },
          dataLabels: { enabled: false },
	    }]
})

/*

.service('historyChartService', function(HistoryService) {
  var s2cSeriesData = [],
      c2sSeriesData = [];
  var historyChartService = {};

  angular.forEach(HistoryService.historicalData.measurements, function (historicalRecord) {
    if (historicalRecord.hidden !== true) {
      s2cSeriesData.push(historicalRecord.results.s2cRate);
      c2sSeriesData.push(historicalRecord.results.c2sRate);
    }
  });
  
  historyChartService.historyChartConfig = {
          options: {
            chart: { type: 'areaspline', margin: 0 },
            credits: { enabled: false },
            legend: { enabled: false },
            tooltip: { enabled: false },
          },
          title: { text: null, style: { display: 'none' } },
          subtitle: { text: null, style: { display: 'none' } },
          xAxis: {
              lineWidth: 0,
              minorGridLineWidth: 0,
              lineColor: 'transparent',
              labels: {
                enabled: false
              },
              minorTickLength: 0,
              tickLength: 0,
              title: { text: null }
          },
          yAxis: {
              lineWidth: 0,
              minorGridLineWidth: 0,
              lineColor: 'transparent',
              gridLineColor: 'transparent',
              labels: {
                enabled: false
              },
              minorTickLength: 0,
              tickLength: 0,
              title: { text: null }
          },
          plotOptions: {
              areaspline: {
                  fillOpacity: 0.5
              }
          },
          size: {
            height: 200
          },
          series: [{
              name: 'download',
              data: s2cSeriesData,
              marker: { enabled: false },

          }, {
              name: 'upload',
              data: c2sSeriesData,
              marker: { enabled: false }
          }]
  };
  return historyChartService;
})

*/