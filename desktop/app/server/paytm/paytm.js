//https: //fulfillment-staging.paytm.com/v1/merchant/21492/orders.json?token=745f103e-f9a4-4caa-9943-a8829335bace
var https = require('https');
var productionHost = 'catalogadmin-dev.paytm.com'; // for some limited APIs
var cred = exports.cred = {
    host: '',
    merchantId: '',
    token: ''
}

var paytmClient = exports.paytmClient = function (merchantId, Token) {
    cred.host = 'https://fulfillment-staging.paytm.com';
    cred.merchantId = merchantId;
    cred.token = Token;
}

exports.paytmRequest = function (options, callback, type, postData, cb) {
    var request = {};
    var path = options.path;
    request = options.params || {};
    lastCall(request, path, callback, type, postData, cb);
}

var lastCall = function (request, path, callback, type, postData, cb) {
    if (!cred.merchantId || !cred.token) {
        throw ("MerchantId must be set");
    }
    if(type == 'post'){
        var postPath = path + '?token=' + cred.token;
        var postheaders = {
        'Content-Type': 'application/json'
        };
        var options = {
            host: productionHost,
            port: 443,
            path: postPath,
            method: 'POST',
            headers: postheaders
        };
        console.log(options);
        try {
            var str = '';
            var req = https.request(options, function (resp) {
                
                resp.on('data', function (chunk) {
                    str += chunk;
                });
                resp.on('end', function () {
                    console.log(str);
                });
                resp.on('error', function (err) {
                    console.error('Error: ' + err);
                });
            }).on('error', function (err) {
                console.error(err);
            }).end(postData);
        } catch (err) {
            console.log(err);
        }    
    }
    else {
            var query = buildQuery(request);
            var requestSortedKeys = Object.keys(query);
            requestSortedKeys = requestSortedKeys.sort();
            var params = toQueryParameters(requestSortedKeys, query);
            var host = cred.host + path + '?' + params + 'token=' + cred.token;
            console.log(host);
            try {
                var str = '';
                https.get(host, function (resp) {
                    resp.on('data', function (chunk) {
                        str += chunk;
                    });
                    resp.on('end', function () {
                        callback(str, cb);
                    });
                    resp.on('error', function (err) {
                        console.error('Error: ' + err);
                    });
                }).on('error', function (err) {
                    console.error(err);
                }).end();
            } catch (err) {
                console.log(err);
            }
    }
    
};

function toQueryParameters(requestSortedKeys, parameters) {
    var param = '';
    var key;
    var i = 0;
    for (i = 0; i < requestSortedKeys.length; i++) {
        key = requestSortedKeys[i];
        param = param + key + '=' + parameters[key] + '&';
    }
    return param;
}

var buildQuery = function (params) {
    var q = {};
    for (var param in params) {
        var value = params[param].value,
            name = params[param].name,
            complex = (params[param].type === 'Complex');
        required = params[param].required;
        //console.log("v  " + value + "\nn " + name + "\nr " + required);
        if ((value !== undefined) && (value !== null)) {
            q[name] = value;
        } else {
            if (param.required === true) {
                throw ("ERROR: Missing required parameter, " + name + "!")
            }
        }
    };
    return q;
};