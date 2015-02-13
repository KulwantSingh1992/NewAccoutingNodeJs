'use strict';

/**
 * @ngdoc service
 * @name paxcomTerminalApp.inventory/inventoryService
 * @description
 * # inventory/inventoryService
 * Service in the paxcomTerminalApp.
 */
angular.module('paxcomTerminalApp').service('inventoryService', function (configService, InventoryApi) {
	this.getProductDetailsByName = function(name) {
		
    };
    this.getProductDetailsById = function(id) {
		
    };
    this.getAllProducts = function() {
		return InventoryApi.query();
    };
	this.updateProduct = function(prod) {
		InventoryApi.update(prod);
    };
    this.getProductWithInventoryLessThan = function(n) {
		
    };
	this.getProductWithInventoryGreaterThan = function(n) {
		
    };
    this.getActiveChannelConfig = function() {
        var channelConfigs = angular.copy(marketPlaceChannelConfigs);
        var activeChannels = configService.getActiveChannels();
        var activeChannelsConfigs = [];

        channelConfigs.map(function (channelConfig) {
            var result = activeChannels.filter(function (channel) {
                return channelConfig.channelName == channel;
            });
            if (!$.isEmptyObject(result)) {
				channelConfig.marketplaceName = channelConfig.channelName;
                channelConfig.marketplaceID = angular.copy(channelConfig.channelName + "_channel_sku");
                channelConfig.marketplaceExists = angular.copy(channelConfig.channelName + "_exists");
                channelConfig.pageUrl = "views/sell-online/" + channelConfig.fullName.toLowerCase() + "-config.html";
                activeChannelsConfigs.push(channelConfig);
            }
        });
        return activeChannelsConfigs;
    };
});

angular.module('paxcomTerminalApp').provider('InventoryApi', function () {
    this.$get = ['$resource', function ($resource) {
        var api = $resource(configuration.url + '/product/:marketplaceID/:params', {marketplaceID:'@marketplaceID'}, {
			query : {
				method: 'GET',
				isArray: true
			},
			update: {
				method: 'POST'
			}
		});
        return api;
	}];
});