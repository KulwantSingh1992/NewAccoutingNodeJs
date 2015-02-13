'use strict';

/**
 * @ngdoc function
 * @name paxcomTerminalApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the paxcomTerminalApp
 */
angular.module('paxcomTerminalApp').controller('MainCtrl', function ($scope, $http, sessionService, desktopService, inventoryService) {
    $scope.session = {};
	$scope.item = {};
    $scope.main = {};
    $scope.desktopObject = {};
    
    init();
    function init() {
        $scope.session = sessionService.getUserAuthenticated();
        $scope.main = sessionService.getMain();
        $scope.desktopObject = desktopService.getObject();
    }
    
    $scope.clickDashboardSync = function(){
        showLoader();
        desktopService.clickDashboardSync();
    }
    
	$scope.logout= function() {
        sessionService.setUserAuthenticated(false);
        $("#slideMenu").hide();
    }

    /*$scope.submitComment = function (){
        var comment =$('#comment').val();
        $http.post('/comment',{comment:comment});
    }
*/
    $scope.checkNewVersion = function() {
        $http.get('/checkNewVersion').success(function(result) {
            if(result == 'completed') {
                var checkUpdate = confirm('Updates available \nDo you want to update?')
                if(checkUpdate){
                    updateNewVersion();
                }
            } else {
                alert(result);
            }
        });
    }
	
    function updateNewVersion() {
        $http.get('/updateNewVersion');
    }

    $scope.$watch('main.dashboard', function() {
        //console.log($scope.main);
    });
    
});