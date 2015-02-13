'use strict';

/**
 * @ngdoc service
 * @name paxcomTerminalApp.sessionService
 * @description
 * # sessionService
 * Service in the paxcomTerminalApp.
 */
angular.module('paxcomTerminalApp').service('sessionService', function () {
    var session = {};
    var main = {
    	dashboard: ''
    };
    this.getMain = function() {
    	return main;
    };
	this.setMain= function(val) {
	    main.dashboard = val;
	};
    session.isAuthenticated = false;
    this.setUserAuthenticated = function (value) {
        session.isAuthenticated = value;
    };
    this.getUserAuthenticated = function () {
        return session;
    };
});