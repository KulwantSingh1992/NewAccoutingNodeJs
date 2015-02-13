'use strict';

/**
 * @ngdoc function
 * @name paxcomTerminalApp.controller:DesktopCtrl
 * @description
 * # DesktopCtrl
 * Controller of the paxcomTerminalApp
 */
angular.module('paxcomTerminalApp').controller('DesktopCtrl', function ($scope, $http, desktopService, inventoryService, orderService, notificationService, configService) {
    //var localStorage = chrome.storage.local;
    $scope.orderList = {};
    $scope.orderPanel = {};
    $scope.orderFilterForm = {};
    $scope.productListForMapping = [];
    $scope.mappingForm = {};
    $scope.activeChannelsForProduct = [];
    $scope.orderForMapping = [];
    $scope.activeChannelsConfigs = inventoryService.getActiveChannelConfig();

    $scope.searchProductByNameForMapping = function (productName) {
        showLoader();
        $http.post('/product', {name: productName}).success(function (products) {
            $scope.productListForMapping = products.map(function(product) {
                $scope.orderForMapping.map(function(order) {
                    product[order.orders_channel_id + '_additional_info'] = JSON.parse(product[order.orders_channel_id + '_additional_info']);
                });
                return product;
            });
            hideLoader();
        });
    };
    
    $scope.openReverseProductMapModal = function (orders) {
        $scope.productListForMapping = [];
        $scope.mappingForm = {};
        var channelDetails = [];
        var channels = [];
        $scope.activeChannelsForProduct = [];
        orders.map(function (order) {
            var channel = order.orders_channel_id;
            if (channels.indexOf(channel) == -1) {
                channelDetails.push(order);
                channels.push(channel);
            }
        });
        $scope.orderForMapping = channelDetails;
        channels.map(function(channel) {
            $scope.activeChannelsForProduct.push(marketPlaceChannelConfigs.filter(function(ChannelConfig) {
                return ChannelConfig.channelName == channel;
            })[0]);
        });
    };

    $scope.updateProductsForMapping = function (channelName) {
        var product = angular.copy($scope.mappingForm.selectedProduct);
        if(!product.mrp) {
            product.mrp = $scope.mappingForm.newMrp;
        }
        $scope.orderForMapping.map(function(order) {
            if(channelName == order.orders_channel_id) {
                product[channelName + '_is_listed'] = 1;
                product[channelName + '_channel_sku'] = order.channel_sku;
                product[channelName + '_seller_sku'] = order.seller_sku;
            } else {
                delete product[order.orders_channel_id + '_channel_sku'];
                delete product[order.orders_channel_id + '_seller_sku'];
            }
            product[order.orders_channel_id + '_additional_info'] = JSON.stringify(product[order.orders_channel_id + '_additional_info']);
        });
        $http.post('/product/update', product).success(function () {
            getOrders();
        });
    };
    
	var tt = $('div.ex-tooltip');
	var leftOffset = -($('html').css('padding-left').replace('px', '') + $('body').css('margin-left').replace('px', ''));
	var topOffset = -32;
			
    init();
    function init(){
        //localStorage.get("widgetList", function(localWidgetList){
            //console.log($.isEmptyObject(localWidgetList));
            var widgetList;
            if(true/*$.isEmptyObject(localWidgetList)*/) {
                widgetList = [
                    { title: 'Order', drag: true,url:"order-widget.html" },
                    { title: 'Accounts', drag: true, url:"accounting-widget.html" },
                    { title: 'Line Chart', drag: true, url:"views/dashboard/charts/sale-chart-widget.html" },
                    { title: 'Bar Chart', drag: true, url:"views/dashboard/charts/cost-chart-widget.html" }
                ];
                //localStorage.set({"widgetList": widgetList});
            } else {
                //widgetList = localWidgetList.widgetList;
            }
            $scope.widgetList = widgetList;
        //});
    };

    $scope.dropCallback = function (event, ui) {
        //localStorage.remove('widgetList');
        //localStorage.set({"widgetList": $scope.widgetList});
    };
    
    $scope.onUpdate = function (order){
        console.log('Notification');
    }
			
    $scope.getOrders = function () {
        //notificationService.subscribe('order', $scope.onUpdate);
        $scope.main.dashboard='order';
        $scope.orderFilterForm.endDate = new Date().toLocaleDateString();
        $scope.orderFilterForm.startDate = "";
        $scope.orderFilterForm.arrangement = 'product';
        setOrderDeatilPanel();
        getOrders();
        //notificationService.update('order', 'dasds');
    };
    
	$scope.submitOrderFilterForm = function() {
        setOrderDeatilPanel();
        getOrders();
    };
    
    //set tag and heading
    function setOrderDeatilPanel() {
        if($scope.orderFilterForm.status==='SLA') {
            $scope.orderFilterForm.tag = 'sla';
            $scope.orderPanel.heading = 'SLA Breached Orders';
        }else if($scope.orderFilterForm.status==='PENDING') {
            $scope.orderFilterForm.tag = 'pending';
            $scope.orderPanel.heading = 'Total Pending Orders';
        }else if($scope.orderFilterForm.status==='DUE-TODAY') {
            $scope.orderFilterForm.tag = 'dueToday';
            $scope.orderPanel.heading = 'Due Today Orders';
        }else {
            $scope.orderFilterForm.tag = 'all';
            if($scope.orderFilterForm.status !== '0') {
                $scope.orderPanel.heading = camelCase($scope.orderFilterForm.status) + ' Order';
            }else {
                $scope.orderPanel.heading = 'Order';
            }
        }
    }
    
	function getOrders() {
        var params = $scope.orderFilterForm;
        console.log(params);
        $scope.orderList = [];
        orderService.getOrders(params).$promise.then(function (orders) {
            console.log(orders.length);
            var orderList;
            if($scope.orderFilterForm.arrangement === 'product') {
                orderList = orderService.groupOrdersByProduct(orders);
            }else if($scope.orderFilterForm.arrangement === 'order') {
                orderList = orders;
            }
            /*if(!$scope.orderFilterForm.channel || $scope.orderFilterForm.channel == '0') {
                var channelOptions = []
                $scope.orderFilterForm.channelOptions = [];
                orderList.map(function(order) {
                    if($scope.orderFilterForm.arrangement === 'product') {
                        order = order[0]
                    }
                    var channel=order.orders_channel_id.toLowerCase();
                    if(channelOptions.indexOf(channel) == -1) {
                        channelOptions.push(channel);
                    }
                });
                channelOptions.map(function(channel) {
                    $scope.orderFilterForm.channelOptions.push(marketPlaceChannelNames[channel]);
                });
            }*/
            console.log(orderList);
            $scope.orderList = orderList;
        });
    }
	
	$scope.getInventory = function(){
		$scope.main.dashboard='inv';
	}
	
});
