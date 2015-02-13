function UpdateProductRequest() {
    var opts = {
        name: 'Product',
        group: 'Product Creation',
        path: '/mk/sd/product/updateProducts',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    return opts;
}

exports.calls = {
    UpdateProduct: function () {
        return new UpdateProductRequest({});
    }
};
