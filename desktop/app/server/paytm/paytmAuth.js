var paytm = require('./paytm');

function OrdersRequest(params) {
    var opts = {
        name: 'Orders',
        group: 'Order Retrieval',
        path: '/v1/merchant/' + paytm.cred.merchantId + '/orders.json',
        params: params
    };
    return opts;
}

exports.calls = {

    ListOrders: function () {
        return new OrdersRequest({
            placed_before: {
                name: 'placed_before',
                type: 'Timestamp'
            },
            placed_after: {
                name: 'placed_after',
                type: 'Timestamp'
            }
        });
    }
};
