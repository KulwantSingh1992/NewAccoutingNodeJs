'use strict';

/**
 * @ngdoc service
 * @name paxcomTerminalApp.sessionService
 * @description
 * # sessionService
 * Service in the paxcomTerminalApp.
 */
angular.module('paxcomTerminalApp').service('configService', function ($http) {
    var settingConfig = {};
    var activeChannels = [];
    this.getConfig = function() {
        return settingConfig;
    };
    this.setConfig = function(value) {
		setConfig(value);
    };
    this.validateSetting = function(data, callback, errorCallback) {
        var channel = Object.keys(data)[0];
        $http.post('/validate/' + channel, data[channel]).success(function (validateResponse) {
            callback(validateResponse);
        }).error(function(data, status, headers, config) {
            errorCallback('Error to validate channel setting');
        });
    }
    
    this.submitSetting = function(data, callback, errorCallback) {
        $http.post('/setting', data).success(function (response) {
            $http.post('/setting/load').success(function(response) {
                setConfig(response.configData);
            });
            callback('Channel details saved successfully');
        }).error(function(data, status, headers, config) {
            console.error(data);
            errorCallback('Channel setting is valid but not saved');
        });
    };
    this.getActiveChannels = function() {
        return activeChannels;
    };
    function setConfig(value) {
        var localSettingConfig = {};
        activeChannels = [];
        value.map(function(config) {
            config.settingDetails = JSON.parse(config.setting_details);
            localSettingConfig[config.setting_channel] = config;
            if(config.is_active) {
                activeChannels.push(config.setting_channel);
            }
        });
        settingConfig = localSettingConfig;
    }
});