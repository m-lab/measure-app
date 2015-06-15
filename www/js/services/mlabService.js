angular.module('Measure.services.MeasurementLab', [])

.factory('MLabService', function($q, $http) {

  var mlabService = {};
    
  mlabService.cachedResponses = {
    'type': undefined,
    'answer': undefined,
    'all': undefined,
  };
  
  mlabService.findServer = function (metroSelection) {
    var findDeferred = $q.defer();
    var temporaryCache, temporaryResponse;
    var mlabNsUrl;

    if (metroSelection !== 'automatic') {
      mlabNsUrl = 'http://mlab-ns.appspot.com/ndt?format=json&policy=metro&metro=' + metroSelection;
    } else {
      mlabNsUrl = 'http://mlab-ns.appspot.com/ndt?format=json';
    }
    if (this.cachedResponses.type === metroSelection && this.cachedResponses.answer !== undefined) {
        temporaryCache = [];
        if (mlabService.cachedResponses.all !== undefined) {
            angular.forEach(this.cachedResponses.all, function (cachedResponse) {
                if (cachedResponse.metro === mlabService.cachedResponses.answer.metro) {
                    temporaryCache.push(cachedResponse);
                }
            });
            temporaryResponse = temporaryCache[Math.floor(Math.random() * temporaryCache.length)];
        } else {
            temporaryResponse = this.cachedResponses.answer;
        }

      console.log('cache hit for ' + metroSelection + ' on ' +
        this.cachedResponses.answer.site + ' sending ' +
        temporaryResponse.fqdn);
        
      findDeferred.resolve(temporaryResponse);
    } else if (metroSelection !== 'automatic' &&
        mlabService.cachedResponses.all !== undefined) {
      temporaryCache = [];
      angular.forEach(mlabService.cachedResponses.all, function (cachedResponse) {
        if (cachedResponse.metro === metroSelection) {
          temporaryCache.push(cachedResponse);
        }
      });
      console.log('Missed cache for ' + metroSelection + ' on ' +
        this.cachedResponses.answer + ' found all sites list ');
      findDeferred.resolve(temporaryCache[Math.floor(Math.random() * temporaryCache.length)]);
    } else {
      console.log('Missed cache for ' + metroSelection );
      this.cachedResponses.type = metroSelection;
      $http.get(mlabNsUrl)
        .success(function(responseObject) {
          console.log('Received M-Lab answer ' + responseObject.fqdn +
            ' for ' + metroSelection);
          responseObject.label = responseObject.city.replace('_', ' ');
          responseObject.metro = responseObject.site.slice(0, 3);
          mlabService.cachedResponses.answer = responseObject;
          findDeferred.resolve(responseObject);
        })
        .error(function(data) {
          findDeferred.reject(responseObject);
        });
    }
    return findDeferred.promise;
  };
  mlabService.state = function () { return mlabService.cachedResponses.answer };
  mlabService.findAll = function () {
      var findAllDeferred = $q.defer();
      var mlabNsUrl = 'http://mlab-ns.appspot.com/ndt?format=json&policy=all';
      
      if (mlabService.cachedResponses.all === undefined) {
        $http.get(mlabNsUrl).
              success(function(data, status, headers, config) {
                mlabService.cachedResponses.all = [];
                
                angular.forEach(data, function (responseObject) {
                  responseObject.label = responseObject.city.replace('_', ' ');
                  responseObject.metro = responseObject.site.slice(0, 3);
                  mlabService.cachedResponses.all.push(responseObject);
                });
                findAllDeferred.resolve(data);
              }).
              error(function(data, status, headers, config) {
                findAllDeferred.reject(data);
              });
      } else {
        findAllDeferred.resolve(mlabService.cachedResponses.all);
      }
      return findAllDeferred.promise;
  };

  return mlabService;

});
