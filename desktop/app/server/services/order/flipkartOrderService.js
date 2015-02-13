var flipkart = require('../../lib/flipkart/flipkart');
var flipkartOrders = require('../../lib/flipkart/flipkartOrders');
var db = require('../../db/db-config').db;
var orderDAO = require('../../db/order/orderDAO');
var productDAO = require('../../db/product/productDAO');
var commonDAO = require('../../db/common/commonDAO');
var util = require('../util/util');
var logger = require('../../lib/logger');
var orderService = require('./orderService');

var channel = 'FK';
var service = 'orders';

exports.getOrders = function (cb, err) {
    util.getChannelConfig(channel, service, function (credentials, lastSync) {
        if (credentials.SellerID) {
            if (!lastSync) {
                lastSync = 1417066000;
            }
            try {
                flipkart.flipkartClient('54.175.140.196', credentials.SellerID);
                var listOrders = flipkartOrders.calls.ListOrders();
                postData = 'token=' + credentials.token + '&startDate=' + lastSync + '&endDate=' + Date.now();
                flipkart.flipkartRequest(listOrders, function (result) {
                    flipkartRequestCallback(result, cb);
                }, postData);
            } catch (e) {
                logger.error(e);
            }
        } else {
            logger.error('FK SellerID not found!');
        }
    });
};

var flipkartRequestCallback = function (result, cb) {
    result = JSON.parse(result);
    if (result.length) {
        for (var i in result) {
            var data = result[i];
            var order = {
                orders_external_id: data.orderId,
                orders_channel_id: channel,
                orders_order_date: data.orderDate,
                orders_status_id: util.flipkartOrderStatusEnum[data.status], //todo
                orders_external_status_id: data.statusLabel, //todo
                orders_grand_total: data.totalPrice,
                orders_created_timestamp: Date.now(),
                orders_last_updated_timestamp: data.lastUpdated
            };
            orderService.orderCreator(order, data, channel, function (data, orderId, action) {
                var items = [];
                items.push({
                    order_item_order_id: orderId,
                    order_item_id: data.orderItemId,
                    order_item_external_id: data.orderId,
                    order_item_status_id: util.flipkartOrderStatusEnum[data.status],
                    order_item_external_status_id: data.statusLabel,
                    order_item_order_date: data.orderDate,
                    order_item_channel_id: channel,
                    order_item_grand_total: data.totalPrice,
                    order_item_quantity: data.quantity,
                    order_item_unit_price: data.listPrice,
                    order_item_product_id: data.sellerSKU,
                    order_item_external_product_id: data.channelSKU,
                    order_item_name: data.productName,
                    order_item_estimated_ship_date: data.slaDate,
                    order_item_estimated_delivery_date: '',
                    order_item_created_timestamp: Date.now(),
                    order_item_last_updated_timestamp: data.lastUpdated
                });
                orderService.orderItemCreator(items, action);
            }, null);

            /*var lastUpdateDateForSync = Date.now();
        order.push(items);*/
            //cb(order, channel, service, lastUpdateDateForSync, util.updateSync);
        }
    } else {
        logger.info("No Orders Found for FK!");
    }
};