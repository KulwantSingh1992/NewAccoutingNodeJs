var express = require("express"),
	path = require("path");
var app = express();
var nodeExcel = require('excel-export');

app.configure(function () {
	app.set('port', process.env.PORT || 3000);
	//app.use(express.bodyParser()),
	app.use(express.static(path.join(__dirname, 'client')));
});

app.configure('development', function () {
	app.use(express.errorHandler());
});

var amazonOrderService = require('./server/services/order/amazonOrderService');
var analyticsEngine = require('./server/analytics/analyticsengine');
var flipkartOrderService = require('./server/services/order/flipkartOrderService');
var flipkartProductService = require('./server/services/product/flipkartProductService');
var orderService = require('./server/services/order/orderService');
var paytmOrderService = require('./server/services/order/paytmOrderService');
var paytmProductService = require('./server/services/product/paytmProductService');
var productService = require('./server/services/product/productService');
var amazonProductService = require('./server/services/product/amazonProductService');
var productPriceCalculationService = require('./server/services/product/productPriceCalculationService');
var inventoryTransformer = require('./server/services/product/inventoryTransformer');
var dashboardService = require('./server/services/dashboardService');
var accountService = require('./server/services/account/accountService');
var validateTally = require('./server/services/account/tallyAccountService');
var bkg = require('./server/processes/dashboardBackgroundProcess');
var logger = require('./server/lib/logger');
var util = require('./server/services/util/util');
var configService = require('./server/services/config/configService');
//var updater = require('./server/updater');
var feedbackService = require('./server/services/sendFeedback');

var logger_debug_old = logger.debug;
logger.debug = function (msg) {
	var fileAndLine = traceCaller(1);
	return logger_debug_old.call(this, fileAndLine + " : " + msg);
}

var logger_info_old = logger.info;
logger.info = function (msg) {
	var fileAndLine = traceCaller(1);
	return logger_info_old.call(this, fileAndLine + " : " + msg);
}

var logger_error_old = logger.error;
logger.error = function (msg) {
	var fileAndLine = traceCaller(1);
	return logger_error_old.call(this, fileAndLine + " : " + msg);
}

/**
 * examines the call stack and returns a string indicating
 * the file and line number of the n'th previous ancestor call.
 * this works in chrome, and should work in nodejs as well.
 *
 * @param n : int (default: n=1) - the number of calls to trace up the
 *   stack from the current call.  `n=0` gives you your current file/line.
 *  `n=1` gives the file/line that called you.
 */
function traceCaller(n) {
	if (isNaN(n) || n < 0) n = 1;
	n += 1;
	var s = (new Error()).stack,
		a = s.indexOf('\n', 5);
	while (n--) {
		a = s.indexOf('\n', a + 1);
		if (a < 0) {
			a = s.lastIndexOf('\n', s.length);
			break;
		}
	}
	b = s.indexOf('\n', a + 1);
	if (b < 0) b = s.length;
	a = Math.max(s.lastIndexOf(' ', b), s.lastIndexOf('/', b));
	b = s.lastIndexOf(':', b);
	s = s.substring(a + 1, b);
	return s;
}

process.on('uncaughtException', function (err) {
	logger.debug(err);
	if (err.stack) {
		logger.debug(err.stack);
	}
});

app.get('/initializeAmazon', function (req, res) {
	amazonOrderService.startGetOrders();
	orderService.getDashboardOrderData(dashboardService.updateDashboardOrderData);
});



app.get('/order/local/:id', function (req, res) {
	logger.debug('Loading order by local id [ ' + req.params.id + ']');
	orderService.getOrders('DB', util.prepareOrderFilter({
		local: req.params.id
	}), function (orders) {
		logger.debug('Order [' + req.params.id + '] loaded successfully');
		res.send(orders);
	}, function (err) {
		logger.error('Error loading order [' + req.params.id + ']' + err);
		res.send({
			error: 'Error loading order ' + req.params.id
		});
	});
});


