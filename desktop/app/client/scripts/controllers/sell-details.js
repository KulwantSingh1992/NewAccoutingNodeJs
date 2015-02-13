'use strict';

/**
 * @ngdoc function
 * @name paxcomTerminalApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the paxcomTerminalApp
 */
angular.module('paxcomTerminalApp').controller('SellDetailsCtrl', function ($scope, $http, growl, inventoryService, configService) {
    $scope.products = [];
    $scope.values = [];
    $scope.productFilterForm = {};
    $scope.productsFilterFormForMapping = {};
    $scope.productsForMapping = [];
    $scope.activeChannelsConfigs = inventoryService.getActiveChannelConfig();
    $scope.productPagination = {
        totalItems: 0,
        currentPage: 1,
        maxSize: 5
    }
    $scope.tempProduct = {};
    
    var msgConfig = {
        ttl: 5000
    };
    var intervalObject = {};

    $scope.openSellDataModal = function (val) {
        $scope.productsForMapping = angular.copy([val]);
        $scope.tempProduct = val;
        $('#map-product-form')[0].reset();
        $('#selldatamodal').modal('show');
        setTimeout(function(){
            if(val.sku) {
                $('#map-form-product-sku').attr('disabled', 'disabled');
            } else {
                $('#map-form-product-sku').removeAttr('disabled');
            }
        }, 275);
    }
	
	$scope.sendPname = function(name){
		console.log(name);
		
	}
	$scope.setMarketPlaceSerialNo = function(val){
		console.log(val);
		var channel = $("#product-search-markeplaceId").val();	
		$("#"+channel+"-sku-id").val(val);		
		$scope.closeSearchOnChannelModal();
	}
	
	$scope.searchProductOnChannel = function(query,parent, marketplaceId){
		 showLoader();
		if(parent == 'atag') {
			$scope.searchQuery=query;	
			$("#product-search-field").val(query);			
			$("#product-search-markeplaceId").val(marketplaceId);
		}
		else {
			$scope.searchQuery = $("#product-search-field").val();				
		}
		var channel = $("#product-search-markeplaceId").val();	
		console.log(query);
		$http.get('/search/'+channel+'/'+$scope.searchQuery).success(function (transactionDetails) {
			
			 hideLoader();
			console.log(transactionDetails);
			$scope.listProduct = transactionDetails;
			$scope.productSearchMarkeplaceId = channel;
			//$scope.listProduct = {productDetails:[]};
		});
	}

	$scope.closeSearchOnChannelModal = function(){
		$scope.listProduct = [];
		$scope.productSearchMarkeplaceId = "";
		//$("#searchOnChannelModal").find("table").empty();
		$("#searchOnChannelModal").modal("hide");
	}
    function populateProductTable(result) {
        $scope.products = [];
        if (!result.error) {
            var products = result;   
                products.map(function (product) {
                    product.extra = {};
                    var channelExists = [];
                    for (var i = 0; i < $scope.activeChannelsConfigs.length; i++) {
                        if (product[$scope.activeChannelsConfigs[i].channelName + '_channel_sku']) {
                            product.extra[$scope.activeChannelsConfigs[i].marketplaceExists] = true;
                            channelExists.push(true);
                        } else {
                            channelExists.push(false);
                        }
                        var key = $scope.activeChannelsConfigs[i].channelName + '_additional_info';
                        product[key] = JSON.parse(product[key]);
                    };

                    product.extra.noChannelExists = eval(channelExists.map(function (item) {
                        return !item
                    }).join(' && '));
                    product.extra.anyChannelExists = eval(channelExists.join(' || '));
                    $scope.products.push(product);
                });
            
        }
        $scope.productPagination.totalItems = $scope.products.length;
        $scope.productPagination.currentPage = 1;
        loadDataForCurrentPage();
        console.log($scope.values);
        hideLoader();
        setTimeout(function () {
            $('[data-toggle="tooltip"]').tooltip();
        }, 2000);
    }

    $scope.pageChanged = function () {
        console.log($scope.productPagination.currentPage);
        setTimeout(function () {
            $('[data-toggle="tooltip"]').tooltip();
        }, 2000);
        loadDataForCurrentPage()
    }

    function loadDataForCurrentPage() {
        var currentPage = $scope.productPagination.currentPage - 1;
        var start = currentPage * 10;
        var end = currentPage * 10 + 10;
        $scope.values = angular.copy($scope.products.slice(start, end));
    }

    $scope.updateProductsForMapping = function () {
        $scope.productsForMapping.map(function (item, count) {
            var product = angular.copy(item);
            product.sku = $scope.tempProduct.sku;
            var currProdRow = $('[data-id="product-map-' + item.id + '"]');
            if (!product.sku) {
                currProdRow.find('input[name="sku-input-'+item.id+'"]').css({
                    'border': '1px solid red'
                });
                growl.addErrorMessage('Product SKU must be filled.', msgConfig);
                return false;
            } else {
                currProdRow.find('input[name="newMrp"]').css({
                    'border': '1px solid #ccc'
                });
            }
            for (var i = 0; i < $scope.activeChannelsConfigs.length; i++) {
                var marketplaceSellerSku = $scope.activeChannelsConfigs[i].channelName + '_seller_sku';
                if (!product[marketplaceSellerSku]) {
                    product[marketplaceSellerSku] = product.sku
                }
            };
            var statusOfEmpty = validateMapProducts(product);
            if (statusOfEmpty == true) {
                $http.post('/product/update', product).success(function (result) {
                    if(result.error){
                        growl.addErrorMessage(result.error, msgConfig);
                        return false;
                    }else{
                        $('#selldatamodal').modal('hide');
                        growl.addSuccessMessage('Product mapped successfully', msgConfig);
                        $scope.products.map(function (item, count) {
                            if (item.id == product.id) {
                                $scope.products[count] = product;
                                $scope.activeChannelsConfigs.map(function(channelsConfigs) {
                                    if(product[channelsConfigs.channelName + '_channel_sku']) {
                                        $scope.products[count].extra[channelsConfigs.marketplaceExists] = true;
                                        $scope.products[count].extra.noChannelExists = false;
                                        $scope.products[count].extra.anyChannelExists = true;
                                    }
                                });
                            }
                        });
                        $scope.values.map(function (item, count) {
                            if (item.id == product.id) {
                                $scope.values[count] = product;
                                $scope.activeChannelsConfigs.map(function(channelsConfigs) {
                                    if(product[channelsConfigs.channelName + '_channel_sku']) {
                                        $scope.values[count].extra[channelsConfigs.marketplaceExists] = true;
                                        $scope.products[count].extra.noChannelExists = false;
                                        $scope.products[count].extra.anyChannelExists = true;
                                    }
                                });
                            }
                        });
                    }
                }).error(function (){
                    growl.addErrorMessage('Server Side Error Occured', msgConfig);
                });
            }
        });
        setTimeout(function () {
            $('[data-toggle="tooltip"]').tooltip();
        }, 1000);
    };

    //validation for mapProducts
    function validateMapProducts(product) {
        console.log("product name is " + $scope.tempProduct.sku);
        var checkForEmpty = true;
        var channelValueExists = false;

        $scope.activeChannelsConfigs.map(function (channel) {
            if (product[channel.channelName + '_channel_sku']) {
                channelValueExists = true;
            }
        });

        if (channelValueExists && !$scope.tempProduct.sku) {
            checkForEmpty = false;
            $('input[name="sku-input-' + product.id + '"]').css('border', '1px solid red');
        } else {
            $('input[name="sku-input-' + product.id + '"]').css("border-color", "#ccc");
        }

        return checkForEmpty;
    }

    /*search product functionality start*/
    $scope.searchProductByName = function (searchTxt) {
        if($scope.main.dashboard == "selllist") {
            $scope.productFilterForm.status = 'all';
        }
        $scope.searchProductWithFilter(searchTxt);
    };

    $scope.searchProductByNameForMapping = function () {
        showLoader();
        $http.post('/product', $scope.productsFilterFormForMapping).success(function (products) {
            $scope.productsForMapping = products;
            hideLoader();
        });
    };

    $scope.searchProductWithFilter = function (searchTxt) {
            if (searchTxt == 'searchText') {
                $scope.productFilterForm.name = $scope.productFilterForm.name.replace(/[^\w\s]/gi, '');
            }
            showLoader();
            $('.action').find('.btn-danger').hide();
            $('input').css('border', '');
            $http.post('/product', $scope.productFilterForm).success(function (products) {
                populateProductTable(products);
            });
        }
        /*search product functionality end*/

    $scope.syncInventory = function () {
        var syncInventoryLoader = $('.sync-inventory-loader');
        var init = function () {
            $http.get('/products/tally/load').success(function (transactionDetails) {
                var intervalName = 'syncInventory';
                var data = {
                    intervalName: intervalName
                };
                checkTransactionStatus(transactionDetails, data, syncInventoryTransactionStatusCallback);
                intervalObject[intervalName] = setInterval(function () {
                    checkTransactionStatus(transactionDetails, data, syncInventoryTransactionStatusCallback);
                }, 2000);
            });
        }
        var syncInventoryTransactionStatusCallback = function (statusResult, data) {
           console.log(statusResult);
            if (statusResult.txnStatus == "processing") {
                processingCallback(data);
            } else if (statusResult.txnStatus == "completed") {
                completedCallback(data);
            } else if (statusResult.txnStatus == "failed") {
                failedCallback(data);
            }
        }
        var processingCallback = function (data) {
            syncInventoryLoader.show();
        }
        var completedCallback = function (data) {
            clearInterval(intervalObject[data.intervalName]);
            delete intervalObject[data.intervalName];
            $http.post('/product', $scope.productFilterForm).success(function (products) {
                growl.addSuccessMessage('Inventory synced successfully', msgConfig);
                populateProductTable(products);
                syncInventoryLoader.hide();
            }).error(function (err) {
                hideLoader();
                syncInventoryLoader.hide();
            });
        }
        var failedCallback = function (data) {
            clearInterval(intervalObject[data.intervalName]);
            delete intervalObject[data.intervalName];
            growl.addErrorMessage('Failed to sync inventory', msgConfig);
            syncInventoryLoader.hide();
        }
        return {
            init: init
        };
    }


    $scope.listSellData = function (product, marketplaceID) {
        if (product.newMrp) {
            product.mrp = product.newMrp;
        }
        delete product.newMrp;
        var productId = product.id;
        var currProductRow = $('[data-id="product-row-' + product.id + '"]');
        if (product.mrp < product.min_price) {
            currProductRow.find('input[name="newMrp"]').css({
                'border': '1px solid red'
            });
            growl.addErrorMessage('MRP should be greater than or equal to Selling Price', msgConfig);
            return false;
        } else {
            currProductRow.find('input[name="newMrp"]').css({
                'border': '1px solid #ccc'
            });

            var config = configService.getConfig();
            console.log("config " + config);
            var minSlaStr = config[marketplaceID].settingDetails.MinSLAValue;
            var maxSlaStr = config[marketplaceID].settingDetails.MaxSLAValue;
            
           var minSla = parseInt(minSlaStr);
           var maxSla = parseInt(maxSlaStr);

            var returnBool = listValidation(product, marketplaceID, minSla, maxSla);
            if (returnBool == true) {
                $http.post('/product/publish/' + marketplaceID, product).success(function (publishResult) {
                    var intervalName = 'product' + productId;
                    var data = {
                        productId: productId,
                        marketplaceID: marketplaceID,
                        intervalName: intervalName
                    };
                    checkTransactionStatus(publishResult, data, checkListSellDataIntervalCallback);
                    intervalObject[intervalName] = setInterval(function () {
                        checkTransactionStatus(publishResult, data, checkListSellDataIntervalCallback);
                    }, 2000);
                }).error(function () {

                });
            }
        }
    };

    //listValidation function
    function listValidation(product, marketplaceID, minSla, maxSla) {
        var validateKey = false;
        switch (marketplaceID) {
        case 'FK':
            {
                validateKey = flipkartListValidation(product, minSla, maxSla);
            }
            break;
        case 'SD':
            {
                validateKey = snapdealListValidation(product, minSla, maxSla);
            }
            break;
        case 'AMAZON':
            {
                validateKey = amazonListValidation(product, minSla, maxSla);
            }
            break;
        }

        return validateKey;
    }


    //validation flipkart list
    function flipkartListValidation(product, minSla, maxSla) {
        var checkForEmpty = true;
        var currentPoductRow = $('[data-id="product-fk-' + product.id + '"]');
        var decimalOnly = /^\s*-?[1-9]\d*(\.\d{0})?\s*$/;
        var numbersOnly = /^\d+$/;
        var alphanumericOnly = new RegExp("^[a-zA-Z0-9]+$");
        currentPoductRow.find('button[name="seller_sku"]').hide();

        if (!product.FK_channel_sku) {
            checkForEmpty = false;
        } else {}

        if (!product.FK_seller_sku) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="seller_sku"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="seller_sku"]').show();
            currentPoductRow.find('button[name="seller_sku"]').attr('data-original-title', 'Seller Sku field is required');
        } else {
            currentPoductRow.find('input[name="seller_sku"]').css({
                'border-color': '#ccc'
            });
            currentPoductRow.find('button[name="seller_sku"]').hide();
            currentPoductRow.find('button[name="seller_sku"]').attr('data-original-title', '');
        }

        if (!product.FK_listed_price) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="listed_price"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="listed_price"]').show();
            currentPoductRow.find('button[name="listed_price"]').attr('data-original-title', 'Listed price field is required');
        } else if (!numbersOnly.test(product.FK_listed_price)) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="listed_price"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="listed_price"]').show();
            if (product.FK_listed_price < 0) {
                currentPoductRow.find('button[name="listed_price"]').attr('data-original-title', 'Listed price should be greater than 0');
            } else {
                currentPoductRow.find('button[name="listed_price"]').attr('data-original-title', 'Listed price should be numeric');
            }
        } else {
            currentPoductRow.find('input[name="listed_price"]').css({
                'border-color': '#ccc'
            });
            currentPoductRow.find('button[name="listed_price"]').hide();
            currentPoductRow.find('button[name="listed_price"]').attr('data-original-title', '');
        }

        if (!product.FK_additional_info.procurement_sla.toString()) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="procurement_sla"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="procurement_sla"]').show();
            currentPoductRow.find('button[name="procurement_sla"]').attr('data-original-title', 'Procurement SLA field is required');
        } else {
            if (!numbersOnly.test(product.FK_additional_info.procurement_sla)) {
                checkForEmpty = false;
                currentPoductRow.find('input[name="procurement_sla"]').css({
                    'border': '1px solid red'
                });
                currentPoductRow.find('button[name="procurement_sla"]').show();
                if (product.FK_additional_info.procurement_sla < 0) {
                    currentPoductRow.find('button[name="procurement_sla"]').attr('data-original-title', 'Procurement SLA should be greater than 0');
                } else {
                    currentPoductRow.find('button[name="procurement_sla"]').attr('data-original-title', 'Procurement SLA should be numeric');
                }
            } else {
                if (product.FK_additional_info.procurement_sla < minSla || product.FK_additional_info.procurement_sla > maxSla) {
                    checkForEmpty = false;
                    currentPoductRow.find('input[name="procurement_sla"]').css({
                        'border': '1px solid red'
                    });
                    currentPoductRow.find('button[name="procurement_sla"]').show();
                    currentPoductRow.find('button[name="procurement_sla"]').attr('data-original-title', 'Procurement SLA should be in range ' + minSla + ' to ' + maxSla);
                } else {
                    currentPoductRow.find('input[name="procurement_sla"]').css({
                        'border-color': '#ccc'
                    });
                    currentPoductRow.find('button[name="procurement_sla"]').hide();
                    currentPoductRow.find('button[name="procurement_sla"]').attr('data-original-title', '');
                }

            }
        }

        if (!product.FK_additional_info.local_shipping_charge.toString()) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="local_shipping_charge"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="local_shipping_charge"]').show();
            currentPoductRow.find('button[name="local_shipping_charge"]').attr('data-original-title', 'Local Shipping charge field is required');
        } else if (!numbersOnly.test(product.FK_additional_info.local_shipping_charge)) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="local_shipping_charge"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="local_shipping_charge"]').show();
            if (product.FK_additional_info.local_shipping_charge < 0) {
                currentPoductRow.find('button[name="local_shipping_charge"]').attr('data-original-title', 'Local Shipping charge should be greater than 0');
            } else {
                currentPoductRow.find('button[name="local_shipping_charge"]').attr('data-original-title', 'Local Shipping charge should be numeric');
            }
        } else {
            currentPoductRow.find('input[name="local_shipping_charge"]').css({
                'border-color': '#ccc'
            });
            currentPoductRow.find('button[name="local_shipping_charge"]').hide();
            currentPoductRow.find('button[name="local_shipping_charge"]').attr('data-original-title', '');
        }

        if (!product.FK_additional_info.national_shipping_charge.toString()) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="national_shipping_charge"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="national_shipping_charge"]').show();
            currentPoductRow.find('button[name="national_shipping_charge"]').attr('data-original-title', 'National Shipping charge field is required');
        } else if (!numbersOnly.test(product.FK_additional_info.national_shipping_charge)) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="national_shipping_charge"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="national_shipping_charge"]').show();

            if (product.FK_additional_info.national_shipping_charge < 0) {
                currentPoductRow.find('button[name="national_shipping_charge"]').attr('data-original-title', 'National Shipping charge should be greater than 0');
            } else {
                currentPoductRow.find('button[name="national_shipping_charge"]').attr('data-original-title', 'National Shipping charge should be numeric');
            }
        } else {
            currentPoductRow.find('input[name="national_shipping_charge"]').css({
                'border-color': '#ccc'
            });
            currentPoductRow.find('button[name="national_shipping_charge"]').hide();
            currentPoductRow.find('button[name="national_shipping_charge"]').attr('data-original-title', '');
        }

        if (!product.FK_additional_info.zonal_shipping_charge.toString()) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="zonal_shipping_charge"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="zonal_shipping_charge"]').show();
            currentPoductRow.find('button[name="zonal_shipping_charge"]').attr('data-original-title', 'Zonal Shipping charge field is required');
        } else if (!numbersOnly.test(product.FK_additional_info.zonal_shipping_charge)) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="zonal_shipping_charge"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="zonal_shipping_charge"]').show();

            if (product.FK_additional_info.zonal_shipping_charge < 0) {
                currentPoductRow.find('button[name="zonal_shipping_charge"]').attr('data-original-title', 'Zonal Shipping charge should be greater than 0');
            } else {
                currentPoductRow.find('button[name="zonal_shipping_charge"]').attr('data-original-title', 'Zonal Shipping charge should be numeric');
            }
        } else {
            currentPoductRow.find('input[name="zonal_shipping_charge"]').css({
                'border-color': '#ccc'
            });
            currentPoductRow.find('button[name="zonal_shipping_charge"]').hide();
            currentPoductRow.find('button[name="zonal_shipping_charge"]').attr('data-original-title', '');
        }

        return checkForEmpty;
    }

    //validate SnapdealList
    function snapdealListValidation(product, minSla, maxSla) {
        var checkForEmpty = true;
        var currentPoductRow = $('[data-id="product-sd-' + product.id + '"]');
        var decimalOnly = /^\s*-?[1-9]\d*(\.\d{0})?\s*$/;
        var numbersOnly = /^\d+$/;
        var alphanumericOnly = new RegExp("^[a-zA-Z0-9]+$");
        currentPoductRow.find('button[name="seller_sku"]').hide();

        if (!product.SD_channel_sku) {
            checkForEmpty = false;
        } else {}

        if (!product.SD_seller_sku) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="seller_sku"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="seller_sku"]').show();
            currentPoductRow.find('button[name="seller_sku"]').attr('data-original-title', 'Seller Sku field is required');
        } else { 
            currentPoductRow.find('input[name="seller_sku"]').css({
                'border-color': '#ccc'
            });

            currentPoductRow.find('button[name="seller_sku"]').hide();
            currentPoductRow.find('button[name="seller_sku"]').attr('data-original-title', '');
        }

        if (!product.SD_listed_price) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="listed_price"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="listed_price"]').show();
            currentPoductRow.find('button[name="listed_price"]').attr('data-original-title', 'Listed price field is required');
        } else if (!numbersOnly.test(product.SD_listed_price)) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="listed_price"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="listed_price"]').show();

            if (product.SD_listed_price < 0) {
                currentPoductRow.find('button[name="listed_price"]').attr('data-original-title', 'Listed price should be greater than 0');
            } else {
                currentPoductRow.find('button[name="listed_price"]').attr('data-original-title', 'Listed price should be numeric');
            }
        } else {
            currentPoductRow.find('input[name="listed_price"]').css({
                'border-color': '#ccc'
            });
            currentPoductRow.find('button[name="listed_price"]').hide();
            currentPoductRow.find('button[name="listed_price"]').attr('data-original-title', '');
        }

        if (!product.SD_additional_info.dispatch_sla.toString()) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="dispatch_sla"]').css({
                'border': '1px solid red'
            });

            currentPoductRow.find('button[name="dispatch_sla"]').show();
            currentPoductRow.find('button[name="dispatch_sla"]').attr('data-original-title', 'Disptch SLA field is required');
        } else {
            if (!numbersOnly.test(product.SD_additional_info.dispatch_sla)) {
                checkForEmpty = false;
                currentPoductRow.find('input[name="dispatch_sla"]').css({
                    'border': '1px solid red'
                });
                currentPoductRow.find('button[name="dispatch_sla"]').show();
                if (product.SD_additional_info.dispatch_sla < 0) {
                    currentPoductRow.find('button[name="dispatch_sla"]').attr('data-original-title', 'Disptch SLA should be greater than 0');
                } else {
                    currentPoductRow.find('button[name="dispatch_sla"]').attr('data-original-title', 'Disptch SLA should be numeric');
                }
            } else {
                if (product.SD_additional_info.dispatch_sla < minSla || product.SD_additional_info.dispatch_sla > maxSla) {
                    checkForEmpty = false;
                    currentPoductRow.find('input[name="dispatch_sla"]').css({
                        'border': '1px solid red'
                    });
                    currentPoductRow.find('button[name="dispatch_sla"]').show();
                    currentPoductRow.find('button[name="dispatch_sla"]').attr('data-original-title', 'Disptch SLA should be in range ' + minSla + ' to ' + maxSla);
                } else {
                    currentPoductRow.find('input[name="dispatch_sla"]').css({
                        'border-color': '#ccc'
                    });
                    currentPoductRow.find('button[name="dispatch_sla"]').hide();
                    currentPoductRow.find('button[name="dispatch_sla"]').attr('data-original-title', '');
                }
            }
        }

        return checkForEmpty;
    }

    //validation amazon list
    function amazonListValidation(product, minSla, maxSla) {
        var checkForEmpty = true;
        var currentPoductRow = $('[data-id="product-amazon-' + product.id + '"]');
        var decimalOnly = /^\s*-?[1-9]\d*(\.\d{0})?\s*$/;
        var numbersOnly = /^\d+$/;
        var alphanumericOnly = new RegExp("^[a-zA-Z0-9]+$");
        currentPoductRow.find('button[name="seller_sku"]').hide();

        if (!product.AMAZON_channel_sku) {
            checkForEmpty = false;
        } else {}

        if (!product.AMAZON_seller_sku) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="seller_sku"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="seller_sku"]').show();
            currentPoductRow.find('button[name="seller_sku"]').attr('data-original-title', 'Seller Sku field is required');
        } else {
            currentPoductRow.find('input[name="seller_sku"]').css({
                'border-color': '#ccc'
            });
            currentPoductRow.find('button[name="seller_sku"]').hide();
            currentPoductRow.find('button[name="seller_sku"]').attr('data-original-title', '');
        }

        if (!product.AMAZON_listed_price) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="listed_price"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="listed_price"]').show();
            currentPoductRow.find('button[name="listed_price"]').attr('data-original-title', 'Listed price field is required');
        } else if (!numbersOnly.test(product.AMAZON_listed_price)) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="listed_price"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="listed_price"]').show();
            if (product.AMAZON_listed_price < 0) {
                currentPoductRow.find('button[name="listed_price"]').attr('data-original-title', 'Listed price should be grerater than 0');
            } else {
                currentPoductRow.find('button[name="listed_price"]').attr('data-original-title', 'Listed price should be numeric');
            }
        } else {
            currentPoductRow.find('input[name="listed_price"]').css({
                'border-color': '#ccc'
            });
            currentPoductRow.find('button[name="listed_price"]').hide();
            currentPoductRow.find('button[name="listed_price"]').attr('data-original-title', '');
        }

        if (!product.AMAZON_additional_info.leadtime_to_ship.toString()) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="leadtime_to_ship"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="leadtime_to_ship"]').show();
            currentPoductRow.find('button[name="leadtime_to_ship"]').attr('data-original-title', 'SLA field is required');
            currentPoductRow.find('button[name="leadtime_to_ship"]').attr('data-original-title', 'Leading time to ship field is required');
        } else {

            if (!numbersOnly.test(product.AMAZON_additional_info.leadtime_to_ship)) {
                checkForEmpty = false;
                currentPoductRow.find('input[name="leadtime_to_ship"]').css({
                    'border': '1px solid red'
                });
                currentPoductRow.find('button[name="leadtime_to_ship"]').show();
                if (product.AMAZON_additional_info.leadtime_to_ship < 0) {
                    currentPoductRow.find('button[name="leadtime_to_ship"]').attr('data-original-title', 'Leading time to ship should be greater than 0');
                } else {
                    currentPoductRow.find('button[name="leadtime_to_ship"]').attr('data-original-title', 'Leading time to ship should be numeric');
                }
            } else {
                if (product.AMAZON_additional_info.leadtime_to_ship < minSla || product.AMAZON_additional_info.leadtime_to_ship > maxSla) {
                    checkForEmpty = false;
                    currentPoductRow.find('input[name="leadtime_to_ship"]').css({
                        'border': '1px solid red'
                    });
                    currentPoductRow.find('button[name="leadtime_to_ship"]').show();
                    currentPoductRow.find('button[name="leadtime_to_ship"]').attr('data-original-title', 'Leading to ship should be in range ' + minSla + ' to ' + maxSla);
                } else {
                    currentPoductRow.find('input[name="leadtime_to_ship"]').css({
                        'border-color': '#ccc'
                    });
                    currentPoductRow.find('button[name="leadtime_to_ship"]').hide();
                    currentPoductRow.find('button[name="leadtime_to_ship"]').attr('data-original-title', '');
                }
            }
        }
        return checkForEmpty;
    }

    $scope.listAndSellSellData = function (newProduct) {
        var productId = newProduct.id;
        var oldValuesOfProduct = $scope.products.filter(function (prod) {
            return prod.id == productId;
        })[0];
        $scope.activeChannelsConfigs.map(function (channelConfigs, count) {
            var marketplaceID = channelConfigs.channelName;
            var availableQuantity = marketplaceID + '_available_quantity';
            var listedPrice = marketplaceID + '_listed_price';
            if (oldValuesOfProduct[availableQuantity] != newProduct[availableQuantity] || oldValuesOfProduct[listedPrice] != newProduct[listedPrice]) {
                $scope.products.filter(function (prod) {
                    return prod.id == productId;
                })[0][availableQuantity] = newProduct[availableQuantity];
                $scope.products.filter(function (prod) {
                    return prod.id == productId;
                })[0][listedPrice] = newProduct[listedPrice];
                var isValid = listValidationQuickSell(newProduct, marketplaceID);

                if (isValid == true) {
                    $http.post('/product/sell/' + marketplaceID, newProduct).success(function (publishResult) {
                        var intervalName = 'product' + marketplaceID + productId;
                        var data = {
                            productId: productId,
                            marketplaceID: marketplaceID,
                            intervalName: intervalName
                        };
                        checkTransactionStatus(publishResult, data, checkListSellDataIntervalCallback);
                        intervalObject[intervalName] = setInterval(function () {
                            checkTransactionStatus(publishResult, data, checkListSellDataIntervalCallback);
                        }, 2000);
                    }).error(function () {

                    });
                }
            }
        });
    };


    //listValidation function
    function listValidationQuickSell(product, marketplaceID) {
        var validateKey = false;
        switch (marketplaceID) {
        case 'FK':
            {
                validateKey = flipkartListValidationQickSell(product);
            }
            break;
        case 'SD':
            {
                validateKey = snapdealListValidationQickSell(product);
            }
            break;
        case 'AMAZON':
            {
                validateKey = amazonListValidationQickSell(product);
            }
            break;
        }

        return validateKey;
    }


    // validation flipkart quick sell
    function flipkartListValidationQickSell(product) {
        var checkForEmpty = true;
        var currentPoductRow = $('[data-id="product-' + product.id + '"]');
        var decimalOnly = /^\s*-?[1-9]\d*(\.\d{0})?\s*$/;
        var numbersOnly = /^\d+$/;
        var alphanumericOnly = new RegExp("^[a-zA-Z0-9]+$");
        //currentPoductRow.find('button[name="seller_sku"]').hide();

        if (!product.FK_available_quantity) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="FK_available_quantity"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="FK_available_quantity_button"]').show();
            currentPoductRow.find('button[name="FK_available_quantity_button"]').attr('data-original-title', 'Available quantity field is required');
        }else if (!numbersOnly.test(product.FK_available_quantity)) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="FK_available_quantity"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="FK_available_quantity_button"]').show();

            if (product.FK_available_quantity < 0) {
                currentPoductRow.find('button[name="FK_available_quantity_button"]').attr('data-original-title', 'Available quantity must be greater than 0');
            } else {
                currentPoductRow.find('button[name="FK_available_quantity_button"]').attr('data-original-title', 'Available quantity must be numeric');
            }

        }else {
            currentPoductRow.find('input[name="FK_available_quantity"]').css({
                'border-color': '#ccc'
            });
            currentPoductRow.find('button[name="FK_available_quantity_button"]').hide();
            currentPoductRow.find('button[name="FK_available_quantity_button"]').attr('data-original-title', '');
            currentPoductRow.find('button[id="FK_response_danger"]').hide();
        }

        if (!product.FK_listed_price) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="FK_listed_price"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="FK_listed_price_button"]').show();
            currentPoductRow.find('button[name="FK_listed_price_button"]').attr('data-original-title', 'Listed price field is required');
        } else if (!numbersOnly.test(product.FK_listed_price)) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="FK_listed_price"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="FK_listed_price_button"]').show();

            if (product.FK_available_quantity < 0) {
                currentPoductRow.find('button[name="FK_listed_price_button"]').attr('data-original-title', 'Listed price must be greater than 0');
            } else {
                currentPoductRow.find('button[name="FK_listed_price_button"]').attr('data-original-title', 'Listed price must be numeric');
            }

        }else {
            currentPoductRow.find('input[name="FK_listed_price"]').css({
                'border-color': '#ccc'
            });
            currentPoductRow.find('button[name="FK_listed_price_button"]').hide();
            currentPoductRow.find('button[name="FK_listed_price_button"]').attr('data-original-title', '');
            currentPoductRow.find('button[id="FK_response_danger"]').hide();
        }

        return checkForEmpty;
    }

    //validation of snapdeal quick sell
    function snapdealListValidationQickSell(product) {
        var checkForEmpty = true;
        var currentPoductRow = $('[data-id="product-' + product.id + '"]');
        var decimalOnly = /^\s*-?[1-9]\d*(\.\d{0})?\s*$/;
        var numbersOnly = /^\d+$/;
        var alphanumericOnly = new RegExp("^[a-zA-Z0-9]+$");
        //currentPoductRow.find('button[name="seller_sku"]').hide();

        if (!product.SD_available_quantity) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="SD_available_quantity"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="SD_available_quantity_button"]').show();
            currentPoductRow.find('button[name="SD_available_quantity_button"]').attr('data-original-title', 'Available quantity field is required');
        } else if (!numbersOnly.test(product.SD_available_quantity)) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="SD_available_quantity"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="SD_available_quantity_button"]').show();

            if (product.SD_available_quantity < 0) {
                currentPoductRow.find('button[name="SD_available_quantity_button"]').attr('data-original-title', 'Available quantity must be greater than 0');
            } else {
                currentPoductRow.find('button[name="SD_available_quantity_button"]').attr('data-original-title', 'Available quantity must be numeric');
            }
        } else {
            currentPoductRow.find('input[name="SD_available_quantity"]').css({
                'border-color': '#ccc'
            });
            currentPoductRow.find('button[name="SD_available_quantity_button"]').hide();
            currentPoductRow.find('button[name="SD_available_quantity_button"]').attr('data-original-title', '');
            currentPoductRow.find('button[id="SD_response_danger"]').hide();
        }

        if (!product.SD_listed_price) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="SD_listed_price"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="SD_listed_price_button"]').show();
            currentPoductRow.find('button[name="SD_listed_price_button"]').attr('data-original-title', 'Listed price field is required');
        } else if (!numbersOnly.test(product.SD_listed_price)) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="SD_listed_price"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="SD_listed_price_button"]').show();

            if (product.SD_listed_price < 0) {
                currentPoductRow.find('button[name="SD_listed_price_button"]').attr('data-original-title', 'Listed price must be greater than 0');
            } else {
                currentPoductRow.find('button[name="SD_listed_price_button"]').attr('data-original-title', 'Listed price must be numeric');
            }
        } else {
            currentPoductRow.find('input[name="SD_listed_price"]').css({
                'border-color': '#ccc'
            });
            currentPoductRow.find('button[name="SD_listed_price_button"]').hide();
            currentPoductRow.find('button[name="SD_listed_price_button"]').attr('data-original-title', '');
            currentPoductRow.find('button[id="SD_response_danger"]').hide();
        }

        return checkForEmpty;
    }


    //validation amazon list quuick sell
    function amazonListValidationQickSell(product) {
        var checkForEmpty = true;
        var currentPoductRow = $('[data-id="product-' + product.id + '"]');
        var decimalOnly = /^\s*-?[1-9]\d*(\.\d{0})?\s*$/;
        var numbersOnly = /^\d+$/;
        var alphanumericOnly = new RegExp("^[a-zA-Z0-9]+$");
        //currentPoductRow.find('button[name="seller_sku"]').hide();

        if (!product.AMAZON_available_quantity) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="AMAZON_available_quantity"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="AMAZON_available_quantity_button"]').show();
            currentPoductRow.find('button[name="AMAZON_available_quantity_button"]').attr('data-original-title', 'Available quantity field is required');
        } else if (!numbersOnly.test(product.AMAZON_available_quantity)) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="AMAZON_available_quantity"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="AMAZON_available_quantity_button"]').show();

            if (product.AMAZON_available_quantity < 0) {
                currentPoductRow.find('button[name="AMAZON_available_quantity_button"]').attr('data-original-title', 'Available quantity must be greater than 0');
            } else {
                currentPoductRow.find('button[name="AMAZON_available_quantity_button"]').attr('data-original-title', 'Available quantity must be numeric');
            }
        } else {
            currentPoductRow.find('input[name="AMAZON_available_quantity"]').css({
                'border-color': '#ccc'
            });
            currentPoductRow.find('button[name="AMAZON_available_quantity_button"]').hide();
            currentPoductRow.find('button[name="AMAZON_available_quantity_button"]').attr('data-original-title', '');
            currentPoductRow.find('button[id="AMAZON_response_danger"]').hide();
        }

        if (!product.AMAZON_listed_price) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="AMAZON_listed_price"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="AMAZON_listed_price_button"]').show();
            currentPoductRow.find('button[name="AMAZON_listed_price_button"]').attr('data-original-title', 'Listed price field is required');
        } else if (!numbersOnly.test(product.AMAZON_listed_price)) {
            checkForEmpty = false;
            currentPoductRow.find('input[name="AMAZON_listed_price"]').css({
                'border': '1px solid red'
            });
            currentPoductRow.find('button[name="AMAZON_listed_price_button"]').show();
            if (product.AMAZON_listed_price < 0) {
                currentPoductRow.find('button[name="AMAZON_listed_price_button"]').attr('data-original-title', 'Listed price must be greater than 0');
            } else {
                currentPoductRow.find('button[name="AMAZON_listed_price_button"]').attr('data-original-title', 'Listed price must be numeric');
            }
        } else {
            currentPoductRow.find('input[name="AMAZON_listed_price"]').css({
                'border-color': '#ccc'
            });
            currentPoductRow.find('button[name="AMAZON_listed_price_button"]').hide();
            currentPoductRow.find('button[name="AMAZON_listed_price_button"]').attr('data-original-title', '');
            currentPoductRow.find('button[id="AMAZON_response_danger"]').hide();
        }

        return checkForEmpty;
    }


    function checkTransactionStatus(transactionDetails, data, callback) {
        $http.get('/transaction/status/' + transactionDetails.txnId).success(function (statusResult) {
            callback(statusResult, data);
        }).error(function (errMsg) {
            console.error(errMsg);
            clearInterval(intervalObject[data.intervalName]);
        });
    }

    function checkListSellDataIntervalCallback(statusResult, data) {

        var marketplaceID = data.marketplaceID;
        var buttonId, buttontext;
        if ($scope.main.dashboard == "selllist") {
            buttonId = 'button[data-id="product-' + data.productId + '-' + data.marketplaceID + '-button"]';
            buttontext = 'List';
        } else if ($scope.main.dashboard == "sell") {
            buttonId = 'button[data-id="product-' + data.productId + '-button"], button[data-id="product-' + data.productId + '-' + data.marketplaceID + '-button"]';
            buttontext = 'Update';
        }
        var parent = $(buttonId).parents('.action');
		var channelOrderInfo = $(buttonId).parent('.action').parent().find("."+marketplaceID+"-channel-otherinfo");
		
		
        parent.find('.btn-success').hide();
        parent.find('#' + marketplaceID + "_channel_response_danger").hide();

        var txnMsg = statusResult.txnMsg;
        if (statusResult.txnStatus == "processing") {
            $(buttonId).attr('disabled', 'disabled');
            $(buttonId).text('Processing...');
            parent.find('.btn-success').hide();
            parent.find('#' + marketplaceID + "_channel_response_danger").hide();
        } else if (statusResult.txnStatus == "completed") {
            clearInterval(intervalObject[data.intervalName]);
            delete intervalObject[data.intervalName];
            $(buttonId).text(buttontext);
            if ($scope.main.dashboard == "selllist") {
                $scope.values.filter(function(prod) {
                    return prod.id == data.productId;
                })[0][data.marketplaceID + '_is_listed'] = 1;
            }
            $(buttonId).removeAttr('disabled');
            parent.find('.btn-success').show();
        } else if (statusResult.txnStatus == "failed") {
            clearInterval(intervalObject[data.intervalName]);
            delete intervalObject[data.intervalName];
            var htmlData = '';
            if (typeof txnMsg[0][0].message == 'string') {
                htmlData += '<li style="color: #ac2925;border-bottom: 1px solid;">1: ' + txnMsg[0][0].message + '</li>';
            } else {
                txnMsg[0][0].message.map(function (item, count) {
					if(Object.prototype.toString.call(item) == "[object Object]"){
						if(item.errorCode == "PRICE_SOFT_CHECK_EXCEPTION"){
							channelOrderInfo.find('input[name="price_error_check"]').show();
							channelOrderInfo.find('.'+marketplaceID+"-price_error_check-desc").show();
						}						
						htmlData += '<li style="color: #ac2925;border-bottom: 1px solid;">' + (count + 1) + ': ' + item.msg + '</li>';
					}else {
						htmlData += '<li style="color: #ac2925;border-bottom: 1px solid;">' + (count + 1) + ': ' + item + '</li>';
					}
                });
            }
            if (htmlData != "") {
                htmlData = "<ul>" + htmlData + "</ul>";
            }
            parent.find('.dropdown-menu').html(htmlData);
            $(buttonId).text(buttontext);
               
            if ($scope.main.dashboard == "selllist") {
                parent.find('#' + marketplaceID + "_channel_response_danger").attr("data-content", htmlData);
                parent.find('#' + marketplaceID + "_channel_response_danger").popover({
                    "html": true,trigger: "hover"
                });
                parent.find('#' + marketplaceID + "_channel_response_danger").show();
            }else if ($scope.main.dashboard == "sell") {
                parent.find('#' + marketplaceID + "_response_danger").attr("data-content", htmlData);
                parent.find('#' + marketplaceID + "_response_danger").popover({
                     "html": true,trigger: "hover"
                });

                parent.find('#' + marketplaceID + "_response_danger").show();
            }
            
            $(buttonId).removeAttr('disabled');
        }
    }
});