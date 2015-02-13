var db = require('../../db/db-config').db;
var orderDAO = require('../../db/order/orderDAO');
var productDAO = require('../../db/product/productDAO');
var commonDAO = require('../../db/common/commonDAO');
var util = require('../util/util');
var logger = require('../../lib/logger');
var amazonMWS = require('../../amazon-mws/amazonmws');
var amazonfeeds = require('../../amazon-mws/amazonfeeds');
var amazonproducts = require('../../amazon-mws/amazonproducts');
var channel = 'AMAZON';
var service = 'product';

/*setInterval(requestmonitor, 15);*/
function amazonProductCron() {
    var interval = 2 * 60 * 1000;
    setInterval(function () {
        requestMonitor();
    }, interval);
}
amazonProductCron();
exports.createProduct = function (prod, action, txnId) {
    logger.info("Amazon list product service started with transaction id: " + txnId);

    util.getChannelConfig(channel, service, function (credentials, lastSync) {
        if (credentials.AWSAccessKeyID && credentials.SecretKey && credentials.SellerID && credentials.MarketplaceID) {
            logger.info('Uploading product feed on amazon!');
            if (prod.AMAZON_available_quantity == null) {
                prod.AMAZON_available_quantity = 0;
            }
            var data = "";
            data += chkNull(prod.AMAZON_seller_sku) + "\t" + chkNull(prod.AMAZON_listed_price) + "\t" + chkNull(prod.AMAZON_available_quantity) + "\t";
            data += chkNull(prod.AMAZON_channel_sku) + "\t" + "ASIN" + "\t" + "New" + "\t" + " " + "\t" + " " + "\t" + chkNull(prod.name) + "\t";
            data += " " + "\t" + "update" + "\t" + " " + "\t" + " " + "\t" + " " + "\t" + chkNull(prod.AMAZON_additional_info.leadtime_to_ship) + "\t" + " " + "\t";
            data += " " + "\t" + " " + "\t" + " " + "\t" + " " + "\t" + " " + "\t" + " " + "\t";
            data += " " + "\t" + " " + "\t" + " " + "\n";

            var template = amazonTemplate("ListProduct");
            template += data;
            logger.debug('Listing Product on AMAZON with parameters: ' + template);

            try {
                amazonMWS.amazonMwsClient(credentials.AWSAccessKeyID, credentials.SecretKey, credentials.SellerID, {});
                var submitFeed = amazonfeeds.calls.SubmitFeed();
                submitFeed.params.FeedContents.value = template;
                submitFeed.params.MarketplaceIds.value = credentials.MarketplaceID;
                submitFeed.params.PurgeAndReplace.value = "false";
                submitFeed.params.FeedType.value = "_POST_FLAT_FILE_LISTINGS_DATA_";

                amazonMWS.amazonMwsRequest(submitFeed, function (result) {
                    amazonMwsRequestCallback(result, prod, txnId);
                });
            } catch (e) {
                logger.error(e);
            }

        } else {
            logger.error('Unable to fetch order data from amazon, configuration data is incorrect');
        }
    });
};

exports.searchProduct = function (searchKey, cb) {
    util.getChannelConfig(channel, service, function (credentials, lastSync) {
        if (credentials.AWSAccessKeyID && credentials.SecretKey && credentials.SellerID && credentials.MarketplaceID) {
            logger.info('Searching product on amazon!');
            try {
                amazonMWS.amazonMwsClient(credentials.AWSAccessKeyID, credentials.SecretKey, credentials.SellerID, {});
                var listMatchingProducts = amazonproducts.calls.ListMatchingProducts();
                listMatchingProducts.params.MarketplaceId.value = credentials.MarketplaceID;
                listMatchingProducts.params.Query.value = searchKey;
                amazonMWS.amazonMwsRequest(listMatchingProducts, function (result) {
                    cb(result);
                });
            } catch (e) {
                logger.error(e);
            }

        } else {
            logger.error('Unable to fetch data from amazon, configuration data is incorrect');
        }
    });
};


