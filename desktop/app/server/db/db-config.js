var fs = require("fs"),
    sqlite3 = require('sqlite3').verbose(),
    TransactionDatabase = require("sqlite3-transactions").TransactionDatabase,
    logger = require('../lib/logger');


if(/^lin/.test(process.platform)){
appFolder ="/tmp/Paxcom",
dbFile = appFolder + "/paxcom.db";}
else if(/^win/.test(process.platform)){
appFolder = process.env.USERPROFILE + "\\Paxcom",
dbFile = appFolder + "\\paxcom.db";}
existFolder = fs.existsSync(appFolder);
existFile = fs.existsSync(dbFile);

if (!existFolder) {
    console.log("Creating DB folder " + appFolder);
    fs.mkdir(dbFolder);
}

if (!existFile) {
    console.log("Creating DB file " + dbFile);
    fs.openSync(dbFile, "w");
}

var db = exports.db = new TransactionDatabase(new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE));
var accountDao = require('./account/accountDAO');

var tableNames = ['orders', 'order_item', 'order_status', 'product', 'setting_conf', 'paxcom_transaction'];

populateDatabase();

function populateDatabase() {
    for (var i in tableNames) {
        createOrAlterTable(tableNames[i]);
    }
}

function createOrAlterTable(tableName) {
    db.get("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? ", [tableName], function (err, rows) {
        if (rows) {
            alterTable(tableName);
        } else {
            createTable(tableName);
        }
    });
}

