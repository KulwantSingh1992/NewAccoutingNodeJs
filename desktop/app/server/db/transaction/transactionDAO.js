var db = require('../db-config').db;
var logger = require('../../lib/logger');
// transaction table 
// id, action, status, additionalDetails, active (true/false)
// transaction obj - id, action, status, additionalDetails{}, active (true/false) - default false

//var getTransactionStatusQuery = 'SELECT status FROM paxcom_transaction where id = ?';
var updateTransactionStatusQuery = 'UPDATE paxcom_transaction SET status=? where id=?';
var updateTransactionQuery = 'UPDATE paxcom_transaction SET action=? where id=?';
var transactionSelectQuery = 'Select * from paxcom_transaction ';
var getTransactionStatusQuery = 'Select status from paxcom_transaction ';

exports.createTransaction = function (txn, cb, err) {
    logger.debug(txn);
    db.beginTransaction(function (err, transaction) {
        var query = "INSERT INTO paxcom_transaction ( ";
        var values = " VALUES ( ";
        for (var prop in txn) {
            if (txn[prop]) {
                query = query + prop + " , ";
                values = values + " '" + txn[prop] + "', ";
            }
        }
        query = query.substring(0, query.length - 2) + " ) " + values.substring(0, values.length - 2) + " ) ";
        transaction.exec(query);
        transaction.commit(function (dbErr) {
            if (dbErr) {
                logger.error('Error creating paxcom_transaction ' + JSON.stringify(dbErr));
                transaction.rollback();
            }
            cb(txn);
        });
    });
};

//exports.getTransaction = function (txnId, cb, err) {};
/*
exports.getTransaction = function (action, cb, err) {
    db.all(getTransactionQuery, [action], function (err, rows) {
        var data = [];
        if (rows) {
            rows.forEach(function (row) {
                data.push(row);
            });
            cb(data);
        }else if(err){
            cb(err);
        }
    });
};
*/

exports.getTransactions = function (filters, cb, err) {
    logger.debug('transaction query ' + transactionSelectQuery+prepareWhereCondition(filters));
    db.all(transactionSelectQuery+prepareWhereCondition(filters), function (dbErr, rows) {
        
        if (dbErr){
            if (err){
            err(dbErr);
            }
                
        }else{
            var data = [];
            if (rows) {
                rows.forEach(function (row) {
                    data.push(row);
                });
                cb(data);
            }
        }
    });

};


function prepareWhereCondition(filters) {
    var condition = "";
    var AND = ' AND ';
    for (var i = 0; i < filters.length; i++) {
        var filter = filters[i];
        if (filter.name == 'action') {
            if (condition.length > 0) {
                condition += AND;
            }
            condition += ' paxcom_transaction.action in (' + filter.value + ') ';
        }
        if (filter.name == 'status') {
            if (condition.length > 0) {
                condition += AND;
            }
            condition += ' paxcom_transaction.status in (' + filter.value + ') ';
        }
        if (filter.name == 'id') {
            if (condition.length > 0) {
                condition += AND;
            }
            condition += ' paxcom_transaction.id in (' + filter.value + ') ';
        }
    }
    if (condition.length > 0) {
        return " where " + condition;
    }
    return condition;
}

/*exports.getTransactions = function (action, status, cb, err) {
      logger.debug('transaction query ' + getTransactionsQuery); 
    db.all(getTransactionsQuery, [action, status], function (err, rows) {
        var data = [];
        if (rows) {
            rows.forEach(function (row) {
                data.push(row);
            });
            cb(data);
        }else if(err){
            cb(err);
        }
    });
};*/

exports.getTransactionStatus = function (filters, cb, err) {
    db.all(getTransactionStatusQuery+prepareWhereCondition(filters), function (dbErr, rows) {
        if(dbErr){
            if (err){
            err(dbErr);
            }
        }else{
            var data = [];
            if (rows) {
                rows.forEach(function (row) {
                    data.push(row);
                });
                cb(data);
            }else if(err){
                cb(err);
            }
        }
    });
};

exports.updateTransactionStatus = function (txnId, status, cb, err) {
    db.all(updateTransactionStatusQuery, [status, txnId], function (dbErr) {
        if(dbErr){
            if (err){
            err(dbErr);
            }
        }else{
            cb("Done updateTransactionStatus");
        }
    });
}

exports.updateTransaction = function (txn, cb, err) {
	 db.all(updateTransactionQuery, [txn.action, txn.id], function (dbErr) {
         if(dbErr){
            if (err){
            err(dbErr);
            }
         }else{
            cb("Done updateTransaction");
        }
    });
}