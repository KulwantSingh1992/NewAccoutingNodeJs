var productPriceCalculationDAO = require('../../db/product/productPriceCalulationDAO');
var logger = require('../../lib/logger.js');

/*exports.createProductPriceData = function(prod, cb, err){
	productPriceCalculationDAO.createProductPriceData(prod,function(result){
		cb(result);
	},function(er){
		err(er);
	});
}*/

function createProductPriceData(prod, cb, err) {
    productPriceCalculationDAO.createProductPriceData(prod, function (result) {
        cb(result);
    }, function (er) {
        err(er);
    });
}

/*exports.updateProductPriceData = function(prod, cb, err){
	productPriceCalculationDAO.updateProductPriceData(prod,function(result){
		cb(result);
	},function(er){
		err(er);
	});
}*/

function updateProductPriceData(prod, cb, err) {

    logger.debug("data to be updated" + JSON.stringify(prod));
    productPriceCalculationDAO.updateProductPriceData(prod, function (result) {
        cb(result);
    }, function (er) {
        err(er);
    });
}

/*
{
    id: 2,
    TALLY_id: 2340,
    name: 'Double Bedsheet Armada 1+2 (Devil) Multicolour',
    category: 'Richenza',
    mrp: 850,
    cost_price: 792,
    available_quantity: 5,
    sku: 'ddd',
    min_price: 792,
    max_price: null,
    FK_channel_sku: 'ddd',
    FK_seller_sku: 'ddd',
    FK_available_quantity: null,
    FK_listed_price: null,
    FK_additional_info: {
        listing_status: '',
        local_shipping_charge: '',
        national_shipping_charge: '',
        procurement_sla: '',
        zonal_shipping_charge: '',
        price_error_check: 'enable'
    },
    AMAZON_channel_sku: null,
    AMAZON_seller_sku: null,
    AMAZON_available_quantity: null,
    AMAZON_listed_price: null,
    AMAZON_additional_info: '{"leadtime_to_ship":""}',
    PTM_channel_sku: null,
    PTM_seller_sku: null,
    PTM_available_quantity: null,
    PTM_listed_price: null,
    PTM_additional_info: '{}',
    pending_orders_AMAZON: null,
    pending_orders_FK: null,
    pending_orders_PTM: null,
    total_sold_quantity: null,
    sold_last_week: null,
    last_sold_at: null,
    FK_is_listed: 0,
    AMAZON_is_listed: 0
}

    prod.productChannelId;
	values[1] = prod.shippingCharges;
	values[2] = prod.profitPrice;
	values[3] = prod.productCommision;
	values[4] = prod.channelName;

*/


exports.createOrUpdateProductPriceData = function (prod, cb, err) {
    logger.debug("create or update started in productPricedata");
    var condition = [];
    var productPriceData = [];
    if (prod.AMAZON_channel_sku) {
        
    }
    if (prod.FK_channel_sku) {
        condition.push(prod.FK_channel_sku);
        condition.push('FK');
        //check if data exist for productChannelId and channelName
        var flag;
        productPriceData.push(prod.FK_channel_sku);
        productPriceData.push(prod.FKShippingCharges);
        productPriceData.push(prod.FKPriceProfit);
        productPriceData.push(prod.FKPriceCommission);
        productPriceData.push('FK');
        exists(condition, function (result) {
            logger.debug("Exist result " + result);
            flag = result;
            if (flag) {
                logger.debug("Insert initiated");
                createProductPriceData(productPriceData, function (result) {
                    cb(result, prod);
                }, function (dbEr) {
                    err(dbEr);
                });
            } else {
                logger.debug("Update initiated");
                updateProductPriceData(productPriceData, function (result) {
                    cb(result, prod);
                }, function (dbEr) {
                    err(dbEr);
                });
            }
        }); //exist ends 
    }

}



exports.getProductPriceCalculationDataByChannel = function (channelSku, channelName, cb) {
    productPriceCalculationDAO.getProductPriceCalculationDataByChannel(channelSku, channelName, cb);
};

function exists(condition, cb) {
    productPriceCalculationDAO.exists(condition, function (flag) {
        cb(flag); //flag is false if data found else flag is true
    });
}