'use strict';

/**
 * @ngdoc service
 * @name paxcomTerminalApp.services/notificationService
 * @description
 * # services/notificationService
 * Service in the paxcomTerminalApp.
 */
angular.module('paxcomTerminalApp').service('notificationService', function () {
    var map = {}; //eventType : [], List of callback

    this.subscribe = function (eventType, callback) {
        var calls = map[eventType];
        if (calls == null) {
            calls = [];
        };
        calls.push(callback);
        map[eventType] = calls;
    };

    this.unsubscribe = function (eventType, callback) {
        var calls = map[eventType];
        if (calls != null) {
            var index = calls.indexOf(callback);
            if (index >= 0) {
                calls = calls.slice(callback, 1);
                map[eventType] = calls;
            }
        }
    };

    this.update = function (objectType, object) {
        var calls = map[objectType];
        if (calls != null) {
            for (var i = 0; i < calls.length; i++) {
                calls[i](object);
            }
        }
    };
});