var db = require('../db-config').db;
var logger = require('../../lib/logger');

var cancelledCountQuery = "select COUNT(*) as cancelledCount from ORDERS where ORDERS_STATUS_ID = ?";

var pendingCountQuery = "select COUNT(*) as pendingCount from ORDERS where ORDERS_STATUS_ID NOT IN (?,?,?)";

var todaysOrderQuery = "select COUNT(*) as todaysOrder from ORDERS where orders_last_updated_timestamp >= ? and ORDERS_STATUS_ID IN (?,?)";

var dueTodayQuery = "SELECT COUNT(*) as dueToday FROM ORDERS INNER JOIN ORDER_ITEM ON ORDERS.ORDERS_ID = ORDER_ITEM.order_item_ORDER_ID WHERE ORDERS.ORDERS_STATUS_ID IN (?,?) AND ORDER_ITEM.order_item_ESTIMATED_SHIP_DATE BETWEEN ? AND ?";

var slaCountQuery = "SELECT COUNT(*) as slaCount FROM ORDERS INNER JOIN ORDER_ITEM ON ORDERS.ORDERS_ID = ORDER_ITEM.order_item_ORDER_ID WHERE ORDERS.ORDERS_STATUS_ID IN (?,?) AND ORDER_ITEM.order_item_ESTIMATED_SHIP_DATE < ?";

exports.getDashboardOrderData = function(cb) {
    var data = [];
    var midnightDate = new Date().setHours(0, 0, 0, 0);
    db.get(cancelledCountQuery, ['CANCELLED'], getPendingCount);

    function getPendingCount(err, rows) {
        data.push({
            cancelled: rows.cancelledCount
        });
        db.get(pendingCountQuery, ['CANCELLED', 'SHIPPED', 'DELIVERED'], getTodaysOrder);
    }

    function getTodaysOrder(err, rows) {
        data.push({
            pending: rows.pendingCount
        });
        db.get(todaysOrderQuery, [midnightDate, 'NEW', 'UNSHIPPED'], getDueToday);
    }

    function getDueToday(err, rows) {
        data.push({
            ordersToday: rows.todaysOrder
        });
        db.get(dueTodayQuery, ['NEW', 'UNSHIPPED', midnightDate, Date.now()], getSlaCount);
    }

    function getSlaCount(err, rows) {
        data.push({
            dueToday: rows.dueToday
        });
        db.get(slaCountQuery, ['NEW', 'UNSHIPPED', midnightDate], pushSlaData);
    }

    function pushSlaData(err, rows) {
        data.push({
            sla: rows.slaCount
        });
        cb(data);
    }
}