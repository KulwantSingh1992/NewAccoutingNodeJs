var flipkart = require('../../lib/flipkart/flipkart');
var flipkartCreateListing = require('../../lib/flipkart/flipkartCreateListing');
var flipkartUpdateProduct = require('../../lib/flipkart/flipkartUpdateProduct');
var flipkartProductSearch = require('../../lib/flipkart/flipkartProductSearch');
var db = require('../../db/db-config').db;
var orderDAO = require('../../db/order/orderDAO');
var productDAO = require('../../db/product/productDAO');
var commonDAO = require('../../db/common/commonDAO');
var util = require('../util/util');
var logger = require('../../lib/logger');
var orderService = require('../order/orderService');

var channel = 'FK';
var service = 'product';

exports.createProduct = function (data, action, txnId) {
    logger.info("Flipkart list product service started with transaction id: " + txnId);
    util.getChannelConfig(channel, service, function (credentials, extra, createdAfter) {
        if (credentials.SellerID) {
            try {
                var sellerId = credentials.SellerID;
                //createOrUpdateProduct(extra.SellerID, lastSync, data, action);
                /*if (action == 'create') {
                    data.FK_available_quantity = 0;
                } else {
                    if (!data.FK_available_quantity) {
                        cb({
                            "statusCode": "417",
                            "status": "failure",
                            "response": [{
                                "skuId": "",
                                "listingId": null,
                                "status": "failure",
                                "errors": [{
                                    "errorCode": "QTY_NOT_VALID",
                                    "message": "quantity must be more than 0 to sell a product",
                                    "attributeName": null
                    }]
                }]
                        });
                    }
                }*/
                var FK_additional_info = data.FK_additional_info;
                var productData = {
                    "fsn": data.FK_channel_sku,
                    "skuId": data.FK_seller_sku,
                    "listingStatus": "ACTIVE",
                    "localShippingCharge": FK_additional_info.local_shipping_charge, //100,
                    "mrp": parseInt(data.mrp),
                    "nationalShippingCharge": FK_additional_info.national_shipping_charge, //100,
                    "zonalShippingCharge": FK_additional_info.zonal_shipping_charge, //100,
                    "stockCount": 0,
                    "sellingPrice": parseInt(data.FK_listed_price),
                    "procurementSla": FK_additional_info.procurement_sla,
                    "priceErrorCheck": FK_additional_info.price_error_check //"disable"
                }
                logger.debug('Listing Product on FK with parameters: ' + JSON.stringify(productData));
                var postData = {
                    "sellerId": sellerId,
                    "token": credentials.token, //"18248633143f46c8",
                    "listingParams": [productData]
                };
                var postDataString = JSON.stringify(postData);
                flipkart.flipkartClient('54.175.140.196', sellerId);
                var createProductRequest = flipkartCreateListing.calls.CreateProduct();
                flipkart.flipkartRequest(createProductRequest, function (result) {
                    flipkartRequestCallback(result, txnId, data.id);
                }, postDataString);
            } catch (e) {
                logger.error(e);
            }
        } else {
            logger.error("Flipkart SellerID not found!");
            util.transactionPlaceHolder[txnId].txnStatus = 'failed';
            util.transactionPlaceHolder[txnId].txnMsg = 'Unable to connect to Flipkart. Information missing';

        }
    });


};

exports.searchProduct = function (searchKey, cb) {
    util.getChannelConfig(channel, service, function (credentials, extra, createdAfter) {
        if (credentials.SellerID) {
            try {
                var postData = 'q=' + searchKey + '&pageSize=20&token=' + credentials.token;
                flipkart.flipkartClient('54.175.140.196', credentials.SellerID);
                var searchProductRequest = flipkartProductSearch.calls.SearchProduct();
                flipkart.flipkartRequest(searchProductRequest, function (result) {
                    cb(result);
                }, postData);
            } catch (e) {
                logger.error(e);
            }
        } else {
            logger.error("Flipkart SellerID not found!");
        }
    });
};


exports.updateProduct = function (data, action, txnId) {
    util.getChannelConfig(channel, service, function (credentials, createdAfter) {
        if (credentials.SellerID) {
            try {
                var sellerId = credentials.SellerID;
                var FK_additional_info = data.FK_additional_info;
                var productData = {
                    "fsn": data.FK_channel_sku,
                    "skuId": data.FK_seller_sku,
                    "listingStatus": "ACTIVE",
                    "localShippingCharge": FK_additional_info.local_shipping_charge, //100,
                    "mrp": parseInt(data.mrp),
                    "nationalShippingCharge": FK_additional_info.national_shipping_charge, //100,
                    "zonalShippingCharge": FK_additional_info.zonal_shipping_charge, //100,
                    "stockCount": 0,
                    "sellingPrice": parseInt(data.FK_listed_price),
                    "procurementSla": FK_additional_info.procurement_sla,
                    "priceErrorCheck": FK_additional_info.price_error_check //"disable"
                }
                logger.debug('Updating Product on FK with parameters: ' + JSON.stringify(productData));
                var postData = {
                    "sellerId": sellerId, //"18248633143f46c8",
                    "token": credentials.token, //"18248633143f46c8",
                    "listingParams": [postData]
                };
                var postDataString = JSON.stringify(postData);
                flipkart.flipkartClient('54.175.140.196', sellerId);
                var updateProductRequest = flipkartUpdateProduct.calls.UpdateProduct();
                flipkart.flipkartRequest(updateProductRequest, function (result) {
                    flipkartRequestCallback(result, txnId, data.id);
                }, postDataString);
            } catch (e) {
                logger.error(e);
            }
        }
    });


};

var flipkartRequestCallback = function (result, txn, productId) {
    logger.info("Result for FK Product Service: " + result);
    try {
        var response = JSON.parse(result);
        if (response.statusCode == 200) {
            productDAO.updateListingStatus(productId, channel, function () {
                var response = JSON.parse(result);
                response.response = response.response.replace("FSN", "Flipkart Serial Number");
                util.transactionPlaceHolder[txn].txnStatus = 'completed';
                if (typeof response.response == "string") {
                    util.transactionPlaceHolder[txn].txnMsg = [[{
                        message: response.response
                    }]]
                } else {
                    util.transactionPlaceHolder[txn].txnMsg = response.response;
                }
            });

        } else {
            util.transactionPlaceHolder[txn].txnStatus = 'failed';
            if (response.inValidfsn) {
                util.transactionPlaceHolder[txn].txnMsg = [[{
                    message: "Flipkart Serial Number " + response.inValidfsn.FSN_NOT_EXIST[0] + " does not exists."
                }]];
            } else {
                if (Object.prototype.toString.call(response.response) == '[object Array]') {
                    var errArray = [];
                    for (var i in response.response[0].errors) {
                        errArray.push({
                            "errorCode": response.response[0].errors[i].errorCode,
                            "msg": response.response[0].errors[i].message
                        });
                    }
                    util.transactionPlaceHolder[txn].txnMsg = [[{
                        message: errArray
                    }]]
                } else {
                    if (typeof response.response == "string") {
                        util.transactionPlaceHolder[txn].txnMsg = [[{
                            message: response.response
                    }]]
                    } else {
                        util.transactionPlaceHolder[txn].txnMsg = response.response;
                    }
                }
            }
        }
    } catch (err) {
        util.transactionPlaceHolder[txn].txnStatus = 'failed';
        util.transactionPlaceHolder[txn].txnMsg = [[{
            message: 'Invalid Input for Request'
        }]];
    }

    //cb(result);
    /*{"statusCode":"200","status":"success","response":"Products have been listed successfully."}*/
};