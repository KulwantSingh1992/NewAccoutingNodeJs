var db = require('../db/db-config').db;
var logger = require('../lib/logger');

exports.topSellingProducts = function (startDate, endDate, limit, cb, err) {
    if (!startDate) {
        startDate = Date.now();
    }

    if (!endDate) {
        endDate = Date.now();
    }
    var selectQuery = "select product.name as order_item,sum(order_item.quantity) as total_quantity,product.available_quantity, product.last_sold_at from order_item inner join product on order_item.product_id = product.id where order_item.status in ('NEW', 'SHIPPED', 'IN-PROGRESS') AND order_item.order_item_date BETWEEN " + startDate + " AND " + endDate + " group by order_item.product_id order by total_quantity desc limit " + limit;
    logger.debug('Top Selling Product Query ' + selectQuery);
    executeAnalyticsQuery(selectQuery, cb, err);
}

exports.notSoldProducts = function (startDate, endDate, limit, cb, err) {

    if (!startDate) {
        startDate = Date.now();
    }

    if (!endDate) {
        endDate = Date.now();
    }

    var selectQuery = "Select product.name from product where product.id NOT IN (select order_item.product_id from order_item where order_item.status in ('IN-PROGRESS','NEW','SHIPPED') AND order_item.order_item_date BETWEEN " + startDate + " AND " + endDate + ") group by product.name  limit 5";
    logger.debug('Not Sold Product ' + selectQuery);
    executeAnalyticsQuery(selectQuery, cb, err);
};

exports.mostCancelledProducts = function (startDate, endDate, limit, cb, err) {

    if (!startDate) {
        startDate = Date.now();
    }

    if (!endDate) {
        endDate = Date.now();
    }

    var selectQuery = "select product.name as order_item , count(order_item.name) as total_quantity from order_item inner join product on order_item.product_id = product.id  where order_item.status = 'CANCELLED' AND order_item.order_item_date BETWEEN " + startDate + " AND " + endDate + " group by product.name order by total_quantity desc limit  " + limit;
    logger.debug('Most Cancelled Product Query ' + selectQuery);
    executeAnalyticsQuery(selectQuery, cb, err);
};

exports.getSalesData = function (startDate, endDate, cb, err) {

    if (!startDate) {
        startDate = Date.now();
    }

    if (!endDate) {
        endDate = Date.now();
    }

    var selectQuery = "Select strftime('%Y-%m-%d', orders.order_date / 1000, 'unixepoch') as orderdate, orders.channel_id,  SUM(orders.grand_total) AS total, count(*) as num_order from orders where orders.status_id in ('IN-PROGRESS', 'SHIPPED', 'NEW') AND orders.order_date BETWEEN " + startDate + " AND " + endDate + " GROUP BY orderdate, orders.channel_id";
    logger.debug('Get Sales Data Query ' + selectQuery);

    executeAnalyticsQuery(selectQuery, cb, err);
};

exports.getSalesAndRevenueData = function (startDate, endDate, cb, err) {
    if (!startDate) {
        startDate = Date.now();
    }

    if (!endDate) {
        endDate = Date.now();
    }
    var selectQuery = "Select strftime('%Y-%m-%d', orders.order_date / 1000, 'unixepoch') as orderdate, SUM(orders.grand_total) AS Revenue,SUM(order_item.unit_price*order_item.quantity) as Cost from orders INNER JOIN  order_item ON orders.id = order_item.order_id where orders.status_id in ('IN-PROGRESS', 'SHIPPED', 'NEW') AND orders.order_date BETWEEN  " + startDate + " AND " + endDate + " GROUP BY orderdate";

    logger.debug('Get Sales and Revenue Data ' + selectQuery);
    executeAnalyticsQuery(selectQuery, cb, err);
};




var executeAnalyticsQuery = function (query, cb, err) {
    db.all(query, function (dbErr, rows) {
        if (dbErr) {
            err(dbErr);
        } else {
            var data = [];
            rows.forEach(function (row) {    
                data.push(row);
            });
            cb(data);
        }
    });
}