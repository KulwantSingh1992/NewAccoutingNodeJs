var db = require('../db-config').db;
var logger = require('../../lib/logger');
var productService = require('../../services/product/productService');

var _ = require('underscore');

var selectQuery = "select orders.id as orders_id, order_item.id as order_item_id, orders.external_id as orders_external_id, order_item.external_id as order_item_external_id, orders.channel_id as orders_channel_id, order_item.channel_id as order_item_channel_id, orders.order_date as orders_order_date, order_item.order_item_date, orders.status_id as orders_status_id, order_item.status as order_item_status, orders.external_status_id as orders_external_status_id, order_item.external_status as order_item_external_status, order_item.order_id as order_item_order_id, orders.grand_total as orders_grand_total, order_item.id as order_item_grand_total, orders.created_timestamp as orders_created_timestamp, order_item.created_timestamp as order_item_created_timestamp, orders.last_updated_timestamp as orders_last_updated_timestamp, order_item.last_updated_timestamp as order_item_last_updated_timestamp, order_item.quantity, order_item.unit_price, order_item.seller_sku, order_item.channel_sku, order_item.name, order_item.estimated_ship_date, order_item.estimated_delivery_date, order_item.product_id, order_item.product_name, order_item.product_cost_price from orders INNER JOIN order_item ON orders.ID=order_item.order_id";

var selectCountQuery = "select count(*) as cnt, channel_id as channel from orders ";

var insertOrderQuery = "INSERT OR REPLACE INTO orders(external_id, channel_id, order_date, status_id, external_status_id, grand_total, created_timestamp, last_updated_timestamp) VALUES (?,?,?,?,?,?,?,?)";

var insertOrderStatusQuery = "INSERT OR REPLACE INTO order_status (order_id, last_updated_timestamp, old_status, old_external_status, extra) VALUES (?,?,?,?,?)";

var updateOrderQuery = "UPDATE orders set order_date = ?, status_id = ?, external_status_id = ?, grand_total = ?, last_updated_timestamp = ? where external_id = ?";

var cancelledCountQuery = "select COUNT(*) as cancelledCount, orders.channel_id as channel from ORDERS where STATUS_ID = ? group by orders.channel_id";

var pendingCountQuery = "select COUNT(*) as pendingCount, orders.channel_id as channel from ORDERS where STATUS_ID NOT IN (?,?,?) group by orders.channel_id";

var todaysOrderQuery = "select COUNT(*) as todaysOrder, orders.channel_id as channel from ORDERS where last_updated_timestamp >= ? and STATUS_ID IN (?,?) group by orders.channel_id";

var dueTodayQuery = "SELECT COUNT(*) as dueToday, orders.channel_id as channel FROM ORDERS INNER JOIN ORDER_ITEM ON ORDERS.ID = ORDER_ITEM.ORDER_ID WHERE ORDERS.STATUS_ID IN (?,?) AND ORDER_ITEM.ESTIMATED_SHIP_DATE BETWEEN ? AND ? group by orders.channel_id";

var slaCountQuery = "SELECT COUNT(*) as slaCount, orders.channel_id as channel FROM ORDERS INNER JOIN ORDER_ITEM ON ORDERS.ID = ORDER_ITEM.ORDER_ID WHERE ORDERS.STATUS_ID IN (?,?) AND ORDER_ITEM.ESTIMATED_SHIP_DATE < ? group by orders.channel_id";

exports.getDashboardOrderData = function (cb) {
    logger.info('Get Dashboard Order Data Started');
    var data = [];
    var midnightDate = new Date().setHours(0, 0, 0, 0);
    db.all(cancelledCountQuery, ['CANCELLED'], getPendingCount);

    function getPendingCount(err, rows) {
        var merger = {};
        if (rows) {
            rows.forEach(function (row) {
                merger[row.channel] = row.cancelledCount;
            });
            data.push({
                cancelled: merger
            });
            db.all(pendingCountQuery, ['CANCELLED', 'SHIPPED', 'DELIVERED'], getTodaysOrder);
        }
    }

    function getTodaysOrder(err, rows) {
        var merger = {};
        rows.forEach(function (row) {
            merger[row.channel] = row.pendingCount;
        });
        data.push({
            pending: merger
        });
        db.all(todaysOrderQuery, [midnightDate, 'NEW', 'IN-PROGRESS'], getDueToday);
    }

    function getDueToday(err, rows) {
        var merger = {};
        rows.forEach(function (row) {
            merger[row.channel] = row.todaysOrder;
        });
        data.push({
            ordersToday: merger
        });
        db.all(dueTodayQuery, ['NEW', 'IN-PROGRESS', midnightDate, Date.now()], getSlaCount);
    }

    function getSlaCount(err, rows) {
        var merger = {};
        rows.forEach(function (row) {
            merger[row.channel] = row.dueToday;
        });
        data.push({
            dueToday: merger
        });
        db.all(slaCountQuery, ['NEW', 'IN-PROGRESS', midnightDate], pushSlaData);
    }

    function pushSlaData(err, rows) {
        var merger = {};
        rows.forEach(function (row) {
            merger[row.channel] = row.slaCount;
        });
        data.push({
            sla: merger
        });
        logger.info('Get Dashboard Order Data Completed');
        cb(data);
    }
}

