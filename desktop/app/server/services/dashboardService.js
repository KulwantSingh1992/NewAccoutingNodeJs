var logger = require('../lib/logger');

var dashboardOrderData;

var dashboardAccountData;

var dashboardProductData = {
    'ofs': 0,
    'bt': 0,
    'agp': 0,
    'tl': {
        AMAZON: 0,
        FK: 0,
        TOTAL: 0
    },
    'al': {
        AMAZON: 0,
        FK: 0,
        TOTAL: 0
    },
    'ial': {
        AMAZON: 0,
        FK: 0,
        TOTAL: 0
    }
};


var defaultUninitializedDataMessage = {
    'STATUS': 'NOT_INIT',
    'MSG': 'Data not loaded yet'
};

exports.getOrderDetails = function () {
    if (!dashboardOrderData) {
        return defaultUninitializedDataMessage;
    }
    return dashboardOrderData;
};


exports.getAccountingDetails = function () {
    if (!dashboardAccountData) {
        return defaultUninitializedDataMessage;
    }
    return dashboardAccountData;
};

exports.getProductDashboardDetails = function () {
    if (!dashboardProductData) {
        return defaultUninitializedDataMessage;
    }
    return dashboardProductData;
};



exports.getDashboardDetails = function () {
    var dashboaddetails = {};
    dashboaddetails['order'] = this.getOrderDetails();
    dashboaddetails['account'] = this.getAccountingDetails();
    dashboaddetails['product'] = this.getProductDashboardDetails();
    return dashboaddetails;
};

function sumChannelCount(channelsData) {
    var count = 0;
    if (channelsData) {
        for (var key in channelsData) {
            count = count + channelsData[key];
        }
    }
    channelsData.TOTAL = count;
    return channelsData;
}
// cron
var updateDashboardOrderData = exports.updateDashboardOrderData = function (result) {

    if (!result) {
        return;
    }
    var pending = result[1].pending;
    var sla = result[4].sla;
    var cancelled = result[0].cancelled;
    var dueToday = result[3].dueToday;
    var ordersToday = result[2].ordersToday;
    pending = sumChannelCount(pending);
    sla = sumChannelCount(sla);
    cancelled = sumChannelCount(cancelled);
    dueToday = sumChannelCount(dueToday);
    ordersToday = sumChannelCount(ordersToday);


    dashboardOrderData = {
        sla: sla,
        cancelled: cancelled,
        pending: pending,
        dueToday: dueToday,
        ordersToday: ordersToday,
        lastUpdatedTime: Date.now()
    };
};


exports.updateDashboardAccountData = function (res) {
    if (res != null) {
        dashboardAccountData = res;
    }
};


exports.updateDashboardProductData = function (res) {
    if (res != null) {
        dashboardProductData = res;
    }
};