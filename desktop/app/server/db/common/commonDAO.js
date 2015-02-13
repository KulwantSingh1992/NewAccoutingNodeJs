var db = require('../db-config').db;
var configService = require('../../services/config/configService');
var util = require('../../services/util/util');
var logger = require('../../lib/logger');

exports.updateSync = function (channelName, serviceName, syncTime) {
    var syncData = '{"'+ serviceName + '":"'+ syncTime+'"}';
    db.run("UPDATE setting_conf set service_sync_info  = ? where setting_channel  =  ?", [syncData, channelName], function (err) {
        if (err) {
            console.log(err);
        }
    });
};

exports.getChannelConfig = function (channelName, cb) {
   db.get('Select service_sync_info from setting_conf where setting_channel = ?', [channelName], function(err, rows){
        if (rows) {
                cb(rows.service_sync_info, channelName);
            }else{
                logger.info("Sync Configuration for " + channelName + " not found!");
            }
   });
}

function getChannelCredentials (syncTime, channelName, cb) {
    configService.getConfiguration(util.prepareConfigSettingFilter({
        source: "'" + channelName + "'"
    }), function (credentials) {
        if (credentials[0].setting_details) {
                cb(JSON.parse(credentials[0].setting_details), JSON.parse(credentials[0].extra), syncTime);
            }else{
                cb({}, {}, syncTime);
        }
    },
    function (dbErr) {
        console.log(dbErr);
        err(dbErr);
    });
}

exports.updateFKSellerId = function (sellerId, cb) {
    var sellerIdObj = '{"SellerID":"'+sellerId+'"}';
    db.run("UPDATE setting_conf set extra = ? where setting_channel = ?", [sellerIdObj, 'FK'], function (err) {
        if (err) {
            console.log(err);
        }
        cb(true);
    });
};