app.get('/order/external/:id', function (req, res) {
	logger.debug('Loading order by external id [' + req.params.id + ']');
	orderService.getOrders('DB', util.prepareOrderFilter({
		external: req.params.id
	}), function (orders) {
		logger.debug('Order [' + req.params.id + '] loaded successfully');
		res.send(orders);
	}, function (err) {
		logger.error('Error loading order [' + req.params.id + ']' + err);
		res.send({
			error: 'Error loading order ' + req.params.id
		});
	});
});

app.post('/orderitem', function (req, res) {
	logger.debug('Loading orderitems ' + req.body);
	orderService.getOrderItems(util.prepareOrderFilter(req.body), function (orderitems) {
		logger.debug('Orderitems loaded. Total order items are ' + orderitems.length);
		res.send(orderitems);
	}, function (err) {
		logger.error('Error loading orFsearchderitems. ' + err);
		res.send({
			error: 'Error loading orderitems ' + err
		});
	});
});
/*

app.post('/order/count', function (req, res) {
    logger.debug('Finding count of orders ');
    var channel = req.body.channel;
    var Filter = orderService.Filter;
    var filters = [];
    if (channel) {
        filters.push(new Filter('channel', channel));
    }
    orderService.getCount(filters, function (result) {
        res.send(JSON.stringify(result));
    }, null);
});

*/

app.get('/order/dashboard/detail', function (req, res) {
	logger.debug('Returning Order statistics data ');
	res.send(dashboardService.getOrderDetails());
});

app.get('/dashboard/detail', function (req, res) {
	logger.debug('Returning Dashboard statistics data ');
	res.send({
		dashboaddetails: dashboardService.getDashboardDetails()
	});
});

/*app.get('/product', function (req, res) {
    productService.getProducts(function (result) {
        res.send(result);
    }, null);
});*/

/*
app.get('/product/:name', function (req, res) {
    productService.getProductLikeName (req.params.name, function (result) {
        res.send(result);
    }, null);
});
*/

// internal method to get list of channels in product where id is available, need to move to util or extension
function getChannelSkus(product) {
	var channelSkus = [];
	if (product.FK_channel_sku) {
		channelSkus.push(product.FK_channel_sku);
	}
	if (product.AMAZON_channel_sku) {
		channelSkus.push(product.AMAZON_channel_sku);
	}
	return channelSkus;
}

app.post('/product/update', function (req, res) {
	logger.debug('Updating product information. product details ' + req.body);
	var txnId = util.createTransaction('UpdateProductService');
	productService.updateProduct('DB', req.body, function (product) {
		if (product) {
			var productId = product.id;
			var productName = product.name;
			var productCostPrice = product.cost_price;
			var amazonChannelSku = product.AMAZON_channel_sku;
			var fkChannelSku = product.FK_channel_sku;
			var channelSkus = getChannelSkus(product);
			var succcess = true;
			for (var i = 0; i < channelSkus.length; i++) {
				logger.debug('Úpdating existing orderitems for product for channels ' + channelSkus[i] + ' product id ' + productId);
				orderService.updateOrderItemsProductData(productId, productName, productCostPrice, channelSkus[i],
					function (output) {}, function (err) {
						succcess = false;
					});
			}
			// need improvement in this method
			if (succcess == true) {
				res.send({
					result: 'orders update successfully'
				});
			} else {
				res.send({
					error: 'There was some error updating order items ' + err
				});

			}
		} else {
			res.send({
				error: 'Seller_Sku_Constraint'
			});
		}


	}, function (err) {
		res.send({
			error: 'There was some error updating Product.' + err + ' Request ' + req.body
		});
	}, txnId);
});

// need to work on this approach differently
app.post('/product/update2', function (req, res) {
	logger.info('calling API /product/update2');
	var product = req.body;
	product['AMAZONShippingCharges'] = 100;
	product['FKShippingCharges'] = 100;
	product['FKPriceProfit'] = 12;
	product['AMAZONPriceprofit'] = 12;
	product['AMAZONPriceCommission'] = 3;
	product['FKPriceCommission'] = 4;
	productPriceCalculationService.createOrUpdateProductPriceData(req.body, function (result, prod) {
		logger.debug(prod);
		if (result) {
			var productPriceMap = inventoryTransformer.transform(prod, function (productPriceMap) {
				logger.debug(productPriceMap);
			});
		}
	});
});



