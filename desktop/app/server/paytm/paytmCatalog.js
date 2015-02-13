var paytm = require('./paytm');

function CatalogRequest(params) {
    var opts = {
        name: 'Catalog',
        group: 'Inventory Retrieval',
        path: '/v1/merchant/' + paytm.cred.merchantId + '/catalog.json',
        params: params
    };
    return opts;
}

exports.calls = {

    ListCatalog: function () {
        return new CatalogRequest({
            status: {
                name: 'status',
                type: 'Integer'
            },
            is_in_stock: {
                name: 'is_in_stock',
                type: 'Integer'
            },
            stock: {
                name: 'stock',
                type: 'Integer'
            },
            limit: {
                name: 'limit',
                type: 'Integer'
            },
            after_id: {
                name: 'after_id',
                type: 'Integer'
            },
            before_id: {
                name: 'before_id',
                type: 'Integer'
            }
        });
    }
};
