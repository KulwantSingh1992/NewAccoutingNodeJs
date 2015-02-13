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
            },
            shipby_before: {
                name: 'shipby_before',
                type: 'Timestamp'
            },
            shipby_after: {
                name: 'shipby_after',
                type: 'Timestamp'
            },//Order id based filters (Only one of these may be applied)
            order_id: {
                name: 'order_id',
                type: 'Number'
            },
            order_ids: {
                name: 'order_ids',
                type: 'Number'
            },
            before_id: {
                name: 'before_id',
                type: 'Number'
            },
            after_id: {
                name: 'after_id',
                type: 'Number'
            },//Status based filters
            status: {
                name: 'status',
                type: 'Number'
            },
            payment_status: {
                name: 'payment_status',
                type: 'Number'
            },//SKU/Item filters
            sku: {
                name: 'sku',
                type: 'String'
            },
            vertical_id: {
                name: 'vertical_id',
                type: 'Number'
            },
            customer_email: {
                name: 'customer_email',
                type: 'String'
            },
            customer_id: {
                name: 'customer_id',
                type: 'Number'
            },//Pagination
            limit: {
                name: 'limit',
                type: 'Number'
            }
        });
    }
};