app.post('/order', function (req, res) {
	logger.debug('Loading orders. Request ' + req.body);
	orderService.getOrders('DB', util.prepareOrderFilter(req.body), function (orders) {
		logger.debug('Orders loaded successfully. Total orders ' + orders.length);
		res.send(orders);
	}, function (err) {
		res.send({
			error: 'There was some error loading orders  ' + err + ' Request ' + req.body
		});
	});
});

app.get('/account/dashboard/detail', function (req, res) {
	logger.debug('Returning accounting details ');
	res.send(dashboardService.getAccountingDetails());
});

app.get('/product/dashboard/detail', function (req, res) {
	logger.debug('Returning product dashboard statistics');
	res.send(dashboardService.getProductDashboardDetails());
});

app.post('/setting', function (req, res) {
	logger.debug('Storing configuration ');
	var params = req.body;
	configService.setConfiguration(params, function (configData) {
		var result = false;
		if (configData.length) {
			result = true;
		}
		logger.debug('Done saving configuration.');
		res.send({
			result: result,
			configData: configData
		});
	}, function (err) {
		logger.error('Error setting configuration ' + err);
		res.send({
			error: 'There was some error saving configuration  ' + err
		});
	});
});


app.post('/setting/load', function (req, res) {
	logger.debug('Loading configuration.');
	var params = req.body;
	configService.getConfiguration(util.prepareConfigSettingFilter(params), function (configData) {
		var result = false;
		if (configData.length) {
			result = true;
		}
		logger.debug('Done loading configuration.');
		res.send({
			result: result,
			configData: configData
		});
	}, function (err) {
		logger.error('Error loading configuration ' + err);
		res.send({
			error: 'There was some error loading configuration  ' + err
		});
	});
});


app.get('/paytm', function (req, res) {
	logger.info('calling API /paytm');
	paytmOrderService.startGetOrders(orderService.createOrUpdateOrder);
});

app.get('/paytmprod', function (req, res) {
	logger.info('calling API /paytmprod');
	paytmProductService.startGetProducts();
});

app.post('/topSellingProducts', function (req, res) {
	var startDate = req.body.startDate;
	var endDate = req.body.endDate;
	logger.debug('Loading top selling products. Start date ' + startDate + ' End date ' + endDate);
	analyticsEngine.topSellingProducts(startDate, endDate, 5, function (result) {
		logger.debug('Done loading top selling products. Start date ' + startDate + ' End date ' + endDate);
		res.send(result);
	}, function (err) {
		logger.error('Error loading top selling product ' + err);
		res.send({
			error: 'There was some error loading top selling products  ' + err + ' Request ' + req.body
		});
	});
});

app.post('/notSoldProducts', function (req, res) {
	var startDate = req.body.startDate;
	var endDate = req.body.endDate;
	logger.debug('Loading not sold products. Start date ' + startDate + ' End date ' + endDate);

	analyticsEngine.notSoldProducts(startDate, endDate, 5, function (result) {
		logger.debug('Done loading not sold products. Start date ' + startDate + ' End date ' + endDate);
		res.send(result);
	}, function (err) {
		logger.error('Error loading not sold products ' + err);
		res.send({
			error: 'There was some error loading not sold products ' + err + ' Request ' + req.body
		});
	});
});

app.post('/mostCancelledProducts', function (req, res) {
	var startDate = req.body.startDate;
	var endDate = req.body.endDate;
	logger.debug('Loading most cancelled product. Start date ' + startDate + ' End date ' + endDate);

	analyticsEngine.mostCancelledProducts(startDate, endDate, 5, function (result) {
		logger.debug('Done loading most cancelled selling products. Start date ' + startDate + ' End date ' + endDate);
		res.send(result);
	}, function (err) {
		logger.error('Error loading most cancelled products ' + err);
		res.send({
			error: 'There was some error loading most cancelled products ' + err + ' Request ' + req.body
		});
	});
});

app.get('/analytics', function (req, res) {
	logger.info('calling API /analytics');
});

app.get('/product/analytics', function (req, res) {
	logger.info('calling API /product/analytics');

});

