var commonDB = require('../../db/common/commonDAO');
var flipkart = require('../../lib/flipkart/flipkart');
var snapdeal = require('../../lib/snapdeal/snapdeal');
var flipkartAuth = require('../../lib/flipkart/flipkartAuth');
var snapdealAuth = require('../../lib/snapdeal/snapdealAuth');
var amazonMWS = require('../../amazon-mws/amazonmws');
var amazonproducts = require('../../amazon-mws/amazonproducts');
var crypto = require('crypto');
var key = "demo";
var algorithm = 'aes-256-ctr';
var logger = require('../../lib/logger');
var configService = require('../config/configService');
var mustache = require('mustache');
var http = require('http'); //used to check internet connectivity
var validateTally = require('../account/tallyAccountService');

exports.paytmOrderStatusEnum = {
    '2': 'NEW',
    '5': 'IN-PROGRESS',
    '23': 'IN-PROGRESS',
    '25': 'IN-PROGRESS',
    '13': 'IN-PROGRESS',
    '10': 'IN-PROGRESS', //handled
    '16': 'IN-PROGRESS', //handled
    '15': 'SHIPPED',
    '7': 'SHIPPED',
    '8': 'CANCELLED',
    '6': 'CANCELLED',
    '17': 'SHIPPED',
    '17': 'SHIPPED',
    '18': 'SHIPPED',
    '12': 'SHIPPED'
};

exports.paytmOrderExternalStatusEnum = {
    '2': 'Pending Acknowledgment (Order is Authorized to be Processed)',
    '5': 'Pending Shipment ( Order has been acknowledged. AWB is to be assigned now)',
    '23': 'Shipment Created (AWB has been assigned)',
    '25': 'Manifest Requested ( Manifest has been created ready to be Picked from the Merchant)',
    '13': 'Ready to Ship ( Shipment is packed )',
    '15': 'Shipped',
    '7': 'Delivered',
    '17': 'Return Requested',
    '18': 'Returned',
    '6': 'Failure (Order has been cancelled by the merchant)',
    '8': 'Cancelled (Order has been cancelled by the User)',
    '12': 'Refunded',
    '10': 'Unknown', //handled
    '16': 'Unknown' //handled
};

exports.amazonOrderStatusEnum = {
    'Pending': 'NEW',
    'Unshipped': 'IN-PROGRESS',
    'PartiallyShipped': 'IN-PROGRESS',
    'Shipped': 'SHIPPED',
    'Canceled': 'CANCELLED',
    'Unfulfillable': 'UNFULFILLED'
};

exports.flipkartOrderStatusEnum = {
    'payment_approved': 'NEW',
    'packed': 'IN-PROGRESS',
    'label_created': 'IN-PROGRESS',
    'to_dispatch': 'IN-PROGRESS',
    'delivered': 'SHIPPED',
    'cancelled': 'CANCELLED',
    'shipped': 'SHIPPED'
};

exports.dateformat = function (dt) {

    function pad(number) {
        var r = String(number);
        if (r.length === 1) {
            r = '0' + r;
        }
        return r;
    }

    return dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate()) + 'T' + pad(dt.getUTCHours()) + ':' + pad(dt.getUTCMinutes()) + ':' + pad(dt.getUTCSeconds()) + 'Z';
};

var Filter = exports.Filter = function (name, value) {
    this.name = name;
    this.value = value;
};

exports.prepareProductFilter = function (input) {
    var filters = [];
    if (input.channels) {
        filters.push(new Filter('channels', input.channels));
    }
    if (status) {
        filters.push(new Filter('status', input.status));
    }
    return filters;
}


exports.prepareOrderFilter = function (input) {
    var channels = input.channels;
    var status = input.status;
    var createdDateRange = input.createdDateRange;
    var updatedDateRange = input.updatedDateRange;
    var shipDateRange = input.shipDateRange;
    var local = input.local;
    var external = input.external;
    var tag = input.tag;
    var filters = [];
    if (channels) {
        filters.push(new Filter('channels', channels));
    }
    if (status) {
        filters.push(new Filter('status', status));
    }
    if (createdDateRange) {
        filters.push(new Filter('createdDateRange', createdDateRange));
    }
    if (updatedDateRange) {
        filters.push(new Filter('updatedDateRange', updatedDateRange));
    }
    if (shipDateRange) {
        filters.push(new Filter('shipDateRange', shipDateRange));
    }
    if (local) {
        filters.push(new Filter('local', local));
    }
    if (external) {
        filters.push(new Filter('external', external));
    }
    if (tag) {
        filters.push(new Filter('tag', tag));
    }
    return filters;
};