function createTable(tableName) {
    switch (tableName) {
    case 'orders':
        db.run('CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, external_id TEXT, channel_id TEXT, order_date INTEGER, status_id TEXT, external_status_id TEXT, grand_total REAL, created_timestamp INTEGER, last_updated_timestamp INTEGER)');
        break;

    case 'order_item':
        db.run('CREATE TABLE IF NOT EXISTS order_item (id INTEGER PRIMARY KEY, order_id INTEGER, external_id TEXT, channel_id TEXT, status TEXT, external_status TEXT, grand_total REAL, quantity INTEGER, unit_price REAL, seller_sku TEXT, channel_sku TEXT, name TEXT, estimated_ship_date INTEGER, estimated_delivery_date INTEGER, order_item_date INTEGER, created_timestamp INTEGER, last_updated_timestamp INTEGER, product_id INTEGER, product_name TEXT, product_cost_price REAL)');
        break;

    case 'order_status':
        db.run('CREATE TABLE IF NOT EXISTS order_status (order_id INTEGER, last_updated_timestamp INTEGER, old_status TEXT, old_external_status TEXT, extra TEXT)');
        break;

    case 'product':
        db.run("CREATE TABLE IF NOT EXISTS product (id INTEGER PRIMARY KEY AUTOINCREMENT, TALLY_id INTEGER DEFAULT NULL, name TEXT DEFAULT NULL, category TEXT DEFAULT NULL, mrp REAL DEFAULT NULL, cost_price REAL DEFAULT NULL, available_quantity INTEGER DEFAULT NULL, sku TEXT DEFAULT NULL, min_price REAL DEFAULT NULL, max_price REAL DEFAULT NULL, FK_channel_sku TEXT DEFAULT NULL, FK_seller_sku TEXT DEFAULT NULL, FK_available_quantity INTEGER DEFAULT NULL, FK_listed_price REAL DEFAULT NULL, FK_additional_info TEXT DEFAULT '{\"listing_status\":\"\",\"local_shipping_charge\":\"\",\"national_shipping_charge\":\"\",\"procurement_sla\":\"\",\"zonal_shipping_charge\":\"\",\"price_error_check\":\"enable\"}',AMAZON_channel_sku TEXT DEFAULT NULL, AMAZON_seller_sku TEXT DEFAULT NULL, AMAZON_available_quantity INTEGER DEFAULT NULL, AMAZON_listed_price REAL DEFAULT NULL, AMAZON_additional_info TEXT DEFAULT '{\"leadtime_to_ship\":\"\"}',SD_channel_sku TEXT DEFAULT NULL, SD_seller_sku TEXT DEFAULT NULL,SD_available_quantity INTEGER DEFAULT NULL, SD_listed_price REAL DEFAULT NULL, SD_additional_info TEXT DEFAULT '{\"dispatch_sla\":\"\"}', PTM_channel_sku TEXT DEFAULT NULL, PTM_seller_sku TEXT DEFAULT NULL, PTM_available_quantity INTEGER DEFAULT NULL, PTM_listed_price REAL DEFAULT NULL, PTM_additional_info TEXT DEFAULT '{}', pending_orders_AMAZON INTEGER DEFAULT NULL, pending_orders_FK INTEGER DEFAULT NULL, pending_orders_PTM INTEGER DEFAULT NULL, total_sold_quantity INTEGER DEFAULT NULL, sold_last_week INTEGER DEFAULT NULL, last_sold_at INTEGER DEFAULT NULL, FK_is_listed	INTEGER DEFAULT 0, AMAZON_is_listed	INTEGER DEFAULT 0, SD_is_listed	INTEGER DEFAULT 0, SD_min_price INTEGER DEFAULT 0, FK_min_price INTEGER DEFAULT 0, AMAZON_min_price INTEGER DEFAULT 0, profit_percent INTEGER DEFAULT 10 )");
        break;

    case 'setting_conf':
        db.run('CREATE TABLE IF NOT EXISTS setting_conf (serial_id INTEGER PRIMARY KEY, setting_channel TEXT, setting_details TEXT, is_active BOOLEAN,setting_conf_last_updated_timestamp INTEGER,setting_conf_created_timestamp INTEGER,app_name TEXT,app_version TEXT,app_lang TEXT, service_sync_info TEXT DEFAULT "{}")');
        break;

    case 'paxcom_transaction':
        db.run('CREATE TABLE IF NOT EXISTS paxcom_transaction (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT, status TEXT, additionalDetails TEXT, active int DEFAULT 0)');
        break;
    }
	
	
//Create PaymentSheet specific tables
   db.run('CREATE TABLE IF NOT EXISTS payment_sheet_summary (settlement_ref_id TEXT, order_id TEXT, external_id TEXT, settlement_date TEXT, order_item_id TEXT, order_status TEXT, sku TEXT, description TEXT, quantity TEXT, invoice_id TEXT, marketPlace TEXT, order_city TEXT, order_state TEXT, order_postal TEXT, invoice_amount REAL,  shipping_credits REAL, promotional_rebate REAL, sales_tax REAL, selling_fee REAL, fba_fee REAL, other_transaction_fee REAL, other REAL, total REAL, settlement_value REAL, order_item_value REAL, refund REAL, hold REAL, performance_award REAL, protection_fund REAL, total_marketplace_fee REAL, comission_rate REAL, commission_fee REAL, fixed_fee REAL, emi_fee REAL, shipping_fee REAL, reverse_shipping_fee REAL, cancellation_fee REAL, fee_discount REAL, service_tax REAL, dispatch_date TEXT, delivery_date TEXT, cancellation_date TEXT, dispute_date TEXT, PRIMARY KEY(settlement_ref_id,order_id))'); 

   db.run('CREATE TABLE IF NOT EXISTS acctg_trans (acctg_trans_id TEXT, acctg_trans_type_id TEXT, description TEXT, transaction_date TEXT, is_posted TEXT,  voucher_ref TEXT, voucher_date TEXT, order_id TEXT, inventory_item_id TEXT, party_id TEXT,PRIMARY KEY(acctg_trans_id,order_id))');

   db.run('CREATE TABLE IF NOT EXISTS acctg_trans_entry (acctg_trans_id TEXT, acctg_trans_entry_seq_id TEXT, acctg_trans_entry_type_id TEXT,party_id TEXT, role_type_id TEXT, gl_account_type_id TEXT, gl_account_id, organisation_party_id TEXT, amount REAL, currency_uom_id TEXT, debit_credit_flag TEXT, reconcile_status_id TEXT, gl_account_class TEXT,PRIMARY KEY(acctg_trans_id, acctg_trans_entry_seq_id))');

   db.run('CREATE TABLE IF NOT EXISTS gl_account_organisation_and_class (gl_account_id INTEGER,organisation_party_id TEXT,role_type_id TEXT,gl_account_type_id TEXT,gl_account_class_id TEXT,account_name TEXT)',function(){
	accountDao.glAccountsExists();
   });
}

function alterTable(tableName) {
    switch (tableName) {
        /*case 'orders':
        db.exec('ALTER TABLE "orders" ADD "testcol" TEXT', function (err) {
            if (err) {
                logger.debug(err);
            }
        });
        break;*/
    }
}