'use strict';

/**
 * @ngdoc service
 * @name paxcomTerminalApp.orderService
 * @description
 * # orderService
 * Service in the paxcomTerminalApp.
 */

angular.module('paxcomTerminalApp').service('orderService', function (OrderItemApi, OrderApi, OrderDasktopApi) {
    this.getOrders = function (params) {
        var api;
        if(params.arrangement === 'product') {
            api = new OrderItemApi();
        }else {
            api = new OrderApi();
        }
        var tag = params.tag
        if (tag && tag != 'all')
            api.tag = tag;

        var channel = params.channel;
        if (channel && channel != '0')
            api.channels = '"' + channel + '"';

        var status = params.status;
        if (status && status != '0' && status != 'PENDING' && status != 'DUE-TODAY' && status != 'SLA')
            api.status = '"' + status + '"';

        var startDate = params.startDate;
        var endDate = params.endDate;
        if (startDate)
            api.createdDateRange = new Date(startDate).getTime() + ',' + eval(new Date(endDate).getTime() + 86399999);
        
        if(params.arrangement === 'product') {
            return OrderItemApi.save(api);
        } else if(params.arrangement === 'order') {
            return OrderApi.save(api);
        }
    };

    this.getOrdersCountForDesktop = function () {
        return OrderDasktopApi.query();
    };

    this.groupOrdersByProduct = function (orders) {
        var ordersForUnmappedProduct = orders.filter(function (order) {
            return !order.product_id;
        });
        var ordersForMappedProduct = orders.filter(function (order) {
            return !!order.product_id;
        });
        
        return _.sortBy(_.groupBy(ordersForUnmappedProduct, function (order) {
            return order.name;
        }), 'length').reverse().concat(_.sortBy(_.groupBy(ordersForMappedProduct, function (order) {
            return order.product_id;
        }), 'length').reverse());
    }

    this.groupOrdersByOrderItems = function (orders) {
        return _.sortBy(_.groupBy(orders, function (order) {
            return order.orders_external_id;
        }), 'length').reverse();
    }
});

angular.module('paxcomTerminalApp').provider('OrderItemApi', function () {
    this.$get = ['$resource',
        function ($resource) {
            var api = $resource(configuration.url + '/orderitem/:params', {}, {
                save: {
                    method: 'POST',
                    isArray: true
                }
            });
            return api;
    }];
});

angular.module('paxcomTerminalApp').provider('OrderApi', function () {
    this.$get = ['$resource',
        function ($resource) {
            var api = $resource(configuration.url + '/order/:params', {}, {
                save: {
                    method: 'POST',
                    isArray: true
                }
            });
            return api;
    }];
});

angular.module('paxcomTerminalApp').provider('OrderDasktopApi', function () {
    this.$get = ['$resource',
        function ($resource) {
            var api = $resource(configuration.url + '/order/dashboard/detail/:item', {}, {
                update: {
                    method: 'PUT'
                }
            });
            return api;
    }];
});