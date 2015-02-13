var paytm = require('./paytm');

function ProductUpdateRequest(params) {
    var opts = {
        name: 'Product',
        group: 'Product Update',
        path: '/v1/merchant/' + paytm.cred.merchantId + '/product.json',
        params: params
    };
    return opts;
}

exports.calls = {

    ProductUpdate: function () {
        return new ProductUpdateRequest({});
    }
};

