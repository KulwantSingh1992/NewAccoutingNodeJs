var db = require('../db-config').db;
var logger = require('../../lib/logger');
var productService = require('../../services/product/productService');
var _ = require('underscore');
var matchingProductQuery = "SELECT * FROM product WHERE name LIKE ?";
var getProductsByCategoryQuery = 'SELECT * FROM product where category = ?';
var util = require('../../services/util/util');


/*
exports.topSellingProducts = function (startDate, endDate, limit, cb, err) {
    var selectQuery = "select product.name,sum(order_item.quantity) as total_quantity,product.available_quantity, product.last_sold_at from order_item inner join product on order_item.product_id = product.id where order_item.status in ('NEW', 'SHIPPED', 'IN-PROGRESS') AND order_item.order_item_date BETWEEN " + startDate + " AND " + endDate + " group by order_item.product_id order by total_quantity desc limit " + limit;
    logger.debug('Top Selling Product ' + selectQuery);
    db.all(selectQuery, function (dbErr, rows) {
        if (dbErr) {
            err(dbErr);
        } else {
            var data = [];
            rows.forEach(function (row) {
                var item = {};
                item.order_item = row.name;
                item.total_quantity = row.total_quantity;
                data.push(item);
            });
            cb(data);
        }
    });
};
*/


/*
exports.notSoldProducts = function (startDate, endDate, limit, cb, err) {
    if (!startDate) {
        startDate = Date.now();
    }

    if (!endDate) {
        endDate = Date.now();
    }


    var selectQuery = "Select product.name from product where product.id NOT IN (select order_item.product_id from order_item where order_item.status in ('IN-PROGRESS','NEW','SHIPPED') AND order_item.order_item_date BETWEEN " + startDate + " AND " + endDate + ") group by product.name  limit 5";
    logger.debug('Not Sold Product ' + selectQuery);
    db.all(selectQuery, function (dbErr, rows) {
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
};

*/

/*
exports.mostCancelledProducts = function (startDate, endDate, limit, cb, err) {
    var selectQuery = "select product.name , count(order_item.name) as cancelled from order_item inner join product on order_item.product_id = product.id  where order_item.status = 'CANCELLED' AND order_item.order_item_date BETWEEN " + startDate + " AND " + endDate + " group by product.name order by cancelled desc limit  " + limit;
    logger.debug('Most Cancelled Product ' + selectQuery);
    db.all(selectQuery, function (dbErr, rows) {
        if (dbErr) {
            err(dbErr);
        } else {
            var data = [];
            rows.forEach(function (row) {
                var item = {};
                item.order_item = row.name;
                item.total_quantity = row.cancelled;
                data.push(item);
            });
            cb(data);
        }
    });
};
*/

/*
exports.getSalesData = function (startDate, endDate, cb, err) {
    var selectQuery = "Select strftime('%Y-%m-%d', orders.order_date / 1000, 'unixepoch') as orderdate, orders.channel_id,  SUM(orders.grand_total) AS total, count(*) as num_order from orders where orders.status_id in ('IN-PROGRESS', 'SHIPPED', 'NEW') AND orders.order_date BETWEEN " + startDate + " AND " + endDate + " GROUP BY orderdate, orders.channel_id";
    logger.debug('Get Sales Data ' + selectQuery);
    db.all(selectQuery, function (dbErr, rows) {
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
};
*/

/*
exports.getSalesAndRevenueData = function (startDate, endDate, cb, err) {
    var selectQuery = "Select strftime('%Y-%m-%d', orders.order_date / 1000, 'unixepoch') as orderdate, SUM(orders.grand_total) AS Revenue,SUM(order_item.unit_price*order_item.quantity) as Cost from orders INNER JOIN  order_item ON orders.id = order_item.order_id where orders.status_id in ('IN-PROGRESS', 'SHIPPED', 'NEW') AND orders.order_date BETWEEN  " + startDate + " AND " + endDate + " GROUP BY orderdate";

    logger.debug('Get Sales and Revenue Data ' + selectQuery);
    db.all(selectQuery, function (dbErr, rows) {
        if (dbErr) {
            err(dbErr);
        } else {
            var data = [];
            rows.forEach(function (row) {
                data.push(row);
            });
            logger.debug(data);
            cb(data);
        }
    });
};
*/

exports.getTallyCredentials = function (cb) {
    db.get('Select setting_details from setting_conf where setting_channel = "TALLY"', [], function (err, rows) {
        if (rows) {
            cb(JSON.parse(rows.setting_details));
        } else {
            cb({});
        }
    });
};

