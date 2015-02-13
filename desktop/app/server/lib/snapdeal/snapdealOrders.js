function OrdersRequest() {
    var opts = {
        name: 'Orders',
        group: 'Order Retrieval',
        path: '/mk/sd/order/fetchOrders',
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded' 
        }
    };
    return opts;
}

exports.calls = {
    ListOrders: function () {
        return new OrdersRequest({});
    }
};