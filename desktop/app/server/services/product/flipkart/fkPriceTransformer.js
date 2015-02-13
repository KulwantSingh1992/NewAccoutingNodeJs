var productPriceCalculationService = require('../productPriceCalculationService');
exports.transformPrice = function (product, cb) {
	//var minPrice = product.min_price;
	if (product.FK_channel_sku) {
		getBasePrice(product, cb);
	} else {
		err('FSN Value not fund');
	}
};

function getBasePrice(product, cb) {
    productPriceCalculationService.getProductPriceCalculationDataByChannel(product.FK_channel_sku, 'FK', function(calaculationData){
        var minnimumProfit = ((product.cost_price * calaculationData.product_price_profit) / 100);
        var commision = (((product.min_price + minnimumProfit) * calaculationData.product_price_commission)) / 100;
        cb(product.min_price + minnimumProfit + commision);
    });
	
}