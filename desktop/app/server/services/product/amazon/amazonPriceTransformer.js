exports.transformPrice = function (product, err) {
	/*var minPrice = product.min_price;*/
	if (product.AMAZON_channel_sku) {
		return getBasePrice(product);
	} else {
		err('ASIN value not found');
	}
}

function getBasePrice(product) {
	var minnimumProfit = ((product.cost_price * product.AMAZONPriceprofit) / 100);
	var commision = (((product.min_price + minnimumProfit) * 3)) / 100;

	return product.min_price + minnimumProfit + commision;
}