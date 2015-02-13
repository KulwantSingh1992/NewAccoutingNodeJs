function ProductsRequest() {
    var opts = {
        name: 'Product',
        group: 'Product Creation',
        path: '/mk/sd/product/listProducts',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    return opts;
}

exports.calls = {
    CreateProduct: function () {
        return new ProductsRequest({});
    }
};
