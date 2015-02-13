var db = require('../db-config').db;
var logger = require('../../lib/logger');



exports.createProductPriceData = function(prod, cb, err){
	var insertQuery = "INSERT OR REPLACE INTO product_price_calculation_data (product_price_channel_id , product_price_shipping_charges , product_price_profit, product_price_commission, product_price_channel_name ) VALUES (?,?,?,?,?)";
	/*var values = [];
	logger.debug(JSON.stringify(prod));
	values[0] = prod.productChannelId;
	values[1] = prod.shippingCharges;
	values[2] = prod.profitPrice;
	values[3] = prod.productCommision;
	values[4] = prod.channelName;*/
	
	db.run(insertQuery, prod , function(er){
		if(er != null){
			err("Error occured while trying to insert values in producr_price_channel_id " +er);
            cb(false);
		}else{
			logger.debug("succssfully added");
			cb(true);
		}
	});	
}

exports.updateProductPriceData = function(prod, cb, err){
	
	var productPriceChannelId =prod.productChannelId; 
	var productPriceChannelName = prod.channelName;
	var updateQuery = "UPDATE product_price_calculation_data SET product_price_channel_id = ? ,product_price_shipping_charges = ?, product_price_profit = ?, product_price_commission =? WHERE product_price_channel_id = '"+productPriceChannelId+"' and product_price_channel_name = '"+productPriceChannelName+"' ";
	
	logger.debug("starting update condition, query "+updateQuery);	
	
	var values = [];
	logger.debug(JSON.stringify(prod));
	values[0] = prod.productChannelId;
	values[1] = prod.shippingCharges;
	values[2] = prod.profitPrice;
	values[3] = prod.productCommision;
	values[4] = prod.channelName;
	logger.debug(values);
		db.run(updateQuery, values , function(er){
			if(er != null){
				err("Error occured while trying to update values  " +er);
                cb(false);
			}else{
				logger.debug("succssfully added");
				cb(true);
			}
		});	
}

exports.getProductPriceData = function(cb, err){
	var selectQuery = "SELECT * FROM product_price_calculation_data ";
    logger.debug('Search Query ' + selectQuery);
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
}

exports.deleteProductPriceData = function(prod,cb, err){ 
	var productChannelId = prod.channel_id;
	var deleteQuery = "DELETE FROM product_price_calculation_data WHERE product_price_channel_id = ? and  product_price_channel_name = ?";
	var values = [];
	for(var key in values){
		values.pusht(values[key]);
	}
	
	db.run(deleteQuery, values, function(er){
		if(err){
			err("An error occured while trying to delte from product_price_calculation_data "+ er);
		}else{
			cb("Row successfully delted ");
		}
	});
}


exports.exists = function(condition, flag){
	
	logger.debug("exists function started"+ condition );
	db.get("SELECT * from product_price_calculation_data WHERE product_price_channel_id = ? and product_price_channel_name = ?  ",condition, function(er, row){
		if(!er){
			if(row){
				logger.debug("exists condition result");
				logger.debug(row);
				flag(false);
			}else{
				logger.error("Nothing found in exist");
				flag(true);
			}
		}else{
			logger.error("error occured"+ er);
			flag(true);
		}
	});
}

exports.getProductPriceCalculationDataByChannel = function(channelSku, channelName, cb){
    //
	db.get("SELECT * from product_price_calculation_data WHERE product_price_channel_id = ? and product_price_channel_name = ?  ",[channelSku, channelName], function(er, row){
		if(!er){
			if(row){
                logger.debug(row);
				cb(row);
			}else{
				cb(false);
			}
		}else{
			cb(flase);
		}
	});
};
