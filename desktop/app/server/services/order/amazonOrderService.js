var amazonMWS = require('../../amazon-mws/amazonmws');
var amazonMWSOrders = require('../../amazon-mws/amazonorders');
var db = require('../../db/db-config').db;
var orderDAO = require('../../db/order/orderDAO');
var commonDAO = require('../../db/common/commonDAO');
var util = require('../util/util');
var logger = require('../../lib/logger');
var orderService = require('./orderService');

var channel = 'AMAZON';
var service = 'orders';

// name it to background process startup
//exports.startGetOrders = function () {
//    logger.debug('Loading orders from Amazon in background ');
//    getOrders(null, amazonMwsRequestCallback, function (err) {
//        logger.error('Error loading order from amazon ' + err);
//
//    });
//};

exports.getOrders = function (cb, err) {
    util.getChannelConfig(channel, service, function (credentials, lastSync) {
        if (credentials.AWSAccessKeyID && credentials.SecretKey && credentials.SellerID && credentials.MarketplaceID) {
            if (!lastSync) {
                lastSync = '1970-01-17T09:37:46Z';
            } else {
                lastSync = util.dateformat(new Date(lastSync));
            }
            logger.info('Loading orders from amazon since update date (' + lastSync + ')');
            try {
                amazonMWS.amazonMwsClient(credentials.AWSAccessKeyID, credentials.SecretKey, credentials.SellerID, {});
                var listOrders = amazonMWSOrders.calls.ListOrders();
                listOrders.params.MarketplaceId.value = credentials.MarketplaceID;
                listOrders.params.CreatedAfter.value = lastSync;
                amazonMWS.amazonMwsRequest(listOrders, amazonMwsRequestCallback);
            } catch (e) {
                logger.error(e);
            }
        } else {
            logger.error('Unable to fetch order data from amazon, configuration data is incorrect');
        }
    });
};


