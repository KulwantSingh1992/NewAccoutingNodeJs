//Insert Query
var dbconfig=require('./../db-config');
db=dbconfig.db;
var insertPaymentSummaryQuery = "INSERT OR REPLACE INTO payment_sheet_summary(settlement_ref_id, order_id, external_id, settlement_date, order_item_id, order_status, sku, description, quantity, invoice_id, marketPlace, order_city, order_state, order_postal, invoice_amount,  shipping_credits, promotional_rebate, sales_tax, selling_fee, fba_fee, other_transaction_fee, other, total, settlement_value, order_item_value, refund, hold, performance_award, protection_fund, total_marketplace_fee, comission_rate, commission_fee, fixed_fee, emi_fee, shipping_fee, reverse_shipping_fee, cancellation_fee, fee_discount, service_tax, dispatch_date, delivery_date, cancellation_date, dispute_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

var insertAcctgTransQuery = "INSERT OR REPLACE INTO acctg_trans(acctg_trans_id, acctg_trans_type_id, description, transaction_date, is_posted,voucher_ref,voucher_date,order_id, inventory_item_id, party_id) VALUES (?,?,?,?,?,?,?,?,?,?)";

var insertAcctgTransEntryQuery = "INSERT OR REPLACE INTO acctg_trans_entry(acctg_trans_id, acctg_trans_entry_seq_id, acctg_trans_entry_type_id,  party_id, role_type_id, gl_account_type_id, gl_account_id,organisation_party_id,amount,currency_uom_id,debit_credit_flag,reconcile_status_id,gl_account_class) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";

var orderExistsCountQuery = "select * from orders where orders_external_id = ? ";

var orderItemExistsCountQuery = "select * from order_item where order_item_external_id = ? "

var refExistsCount = "select * from payment_sheet_summary where settlement_ref_id = ?  and order_status = ? ";

var glAccountsExistsCount = "select * from gl_account_organisation_and_class";

var getDataFromPaymentSummary="select * from payment_sheet_summary";

var glaccountinfo = "select * from gl_account_organisation_and_class where organisation_party_id IN (?, ?)";

var acctTransViewQuery="select * from acctg_trans";

var acctgTransEntryViewQuery="select * from acctg_trans_entry";

var insertGlAccountOrganisationAndClassQuery = "INSERT OR REPLACE INTO gl_account_organisation_and_class(gl_account_id,organisation_party_id,role_type_id,gl_account_type_id,gl_account_class_id,account_name) VALUES (?,?,?,?,?,?);"

var importAmazonPaymentSheet = exports.importAmazonPaymentSheet = function (record) {
    db.beginTransaction(function (err, transaction) {
	transaction.run(insertPaymentSummaryQuery, [record[1], null,record[3], record[0], null, record[2], record[4], record[5],record[6],null,record[7], record[9],record[10],record[11],record[12], record[13], record[14],record[15],record[16],
		record[17],record[18],record[19],record[20]]);
        transaction.commit(function (err) {
            if (err) {
                console.error(err);
                transaction.rollback();
            }
        });
    });
}

var importFlipkartPaymentSheet = exports.importFlipkartPaymentSheet = function (record) {
    db.beginTransaction(function (err, transaction) {
	transaction.run(insertPaymentSummaryQuery, [record[0], null,record[2], record[1], record[3], record[5], record[6],null, 		record[7],record[8],null,null,null,null,record[10],null,null,null,null,null,null,null,null, record[11],null,record[13],
		record[14],record[15],record[16],record[17],record[18],record[19],record[20],record[21],record[22],record[26],record[27],
		record[28],record[29],record[30],record[31],record[32],record[33]]);
        transaction.commit(function (err) {
            if (err) {
                console.error(err);
                transaction.rollback();
            }
        });
    });

}

function getGlAccountInfo(organisation_party_id,company_party_id, fun){

db.all(glaccountinfo,organisation_party_id,company_party_id, function(err,rows){fun(rows);});

}


function refAlreadyExistsAmazon(data,fun){

db.all(refExistsCount,data[1],data[2],function(err,rows){fun(rows);
//fun(count);return ;
}//,function(){fun(count);}
);

}

