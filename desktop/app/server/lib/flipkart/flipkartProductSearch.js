function ProductSearch() {
    var opts = {
        name: 'Product',
        group: 'Product Search',
        path: '/mk/fk/product/search',
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded' 
        }
    };
    return opts;
}

exports.calls = {
    SearchProduct: function () {
        return new ProductSearch({});
    }
};