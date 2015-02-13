var logger = require('../../lib/logger');
var priceTransformer = require('./priceTransformer');


exports.transform = function(prod, cb){	
	priceTransformer.transformPrice(prod, cb);	
}

