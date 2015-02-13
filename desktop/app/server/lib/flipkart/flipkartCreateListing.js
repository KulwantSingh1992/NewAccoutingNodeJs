function ProductsRequest() {
    var opts = {
        name: 'Product',
        group: 'Product Creation',
        path: '/mk/fk/product/listProducts',
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
/*exports.calls = {
    CreateProduct: function () {
        return new ProductsRequest({
            "sellerId": "18248633143f46c8",
            "listingParams": [{
                "fsn": "ACCDDXAFYKSQMCGB",
                "skuId": "PAXACCDDXAFYKSQMCGB",
                "listingStatus": "ACTIVE",
                "localShippingCharge": 100,
                "mrp": 531,
                "nationalShippingCharge": 100,
                "zonalShippingCharge": 100,
                "stockCount": 0,
                "sellingPrice": 400,
                "procurementSla": 3,
                "priceErrorCheck": "disable"
             }]
        });
    }
};*/