exports.getOrders = function (filters, cb, err) {
    var wherecondition = prepareWhereCondition(filters);
    db.all(selectQuery + wherecondition, function (err, rows) {
        var data = [];
        var orders = [];
        var orderIds = {};
        rows.forEach(function (row) {
            var order = {};

            if (row.orders_id in orderIds) {
                order = orderIds[row.orders_id];
            } else {
                order.orders_id = row.orders_id;
                order.orders_external_id = row.orders_external_id;
                order.orders_channel_id = row.orders_channel_id;
                order.orders_order_date = row.order_date;
                order.orders_status_id = row.orders_status_id;
                order.orders_external_status_id = row.orders_external_status_id;
                order.orders_grand_total = row.orders_grand_total;
                order.orders_created_timestamp = row.orders_created_timestamp;
                order.orders_last_updated_timestamp = row.orders_last_updated_timestamp;
                orderIds[row.id] = order;
                order['items'] = [];
                orders.push(order);
            }
            var item = {};
            orderIds[row.orders_id] = order;
            item.order_item_id = row.order_item_id;
            item.order_item_order_id = row.order_item_order_id;
            item.order_item_external_id = row.order_item_external_id;
            item.order_item_status = row.order_item_status;
            item.order_item_channel_id = row.order_item_channel_id;
            item.order_item_date = row.order_item_date;
            item.order_item_external_status = row.order_item_external_status;
            item.order_item_grand_total = row.order_item_grand_total;
            item.order_item_quantity = row.quantity;
            item.order_item_unit_price = row.unit_price;
            item.order_item_product_id = row.seller_sku;
            item.order_item_name = row.name;
            item.order_item_estimated_ship_date = row.estimated_ship_date;
            item.order_item_estimated_delivery_date = row.estimated_delivery_date;
            item.order_item_created_timestamp = row.order_item_created_timestamp;
            item.order_item_last_updated_timestamp = row.order_item_last_updated_timestamp;
            item.product_id = row.product_id;
            item.product_name = row.product_name;
            item.product_cost_price = row.product_cost_price;
            order['items'].push(item);
        });
        cb(orders);
    });

};

exports.getOrderItems = function (filters, cb, err) {

    var wherecondition = prepareWhereCondition(filters);
    //logger.debug(wherecondition);
    db.all(selectQuery + wherecondition, function (err, rows) {
        var orders = [];
        rows.forEach(function (row) {
            orders.push(row);
        });
        /*
        var output = _.sortBy(_.groupBy(orders, function (order) {
            //console.log('order' + JSON.stringify(order));
            return order.order_item_product_id;
        }), 'length').reverse();
*/
        cb(orders);
    });

};


exports.getCount = function (filters, cb, err) {
    var whereCondition = prepareWhereCondition(filters);
    db.all(selectCountQuery + whereCondition + ' group by channel_id', function (err, rows) {
        var data = {};
        var count = 0;
        rows.forEach(function (row) {
            data[row.channel] = row.cnt;
            count += row.cnt;
        });
        data['COUNT'] = count;
        cb(data);
    });

};

var exists = exports.exists = function (orderID, channel, cb, err, transaction) {
    db.get('SELECT * FROM orders  where orders.external_id = ? AND orders.channel_id = ?', [orderID, channel], insertCheck);
    function insertCheck(err, rows) {
        var exist = null;
        if (rows) {
            exist = rows;
        }
        cb(exist);
    }
};

exports.createOrUpdateOrder = function (order, channel, cb, err) {
    exists(order.orders_external_id, channel, function (exist) {
        if (exist) {
            updateOrder(order, exist, channel, cb, err);
        } else {
            createOrder(order, channel, cb, err);
        }
    }, null);
}