function orderExists(externalOrderId,fun){
	
	db.all(orderExistsCountQuery,externalOrderId,function(err,rows){fun(rows);});

	}

function orderItemExists(externalOrderItemId,fun){
	
	db.all(orderItemExistsCountQuery,externalOrderItemId,function(err,rows){
		fun(rows);
	});
	
}

function refAlreadyExistsFlipkart(data,fun){

db.all(refExistsCount,data[0],data[5],function(err,rows){if(rows.length==0)fun(0);else fun(1);
//fun(count);return ;
}//,function(){fun(count);}
);

}

function glAccountsExists() {
	db.all(glAccountsExistsCount,function(err,rows){
		if(rows.length==0){
			 db.beginTransaction(function (err, transaction) {
				transaction.run(insertGlAccountOrganisationAndClassQuery,"12345","PAXCOM","INTERNAL_ORGANIZATIO","BANK_STLMNT_ACCOUNT","ASSET","BANK_ACCOUNT");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"908001","AMAZON","COMSN_AGENT","COMMISSION_EXPENSE","EXPENSE","MarketPlace Amazon Commission A/C");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"908004","AMAZON","SERVICE_TAX_AUTH","TAX_ACCOUNT","EXPENSE","MarketPlace Amazon Service Tax A/C");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"908006","AMAZON","CNCL_AGENT","CANCELLATION_EXPENSE","EXPENSE","MarketPlace Amazon Cancellation Fee A/C");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"10080","AMAZON","SALES_REP","ACCOUNTS_RECEIVABLE","ASSET","MarketPlace AMAZON A/C");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"908003","AMAZON","CARRIER","REV_SHIPPING_EXPENSE","EXPENSE","MarketPlace Amazon Reverse Shipping A/C");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"908002","AMAZON","CARRIER","SHIPPING_EXPENSE","EXPENSE","MarketPlace Amazon Shipping A/C");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"908008","AMAZON","CUSTOMER","CUSTOMER_ACCOUNT","ASSET","Amazon Customer Group A/C");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"908005","AMAZON","EMI_AGENT","EMI_EXPENSE","EXPENSE","MarketPlace Amazon EMI Fee A/C");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"908007","AMAZON","PROTECTN_FUND_AGENT","PROTECTION_FUND","INCOME","MarketPlace Amazon Protection Fund A/C");
	
				transaction.run(insertGlAccountOrganisationAndClassQuery,"909001","FLIPKART","COMSN_AGENT","COMMISSION_EXPENSE","EXPENSE","MarketPlace Flipkart Commission A/C");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"909004","FLIPKART","SERVICE_TAX_AUTH","TAX_ACCOUNT","EXPENSE","MarketPlace Flipkart Service Tax A/C");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"909006","FLIPKART","CNCL_AGENT","CANCELLATION_EXPENSE","EXPENSE","MarketPlace Flipkart Cancellation Fee A/C");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"10081","FLIPKART","SALES_REP","ACCOUNTS_RECEIVABLE","ASSET","MarketPlace Flipkart A/C");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"909003","FLIPKART","CARRIER","REV_SHIPPING_EXPENSE","EXPENSE","MarketPlace Flipkart Reverse Shipping A/C");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"909002","FLIPKART","CARRIER","SHIPPING_EXPENSE","EXPENSE","MarketPlace Flipkart Shipping A/C");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"909008","FLIPKART","CUSTOMER","CUSTOMER_ACCOUNT","ASSET","Flipkart Customer Group A/C");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"909005","FLIPKART","EMI_AGENT","EMI_EXPENSE","EXPENSE","MarketPlace Flipkart EMI Fee A/C");
				transaction.run(insertGlAccountOrganisationAndClassQuery,"909007","FLIPKART","PROTECTN_FUND_AGENT","PROTECTION_FUND","INCOME","MarketPlace Flipkart Protection Fund A/C");
	
	
					transaction.commit(function (err) {
					    if (err) {
						console.error(err);
						transaction.rollback();
					    }
					});
				});

					}
				});
}
function insertAcctgTrans(acctg_trans_id, acctg_trans_type_id, description, transaction_date, is_posted,
       voucher_ref, voucher_date, order_id, inventory_item_id, party_id){
db.beginTransaction(function (err, transaction) {
	transaction.run(insertAcctgTransQuery, acctg_trans_id, acctg_trans_type_id, description, transaction_date, is_posted,
    	voucher_ref,voucher_date, order_id, inventory_item_id, party_id);
		transaction.commit(function (err) {
		    if (err) {
			console.error(err);
			transaction.rollback();
		    }
		});
	});
}
function insertAcctgTransEntry(acctg_trans_id,acctg_trans_entry_seq_id,acctg_trans_entry_type_id
    ,party_id,role_type_id,gl_account_type_id,gl_account_id,organisation_party_id,amount,
	currency_uom_id,debit_credit_flag,reconcile_status_id,gl_account_class){
	
	db.beginTransaction(function (err, transaction) {
	transaction.run(insertAcctgTransEntryQuery, acctg_trans_id,acctg_trans_entry_seq_id,acctg_trans_entry_type_id,
        party_id,role_type_id,gl_account_type_id,gl_account_id,organisation_party_id,amount,currency_uom_id,debit_credit_flag
		,reconcile_status_id,gl_account_class);
		transaction.commit(function (err) {
		    if (err) {
			console.error(err);
			transaction.rollback();
		    }
		});
	});
	//change kall leyo ehde vich
}

