var productDB = require('../../db/product/productDAO');
var logger = require('../../lib/logger');
var db = require('../../db/db-config').db;
var tallyProductService = require('./tallyProductservice');
var flipkartProductService = require('./flipkartProductService');
var amazonProductService = require('./amazonProductService');
var snapdealProductService = require('./snapdealProductService');
var configService = require('../config/configService');
var util = require('../util/util');

exports.getProductLikeName = function (prod, cb, err) {
    productDB.getProductLikeName(prod, cb, err);
};

exports.createProduct = function (destination, prod, cb, err, txnId) {
    switch (destination) {
    case 'FK':
        flipkartProductService.createProduct(prod, 'create', txnId);
        break;
    case 'AMAZON':
        amazonProductService.createProduct(prod, 'create', txnId);
        break;
    case 'SD':
        snapdealProductService.createProduct(prod, 'create', txnId);
        break;
    case 'TALLY':
        break;
    case 'DB':
        productDB.createProduct(prod, cb, err, txnId);
        break;
    case 'all':
        flipkartProductService.createProduct(prod, 'create', txnId);
        break;
    }
}

exports.updateProduct = function (destination, prod, cb, err, txnId) {
    switch (destination) {
    case 'FK':
        flipkartProductService.updateProduct(prod, 'update', txnId);
        break;
    case 'SD':
        snapdealProductService.updateProduct(prod, 'update', txnId);
        break;
    case 'AMAZON':
        logger.info(prod);
        amazonProductService.updateProduct(prod, 'update', txnId);
        break;
    case 'TALLY':
        break;
    case 'DB':
        productDB.updateProduct(prod, cb, err, txnId);
        break;
    case 'all':
        amazonProductService.updateProduct(prod, 'update', txnId);
        //flipkartProductService.updateProduct(prod, 'update', txnId);
        break;
    }
}


exports.createOrUpdateProduct = function (destination, sourceIdColumn, sourceIdValue, prod, cb, err, txnId) {
    switch (destination) {
    case 'FK':
        flipkartProductService.createOrUpdateProduct(prod, 'update', txnId);
        break;
    case 'SD':
        snapdealProductService.createOrUpdateProduct(prod, 'update', txnId);
        break;
    case 'AMAZON':
        logger.info(prod);
        amazonProductService.createOrUpdateProduct(prod, 'update', txnId);
        break;
    case 'TALLY':
        break;
    case 'DB':
        productDB.createOrUpdateProduct(sourceIdColumn, sourceIdValue, prod, cb, err, txnId);
        break;
    case 'all':
        logger.info(prod);
        amazonProductService.createOrUpdateProduct(prod, 'update', txnId);
        //flipkartProductService.updateProduct(prod, 'update', txnId);
        break;
    }
}

exports.deleteProduct = function (prodid, cb, err) {
    productDB.deleteProduct(prodid, cb, err);
}

exports.getProductById = function (id, cb, err) {
    productDB.getProductById(id, cb, err);
}

exports.exists = function (existid, cb, err) {
    productDB.exists(existid, cb, err);
}

exports.getDashboardProductData = function (cb, err) {
    //productDB.getProducts

}


exports.getLastSync = function (channel, service, cb) {
    commonDB.getLastSync(channel, service, cb);
};



exports.getProductByChannelId = function (channelName, productId, cb) {
    productDB.getProductByChannelId(channelName, productId, cb, 'null');
}

exports.updateInventory = function (channelName, orderItemQuantity, orderItemProductId) {
    productDB.updateInventory(channelName, orderItemQuantity, orderItemProductId);
}


exports.getProducts = function (source, filter, cb, err, txnId) {
    switch (source) {
    case 'TALLY':
        tallyProductService.getProducts(filter, cb, err, txnId);
        break;
    case 'DB':
        productDB.getProducts(filter, cb, err);
        break;
    }
}