'use strict';

/**
 * @ngdoc service
 * @name paxcomTerminalApp.sessionService
 * @description
 * # sessionService
 * Service in the paxcomTerminalApp.
 */
angular.module('paxcomTerminalApp').service('desktopService', function (DesktopApi, NotSoldProducts, $http) {
    var dashboardSyncService;
    var desktopObject = {};
    var optionSet = {
        ranges: {
                    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment()],
                    'Quarterly': [moment().subtract(3, 'month').startOf('month'), moment()],
                    'Half Yearly': [moment().subtract(6, 'month').startOf('month'), moment()],
                    'Annually': [moment().subtract(12, 'month').startOf('month'), moment()]
                },
                startDate: moment().subtract(30, 'days'),
                endDate: moment()
    };
    
    this.getObject = function () {
        return desktopObject;
    };
    this.startDashboardSync = function () {
        startDashboardSync();
        dashboardSyncService = setInterval(function () {
            startDashboardSync();
        }, 20000);
    };
    this.stopDashboardSync = function () {
        clearInterval(dashboardSyncService);
    };
    this.initializeAmazon = function () {
        $http.get('/initializeAmazon');
    };
    this.notSoldProducts = function (timeFrame) {
        var request = new NotSoldProducts();
        request.startDate = timeFrame.startDate;
        request.endDate = timeFrame.endDate;
        return NotSoldProducts.save(request);
    };
    this.getOptionSet = function () {
        return optionSet;
    };
    this.clickDashboardSync = function(){
        startDashboardSync();
    }
    
    function startDashboardSync() {
        DesktopApi.query().$promise.then(function (result) {
            desktopObject.dashboaddetails = result.dashboaddetails;
            hideLoader();
            console.log(desktopObject);
        });
    }
});

angular.module('paxcomTerminalApp').provider('DesktopApi', function () {
    this.$get = ['$resource', function ($resource) {
        var api = $resource(configuration.url + '/dashboard/detail', {}, {
            query: {
                method: 'GET',
                isArray: false
            }
        });
        return api;
    }];
});

angular.module('paxcomTerminalApp').provider('NotSoldProducts', function () {
    this.$get = ['$resource', function ($resource) {
        var api = $resource(configuration.url + '/notSoldProducts', {}, {
            save: {
                method: 'POST',
                isArray: true
            }
        });
        return api;
    }];
});