app.post('/getSalesData', function (req, res) {

	var startDate = req.body.startDate;
	var endDate = req.body.endDate;
	logger.debug('Loading sales data. Start date ' + startDate + ' End date ' + endDate);
	analyticsEngine.getSalesData(startDate, endDate, function (result) {
		logger.debug('Done loading sales data. Start date ' + startDate + ' End date ' + endDate);
		res.send(result);
	}, function (err) {
		logger.error('Error loading sales data ' + err);
		res.send({
			error: 'There was some error loading sales data ' + err + ' Request ' + req.body
		});
	});
});

app.post('/getSalesAndRevenueData', function (req, res) {
	var startDate = req.body.startDate;
	var endDate = req.body.endDate;
	logger.debug('Loading sales and revenue data. Start date ' + startDate + ' End date ' + endDate);

	analyticsEngine.getSalesAndRevenueData(startDate, endDate, function (result) {
		logger.debug('Done loading not sold products. Start date ' + startDate + ' End date ' + endDate);
		res.send(result);
	}, function (err) {
		logger.error('Error loading sales and revenue data ' + err);
		res.send({
			error: 'There was some error loading sales and revenue data ' + err + ' Request ' + req.body
		});
	});
});

app.get('/notification/first', function (req, res) {
	logger.info('calling API /notification/first');
});

app.get('/fk', function (req, res) {
    logger.info('calling API /fk');
    orderService.getOrders('FK', null, orderService.createOrUpdateOrder);
});

app.get('/search/:channel/:query', function (req, res) {
    logger.info('calling API /search/:channel/:query');
    switch(req.params.channel){
            case 'FK':
            flipkartProductService.searchProduct(req.params.query, function(result){
                res.send(result);
            });
            break;
            case 'AMAZON':
            amazonProductService.searchProduct(req.params.query, function(result){
				var products = [];
				for(productObject in result.ListMatchingProductsResponse.ListMatchingProductsResult[0].Products[0].Product){
					var listPrice = '';
					if(result.ListMatchingProductsResponse.ListMatchingProductsResult[0].Products[0].Product[productObject].AttributeSets[0]['ns2:ItemAttributes'][0]['ns2:ListPrice']){
						listPrice= result.ListMatchingProductsResponse.ListMatchingProductsResult[0].Products[0].Product[productObject].AttributeSets[0]['ns2:ItemAttributes'][0]['ns2:ListPrice'][0]['ns2:Amount'][0];
					}
					products.push({brand:result.ListMatchingProductsResponse.ListMatchingProductsResult[0].Products[0].Product[productObject].AttributeSets[0]['ns2:ItemAttributes'][0]['ns2:Brand'][0],
							color:result.ListMatchingProductsResponse.ListMatchingProductsResult[0].Products[0].Product[productObject].AttributeSets[0]['ns2:ItemAttributes'][0]['ns2:Color'][0],
							listprice:listPrice,
							title:result.ListMatchingProductsResponse.ListMatchingProductsResult[0].Products[0].Product[productObject].AttributeSets[0]['ns2:ItemAttributes'][0]['ns2:Title'][0],
							asin:result.ListMatchingProductsResponse.ListMatchingProductsResult[0].Products[0].Product[productObject].Identifiers[0].MarketplaceASIN[0].ASIN[0],
							productImage:result.ListMatchingProductsResponse.ListMatchingProductsResult[0].Products[0].Product[productObject].AttributeSets[0]['ns2:ItemAttributes'][0]['ns2:SmallImage'][0]['ns2:URL'][0]});
				}
                res.send(products);
            });
            break;
    };
});

app.get('/amazon', function (req, res) {
    logger.info('calling API /amazon');
    //amazonProductService.getFeedSubmissionIdStatus(null);
    orderService.getOrders('AMAZON', null, orderService.createOrUpdateOrder);
    res.send('OK');
});


app.post('/validate/:channel', function (req, res) {
	logger.debug('Validating channel configuration ' + req.params.channel + '. Request ' + req.body);
	util.validateChannelConfig(req.params.channel, req.body, function (result) {
		logger.debug('Done validating channel configuration ' + result);
		res.send(result);
	});
});

