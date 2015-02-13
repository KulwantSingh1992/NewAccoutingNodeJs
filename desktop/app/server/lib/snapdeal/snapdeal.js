var https = require('http');

var SDcred = exports.SDcred = {
    host: '',
    sellerId: ''
}

var snapdealClient = exports.snapdealClient = function (host, sellerId) {
    SDcred.host = host;
    SDcred.sellerId = sellerId;
}

exports.snapdealRequest = function (options, callback, cb, postData,txnId, productId) {
    var request = {};
    var path = options.path;
    var header = options.headers;
    lastCall(path, callback, cb, header, postData,txnId, productId);
}

var lastCall = function (path, callback, cb, header, postData,txnId, productId) {
    if (!SDcred.sellerId) {
        throw ("sellerId must be set");
    }
    var options = {
        hostname: SDcred.host,
        port: 8080,
        path: path,
        method: 'POST',
        headers: header
    };
    
    try {
        var str = '';
        var req = https.request(options, function (res) {
            res.on('data', function (chunk) {
                str += chunk;
            });
            res.on('end', function () {
                console.log("str"+str);
                callback(str, cb,txnId, productId);
            });
            res.on('error', function (err) {
                console.error('Error: ' + err);
            });
        }).on('error', function (err) {
            console.error(err);
        }).end(postData);
    } catch (err) {
        console.log(err);
    }
}