var snapdeal = require('../../lib/snapdeal/snapdeal');
var snapdealOrders = require('../../lib/snapdeal/snapdealOrders');
//var db = require('../../db/db-config').db;
//var orderDAO = require('../../db/order/orderDAO');
//var productDAO = require('../../db/product/productDAO');
//var commonDAO = require('../../db/common/commonDAO');
var util = require('../util/util');
var logger = require('../../lib/logger');
var orderService = require('./orderService');

var channel = 'SD';
var service = 'orders';

exports.getOrdersSD = function (cb) {
    snapdeal.snapdealClient('54.175.140.196', "test123");
    var listOrders = snapdealOrders.calls.ListOrders();
    postData = 'sellerId=test123';
    snapdeal.snapdealRequest(listOrders, snapdealRequestCallback, cb, postData);
};

var snapdealRequestCallback = function (result, cb) {
    //console.log("result is " + result);
    //logger.debug(result);
    result = JSON.parse(result);
    console.log("result = "+result);
    for (var i in result) {
        var data = result[i];
        console.log("enter in napdeal request call back func for loop and data is "+data);
        var order = {
            orders_external_id: result[i].orderCode,
            orders_channel_id: channel,
            orders_order_date: result[i].orderCreatedDate,
            orders_status_id: "NEW", //temp confrm from rishi
            orders_external_status_id: result[i].status,
            orders_grand_total: "10000",
            orders_created_timestamp: Date.now(),
            orders_last_updated_timestamp: Date.now() // from rishi
            }
        orderService.orderCreator(order, data, channel, function (data, orderId, action){
            var items = [];
             items.push({
            order_item_id: result[i].itemId,
            order_item_external_id: result[i].orderCode,
            order_item_status_id: "111", // temp confrm from rishi,
            order_item_external_status_id: result[i].status,
            order_item_order_date: result[i].orderCreatedDate,
            order_item_channel_id: channel,
            order_item_grand_total: "10000",// temp
            order_item_quantity: "1000",//temp
            order_item_unit_price: "1000", //temp
            order_item_product_id: result[i].skuCode,
            order_item_external_product_id: "111", //temp
            order_item_name: result[i].productName,
            order_item_estimated_ship_date: Date.now(), // temp
            order_item_estimated_delivery_date: '',
            order_item_created_timestamp: Date.now(),
            order_item_last_updated_timestamp: Date.now()//temp
        });
            logger.debug(items);
           orderService.orderItemCreator(items, action);
            
        },null);
    }
};