var updateOrder = exports.updateOrder = function (order, rows, channel, cb, err) {
    logger.info("Update Order Started for " + channel);
    insertOrderStatus(rows, function () {
        db.run(updateOrderQuery, [new Date(order.orders_order_date).getTime(), order.orders_status_id, order.orders_external_status_id, order.orders_grand_total, new Date(order.orders_last_updated_timestamp).getTime(), order.orders_external_id], function (dbErr) {
            if (dbErr) {
                logger.error(dbErr);
            }
            logger.info("Update Order Completed for " + channel);
            cb(rows.id, 'update');
        });
    });
};

var insertOrderStatus = function (rows, cb) {
    db.run(insertOrderStatusQuery, [rows.id, rows.last_updated_timestamp, rows.status_id, rows.external_status_id, ''], cb);
}

var createOrder = exports.createOrder = function (order, channel, cb, err) {
    logger.info("createOrder Order Started for " + channel);
    db.run(insertOrderQuery, [order.orders_external_id, order.orders_channel_id, new Date(order.orders_order_date).getTime(), order.orders_status_id, order.orders_external_status_id, order.orders_grand_total, new Date().getTime(), new Date(order.orders_last_updated_timestamp).getTime()], function (dbErr) {
        if (dbErr) {
            logger.error(dbErr);
        }
        logger.info("createOrder Order Completed for " + channel + " with last insertID " + this.lastID);
        cb(this.lastID, 'create');
    });
}

function prepareWhereCondition(filters) {
    var condition = "";
    var AND = ' AND ';
    var midnightDate = new Date().setHours(0, 0, 0, 0);
    for (var i = 0; i < filters.length; i++) {
        var filter = filters[i];
        if (filter.name == 'channels') {
            if (condition.length > 0) {
                condition += AND;
            }
            condition += ' orders.channel_id in (' + filter.value + ') ';
        }
        if (filter.name == 'status') {
            if (condition.length > 0) {
                condition += AND;
            }
            condition += ' status_id in (' + filter.value + ') ';
        }
        if (filter.name == 'createdDateRange') {
            if (condition.length > 0) {
                condition += AND;
            }
            var dateRange = filter.value.split(",");
            if (!dateRange[1]) {
                dateRange[1] = Date.now();
            }
            condition += ' order_date between ' + dateRange[0] + ' AND ' + dateRange[1];
        }
        if (filter.name == 'updatedDateRange') {
            if (condition.length > 0) {
                condition += AND;
            }
            var dateRange = filter.value.split(",");
            if (!dateRange[1]) {
                dateRange[1] = Date.now();
            }
            condition += ' last_updated_timestamp between ' + dateRange[0] + ' AND ' + dateRange[1];
        }
        if (filter.name == 'shipDateRange') {
            if (condition.length > 0) {
                condition += AND;
            }
            var dateRange = filter.value.split(",");
            if (!dateRange[1]) {
                dateRange[1] = Date.now();
            }
            condition += ' estimated_ship_date between ' + dateRange[0] + ' AND ' + dateRange[1];
        }
        if (filter.name == 'local') {
            if (condition.length > 0) {
                condition += AND;
            }
            condition += ' orders.id = ' + filter.value;
        }
        if (filter.name == 'external') {
            if (condition.length > 0) {
                condition += AND;
            }
            condition += ' orders.external_id = ' + filter.value;
        }
        if (filter.name == 'tag') {
            if (condition.length > 0) {
                condition += AND;
            }
            switch (filter.value) {
            case "sla":
                condition += " STATUS_ID IN ('NEW', 'IN-PROGRESS') AND ESTIMATED_SHIP_DATE < " + midnightDate;
                break;
            case "cancelled":
                condition += " STATUS_ID = 'CANCELLED' ";
                break;
            case "pending":
                condition += " STATUS_ID NOT IN ('CANCELLED', 'SHIPPED', 'DELIVERED') ";
                break;
            case "dueToday":
                condition += " STATUS_ID IN ('NEW', 'IN-PROGRESS') AND ESTIMATED_SHIP_DATE BETWEEN " + midnightDate + " AND " + Date.now();
                break;
            case "ordersToday":
                condition += " orders.last_updated_timestamp >= " + midnightDate + " and STATUS_ID IN ('NEW', 'IN-PROGRESS') ";
                break;
            }
        }

    }
    if (condition.length > 0) {
        return " where " + condition;
    }
    return condition;
}