exports.createOrUpdateProduct = function (sourceIdColumn, sourceIdValue, prod, cb, err, txnId) {
    getProductBySourceId(sourceIdColumn, sourceIdValue, function (result) {
        if (result) {
            prod.id = result.id;
            updateProduct(prod, cb, err, txnId);
        } else {
            createProduct(prod, cb, err, txnId);

        }
    }, function (dbErr) {
        logger.error('Unable to get existing product with ' + sourceIdColumn + ' with value ' + sourceIdValue + ' error ' + dbErr);
    });
};

var exists = exports.exists = function (column_name, id, cb, err) {
    var selectQuery = "select count(*) as cnt from product WHERE " + column_name + "='" + id + "'";
    db.get(selectQuery, function (err, row) {
        if (row.cnt > 0) {
            cb(true);
        } else {
            cb(false);
        }
    });
};


var getProductBySourceId = exports.getProductBySourceId = function (column_name, id, cb, err) {
    var selectQuery = "select * from product WHERE " + column_name + "=" + id;
    logger.debug('Loading product by source id ' + selectQuery);
    db.get(selectQuery, function (dbErr, row) {
        if (dbErr) {
            if (err) {
                err(dbErr);
            }
        }
        logger.debug(row);
        if (row) {
            if (cb) {
                cb(row);
            }
        } else {
            cb(null);
        }
    });
};

/*

var replaceUndefinedWithNull = function (value) {
    if (value == undefined) {
        return '';
    }
    return value;
}
*/

var createProduct = exports.createProduct = function (prod, cb, err, txn) {
    logger.debug('Creating product ' + JSON.stringify(prod));
    db.beginTransaction(function (err, transaction) {
        var query = "INSERT INTO product ( ";
        var values = " VALUES ( ";
        for (var prop in prod) {
            if (prod[prop]) {
                query = query + prop + " , ";
                values = values + " '" + prod[prop] + "', ";
            }
        }
        query = query.substring(0, query.length - 2) + " ) " + values.substring(0, values.length - 2) + " ) ";
        transaction.exec(query);
        transaction.commit(function (dbErr) {
            if (dbErr) {
                logger.error('Error creating product ' + JSON.stringify(dbErr));
                if (txn) {
                    util.transactionPlaceHolder[txn].txnStatus = 'failed';
                    util.transactionPlaceHolder[txn].txnMsg = 'failed:' + dbErr;
                }
                if (err) {
                    err(dbErr);
                }
                transaction.rollback();
            }
            if (txn) {
                if (txn) {
                    util.transactionPlaceHolder[txn].txnStatus = 'completed';
                    util.transactionPlaceHolder[txn].txnMsg = 'completed';
                }
            }
            cb(prod);
        });
    });
};
var updateProduct = exports.updateProduct = function (prod, cb, err, txn) {
    delete prod.extra;
    logger.info('Updating product ' + JSON.stringify(prod.name));
    db.beginTransaction(function (err, transaction) {
        var query = "UPDATE product SET ";
        for (var prop in prod) {
            if (prod[prop]) {
                //if(prop!='sellingPrice' && prop!='mrp' && prop!='skuId' && prop!='fsn') {
                var value = prod[prop];
                value = typeof value == 'string' ? value : JSON.stringify(value);
                query = query + prop + " = '" + value + "' , ";
                //}
            }
        }
        query = query.substring(0, query.length - 2) + " WHERE id = " + prod.id;
        transaction.exec(query, function (err) {
            if (err) {
                /*Error: SQLITE_CONSTRAINT: UNIQUE constraint failed: product.AMAZON_seller_sku*/
                logger.debug(err);
                console.log(err);
                if (err.code == 'SQLITE_CONSTRAINT') {
                    cb(false);
                }
            }
            transaction.commit(function (dbErr) {
                if (dbErr) {
                    if (txn) {
                        util.transactionPlaceHolder[txn].txnStatus = 'failed';
                        util.transactionPlaceHolder[txn].txnMsg = 'failed: ' + dbErr;
                    }
                    logger.error('Error updating product ' + JSON.stringify(dbErr));
                    transaction.rollback();
                    if (err) {
                        err(dbErr);
                    }
                    return;
                }
                if (txn) {
                    util.transactionPlaceHolder[txn].txnStatus = 'completed';
                    util.transactionPlaceHolder[txn].txnMsg = 'completed';
                }
                logger.info('Completed Updating product ' + JSON.stringify(prod.name));
                cb(prod);
            });
        });

    });
};

