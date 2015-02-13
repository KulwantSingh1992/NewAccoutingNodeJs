var db = require('../db-config').db;
var logger = require('../../lib/logger');

var insertOrderItemQuery = "INSERT OR REPLACE INTO order_item(id, order_id,external_id, status, grand_total, quantity, unit_price, seller_sku,channel_sku, name, estimated_ship_date, estimated_delivery_date, created_timestamp, last_updated_timestamp, product_id, product_name, product_cost_price, channel_id, order_item_date, external_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

var updateItemQuery = "UPDATE order_item set status = ?, grand_total = ?, quantity = ?, unit_price = ?, seller_sku = ?, channel_sku = ?, name = ?, estimated_ship_date = ?, estimated_delivery_date = ?, last_updated_timestamp = ? , channel_id = ?, order_item_date = ?, external_status = ? where id = ?";

var updateOrderItemsQuery = "Update order_item set product_id = ?, product_name = ?, product_cost_price = ? where channel_sku=?";



// need to refactor this 
exports.updateOrderItemsProductData = function (productId, productName, productCostPrice, channelSku, cb, err) {

    db.run(updateOrderItemsQuery, [productId, productName, productCostPrice, channelSku], function (dbErr, rows) {

        if (dbErr) {
            if (err) {
                err(dbErr);
            }
        } else {
            cb(rows);
        }
    });
};



var updateOrderItem = exports.updateOrderItem = function (orderItem) {
    db.run(updateItemQuery, [orderItem.order_item_status_id, orderItem.order_item_grand_total, orderItem.order_item_quantity, orderItem.order_item_unit_price, orderItem.order_item_product_id, orderItem.order_item_external_product_id, orderItem.order_item_name, new Date(orderItem.order_item_estimated_ship_date).getTime(), new Date(orderItem.order_item_estimated_delivery_date).getTime(), new Date(orderItem.order_item_last_updated_timestamp).getTime(), orderItem.order_item_channel_id, orderItem.order_item_order_date, orderItem.order_item_external_status_id, orderItem.order_item_id], function (dbErr) {
        if (dbErr) {
            logger.error(dbErr);
        }
    });
};


var createOrderItem = exports.createOrderItem = function (orderItem, cb) {
    logger.debug(orderItem);
    logger.info("createOrderItem Started!!");
    db.run(insertOrderItemQuery, [orderItem.order_item_id,
                                 orderItem.order_item_order_id, orderItem.order_item_external_id,
                                 orderItem.order_item_status_id,
                                 orderItem.order_item_grand_total,
                                 orderItem.order_item_quantity,
                                 orderItem.order_item_unit_price,
                                 orderItem.order_item_product_id,
                                 orderItem.order_item_external_product_id,
                                 orderItem.order_item_name,
                                 new Date(orderItem.order_item_estimated_ship_date).getTime(),
                                 new Date(orderItem.order_item_estimated_delivery_date).getTime(),
                                 new Date().getTime(),
                                 new Date(orderItem.order_item_last_updated_timestamp).getTime(),
                                 orderItem.product_id,
                                 orderItem.product_name,
                                 orderItem.product_cost_price,
                                 orderItem.order_item_channel_id,
                                 orderItem.order_item_order_date,
                                 orderItem.order_item_external_status_id], function (dbErr) {
        if (dbErr) {
            logger.error(dbErr);
        }
        var qty = orderItem.order_item_quantity;
        if (orderItem.order_item_status_id == 'CANCELLED') {
            qty = qty * -1;
        }
        if (orderItem.product_id) cb(orderItem.order_item_channel_id, qty, orderItem.product_id);
    });
};