/*
function requestmonitor() {
    amazonTransactionMap.map(function (requestId, i)) {
                            // check amazon for request id
                             // on callback, if succcess or error
                             // get transaction id and update that transaction
                             // remove this request id from this current map0
    }
}
*/
function requestMonitor() {
    for (var reqId in amazonTransactionMap) {
        getFeedSubmissionIdStatus(reqId, function (result) {
            logger.debug(result);
            if (result[0].processed) {
                if (result[0].processed.value == result[1].successful.value) {
                    productDAO.updateListingStatus(productIdMap[reqId], channel, function () {
                        util.txnSetSuccess(amazonTransactionMap[reqId], 'Completed Successfully');
                    });
                } else if (result[0].processed.value != result[1].successful.value) {
                    util.txnSetError(amazonTransactionMap[reqId], amazonTransactionMap);
                }
            }
        }, function (err) {

        });
    }
    /*amazonTransactionMap.map(function (requestId, i)) {
        // check amazon for request id
        // on callback, if succcess or error
        // get transaction id and update that transaction
        // remove this request id from this current map0
    }*/
}

function amazonMwsRequestCallback(result, prod, txnId) {
    try {
        if (result.SubmitFeedResponse) {
            util.txnSetQueued(txnId, 'Feed Submitted Successfully. Waiting For Update.');
            amazonTransactionMap[result.SubmitFeedResponse.SubmitFeedResult[0].FeedSubmissionInfo[0].FeedSubmissionId[0]] = txnId;
            productIdMap[result.SubmitFeedResponse.SubmitFeedResult[0].FeedSubmissionInfo[0].FeedSubmissionId[0]] = prod.id;
            //            setTransactionMap(result.SubmitFeedResponse.SubmitFeedResult[0].FeedSubmissionInfo[0], txnId);
        } else if (result.ErrorResponse) {
            logger.error('Some error occured during listing product on amazon: ' + JSON.stringify(result));
            util.txnSetError(txnId, result.ErrorResponse.Error[0].Message);
        } else {
            logger.error('Some error occured during listing product on amazon: ' + JSON.stringify(result));
            util.txnSetError(txnId, 'Unexpected Response From Server.');
        }
    } catch (err) {
        logger.error('Some error occured during listing product on amazon: ' + err);
    }
}

exports.updateProduct = function (prod, action, txnId) {
    logger.info("Amazon update product service started with transaction id: " + txnId);

    util.getChannelConfig(channel, service, function (credentials, lastSync) {
        if (credentials.AWSAccessKeyID && credentials.SecretKey && credentials.SellerID && credentials.MarketplaceID) {
            if (prod.AMAZON_available_quantity == null) {
                prod.AMAZON_available_quantity = 0;
            }
            var data = "";
            data = "";

            data += chkNull(prod.AMAZON_seller_sku) + "\t" + chkNull(prod.AMAZON_listed_price) + "\t" + chkNull(prod.AMAZON_available_quantity) + "\t";
            data += chkNull(prod.AMAZON_additional_info.leadtime_to_ship) + "\n";

            var template = amazonTemplate("UpdatePriceOrQuantity");
            template += data;
            logger.debug('Updating Product on AMAZON with parameters: ' + template);

            try {
                amazonMWS.amazonMwsClient(credentials.AWSAccessKeyID, credentials.SecretKey, credentials.SellerID, {});
                var submitFeed = amazonfeeds.calls.SubmitFeed();
                submitFeed.params.FeedContents.value = template;
                submitFeed.params.MarketplaceIds.value = credentials.MarketplaceID;
                submitFeed.params.PurgeAndReplace.value = "false";
                submitFeed.params.FeedType.value = "_POST_FLAT_FILE_PRICEANDQUANTITYONLY_UPDATE_DATA_";
                amazonMWS.amazonMwsRequest(submitFeed, function (result) {
                    amazonMwsRequestCallback(result, prod, txnId);
                });
            } catch (e) {
                logger.error(e);
            }

        } else {
            logger.error('Unable to update amazon product, configuration data is incorrect');
        }
    });
};

