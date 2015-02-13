var https = require('http');
var cred = exports.cred = {
    host: '',
    sellerId: ''
}

var flipkartClient = exports.flipkartClient = function (host, sellerId) {
    cred.host = host;
    cred.sellerId = sellerId;
}

exports.flipkartRequest = function (options, callback, postData) {
    var request = {};
    var path = options.path;
    var header = options.headers;
    lastCall(path, callback, header, postData);
}

var lastCall = function (path, callback,header, postData) {
    if (!cred.sellerId) {
        throw ("sellerId must be set");
    }
        var options = {
            hostname: cred.host,
            port: 8080,
            path: path,
            method: 'POST',
            headers: header
        };
        try {
            var str = '';
            var req = https.request(options, function(res) {
                res.on('data', function (chunk) {
                    str += chunk;
                });
                res.on('end', function () {
                    callback(str);
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
};