/*
function getOrders(accessKey, secretKey, sellerID, marketplaceId, createdAfter) {
    try {
        amazonMWS.amazonMwsClient(accessKey, secretKey, sellerID, {});
        var listOrders = amazonMWSOrders.calls.ListOrders();
        listOrders.params.MarketplaceId.value = marketplaceId;
        listOrders.params.CreatedAfter.value = createdAfter;
        amazonMWS.amazonMwsRequest(listOrders, amazonMwsRequestCallback);
    } catch (e) {
        throw e;
    }
};

*/
function amazonMwsRequestCallback(result) {
    if (result.ListOrdersResponse) {
        var responseOrderData = result.ListOrdersResponse.ListOrdersResult[0].Orders[0];
        if (Object.prototype.toString.call(responseOrderData.Order) == "[object Object]") {
            responseOrderData = [responseOrderData];
        }

        /* checkToken(result);

        function checkToken(result) {
            if (result.ListOrdersResponse.ListOrdersResult[0].NextToken[0]) {
                var listOrdersByNextToken = new amazonOrderService.calls.ListOrdersByNextToken();
                listOrdersByNextToken.params.NextToken.value = result.ListOrdersResponse.ListOrdersResult[0].NextToken[0];
                amazonMWS.amazonMwsRequest(listOrdersByNextToken, function (tokenResult) {
                    if (Object.prototype.toString.call(tokenResult.ListOrdersResponse.ListOrdersResult[0].Orders[0].Order) == "[object Object]") {
                        tokenResult.ListOrdersResponse.ListOrdersResult[0].Orders[0].Order = [tokenResult.ListOrdersResponse.ListOrdersResult[0].Orders[0].Order];
                    }
                    for (var i in tokenResult.ListOrdersResponse.ListOrdersResult[0].Orders[0].Order) {
            result.ListOrdersResponse.ListOrdersResult[0].Orders[0].Order.push(tokenResult.ListOrdersResponse.ListOrdersResult[0].Orders[0].Order[i]);
                    }
                    checkToken(tokenResult);
                });
            }
        }*/
        if (responseOrderData.Order) {
            var order = {};
            var orderArrayLastIndex = responseOrderData.Order.length - 1;
            var lastUpdateDateForSync = new Date(responseOrderData.Order[orderArrayLastIndex].LastUpdateDate[0]).getTime();
            for (var i in responseOrderData.Order) {
                var data = responseOrderData.Order[i];
                var grandTotal = 0;
                var maxDeliveryDate = '';
                if (data.OrderTotal) {
                    grandTotal = data.OrderTotal[0].Amount[0];
                }
                if (data.LatestDeliveryDate) {
                    maxDeliveryDate = data.LatestDeliveryDate;
                }
                order = {
                    orders_external_id: data.AmazonOrderId[0],
                    orders_channel_id: channel,
                    orders_order_date: data.PurchaseDate,
                    orders_external_status_id: data.OrderStatus[0],
                    orders_status_id: util.amazonOrderStatusEnum[data.OrderStatus],
                    orders_grand_total: grandTotal,
                    orders_last_updated_timestamp: data.LastUpdateDate,
                    order_item_estimated_ship_date: data.LatestShipDate,
                    order_item_estimated_delivery_date: maxDeliveryDate
                };
                orderService.orderCreator(order, data, channel, function (data, orderId, action) {
                    var listOrderItems = amazonMWSOrders.calls.ListOrderItems();
                    listOrderItems.params.AmazonOrderId.value = data.AmazonOrderId[0];
                    amazonMWS.amazonMwsRequest(listOrderItems, function (result) {
                        var responseOrderitemData = result.ListOrderItemsResponse.ListOrderItemsResult[0].OrderItems[0];
                        if (Object.prototype.toString.call(responseOrderitemData.OrderItem) == "[object Object]") {
                            responseOrderitemData = [responseOrderitemData];
                        }
                        /* checkToken(result);

        function checkToken(result) {
            if (result.ListOrderItemsResponse.ListOrderItemsResult[0].NextToken[0]) {
                var listOrderItemsByNextToken = new amazonOrderService.calls.ListOrderItemsByNextToken();
                listOrderItemsByNextToken.params.NextToken.value = result.ListOrderItemsResponse.ListOrderItemsResult[0].NextToken[0];
                amazonMWS.amazonMwsRequest(listOrderItemsByNextToken, function (tokenResult) {
                    if (Object.prototype.toString.call(tokenResult.ListOrderItemsResponse.ListOrderItemsResult[0].OrderItems[0].OrderItem) == "[object Object]") {
                        tokenResult.ListOrderItemsResponse.ListOrderItemsResult[0].OrderItems[0].OrderItem = [tokenResult.ListOrderItemsResponse.ListOrderItemsResult[0].OrderItems[0].OrderItem];
                    }
                    for (var i in tokenResult.ListOrderItemsResponse.ListOrderItemsResult[0].OrderItems[0].OrderItem) {
            result.ListOrderItemsResponse.ListOrderItemsResult[0].OrderItems[0].OrderItem.push(tokenResult.ListOrderItemsResponse.ListOrderItemsResult[0].OrderItems[0].OrderItem[i]);
                    }
                    checkToken(tokenResult);
                });
            }
        }*/
                        if (responseOrderitemData.OrderItem) {
                            //var orderItem = [];
                            var items = [];
                            //orderItem.push([order]);
                            for (var i in responseOrderitemData.OrderItem) {
                                var grandTotal = 0;
                                var unitPrice = 0;
                                if (responseOrderitemData.OrderItem[i].ItemPrice) {
                                    unitPrice = responseOrderitemData.OrderItem[i].ItemPrice[0].Amount[0];
                                    grandTotal = parseInt(unitPrice) * parseInt(responseOrderitemData.OrderItem[i].QuantityOrdered[0]);
                                }
                                items.push({
                                    order_item_order_id: orderId,
                                    order_item_id: responseOrderitemData.OrderItem[i].OrderItemId[0],
                                    order_item_external_id: result.ListOrderItemsResponse.ListOrderItemsResult[0].AmazonOrderId[0],
                                    order_item_channel_id: channel,
                                    order_item_grand_total: grandTotal,
                                    order_item_quantity: responseOrderitemData.OrderItem[i].QuantityOrdered[0],
                                    order_item_unit_price: unitPrice,
                                    order_item_product_id: responseOrderitemData.OrderItem[i].SellerSKU[0],
                                    order_item_external_product_id: responseOrderitemData.OrderItem[i].ASIN[0],
                                    order_item_name: responseOrderitemData.OrderItem[i].Title[0],
                                    order_item_order_date: new Date(order.orders_order_date).getTime(),
                                    order_item_status_id: order.orders_status_id,
                                    order_item_external_status_id: order.orders_external_status_id,
                                    order_item_estimated_ship_date: order.order_item_estimated_ship_date,
                                    order_item_estimated_delivery_date: order.order_item_estimated_delivery_date,
                                    order_item_last_updated_timestamp: order.orders_last_updated_timestamp
                                });
                            }
                            orderService.orderItemCreator(items, action);
                            /*orderItem.push(items);
            orderService.createOrUpdateOrder(orderItem, channel, service, lastUpdateDateForSync, util.updateSync);*/
                        } else {
                            logger.info("No Orders Found!!");
                        }
                    });


                });
                //getItems(order, lastUpdateDateForSync);
            }
        } else {
            logger.info("No Orders Found for AMAZON!");
        }
    } else {
        logger.error("Result Not Returned for AMAZON MWS because " + result.ErrorResponse.Error[0].Message[0]);
    }
}