function amazonTemplate(templateType) {
    var temp = "";
    if (templateType == "ListProduct") {
        temp += "TemplateType=Offer" + "\t" + "Version=1.4" + "\n" + "sku" + "\t" + "price" + "\t" + "quantity" + "\t" + "product-id" + "\t" + "product-id-type" + "\t" +
            "condition-type" + "\t" + "condition-note" + "\t" + "ASIN-hint" + "\t" + "title" + "\t" + "product-tax-code" + "\t" + "operation-type" + "\t" +
            "sale-price" + "\t" + "sale-start-date" + "\t" + "sale-end-date" + "\t" + "leadtime-to-ship" + "\t" + "launch-date" + "\t" + "is-giftwrap-available" + "\t" +
            "is-gift-message-available" + "\t" + "fulfillment-center-id" + "\t" + "main-offer-image" + "\t" + "offer-image1" + "\t" + "offer-image2" + "\t" + "offer-image3" + "\t" + "offer-image4" + "\t" + "offer-image5" + "\n";
    } else if (templateType == "UpdatePriceOrQuantity") {
        var temp = "";
        temp += "sku" + "\t" + "price" + "\t" + "quantity" + "\t" + "leadtime-to-ship" + "\n";
    }
    return temp;
}

function chkNull(str) {
    if (str == null)
        return " ";
    else
        return str;
}

var amazonTransactionMap = {};
var productIdMap = {};

function setTransactionMap(amazonResponseData, txnId) {
    amazonTransactionMap[amazonResponseData.FeedSubmissionId[0]] = txnId;
    getFeedSubmissionIdStatus([amazonResponseData.FeedSubmissionId[0]]);
    /*
    amazonTransactionMap['FeedSubmissionId'] = amazonResponseData.FeedSubmissionId[0];
    amazonTransactionMap['SubmittedDate'] = amazonResponseData.SubmittedDate[0];
    amazonTransactionMap['FeedProcessingStatus'] = amazonResponseData.FeedProcessingStatus[0];
    amazonTransactionMap['FeedType'] = amazonResponseData.FeedType[0];
    lo
*/
}

var getFeedSubmissionIdStatus = exports.getFeedSubmissionIdStatus = function (feedSubmissionId, cb, err) {
    logger.info('getting feed status');
    var getFeedSubmissionResult = amazonfeeds.calls.GetFeedSubmissionResult();
    getFeedSubmissionResult.params.FeedSubmissionId.value = feedSubmissionId;
    amazonMWS.amazonMwsRequest(getFeedSubmissionResult, function (result) {
        feedRequestCallback(result, cb, err);
    });
}

/*function feedRequestCallback(result) {
    console.log(result);
    csvParse_func(result, null, null);
}*/

var feedRequestCallback = function (responseData, cb, err) {
    if (typeof responseData == "string") {
        var arr = [];
        var csv_data = [];
        var str = "";
        var secondPart;
        var csv = require("fast-csv");
        csv
            .fromString(responseData, {
                delimiter: '\t'
            })
            .on("data", function (data) {
                arr.push(data);
            })
            .on("end", function () {
                console.log(arr);
                for (var i = 1; i < 3; i++) {
                    console.log(arr[i]);
                    if (i == 2)
                        csv_data.push({
                            successful: {
                                msg: arr[i][1],
                                value: arr[i][3]
                            }
                        });
                    else
                        csv_data.push({
                            processed: {
                                msg: arr[i][1],
                                value: arr[i][3]
                            }
                        });
                }

                for (var i = 3; i < arr.length; i++) {
                    if (arr[i][2]) {
                        if (arr[i][2] == "error-code") {
                            secondPart = i;
                            csv_data.push({
                                errors: []
                            });
                            break;
                        }
                    }
                }
                for (var i = secondPart + 1; i < arr.length; i++) {
                    csv_data[2].errors.push({
                        errorcode: arr[i][2],
                        sku: arr[i][1],
                        msg: arr[i][4]
                    });
                }
                logger.debug(JSON.stringify(csv_data));
                cb(csv_data);
            });
    }
}