function acctTransView(view,fun){

db.all(acctTransViewQuery,function(err,rows){
                              
                               for(var i=0;i<rows.length;i++)
							   {
							 
							   view+='<tr>';
								  view+='<td>'+rows[i]["acctg_trans_id"]+'</td>'
								  view+='<td>'+rows[i]["acctg_trans_type_id"]+'</td>'
								  view+='<td>'+rows[i]["description"]+'</td>'
								  view+='<td>'+rows[i]["transaction_date"]+'</td>'
								  view+='<td>'+rows[i]["voucher_ref"]+'</td>'
								  view+='<td>'+rows[i]["voucher_date"]+'</td>'
								  view+='<td>'+rows[i]["order_id"]+'</td>'
								  view+='</tr>';
								 
							  }
								
							  view+="</table>";
							  console.log(view);
							  fun(view);
                             });

}

function acctTransEntryView(view,fun){

db.all(acctgTransEntryViewQuery,function(err,rows){

                   for(var i=0;i<rows.length;i++)
							   {
							 
							   view+='<tr>';
								  view+='<td>'+rows[i]["acctg_trans_id"]+'</td>'
								  view+='<td>'+rows[i]["acctg_trans_entry_seq_id"]+'</td>'
								  view+='<td>'+rows[i]["acctg_trans_entry_type_id"]+'</td>'
								  view+='<td>'+rows[i]["party_id"]+'</td>'
								  view+='<td>'+rows[i]["role_type_id"]+'</td>'
								  view+='<td>'+rows[i]["gl_account_type_id"]+'</td>'
								  view+='<td>'+rows[i]["gl_account_id"]+'</td>'
								  view+='<td>'+rows[i]["organisation_party_id"]+'</td>'
								  view+='<td>'+rows[i]["amount"]+'</td>'
								  view+='<td>'+rows[i]["currency_uom_id"]+'</td>'
								  view+='<td>'+rows[i]["debit_credit_flag"]+'</td>'
								  view+='<td>'+rows[i]["reconcile_status_id"]+'</td>'
								  view+='<td>'+rows[i]["gl_account_class"]+'</td>'
								  view+='</tr>';
								 
							  }
								
							  view+="</table>";
							  console.log(view);
							  fun(view);
                             });

               }

exports.acctTransEntryView=acctTransEntryView;
exports.acctTransView=acctTransView;
exports.refAlreadyExistsAmazon=refAlreadyExistsAmazon;
exports.refAlreadyExistsFlipkart=refAlreadyExistsFlipkart;
exports.getGlAccountInfo=getGlAccountInfo;
exports.insertAcctgTrans=insertAcctgTrans;
exports.insertAcctgTransEntry=insertAcctgTransEntry;
exports.glAccountsExists = glAccountsExists;
exports.orderExists=orderExists;
exports.orderItemExists=orderItemExists;