app.get('/notification/all', function (req, res) {});

app.get('/api', function (req, res) {
	logger.info('calling API /api');
	res.send('API is running');
});

app.get('/checkNewVersion', function (req, res) {
	logger.debug('Checking new version of application');
	updater.checkNewVersion(function (result) {
		logger.debug('Done checking new version of application');
		res.send(result);
	});
});

app.get('/products/tally/load', function (req, res) {
	logger.debug('Loading products from tally ');
	var txnId = util.createTransaction('SyncTallyService');
	productService.getProducts('TALLY', null, null, null, txnId);
	logger.debug('Running load products from tally in background. Transaction id is ' + txnId);
	res.send({
		response: 'OK',
		txnId: txnId
	});
});

app.get('/updateNewVersion', function (req, res) {
	logger.debug('Updating new version of application ');
	updater.updateNewVersion();
	res.end();
	process.kill();
});

app.listen(app.get('port'));
console.log('Server listening on port ' + app.get('port'));


/** product listing calls urls*/


// is this working?, different parameters for call?
app.post('/product/publish', function (req, res) {
	logger.debug('Publishing/Listing product to all channels. product ' + req.body);
	var product = {
		channel: 'all',
		product: req.body
	}
	productService.createOrUpdateProduct(product.channel, 'id', product.product.id, product.product, productService.createProduct, null);

});


app.post('/product/publish/:channel', function (req, res) {
	var product = {
		channel: req.params.channel,
		product: req.body
	}

	logger.debug('Publishing/Listing product to ' + product.channel + ' product ' + product.product);

    var txnId = util.createTransaction(product.channel + 'productService');
    productService.createOrUpdateProduct('DB', 'id', product.product.id, product.product, function (prod) {
        productService.createProduct(product.channel, product.product, null, null, txnId);
    }, function (err) {

	}, null);
	logger.debug('Publishing/Listing product in background. transaction id is  ' + txnId);
	res.send({
		response: 'OK',
		txnId: txnId
	});
});

// where this method is used, if it is? it should be using same apis
app.post('/product/:id/publish', function (req, res) {
	logger.debug('Publishing/Listing product  ' + req.params.id + 'product ' + product.product);

	productService.getProductById(req.params.id, function (prod) {
		productService.listProduct(prod, function (cb) {
			res.send(cb);
			res.end();
		});

	}, function () {
		res.send('error');
		res.end();
	});
});

// where this method is used, if it is? it should be using same apis
app.post('/product/:id/publish/:channel', function (req, res) {
	logger.info('calling API /product/:id/publish/:channel');
	productService.getProductById(req.params.id, function (prod) {
		productService.listProduct(prod, function (cb) {
			res.send(cb);
			res.end();
		});

	}, function () {
		res.send('error');
		res.end();
	});
});



app.post('/product/sell', function (req, res) {
    logger.info('calling API /product/sell');
    var product = {
        channel: 'all',
        product: req.body
    }
    logger.debug('Selling (updating) product ' + JSON.stringify(product.product));
    var txnId = util.createTransaction(product.channel + 'productService');
    productService.createOrUpdateProduct('DB', 'id', product.product.id, product.product, function (prod) {
        productService.updateProduct(product.channel, product.product, null, null, txnId);
    }, function (err) {

	}, null);
	logger.debug('Running sell call in background, transaction id is ' + txnId);
	res.send({
		response: 'OK',
		txnId: txnId
	});
});

app.post('/product/sell/:channel', function (req, res) {
    logger.info('calling API /product/sell/' + req.params.channel);
    var product = {
        channel: req.params.channel,
        product: req.body
    }
    logger.debug('Selling (updating) product ' + JSON.stringify(product.product));
    var txnId = util.createTransaction(product.channel + 'productService');
    productService.createOrUpdateProduct('DB', 'id', product.product.id, product.product, function (prod) {
        logger.debug('Updated successfully in DB, Now updating product on ' + JSON.stringify(product.channel));
        productService.updateProduct(product.channel, product.product, null, null, txnId);
    }, function (err) {

	}, null);
	logger.debug('Running sell call in background, transaction id is ' + txnId);
	res.send({
		response: 'OK',
		txnId: txnId
	});
});

