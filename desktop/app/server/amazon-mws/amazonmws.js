var host = '';
var appName = '';
var appVersion = '';
var appLanguage = '';
var accessKeyId = '';
var secretAccessKey = '';
var merchantId = '';
var CryptoJS = require('../lib/crypto').CryptoJS;
var crypto = require('crypto');
var logger = require('../lib/logger');

exports.amazonMwsRequest = function (options, callback) {
    var request = {};
    request.api = {
        path: options.path || '/',
        version: options.version || '2009-01-01',
        legacy: options.legacy || false,
        upload: options.upload || false
    };
    request.action = options.action || 'GetServiceStatus';
    request.params = options.params || {};
    invoke(request, callback);
}

var amazonMwsClient = exports.amazonMwsClient = function (AccessKeyId, SecretAccessKey, MerchantId, Options) {
    host = 'mws.amazonservices.in';
    appName = 'mws-js';
    appVersion = '0.1.0';
    appLanguage = 'JavaScript';
    accessKeyId = AccessKeyId;
    secretAccessKey = SecretAccessKey;
    merchantId = MerchantId;
}


var lastCall = function (api, action, query, callback) {
    if (secretAccessKey == null || accessKeyId == null || merchantId == null) {
        throw ("accessKeyId, secretAccessKey, and merchantId must be set");
    }

    // Check if we're dealing with a file (such as a feed) upload
    if (api.upload) {
        var body = query._BODY_,
            bformat = query._FORMAT_;
        delete query._BODY_;
        delete query._FORMAT_;
    }

    // Add required parameters and sign the query
    query['Action'] = action;
    query['Version'] = api.version;
    query["Timestamp"] = (new Date()).toISOString();
    query["AWSAccessKeyId"] = accessKeyId;
    if (api.legacy) {
        query['Merchant'] = merchantId;
    } else {
        query['SellerId'] = merchantId;
    }
    query["SignatureMethod"] = "HmacSHA256";
    query["SignatureVersion"] = "2";
    var requestSortedKeys = Object.keys(query);
    requestSortedKeys = requestSortedKeys.sort();
    var encodeparam = toQueryParameters(requestSortedKeys, query);
    encodeparam = encodeparam.substring(0, encodeparam.length - 1);
    encodeparam = encodeparam + '&Signature=' + encodeURIComponent(signParameters(encodeparam, api.path));

    // prepare the header
    var postheaders = {
        'Content-Type': bformat || 'application/x-www-form-urlencoded',
        'Accept': 'text/xml, */*'
    };
    if (api.upload) {
        postheaders['Content-MD5'] = crypto.createHash('md5').update(body).digest("base64");
    }
    var options = {
        host: host,
        port: 443,
        path: api.path + (api.upload ? '?' + encodeparam : ''), //+ '?' + encodeparam,
        method: 'POST',
        headers: postheaders
    };
    if (api.upload) {
        encodeparam = body;
    }
    try {
        var str = '';
        var https = require('https');
        https.request(options, function (res) {
            logger.info('amazon api response status: ' + res.statusCode);
            res.on('data', function (data) {
                str += data;
            });
            res.on('end', function () {
                try {
                    var parseString = require('xml2js').parseString;
                    parseString(str, function (err, result) {
                        if (result) {
                            logger.debug(JSON.stringify(result));
                            callback(result);
                        } else {
                            callback(str);
                        }
                    });
                } catch (err) {
                    logger.debug(err);
                    callback(str);
                }
            });
            res.on('error', function (err) {
                logger.error('Error: ' + err);
            });
        }).on('error', function (err) {
            logger.error(err);
        }).end(encodeparam);
    } catch (err) {
        logger.error(err);
    }
};


function toQueryParameters(requestSortedKeys, parameters) {
    var param = '';
    var key;
    var i = 0;
    for (i = 0; i < requestSortedKeys.length; i++) {
        key = requestSortedKeys[i];
        param = param + key + '=' + encodeURIComponent(parameters[key]) + '&';
    }
    return param;
}

function signParameters(encodeparam, path) {
    var dataToSign = 'POST' + '\n' + 'mws.amazonservices.in' + '\n' + path + '\n' + encodeparam;
    var hash = CryptoJS.HmacSHA256(dataToSign, secretAccessKey);
    var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);
    return hashInBase64;
}

var invoke = function (request, callback) {
    lastCall(request.api, request.action, buildQuery(request.params), callback);
};

var buildQuery = function (params) {
    var q = {};
    for (var param in params) {
        var value = params[param].value,
            name = params[param].name,
            complex = (params[param].type === 'Complex');
        required = params[param].required;
        //console.log("v  " + value + "\nn " + name + "\nr " + required);
        if ((value !== undefined) && (value !== null)) {
            if (Object.prototype.toString.call(value) == '[object Array]') {
                for (i = value.length - 1; i >= 0; i--) {
                    var updatedName = name + '.' + (i + 1);
                    q[updatedName] = value[i];
                }
            } else {
                q[name] = value;
            }
        } else {
            if (param.required === true) {
                throw ("ERROR: Missing required parameter, " + name + "!")
            }
        }
    };
    return q;
};