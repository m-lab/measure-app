angular.module('Measure.services.Location', [])

.factory('LocationService', function($q, $http) {
  var LocationService = {};
  
  LocationService.getAccessInformation = function () {
    var deferred = $q.defer();
    var ipifyUrl = 'http://www.telize.com/geoip';

    $http.get(ipifyUrl)
      .success(function (data) {  deferred.resolve(data); })
      .error(function (data) { deferred.reject(data); });
    return deferred.promise;
  };

  return LocationService;
});
