angular.module('Measure.controllers.Menu', [])
.controller('MenuCtrl', function($scope, $rootScope, HistoryService) {
  function refreshHistory() {
    HistoryService.get().then(function(data) {
      var dataConsumed = data.measurements.reduce(function(p,c) { return p + c.results.receivedBytes; }, 0);
      console.log(data, dataConsumed);
      $scope.historyState = { "dataConsumed": dataConsumed };
    });
  }

  $rootScope.$on("history:measurement:change", refreshHistory);
  refreshHistory();
});