app.get('/transaction/status/:id', function (req, res) {
	logger.debug('Returning transaction status for ' + req.params.id + ' transaction status is ' + JSON.stringify(util.transactionPlaceHolder[req.params.id]));
	res.send(util.transactionPlaceHolder[req.params.id]);
});


//filter for mapped and unmapped items
app.post('/product', function (req, res) {
	logger.debug('Loading products. Request  ' + req.body);

	var bodyObj = req.body;
	productService.getProducts('DB', util.prepareProductFilter(bodyObj), function (products) {
		logger.debug('Products loaded successfully. Total products are   ' + products.length);
		res.send(products);
	}, function (err) {
		logger.error('Error loading products ' + err);
		res.send({
			error: 'There was some error loading products ' + err + ' Request ' + req.body
		});
	});
});


/*app.post('/copy', function (req, res) {
	
		//console.log("file path "+req.files);
		dbFolder = process.env.APPDATA + "\\Paxcom" ;
		dbFile = dbFolder + "\\paxcom.db" ;
			
		var source = dbFile; //'../../../roaming/paxcom/paxcom.db'; //req.body.source;
		var target = req.body.target;
		util.copyFile(source, target, function(result) {
			console.log(req);
			res.send(result);			
		});
	
});*/


app.get('/database/backup', function (req, res) {
	logger.debug("Database backup session initiated ");
	appFolder = process.env.USERPROFILE + "\\Paxcom",
	filePath = appFolder + "\\paxcom.db";
	fileName = 'paxcom_' + Date.now() + '.db';

	res.download(filePath, fileName, function (err) {
		if (err) {
			logger.error("Error downloading paxcom.db file " + err);
		} else {
			logger.debug("File successfully downloaded");
		}
	});
	logger.debug("\n Database backup session ended");
});

app.post('/tally/validate', function (req, res) {
	var url = req.body.serverIp;
	var companyName = req.body.companyName;
	var tallyResponse;
	var cred = {
		URL: url,
		CompanyName: companyName
	}
	logger.debug(JSON.stringify(cred));
	validateTally.getAccountingDetails(cred, new Date(), new Date(), function (validationResult) {
			if (validationResult.STATUS == 'ERROR') {
				tallyResponse = validationResult.MSG;
			} else if (!validationResult.ENVELOPE) {
				tallyResponse = 'Incorrect url. Response is not valid or not XML.'
			}
			tallyResponse = validationResult;
			res.send(tallyResponse);
		},
		function (tallyError) {
			logger.error(tallyError);
		});
});


/*code to check internet network connectivity.*/

app.get('/internet/status/', function (req, res) {
	var host = "http://www.google.com";
	util.getInternetStatus(host, function (netStatus) {
		res.send(netStatus);
	}, function (getInternetStatusError) {
		logger.error(getInternetStatusError);
	});
});

//code to sendFeedback
app.post('/sendFeedback',function(req,res){
   logger.debug("ischecked "+req.body.ischecked+" and content is "+req.body.text);
    feedbackService.setMailContents(req.body.ischecked,req.body.text);
    feedbackService.sendMail(function(result){
            res.send(result);
    })
});




//Upload Sheet Code
app.post('/showSheetUploadForm', function (req, res) {
    //SendForm to browser
	//console.log(req.headers);
	//console.log(req);
	accountService.storePaymentSheetData(req,res);
	//accountService.insertAcctgTrans();
});

app.get('/viewDataTrans', function (req, res) {
    //use Formidable to parse
    //Get Format
	
    accountService.tableViewTransResponse(res);

});

app.get('/viewDataTransEntry', function (req, res) {
    //use Formidable to parse
    //Get Format
    accountService.tableViewTransEntryResponse(res);
});

app.get('/Excel',function (req,res){
	var data=accountService.temp();
	console.log(data);
    var conf ={};
    conf.cols = [{
        caption:'orderId',
        type:'string' ,
		width:28.7109375
		},
      {caption:'Status',
        type:'string',
		width:28.7109375
}];
    conf.rows = data;
    var result = nodeExcel.execute(conf);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");
    res.end(result, 'binary');
});