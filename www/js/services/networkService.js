angular.module('Measure.services.Network', [])

.factory('connectionInformation', function($cordovaNetwork, MeasureConfig) {
	var connectionDescription = function (connectionClass) {
		var connectionType = {
			'icon': 'ion-help',
			'label': 'Unknown',
			'class': undefined
		}
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
		return connectionType;
	}
	var connectionInformation = {}
	connectionInformation.current = function () {
		var connectionClass = undefined;
		if (MeasureConfig.enviromentCapabilities.connectionInformation === true) {
			var connectionClass = $cordovaNetwork.getNetwork();
		}
		return connectionDescription(connectionClass);
	};
	connectionInformation.lookup = function (connectionClass) {
		return connectionDescription(connectionClass);
	};

	return connectionInformation;
});