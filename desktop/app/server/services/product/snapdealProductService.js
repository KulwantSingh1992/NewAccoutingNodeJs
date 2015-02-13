var snapdeal = require('../../lib/snapdeal/snapdeal');
var snapdealCreateListing = require('../../lib/snapdeal/snapdealCreateListing');
var snapdealUpdateProduct = require('../../lib/snapdeal/snapdealUpdateProduct');
var db = require('../../db/db-config').db;
var orderDAO = require('../../db/order/orderDAO');
var productDAO = require('../../db/product/productDAO');
var commonDAO = require('../../db/common/commonDAO');
var util = require('../util/util');
var logger = require('../../lib/logger');

var channel = 'SD';
var service = 'product';

exports.createProduct = function (data, action, txnId) {
    logger.info("Snapdeal list product service started with transaction id: " + txnId);
    util.getChannelConfig(channel, service, function (credentials, createdAfter) {
        if (credentials.SellerID) {
            try {
                var sellerId = credentials.SellerID;
                var SD_additional_info = data.SD_additional_info;
                var postData = {
                    "id": sellerId, //"18248633143f46c8",
                    "listingParams": [{
                        "supc": data.SD_channel_sku,
                        "skuId": data.SD_seller_sku,
                        "procurementSla": parseInt(data.SD_additional_info.dispatch_sla),
                        "stockCount": 0,
                        "mrp": parseInt(data.mrp),
                        "sellingPrice": parseInt(data.SD_listed_price)
                    }]
                };
                var postDataString = JSON.stringify(postData);
                snapdeal.snapdealClient('54.175.140.196', sellerId);
                var createProductRequest = snapdealCreateListing.calls.CreateProduct();
                snapdeal.snapdealRequest(createProductRequest, snapdealRequestCallbackForListProduct, null, postDataString, txnId, data.id);
            } catch (e) {
                logger.error(e);
            }
        } else {
            logger.error("Snapdeal SellerID not found!");
        }
    });
};

exports.updateProduct = function (data, action, txnId) {
    util.getChannelConfig(channel, service, function (credentials, createdAfter) {
        if (credentials.SellerID) {
            logger.info("in snapdeal update product.... " + credentials.SellerID);
            try {
                var sellerId = credentials.SellerID;
                var SD_additional_info = data.SD_additional_info;
                var postData = {
                    "id": sellerId, //"18248633143f46c8",
                    "listingParams": [{
                        "supc": data.SD_channel_sku,
                        "skuId": data.SD_seller_sku,
                        "procurementSla": data.SD_additional_info.dispatch_sla,
                        "stockCount": parseInt(data.SD_available_quantity),
                        "mrp": parseInt(data.mrp),
                        "sellingPrice": parseInt(data.SD_listed_price)
                    }]
                };
                var postDataString = JSON.stringify(postData);
                console.log(postData);
                snapdeal.snapdealClient('54.175.140.196', sellerId);
                var updateProductRequest = snapdealUpdateProduct.calls.UpdateProduct();
                snapdeal.snapdealRequest(updateProductRequest, snapdealRequestCallbackForUpdateProduct, null, postDataString, txnId, data.id);
            } catch (e) {
                logger.error(e);
            }
        }
    });
};

var snapdealRequestCallbackForUpdateProduct = function (result, cb, txn, productId) {
    logger.debug(result);
    logger.debug(productId);
    var succToBeSent = [];
    var errToBeSent = [];
    var finalResponse = [];
    var supc;
    try {
        var getResult = JSON.parse(result);
        console.log("supc in update is " + getResult.response[0].supc);
//
//        var results[] = getResult.response;
//
//        for (var response in results) {
//            supc = response.supc;
//            if (response.success.length > 0) {
//                for (var succArr in response.success) {
//                    succToBeSent.push("{statusCode: " + succArr.response + ",resonse is: " + succArr.response "}");
//                }
//            }
//
//            if (response.errors.length > 0) {
//                for (var errArr in response.errors) {
//                    errToBeSent.push("{ statusCode: " + errArr.response + ", resonse is: " + errArr.response "}");
//                }
//            }
//
//            finalResponse.push("{" + supc + " " + succToBeSent + " " + errToBeSent "}");
//            console.log(finalResponse);
//        }
        
         util.transactionPlaceHolder[txn].txnStatus = 'completed';
         util.transactionPlaceHolder[txn].txnMsg = getResult.response;

    } catch (err) {
        util.transactionPlaceHolder[txn].txnStatus = 'failed';
        util.transactionPlaceHolder[txn].txnMsg = [[{
            message: 'Unexpected Response'
        }]];
    }
};

var snapdealRequestCallbackForListProduct = function (result, cb, txn, productId) {
    logger.info(result);
    logger.info(productId);
    console.log("result " + result);
    var response;
    try {
        var response = JSON.parse(result);
        if (response.statusCode == 200) {            
             productDAO.updateListingStatus(productId, channel, result, function (result, txn) {
                var response = JSON.parse(result);
                var msg = response.response + " " + response.uploadedId;
                util.transactionPlaceHolder[txn].txnStatus = 'completed';
                util.transactionPlaceHolder[txn].txnMsg = msg;
            }, txn);         
            
        } else {
            util.transactionPlaceHolder[txn].txnStatus = 'failed';
            util.transactionPlaceHolder[txn].txnMsg = "failed to list product on snapdeal";
        }
    } catch (err) {
        logger.debug(err);
        util.transactionPlaceHolder[txn].txnStatus = 'failed';
        util.transactionPlaceHolder[txn].txnMsg = [[{
            message: 'Unexpected Response'
        }]];
    }
}