/*This function returns edited template use mustache to edit 
@param jsonData is must contain key value for editing
@param sourceTemplate is the source xml file needs to be parsed with value on keys
@returns xml with kyed values on keys.
*/
exports.templateEditor = function (sourceTemplate, jsonData) {
    return mustache.render(sourceTemplate, jsonData);
}

exports.validateChannelConfig = function (channel, credentials, cb) {
    switch (channel) {
    case 'AMAZON':
        //cb({}); //this is temp..this must be removed in order to succeed further
        validateAMAZON(credentials, cb);
        break;
    case 'FK':
        validateFK(credentials.UserName, credentials.Password, cb);
        break;
    case 'SD':
        validateSD(credentials.UserName, credentials.Password, cb);
        break;
    case 'PTM':
        cb({});
        break;
    case 'TALLY':
        //cb({});
        logger.debug("credentials of tally" + credentials.URL);
        validateTALLY(credentials.URL, credentials.CompanyName, cb);
        break;
    }
};


function validateFK(username, password, cb) {
    var response = {
        result: false
    };
    flipkart.flipkartClient('54.175.140.196', 'init');
    var getSellerId = flipkartAuth.calls.GetSellerId();
    postData = 'username=' + username + '&password=' + password;
    flipkart.flipkartRequest(getSellerId, function (result) {
        if (result) {
            result = JSON.parse(result);
            if (result.code == 1000) {
                var sellerIdObj = '{"SellerID":"' + result.sellerInfo.sellerId + '", "token":"' + result.sellerInfo.id + '"}';
                response.data = sellerIdObj
                response.result = true;
                cb(response);
            } else {
                response.msg = "Failed to validate flipkart setting";
                response.result = false;
                cb(response);
            }
        } else {
            response.msg = "Failed to validate flipkart setting";
            response.result = false;
            cb(response);
        }
    }, postData);
}

function validateSD(username, password, cb) {
    var response = {
        result: false
    };
    snapdeal.snapdealClient('54.175.140.196', 'init');
    var getSellerId = snapdealAuth.calls.GetSellerId();
    postData = 'username=' + username + '&password=' + password;
    snapdeal.snapdealRequest(getSellerId, function (result, cb) {
        if (result) {
            result = JSON.parse(result);
            if (result.code == 1000) {
                var sellerIdObj = '{"SellerID":"' + result.sellerInfo.sellerId + '"}';
                response.data = sellerIdObj
                response.result = true;
                cb(response);
            } else {
                response.msg = "Failed to validate Snapdeal setting";
                response.result = false;
                cb(response);
            }
        } else {
            response.msg = "Failed to validate Snapdeal setting";
            response.result = false;
            cb(response);
        }
    }, cb, postData);
};

function validateAMAZON(credentials, cb) {
    var response = {
        result: false
    };
    if (credentials.AWSAccessKeyID && credentials.SecretKey && credentials.SellerID && credentials.MarketplaceID) {
        logger.info('Validating Amazon!');
        try {
            amazonMWS.amazonMwsClient(credentials.AWSAccessKeyID, credentials.SecretKey, credentials.SellerID, {});
            var listMatchingProducts = amazonproducts.calls.ListMatchingProducts();
            listMatchingProducts.params.MarketplaceId.value = credentials.MarketplaceID;
            listMatchingProducts.params.Query.value = 'mobiles';
            amazonMWS.amazonMwsRequest(listMatchingProducts, function (result) {
                if (result.ListMatchingProductsResponse) {
                    response.result = true;
                    cb(response);
                } else {
                    if (result.ErrorResponse) {
                        result.ErrorResponse.Error[0].Message[0] == "Access denied" ? response.msg = 'Credentials not activated on AMAZON, contact Amazon Support!' : response.msg = result.ErrorResponse.Error[0].Message[0];
                    } else {
                        response.msg = "Failed to validate Amazon setting";
                    }
                    response.result = false;
                    cb(response);
                }
            });
        } catch (e) {
            logger.error(e);
            response.msg = "Unexpected Response from Amazon Server";
            response.result = false;
            cb(response);
        }

    } else {
        logger.error('Unable to fetch data from amazon, configuration data is incorrect');
        response.msg = "Unexpected Input for Amazon";
        response.result = false;
        cb(response);
    }
}

exports.createTransaction = function (service) {
    var txnId = service + Date.now();
    transactionPlaceHolder[txnId] = {};

    transactionPlaceHolder[txnId].txnStatus = 'processing';
    transactionPlaceHolder[txnId].txnMsg = 'processing';
    return txnId;
};


