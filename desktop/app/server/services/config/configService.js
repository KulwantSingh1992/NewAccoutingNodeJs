var configDAO = require('../../db/config/configDAO');
var logger = require('../../lib/logger');
var util = require('../util/util');

var getConfiguration = exports.getConfiguration = function (filters, cb, err) {
    configDAO.getConfiguration(filters, function (result) {
        var settings = [];
        result.map(function (config) {
            var setting_details = util.decrypt(config.setting_details);
            config.setting_details = setting_details;
            settings.push(config);
        });
        cb(settings);
    }, function (dbErr) {
        err(dbErr);
    });
};

exports.setConfiguration = function (params, cb, err) {
    var setting = {};
    setting.active = params.active;
    setting.date = new Date().getTime();
    
    for(key in params.data) {
        setting.channel = key;
        setting.settingDetails = util.encrypt(params.data[key]);
        configDAO.createOrUpdateConfiguration(setting, function() {
            getConfiguration(null, cb, err);
        });
    }
};

/*exports.updateConfiguration = function (channel, cb, err) {
    switch(channel){
        case 'FK':
            configDAO.u
            break;
    }
};*/

var channelConfigPlaceholder = exports.channelConfigPlaceholder = {};