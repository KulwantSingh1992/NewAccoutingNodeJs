var paytm = require('../../paytm/paytm');
var paytmCatalog = require('../../paytm/paytmCatalog');
var paytmUpdateProduct = require('../../paytm/paytmUpdateProduct');
var db = require('../../db/db-config').db;
var productDAO = require('../../db/product/productDAO');
var commonDAO = require('../../db/common/commonDAO');
var util = require('../util/util');
var logger = require('../../lib/logger');
var productService = require('./productService');

var channel = 'PTM';
var service = 'catalog';

exports.updateProduct = function (productId){
    productService.fetchData(productId,function (updateData) {
        updateData = JSON.stringify(updateData);
        paytm.paytmClient('21492', '745f103e-f9a4-4caa-9943-a8829335bace');
        var productUpdate = paytmUpdateProduct.calls.ProductUpdate();
        paytm.paytmRequest(productUpdate, function(result){console.log(result);}, 'post', updateData);
    });
    /*var aa={"data": [{"sku": "75457", "mrp": "8888"}]};
    aa = JSON.stringify(aa);
    */
};

exports.startGetProducts = function () { 
    productService.getLastSync(channel, service, function(credentials, extra, lastSync){
        console.log(credentials , extra);
        if(credentials.merchantId && extra.token) {
            try{
                getProducts(credentials.merchantId, extra.token, lastSync);
            }catch(e){
                logger.error(e);
            }
        }
    });
};

var getProducts = function (merchantId, token, lastSync) {
    /*paytm.paytmClient('21492', '745f103e-f9a4-4caa-9943-a8829335bace');*/
        paytm.paytmClient(merchantId, token);
        var listCatalog = paytmCatalog.calls.ListCatalog();
        if(lastSync){
            listCatalog.params.after_id.value = lastSync;
        }
        paytm.paytmRequest(listCatalog, paytmRequestCallback);
    };

    var paytmRequestCallback = function (result) {      
        result = JSON.parse(result);
        for(var i in result){
            var product = [];
            product.push({
                channel_product_id : result[i].id,
                product_title : result[i].name,
                paytm_sku : result[i].paytm_sku,
                seller_old_sku : result[i].sku,
                mrp : result[i].mrp,
                selling_price : result[i].price,
                status : result[i].status,
                last_updated_time : new Date(result[i].updated_at).getTime(),
                merchant_id : result[i].merchant_name,
                is_in_stock : result[i].is_in_stock,
                return_in_days : result[i].return_in_days,
                max_dispatch_time : result[i].max_dispatch_time,
                brand : result[i].brand
            });
            console.log(product);
            //var lastUpdateDateForSync = Date.now();
            productService.createOrUpdateCatalog(product, channel, service, result[i].id, util.updateSync);
        }
    };
    