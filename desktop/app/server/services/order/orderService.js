var orderDB = require('../../db/order/orderDAO');
var orderItemDB = require('../../db/order/orderItemDAO');
var commonDB = require('../../db/common/commonDAO');
var flipkartOrderService = require('./flipkartOrderService');
var amazonOrderService = require('./amazonOrderService');
var productService = require('../product/productService');
var util = require('../util/util');
var logger = require('../../lib/logger');

var getOrders = exports.getOrders = function (source, filters, cb, err) {
    switch (source) {
    case 'DB':
        orderDB.getOrders(filters, cb, err);
        break;
    case 'FK':
        flipkartOrderService.getOrders(cb, err);
        break;
    case 'AMAZON':
        amazonOrderService.getOrders(cb, err);
        break;
    case 'PTM':
        orderDB.getOrders(filters, cb, err);
        break;
    }

};

exports.updateOrderItemsProductData = function (productId, productName, productCostPrice, channelSku, cb, err) {
    orderItemDB.updateOrderItemsProductData(productId, productName, productCostPrice, channelSku, cb, err);
}

exports.orderCreator = function (order, data, channel, cb, err) {
    orderDB.createOrUpdateOrder(order, channel, function (id, action) {
        util.updateSync(order.orders_channel_id, 'orders', order.orders_last_updated_timestamp);
        cb(data, id, action);
    }, err);
};

exports.orderItemCreator = function (orderItem, action, cb) {
    for (var i in orderItem) {
        productService.getProductByChannelId(orderItem[i].order_item_channel_id, orderItem[i].order_item_external_product_id, function (data) {
            orderItem[i].product_id = data[0].orderItemProductId;
            orderItem[i].product_name = data[0].orderItemChannelProductName;
            orderItem[i].product_cost_price = data[0].orderItemProductCostPrice;
            if (action == 'create') {
                orderItemDB.createOrderItem(orderItem[i], function (channelId, qty, productId) {
                    productService.updateInventory(channelId, qty, productId);
                });
            } else {
                orderItemDB.updateOrderItem(orderItem[i]);
            }
        });
    }
};

exports.getOrderItems = function (filters, cb, err) {
    orderDB.getOrderItems(filters, cb, err);
};


exports.getCount = function (filters, cb, err) {
    orderDB.getCount(filters, cb, err);

};

exports.getDashboardOrderData = function (cb) {
    orderDB.getDashboardOrderData(cb);
};

/*
exports.getChannelConfig = function (channel, service, cb) {
    commonDB.getChannelConfig(channel, service, cb);
};
*/

exports.createOrUpdateOrder = function (orderItem, channel, service, lastUpdateDateForSync, cb) {
    orderDB.createOrUpdateOrder(orderItem, channel, service, lastUpdateDateForSync, cb);
};

/*var groupOrdersByProduct = function (orders) {
    return _.sortBy(_.groupBy(orders, function (order) {
        console.log('order' + JSON.stringify(order));
        return order.order_item_product_id;
    }), 'length').reverse();
}

var groupOrdersByOrderItems = function (orders) {
    var output = _.groupBy(orders, function (order) {
        return order.orders_id;
    });
    return output;
}



Get all orders (date ranged)
- Get order by status (New - Rececived today, Open, Cancelled, Shipped) 
- Get order status
- Get order by shipping due (o)
- Get out of stock order*/

/*
create same structure for 2 more services -
    inventory - 
        inventoryservice
            methods - 
                getProductDetailsByName(name);
                getProductDetailsById (id);
                getAllProducts();
                getProductWithInventoryLessThan (n)
                getProductWithInventoryGreaterThan (n)
            - tallyinventoryservice
            - paxcominventoryservice
            - localdbinventoryservice

    accounting -
        accountingservice
            methods -
                getProfitandLossDetails()
            - tallyaccountingservice
            - paxcomaccountingservice

In order service, please add localOrderService and tallyOrderService
Also, add other methods in orderservice mentioned earlier + gettotalorder(starttime, endtime)

Create configuration object for the application and create a variable in that with app_version


*/