exports.deleteProduct = function (prodid, cb, err) {
    var deleteQuery = "DELETE FROM product WHERE id='" + prodid + "'";
    db.all(deleteQuery, function (err, rows) {
        var products = [];
        if (rows) {
            rows.forEach(function (row) {
                products.push(row);
            });
            cb(products);
        }
    });
};





exports.getProductById = function (id, cb, err) {
    var getProductByIdQuery = "SELECT * FROM product WHERE products_id = ?";
    db.all(getProductByIdQuery, [id], function (err, rows) {
        var data = [];
        if (rows) {
            rows.forEach(function (row) {
                data.push(row);
            });
            cb(data);
        }
    });
};

exports.getProductLikeName = function (name, cb, err) {
    name = name.replace(/'/g, "''");
    name = name.replace(/"/g, '""');
    db.all(matchingProductQuery, ['%' + name + '%'], function (er, rows) {
        if (er) {
            err(er);
        } else {
            var data = [];
            if (rows) {
                rows.forEach(function (row) {
                    data.push(row);
                });
                cb(data);
            }
        }
    });
};

exports.getProductsByCategory = function (category, cb, err) {
    db.all(getProductsByCategoryQuery, [category], function (err, rows) {
        var data = [];
        if (rows) {
            rows.forEach(function (row) {
                data.push(row);
            });
            cb(data);
        }
    });
};

/*exports.fetchData = function (sku, cb, err) {
    db.get('select mrp, selling_price, qty, max_dispatch_time, status, product_title, return_in_days from paytm_product_catalog where seller_old_sku = ?', [sku], function (err, rows) {
        if (rows) {
            var data = {
                "data": [{
                    "sku": rows.sku,
                    "mrp": rows.mrp,
                    "price": rows.selling_price,
                    "max_dispatch_time": rows.max_dispatch_time,
                    "qty": rows.qty,
                    "status": rows.status,
                    "name": rows.product_title,
                    "return_in_days": rows.return_in_days
                }]
            };
            cb(data);
        }
    });
};*/

exports.getProductByChannelId = function (channelName, productId, cb, err) {
    var getProductByChanneIdQuery = "select id,name, cost_price from product where " + channelName + "_channel_sku = ?";
    logger.debug(getProductByChanneIdQuery);
    logger.debug(productId);
    db.get(getProductByChanneIdQuery, [productId], function (err, rows) {
        var data = [];
        var orderItemProductId = '';
        var orderItemChannelProductName = '';
        var orderItemProductCostPrice = '';
        if (rows) {
            data.push({
                orderItemProductId: rows.id,
                orderItemChannelProductName: rows.name,
                orderItemProductCostPrice: rows.cost_price
            });
        } else {
            data.push({
                orderItemProductId: orderItemProductId,
                orderItemChannelProductName: orderItemChannelProductName,
                orderItemProductCostPrice: orderItemProductCostPrice
            });
        }
        logger.debug(JSON.stringify(data));
        cb(data);
    });
}

exports.updateInventory = function (channelName, orderItemQuantity, orderItemProductId) {
    /*  var colName ;
    if(channelName == 'FK'){
        colName = 'flipkart';
    }else if(channelName == 'PTM'){
        colName = 'paytm';
    }else if(channelName == 'AMAZON'){
        colName = 'amazon';
    }*/
    var updateInventoryQuery = "update product set " + channelName + "_available_quantity =  (" + channelName + "_available_quantity - ?) where id = ?";
    db.run(updateInventoryQuery, [orderItemQuantity, orderItemProductId]);

}

/*exports.getProductsByFilter = function(filter, cb, err){
	logger.debug("Get product started, trying to get products from db based on filter : "+filter); 
	var productQuery = prepareProductQuery(filter);
	//cb(selectQuery);
    db.all(productQuery, function (err, rows) {
        var data = [];
        if (rows) {
            rows.forEach(function (row) {
                data.push(row);
            });
            cb(data);
        }else{
			cb("Invalid Query");
		}
    });
	logger.debug("getProductd fnished.");
}*/

/*//called by getProduct function to prepare dynamic quiery
var prepareProductQuery =  function(filter){
	logger.debug(filter + "<-- filter recieved"); 
	var channelList = ["FK","AMAZON"];
	var select_clause = "SELECT * FROM product ";
	var where_clause = "";
	var condition ="";
	var AND= " AND " ;
	var OR = " OR ";
	var colSuf = "_channel_sku" ;
	var query ="";
	
	if(filter =="all"){
		query = select_clause;
	}
	else if(filter == "mapped"){
		condition = " IS NOT NULL ";
		query = select_clause+" WHERE "+channelList[0]+colSuf+condition;
		for(var i = 1; i< channelList.length; i++){
			channel = channelList[i];			
			where_clause += " OR "+channel+colSuf+condition; 	
			}
			query += where_clause; //final query for mapped products
		}
	else if(filter == "unmapped"){
		condition = " IS NULL ";
		query = select_clause+" WHERE "+channelList[0]+colSuf+condition;
		for(var i = 1; i< channelList.length; i++){
			channel = channelList[i];			
			where_clause += " OR "+channel+colSuf+condition; 	
			}
		query += where_clause; //final query for unmapped products
	}
	else if(filter == "listed"){
		condition = " = 1 ";
		colSuf = "_is_listed ";
		query = select_clause+" WHERE "+channelList[0]+"_is_listed = 1 " ;
		for(var i = 1; i< channelList.length; i++){
			channel = channelList[i];			
			where_clause += " OR "+channel+colSuf+condition; 	
			}
		query += where_clause;
	}
	else if(filter == "unlisted"){
		condition = " = 0 ";
		colSuf = "_is_listed ";
		query = select_clause+" WHERE "+channelList[0]+"_is_listed = 0 " ;
		for(var i = 1; i< channelList.length; i++){
			channel = channelList[i];			
			where_clause += " OR "+channel+colSuf+condition; 	
			}
		query += where_clause;
	}
	logger.debug(query);
	return query;
}*/


function getChannelFilter(filters, cb) {
    var found = false;
    logger.debug('Filters ' + filters + ' length ' + filters.length);
    if (filters && filters.length > 0) {

        for (var i = 0; i < filters.length; i++) {
            if (filters[i].name == 'channels') {
                logger.debug(filters[i].value);
                found = true;
                cb(filters[i].value.split(","));
            }
        }
    }
    if (!found) {
        getChannelList(cb);
    }
}

//code to 
function getChannelList(cb) {
    var selectChannelQuery = "SELECT setting_conf.setting_channel from setting_conf where setting_conf.setting_channel != 'TALLY' and setting_conf.is_active = 1"
    db.all(selectChannelQuery, function (err, rows) {
        var data = [];
        if (rows) {
            rows.forEach(function (row) {
                data.push(row.setting_channel.trim());
            });
            logger.debug('Active Channel List ' + data);
            cb(data);
        }
    });
};


function prepareWhereCondition(filters, cb) {
    var inputchannel = [];
    //    var channels = ['amazon', 'fk']; // get active channel list
    var status = 'listed';
    var condition = "";
    var AND = ' AND ';
    getChannelFilter(filters, function (inputchannel) {
        logger.debug('Filters ' + JSON.stringify(filters));
        for (var i = 0; i < filters.length; i++) {
            var filter = filters[i];
            logger.debug('Filter ' + JSON.stringify(filter) + inputchannel);
            if (filter.name == 'status' && filter.value == 'listed') {
                if (condition.length > 0) {
                    condition += AND;
                }
                //logger.debug(inputchannel, JSON.stringify(inputchannel), typeof inputchannel);
                var cond = '';
                for (var j = 0; j < inputchannel.length; j++) {
                    cond += ' product.' + inputchannel[j] + '_is_listed = 1 OR ';
                }
                if (cond.length > 0) {
                    cond = cond.substring(0, cond.length - 3);
                    logger.debug(cond);
                    condition += '(' + cond + ')';
                    logger.debug(condition);
                }
            }

            if (filter.name == 'status' && filter.value == 'unlisted') {
                if (condition.length > 0) {
                    condition += AND;
                }
                var cond = '';
                for (var j = 0; j < inputchannel.length; j++) {
                    cond += ' product.' + inputchannel[j] + '_is_listed = 0 OR ';
                }
                if (cond.length > 0) {
                    cond = cond.substring(0, cond.length - 3);
                    condition += '(' + cond + ')';
                }

            }

            if (filter.name == 'status' && filter.value == 'mapped') {
                if (condition.length > 0) {
                    condition += AND;
                }
                var cond = '';
                for (var j = 0; j < inputchannel.length; j++) {
                    cond += ' product.' + inputchannel[j] + '_channel_sku IS NOT NULL OR ';
                }
                if (cond.length > 0) {
                    cond = cond.substring(0, cond.length - 3);
                    condition += '(' + cond + ')';
                }

            }

            if (filter.name == 'status' && filter.value == 'unmapped') {
                if (condition.length > 0) {
                    condition += AND;
                }
                var cond = '';
                for (var j = 0; j < inputchannel.length; j++) {
                    cond = ' product.' + inputchannel[j] + '_channel_sku IS NULL OR ';
                }
                if (cond.length > 0) {
                    cond = cond.substring(0, cond.length - 3);
                    condition += "(" + cond + ")"
                }


            }

            if (filter.name == 'name') {
                if (condition.length > 0) {
                    condition += AND;
                }
                var name = filter.value.replace(/'/g, "''");
                name = filter.value.replace(/"/g, '""');
                condition += "product.name LIKE '%" + name + "%'";
            }

        }
        logger.debug('Returning where condition ' + condition);

        if (condition.length > 0) {
            cb(" where " + condition);
        } else {
            cb(condition);
        }
    });

};

exports.getProducts = function (filters, cb, err) {
    prepareWhereCondition(filters, function (wherecondition) {
        var selectQuery = "select * from product " + wherecondition;
        logger.debug('Product Search Query ' + selectQuery);
        db.all(selectQuery, function (dbErr, rows) {
            if (dbErr) {
                err(dbErr);
            } else {
                var data = [];
                if (rows) {
                    rows.forEach(function (row) {
                        data.push(row);
                    });
                    cb(data);
                }
            }
        });
    });
};

exports.updateListingStatus = function (id, channel, cb) {
    var updateListingStatusQuery = "update product set " + channel + "_is_listed = 1 where id = ?";
    console.log(updateListingStatusQuery);
    db.run(updateListingStatusQuery, [id], function (err) {
        if (!err)
            cb();
    });
};



/*
exports.createOrUpdateCatalog = function (product, channel, service, lastUpdateValForSync, cb) {
    checkExists(product[0].channel_product_id, function (exist) {
        if (exist) {
            updateCatalog(product, channel, service, lastUpdateValForSync, cb);
        } else {
            createCatalog(product, channel, service, lastUpdateValForSync, cb);
        }
    }, null);
}

var checkExists = function (channelProductId, cb, err) {
    db.get('SELECT * FROM paytm_product_catalog where channel_product_id = ?', [channelProductId], insertCheck);

    function insertCheck(err, rows) {
        console.log(err);
        var exist = 0;
        if (rows) {
            exist = 1;
        }
        console.log(exist);
        cb(exist);
    }
};


var updateCatalog = exports.updateCatalog = function (product, channel, service, lastUpdateDateForSync, cb) {
    db.beginTransaction(function (err, transaction) {
        db.run('update paytm_product_catalog set product_title = ?, paytm_sku = ?, seller_old_sku = ?, mrp = ?, selling_price = ?, status = ?, last_updated_time = ?, merchant_id = ?, is_in_stock = ?, return_in_days = ?, max_dispatch_time = ?, brand = ? where channel_product_id =?', [product[0].product_title, product[0].paytm_sku, product[0].seller_old_sku, product[0].mrp, product[0].selling_price, product[0].status, product[0].last_updated_time, product[0].merchant_id, product[0].is_in_stock, product[0].return_in_days, product[0].max_dispatch_time, product[0].brand, product[0].channel_product_id]);

        transaction.commit(function (err) {
            if (err) {
                console.error(err);
                transaction.rollback();
            }
            cb(channel, service, lastUpdateDateForSync);
        });
    });
};

var createCatalog = exports.createCatalog = function (product, channel, service, lastUpdateDateForSync, cb) {
    console.log('insert');
    db.beginTransaction(function (err, transaction) {
        db.run('insert or replace into paytm_product_catalog (channel_product_id, product_title, paytm_sku, seller_old_sku, mrp, selling_price, status, last_updated_time, merchant_id, is_in_stock, return_in_days, max_dispatch_time, brand) values (?,?,?,?,?,?,?,?,?,?,?,?,?)', [product[0].channel_product_id, product[0].product_title, product[0].paytm_sku, product[0].seller_old_sku, product[0].mrp, product[0].selling_price, product[0].status, product[0].last_updated_time, product[0].merchant_id, product[0].is_in_stock, product[0].return_in_days, product[0].max_dispatch_time, product[0].brand]);

        transaction.commit(function (err) {
            if (err) {
                console.error(err);
                transaction.rollback();
            }
            cb(channel, service, lastUpdateDateForSync);
        });
    });
};
*/