//function getItems(order, lastUpdateDateForSync) {
//    var listOrderItems = amazonMWSOrders.calls.ListOrderItems();
//    listOrderItems.params.AmazonOrderId.value = order.orders_external_id;
//    amazonMWS.amazonMwsRequest(listOrderItems, function (result) {
//        var responseOrderitemData = result.ListOrderItemsResponse.ListOrderItemsResult[0].OrderItems[0];
//        if (Object.prototype.toString.call(responseOrderitemData.OrderItem) == "[object Object]") {
//            responseOrderitemData = [responseOrderitemData];
//        }
//        /* checkToken(result);
//
//        function checkToken(result) {
//            if (result.ListOrderItemsResponse.ListOrderItemsResult[0].NextToken[0]) {
//                var listOrderItemsByNextToken = new amazonOrderService.calls.ListOrderItemsByNextToken();
//                listOrderItemsByNextToken.params.NextToken.value = result.ListOrderItemsResponse.ListOrderItemsResult[0].NextToken[0];
//                amazonMWS.amazonMwsRequest(listOrderItemsByNextToken, function (tokenResult) {
//                    if (Object.prototype.toString.call(tokenResult.ListOrderItemsResponse.ListOrderItemsResult[0].OrderItems[0].OrderItem) == "[object Object]") {
//                        tokenResult.ListOrderItemsResponse.ListOrderItemsResult[0].OrderItems[0].OrderItem = [tokenResult.ListOrderItemsResponse.ListOrderItemsResult[0].OrderItems[0].OrderItem];
//                    }
//                    for (var i in tokenResult.ListOrderItemsResponse.ListOrderItemsResult[0].OrderItems[0].OrderItem) {
//            result.ListOrderItemsResponse.ListOrderItemsResult[0].OrderItems[0].OrderItem.push(tokenResult.ListOrderItemsResponse.ListOrderItemsResult[0].OrderItems[0].OrderItem[i]);
//                    }
//                    checkToken(tokenResult);
//                });
//            }
//        }*/
//        if (responseOrderitemData.OrderItem) {
//            //var orderItem = [];
//            var items = [];
//            //orderItem.push([order]);
//            for (var i in responseOrderitemData.OrderItem) {
//                var grandTotal = 0;
//                var unitPrice = 0;
//                if (responseOrderitemData.OrderItem[i].ItemPrice) {
//                    unitPrice = responseOrderitemData.OrderItem[i].ItemPrice[0].Amount[0];
//                    grandTotal = parseInt(unitPrice) * parseInt(responseOrderitemData.OrderItem[i].QuantityOrdered[0]);
//                }
//                items.push({
//                    order_item_id: responseOrderitemData.OrderItem[i].OrderItemId,
//                    order_item_external_id: result.ListOrderItemsResponse.ListOrderItemsResult[0].AmazonOrderId,
//                    order_item_grand_total: grandTotal,
//                    order_item_quantity: responseOrderitemData.OrderItem[i].QuantityOrdered,
//                    order_item_unit_price: unitPrice,
//                    order_item_product_id: responseOrderitemData.OrderItem[i].SellerSKU,
//                    order_item_external_product_id: responseOrderitemData.OrderItem[i].ASIN,
//                    order_item_name: responseOrderitemData.OrderItem[i].Title,
//                    order_item_status_id: order.orders_status_id,
//                    order_item_estimated_ship_date: order.order_item_estimated_ship_date,
//                    order_item_estimated_delivery_date: order.order_item_estimated_delivery_date,
//                    order_item_last_updated_timestamp: order.orders_last_updated_timestamp
//                });
//            }
//            orderService.orderItemCreator(items, action);
//            /*orderItem.push(items);
//            orderService.createOrUpdateOrder(orderItem, channel, service, lastUpdateDateForSync, util.updateSync);*/
//        } else {
//            logger.info("No Orders Found!!");
//        }
//    });
//}