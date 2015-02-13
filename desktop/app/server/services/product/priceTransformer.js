var amazonPriceTransformer = require('./amazon/amazonPriceTransformer');
var fkPriceTransformer = require('./flipkart/fkPriceTransformer');
var logger = require('../../lib/logger');


exports.transformPrice = function (product, cb) {

	// for channels available - 
	var prices = {};

	//logger.debug("in inventory transformer "+ minPrice);

	if (product) {
		var amazonPrice = amazonPriceTransformer.transformPrice(product, function (result) {
			/*if (er) {
				err(er);
			}*/
            prices['AMAZON'] = amazonPrice;
		});
		
	}
	if (product) {
		var fkPrice = fkPriceTransformer.transformPrice(product, cb);
                                                        //function (result) {
			/*if (er) {
				err(er);
			}*/
            /*prices['FK'] = fkPrice;
            cb(prices);
		});*/
		
	}
	//return prices;
	//cb(prices); //callback the product array
}