var transactionPlaceHolder = exports.transactionPlaceHolder = {};


exports.encrypt = function (text) {
    var cipher = crypto.createCipher(algorithm, key);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

exports.decrypt = function (text) {
    var result;

    try {
        var decipher = crypto.createDecipher(algorithm, key);
        var dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        result = dec;
        return result;
    } catch (decryptError) {
        logger.error("Decription exception, caused by " + decryptError);
        result = false;
    }
    return result;
    /*var dec;
	try {
		var decipher = crypto.createDecipher(algorithm, key);
		dec = decipher.update(text, 'hex', 'utf8');
		dec += decipher.final('utf8');
	} catch (decryptError) {
		logger.error("decrypt exception " + decryptError);
	}
	if (dec) {
		//logger.debug("karam" + dec);
		return dec;
	} else {
		return false;
	}*/
}


// prepare filter for products this method is called

exports.prepareProductFilter = function (input) {
    var filters = [];
    if (input.channels) {
        filters.push(new Filter('channels', input.channels));
    }
    if (input.status) {
        filters.push(new Filter('status', input.status));
    }

    if (input.name) {
        filters.push(new Filter('name', input.name));
    }


    return filters;
}

//function to prepare config filter
var prepareConfigSettingFilter = exports.prepareConfigSettingFilter = function (input) {
    var filters = [];
    if (input.source) {
        filters.push(new Filter('source', input.source));
    }
    if (input.status) {
        filters.push(new Filter('status', input.status));
    }
    return filters;
}

exports.channelConfigPlaceholder = {};

exports.updateSync = function (channelName, service, syncTime) {
    logger.info("Updating Sync Data for " + channelName + " with last Sync Time: " + syncTime);
    commonDB.updateSync(channelName, service, syncTime);
};

exports.getChannelConfig = function (channelName, serviceName, cb) {
    commonDB.getChannelConfig(channelName, function (configData, channelName) {
        configData = JSON.parse(configData);
        if (configData[serviceName]) {
            getChannelCredentials(configData[serviceName], channelName, cb);
        } else {
            getChannelCredentials(0, channelName, cb);
        }
    });
}

function getChannelCredentials(syncTime, channelName, cb) {
    configService.getConfiguration(prepareConfigSettingFilter({
            source: "'" + channelName + "'"
        }), function (credentials) {
            if (credentials[0].setting_details) {
                cb(JSON.parse(credentials[0].setting_details), syncTime);
            } else {
                cb({}, syncTime);
            }
        },
        function (dbErr) {
            logger.error(dbErr);
            err(dbErr);
        });
}

var txnSetError = exports.txnSetError = function (txn, msg) {
    transactionPlaceHolder[txn].txnStatus = 'failed';
    transactionPlaceHolder[txn].txnMsg = msg;
}

var txnSetSuccess = exports.txnSetSuccess = function (txn, msg) {
    transactionPlaceHolder[txn].txnStatus = 'completed';
    transactionPlaceHolder[txn].txnMsg = msg;
}

var txnSetQueued = exports.txnSetQueued = function (txn, msg) {
    transactionPlaceHolder[txn].txnStatus = 'queued';
    transactionPlaceHolder[txn].txnMsg = msg;
}

exports.getInternetStatus = function (host, result, err) {
    try {
        http.get(host, function (res) {
            logger.debug("Got response: " + res.statusCode);
            if (res.statusCode) {
                result("{STATUS: 'OK', RESPONSE :" + res.statusCode + "}");
            }
        }).on('error', function (e) {
            logger.error("Got error: " + e.message);
            result("{STATUS : 'ERROR' , RESPONSE : " + e.message + "}");
        });
    } catch (internetException) {
        logger.error("Exception Caught, " + internetException);
        err(internetException);
    }
};

//temp
function validateTALLY(URL, companyName, cb) {
    var tallyResponse = {};
    var cred = {
        URL: URL,
        CompanyName: companyName
    }
    logger.debug(JSON.stringify(cred));
    validateTally.getAccountingDetails(cred, new Date(), new Date(), function (validationResult) {
        logger.debug("in tally server" + JSON.stringify(validationResult));

        if (validationResult.STATUS == 'ERROR') {
            tallyResponse.msg = validationResult.MSG;
            tallyResponse.result = false;


        } else {
            tallyResponse.result = true;
        }

        cb(tallyResponse);
    }, function (tallyError) {
        logger.debug(tallyError);
        tallyResponse.msg = tallyError;
        tallyResponse.result = false;
        cb(tallyResponse);
    });
}