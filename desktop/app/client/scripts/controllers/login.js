'use strict';

/**
 * @ngdoc function
 * @name paxcomTerminalApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the paxcomTerminalApp
 */
angular.module('paxcomTerminalApp').controller('LoginCtrl', function ($scope, $http, sessionService, desktopService, configService) {
    $scope.credentials = {username: 'demo', password: 'demo'};
    $scope.login = function() {
        if($scope.credentials.username == ''){
            $('#username').css({
                'border': '1px solid red'
            });
        }
        else{
            $("#username").css("border-color", "#ccc");
            }
        if($scope.credentials.password == ''){
            $('#password').css({
                'border': '1px solid red'
            });
        }
        else{
            $("#password").css("border-color", "#ccc");
            }
        if($scope.credentials.username == 'demo' && $scope.credentials.password == 'demo') {
            sessionService.setUserAuthenticated(true);
            desktopService.startDashboardSync();
            $http.post('/setting/load').success(function(response) {
            	if(response.result) {
            		sessionService.setMain('dashboard');
                    configService.setConfig(response.configData);
            	} else {
            		sessionService.setMain('wizard');
            	}
            });

        }
    }
});
