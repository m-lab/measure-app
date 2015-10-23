angular.module('Measure.controllers.Menu', [])
.controller('MenuCtrl', function($scope, HistoryService) {
  $scope.historyState = HistoryService.state;
});
