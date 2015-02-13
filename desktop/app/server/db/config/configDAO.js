var db = require('../db-config').db;
var logger = require('../../lib/logger');

var insertSettingQuery = "INSERT INTO setting_conf(setting_channel , setting_details , is_active, setting_conf_last_updated_timestamp ,setting_conf_created_timestamp ) VALUES (?,?,?,?,?)";
var updateSettingQuery = "UPDATE setting_conf set setting_details=?, is_active=?, setting_conf_last_updated_timestamp=? where setting_channel=?";
var getSettingQuery = "SELECT * FROM setting_conf ";
/*var updateExtraInfoQuery = "INSERT INTO setting_conf(setting_channel , setting_details , is_active, extra, setting_conf_last_updated_timestamp ,setting_conf_created_timestamp ) VALUES (?,?,?,?,?,?)";*/
var setConfiguration = exports.setConfiguration = function (setting, cb) {
    db.run(insertSettingQuery, [setting.channel, setting.settingDetails, setting.active, setting.date, setting.date], cb());
};

var updateConfiguration = exports.updateConfiguration = function (setting, cb) {
    db.run(updateSettingQuery, [setting.settingDetails, setting.active, setting.date, setting.channel], cb());
};

var getConfiguration = exports.getConfiguration = function (filters, cb, err) {
    logger.debug(getSettingQuery + prepareWhereCondition(filters));
    db.all(getSettingQuery + prepareWhereCondition(filters), function (dbErr, rows) {
        if (dbErr) {
            err(dbErr);
        } else {
            cb(rows);
        }
    });
};

exports.createOrUpdateConfiguration = function (setting, cb) {
    exists(setting.channel, function (result) {
        if (result) {
            updateConfiguration(setting, cb);
        } else {
            setConfiguration(setting, cb);
        }
    }, function (err) {});
};

var exists = exports.exists = function (channelName, cb, err) {
    db.get(getSettingQuery + " where setting_channel = '" + channelName + "'", insertCheck);
    function insertCheck(err, rows) {
        console.log(err, rows);
        var exist = null;
        if (rows) {
            exist = rows;
        }
        cb(exist);
    }
};


function prepareWhereCondition(filters) {
    var condition = "";
    var AND = ' AND ';

    if (filters) {
        for (var i = 0; i < filters.length; i++) {
            var filter = filters[i];
            if (filter.name == 'status') {
                if (condition.length > 0) {
                    condition += AND;
                }
                if (filter.value == 'active') {
                    condition += ' setting_conf.' + 'is_active = 1';
                } else {
                    condition += ' setting_conf.' + 'is_active = 0 OR settig_conf.is_active is NULL';
                }
            }
            if (filter.name == 'source') {
                if (condition.length > 0) {
                    condition += AND;
                }
                condition += ' setting_conf.setting_channel IN (' + filter.value + ')';
            }
        }
        if (condition.length > 0) {
            return " where " + condition;
        }
    }
    return condition;

}

/*var updateExtraInfo = exports.updateExtraInfo = function (extraInfo, cb) {
    db.run(updateExtraInfoQuery, [extraInfo], cb());
};*/

