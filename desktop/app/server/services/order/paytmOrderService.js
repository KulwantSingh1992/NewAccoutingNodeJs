var paytm = require('../../paytm/paytm');
var paytmOrders = require('../../paytm/paytmOrders');
var db = require('../../db/db-config').db;
var orderDAO = require('../../db/order/orderDAO');
var productDAO = require('../../db/product/productDAO');
var commonDAO = require('../../db/common/commonDAO');
var util = require('../util/util');
var logger = require('../../lib/logger');
var orderService = require('./orderService');

var channel = 'PTM';
var service = 'orders';

exports.startGetOrders = function (cb) {  
    console.log("invoked");
    commonDAO.getChannelConfig(channel, service, function(credentials, extra, lastSync){
        console.log(credentials , extra);
        if(credentials.merchantId && extra.token) {
            if(!lastSync){
                lastSync = 1417066000;
            }
            try{
                getOrders(credentials.merchantId, extra.token, lastSync, cb);
            }catch(e){
                logger.error(e);
            }
        }
    });
};

var getOrders = function (merchantId, token, createdAfter, cb) {
    /*paytm.paytmClient('21492', '745f103e-f9a4-4caa-9943-a8829335bace');*/
        paytm.paytmClient(merchantId, token);
        var listOrders = paytmOrders.calls.ListOrders();
        listOrders.params.placed_after.value = createdAfter;
        /*listOrders.params.CreatedAfter.value = createdAfter;*/
        paytm.paytmRequest(listOrders, paytmRequestCallback, null, null, cb);
    };

    var paytmRequestCallback = function (result, cb) {
        result = JSON.parse(result);
        for(var i in result){
            var order = [];
            var items = [];
            order.push([{
                orders_external_id : result[i].id,
                orders_channel_id : channel,
                orders_order_date : new Date(result[i].created_at).getTime(),
                orders_status_id : util.paytmOrderStatusEnum[result[i].status], //todo
                orders_external_status_id : util.paytmOrderExternalStatusEnum[result[i].status],
                orders_grand_total : result[i].selling_price, //confirm
                orders_created_timestamp : Date.now(),
                orders_last_updated_timestamp : new Date(result[i].created_at).getTime() //todo
            }]);
            for(var j in result[i].items){
                items.push({
                    order_item_id : result[i].items[j].id,
                    order_item_external_id : result[i].items[j].order_id,
                    order_item_status_id : util.paytmOrderStatusEnum[result[i].items[j].status],
                    order_item_grand_total : parseFloat(result[i].items[j].price) * parseInt(result[i].items[j].qty_ordered), //todo
                    order_item_quantity : result[i].items[j].qty_ordered,
                    order_item_unit_price : result[i].items[j].price, //todo
                    
                   /* order_item_external_status_id : util.paytmOrderExternalStatusEnum[result[i].items[j].status],
                    order_item_order_date : result[i].orderDate,
                    order_item_channel_id : channel,*/
                    
                    order_item_product_id : result[i].items[j].product_id,
                    order_item_external_product_id : result[i].items[j].sku,
                    order_item_name : result[i].items[j].name,
                    order_item_estimated_ship_date : new Date(result[i].items[j].ship_by_date).getTime(),
                    order_item_estimated_delivery_date : '',
                    order_item_created_timestamp : Date.now(),
                    order_item_last_updated_timestamp : new Date(result[i].items[j].updated_at).getTime()
                });
            }
            var lastUpdateDateForSync = Date.now();
            order.push(items);
            console.log(order);
            //return({order: order, channel: channel, service: service, lastUpdateDateForSync: lastUpdateDateForSync});
            cb(order, channel, service, lastUpdateDateForSync, util.updateSync);
        }
    };