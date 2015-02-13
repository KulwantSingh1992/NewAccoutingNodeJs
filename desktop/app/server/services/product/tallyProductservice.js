var logger = require('../../lib/logger');
var productService = require('./productService');
var util = require('../util/util');
var configService = require('../config/configService');
var completed = true;
var requestXml;
var XMLPath = "./server/templates/tally/stockDetailsRequestFormat.xml";

/* This function returns file content as sting */
var getXmlTemplate = function (templatePath) {
	var fs = require('fs');
	var xmlData = fs.readFileSync(templatePath, 'ascii');
	//logger.debug("File '" + templatePath + "/ was read successfully. \n");
	return xmlData;
}


var setError = function (txn, msg) {

	util.transactionPlaceHolder[txn].txnStatus = 'failed';
	util.transactionPlaceHolder[txn].txnMsg = msg;

}
var setSuccess = function (txn, msg) {

	util.transactionPlaceHolder[txn].txnStatus = 'completed';
	util.transactionPlaceHolder[txn].txnMsg = msg;

}

exports.getProducts = function (filter, cb, err, txnId) {
	logger.debug("Loading products from tally");
	configService.getConfiguration(util.prepareConfigSettingFilter({
			source: "'TALLY'"
		}), function (credentials) {
		if(!credentials[0].setting_details){
			setError(txnId, "Unable to get config settings from database. Internal error.");
			return;
		}
			try {
				var cred = JSON.parse(credentials[0].setting_details);
				if (cred.URL) {
					if (!requestXml) {
						requestXml = getXmlTemplate(XMLPath);
					}

					if (!cred.CompanyName || cred.CompanyName.trim().length == 0) {
						logger.error('Company Name not found in credentials');
						if (txnId) {
							setError(txnId, 'Company Name not provided ');
						}
						if (err) {
							err('Company Name not provided');
						}
					}
					var tmplData = {
						companyName: cred.CompanyName
					}


					var modifiedXml = util.templateEditor(requestXml, tmplData); // calling getTemplate function inside templateEditor
					//logger.debug("Request Xml" + modifiedXml);

					//creating json object for mustache template value insertion 
					var postheaders = {
						'SOAPAction': null,
						'Content-Length': modifiedXml.length,
						'Content-Type': "text/plain;charset=UTF-8",
						'Accept': "*/*"
					};
					var options = {
						host: cred.URL.replace("http://", "").replace("https://", "").split(':')[0],
						port: cred.URL.replace("http://", "").replace("https://", "").split(':')[1],
						method: 'POST',
						path: '/',
						headers: postheaders
					};
					try {
						var http = require('http');
						var req = http.request(options, function (res) {

							var buffer = "";
							res.on('data', function (data) {
								buffer += data;

							});
							res.on('error', function (err) {
								logger.error(err);
								setError(txnId, 'Error loading products from tally ' + err);
							});
							res.on('end', function () {
								var txnStatus = 'processing';
								var parseString = require('xml2js').parseString;
								parseString(buffer, function (err, result) {
									var data;
									if (!result) {
										setError(txnId, errorObject.MSG)
										return;
									} else {
										if (!result.ENVELOPE || !result.ENVELOPE.BODY || !result.ENVELOPE.BODY[0] || !result.ENVELOPE.BODY[0].DATA || !result.ENVELOPE.BODY[0].DATA[0] || !result.ENVELOPE.BODY[0].DATA[0].COLLECTION || !result.ENVELOPE.BODY[0].DATA[0].COLLECTION[0] || !result.ENVELOPE.BODY[0].DATA[0].COLLECTION[0].STOCKITEM) {
											setError(txnId, 'Error loading products from tally, unexpected output');
											console.error(JSON.stringify(result));
											return;
										}
										var length = result.ENVELOPE.BODY[0].DATA[0].COLLECTION[0].STOCKITEM.length;
										var items = result.ENVELOPE.BODY[0].DATA[0].COLLECTION[0].STOCKITEM;
										//result.ENVELOPE.BODY[0].DATA[0].COLLECTION[0].STOCKITEM.length

										var successItems = [];
										var errorItems = [];

										(function nextItem(index) {
											if (index === length - 1) { // No items left
												if (txnId) {
													if (errorItems.length > 0) {
														if (successItems.length > 0) {
															setSuccess(txnId, 'Tally product load partially successful');
														} else {
															setError(txnId, 'Error loading products from tally, unable to process product received from tally');
														}

													} else {
														setSuccess(txnId, 'Done loading tally items');
													}
												}
												if (cb) {
													if (successItems.length > 0) {
														cb(successItems);
													}
												}
												if (err) {
													if (errorItems.length > 0) {
														err(errorItems);
													}
												}
												return;
											}
											var indexValue = items[index];

											data = {
												name: indexValue["$"].NAME,
												category: indexValue["PARENT"][0]._,
												TALLY_id: indexValue["MASTERID"][0]._,
												cost_price: parseFloat(indexValue["OPENINGRATE"][0]._),
												min_price: parseFloat(indexValue["OPENINGRATE"][0]._),
												available_quantity: parseInt(indexValue["CLOSINGBALANCE"][0]._),
												mrp: parseFloat(indexValue["RATEOFMRP"][0]._)
											};

											productService.createOrUpdateProduct('DB', 'TALLY_id',
												indexValue["MASTERID"][0]._.trim(), data, function (result) {
													successItems.push(data);
													nextItem(index + 1);
												}, function (err) {
													errorItems.push(err);
													nextItem(index + 1);
												}, null)
										})(0);
										/*
                                    for (var i = 0; i < length; i++) {
*/
										/*
                            if(i==result.ENVELOPE.BODY[0].DATA[0].COLLECTION[0].STOCKITEM.length-1){
                                txnStatus = 'completed';
                                console.log(i,result.ENVELOPE.BODY[0].DATA[0].COLLECTION[0].STOCKITEM.length-1,txnStatus);
                            }
                            
*/
										/*
                                        function (i) {
                                            productService.createOrUpdateProduct('TALLY', data, function (result) {
                                                logger.debug(JSON.stringify(result) + i);
                                                if (i == length - 1) {
                                                    complete(cb, 'Product Updated successfully');
                                                }
                                            }, function (err) {
                                                // call complete here as well. need to create proper message
                                            }, txnId, txnStatus);
                                        }
                                        (i);
*/
										/*
                                        setSuccess(txnId, 'product loaded successfully, please refresh to see updated products. ');
*/
										//cb(data);
									}

								});
							});
						});
						req.on('error', function (reqErr) {
							logger.error('Error loading products from tally. ' + reqErr);
							setError(txnId, 'Error loading products from tally.' + reqErr);
							return;
						});
						req.end(modifiedXml, "utf-8");
					} catch (innerTryError) {
						logger.error('Error loading products from tally. ' + innerTryError);
						setError(txnId, 'Error loading products from tally. ' + innerTryError);
						return;
					}
				} else {
					logger.error('Tally URL not found!');
				}
			} catch (tryErr) {
				logger.error(tryErr);
			}
		},
		function (dbErr) {
			logger.error(dbErr);
			err(dbErr);
		});

};


exports.createProduct = function (prod, cb, err) {}

exports.updateProduct = function (prod, cb, err) {}


exports.createOrUpdateProduct = function (prod, cb, err) {}


exports.deleteProduct = function (prodid, cb, err) {}

exports.getProductById = function (id, cb, err) {}

exports.exists = function (existid, cb, err) {}