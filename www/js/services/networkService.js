angular.module('Measure.services.Network', [])

.constant('ACCESS_SERVICE_URL', 'https://ipinfo.io')

.factory('accessInformation', function($q, $http, ACCESS_SERVICE_URL) {
	var accessInformation = {};

	accessInformation.currentAccessInformation = {};
	accessInformation.getAccessInformation = function () {
		var deferred = $q.defer();
		$http.get(ACCESS_SERVICE_URL)
			.success(function (data) {
					chrome.extension.getBackgroundPage().console.log(data);
					accessInformation.currentAccessInformation = data;
					deferred.resolve(accessInformation.currentAccessInformation);
				}
			)
			.error(function (data) {
					chrome.extension.getBackgroundPage().console.log(data);
					accessInformation.currentAccessInformation = {};
					deferred.reject(data);
				}
			);
    return deferred.promise;
  };

  return accessInformation;
})

.factory('connectionInformation', function($cordovaNetwork, MeasureConfig) {
	var connectionDescription = function (connectionClass) {
		var connectionType = {
			'icon': 'ion-help',
			'label': 'Unknown',
		}
		if (typeof(Connection) !== 'undefined') {
			switch (connectionClass) {
				case Connection.WIFI:
					connectionType.icon = 'ion-wifi';
					connectionType.label = 'Wi-Fi';
					break;
				case Connection.CELL_2G:
					connectionType.icon = 'ion-connection-bars';
					connectionType.label = 'Mobile Data (2G)';
					break;
				case Connection.CELL_3G:
					connectionType.icon = 'ion-connection-bars';
					connectionType.label = 'Mobile Data (3G)';
					break;
				case Connection.CELL_4G:
					connectionType.icon = 'ion-connection-bars';
					connectionType.label = 'Mobile Data (4G)';
					break;
				case Connection.CELL:
					connectionType.icon = 'ion-connection-bars';
					connectionType.label = 'Mobile Data';
					break;
				case Connection.ETHERNET:
					connectionType.icon = 'ion-network';
					connectionType.label = 'Ethernet';
					break;
				default:
					break;
			}
		}
		return connectionType;
	}
	var connectionInformation = {}

	connectionInformation.current = function () {
		var connectionClass = undefined;
		if (MeasureConfig.environmentCapabilities.connectionInformation === true) {
			connectionClass = $cordovaNetwork.getNetwork();
		}
		return connectionDescription(connectionClass);
	};
	connectionInformation.lookup = function (connectionClass) {
		return connectionDescription(connectionClass);
	};

	return connectionInformation;
});
