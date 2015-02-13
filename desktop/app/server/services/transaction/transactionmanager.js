var transactionDB = require('../../db/transaction/transactionDAO');
var logger = require('../../lib/logger');

exports.createTransaction = function (txn, cb, err) {
    transactionDB.createTransaction(txn, cb, err);
};

exports.getTransactions = function (filters, cb, err) {
    logger.debug('Loading transaction with filters ' + JSON.stringify(filters));
    transactionDB.getTransactions(filters, cb, err);
};

/*
exports.getTransactions = function (action, status, cb, err) {
    transactionDB.getTransactions(action, status, cb, err);
};
*/

exports.getTransactionStatus = function (filters, cb, err) {
	transactionDB.getTransactionStatus(filters, cb, err);
};

exports.updateTransactionStatus = function (txnId, status, cb, err) {
    transactionDB.updateTransactionStatus(txnId, status, cb, err);
};

exports.updateTransaction = function (txn, cb, err) {
    transactionDB.updateTransaction(txn, cb, err);
};