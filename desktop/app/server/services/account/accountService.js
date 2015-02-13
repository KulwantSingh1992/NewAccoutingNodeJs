var productDB = require('../../db/product/productDAO');
var tallyService = require('./tallyAccountService');
var logger = require('../../lib/logger');
var configService = require('../config/configService');
var util = require('../util/util');


var fs=require('fs-extra');
var formidable=require('formidable');
var csvParser=require('./csvParser');
var excelParser=require('./excelParser');
var HasMap=require('hashmap').HashMap;
var uuid = require('node-uuid');
var accountDB = require('../../db/account/accountDAO');


exports.getAccountingDetails = function (startDate, endDate, cb, err) {
	configService.getConfiguration(util.prepareConfigSettingFilter({
			source: "'TALLY'"
		}), function (credentials) {
			if (credentials.length > 0 ) {
				var cred;
				try {
					cred = JSON.parse(credentials[0].setting_details);
					if (cred.URL) tallyService.getAccountingDetails(cred, startDate, endDate, cb, err);
					else logger.error('Tally URL not found!');
				} catch (err) {
					logger.debug(err);
				}
			}else{
				logger.info("Tally credentials not found in database. ");
				var errorObject = {
					STATUS : 'ERROR',
					MSG : 'Tally credentials not found in database.'
				};
				cb(errorObject);
			}
		},
		function (dbErr) {
			err(dbErr);
		});
};



//Export Upload File code
function storePaymentSheetData(req,res) {
      var sheetType;
	  var form = new formidable.IncomingForm();
	//  console.log("storePaymentSheetData");
	  
	  form.parse(req, function(err, fields, files) {
		//  excel.excel(util.inspect(files['upload']['path']));
		  sheetType=fields['sheetType'];
		   if(fields['format']=='csv'){
			   fs.ensureFile('../TempUploaded/file.csv', function(err) {
			   fs.remove('../TempUploaded/file.csv', function(err) {
                       if (err) return console.error(err)
                         console.log("success!");
					// fs.unlinkSync(files['upload']['path']);
					 fs.move(files['upload']['path'], '../TempUploaded/file.csv',
		 		     function (err) {
		        		if (err) {
		           			// i.e. file already exists or can't write to directory
						throw err;
				     } else {
				    csvParser.csvParse('../TempUploaded/file.csv',sheetType,res);
					   //this line should come in each of parsing file .
			          }
			    });
            });
		   }); 
	     }else if(fields['format']=='xlsx'){	 
		 	 fs.ensureFile('../TempUploaded/file.xlsx', function(err) {
				   fs.remove('../TempUploaded/file.xlsx', function(err) {
                       if (err) return console.error(err)
                         console.log("success!");
					// fs.unlinkSync(files['upload']['path']);
					 fs.move(files['upload']['path'], '../TempUploaded/file.xlsx',
		 		     function (err) {
		        		if (err) {
		           			// i.e. file already exists or can't write to directory
						throw err;
				     } else {
				    excelParser.excelParse('../TempUploaded/file.xlsx',sheetType,res);
					   //this line should come in each of parsing file .
			          }
			    });
            });
		   }); 
		}
	});

}

function createFlipkartPaymentSheet(data,fun) {
			//Check if settlementId exists in PaymentSummary entity
			accountDB.refAlreadyExistsFlipkart(data,function(count){if(count==0){
			accountDB.importFlipkartPaymentSheet(data);
			fun(true);}
			else fun(false);
			})};
		     


function createAmazonPaymentSheet(data,fun) {
	 
			//Check if settlementId exists in PaymentSummary entity
			 accountDB.refAlreadyExistsAmazon(data,function(rows){if(rows.length==0){
			 accountDB.importAmazonPaymentSheet(data);
			 fun(true);
			 }
			 else{
				fun(false);
			 }
			 });
		    
}



	var bankStmGlAccountId = null;
	var txaccountGlAccountId=null;
	var cmexpGlAccountId=null;
	var shpexpGlAccountId=null;
	var cnexpGlAccountId=null;
	var bankGlAccountName = null;
	var accrcblGlAccountName=null;
	var serviceTaxGlAccountId = null;
	var rvshpexpGlAccountId=null;
	var cstacctGlAccountId=null;
	var bankStmGlAccountClassId=null;
	var txaccountGlAccountClassId=null;
	var cmexpGlAccountClassId=null;
	var shpexpGlAccountClassId=null;
	var cnexpGlAccountClassId=null;
	var bankGlAccountClassId=null;
	var accrcblGlAccountClassId=null;
	var serviceTaxGlAccountId=null;
	var rvshpexpGlAccountId=null;
	var cstacctGlAccountId=null;

function createPaymentTransactions(orderMap) {
	//console.log("=======orderMap====="+orderMap);
	orderMap.forEach(function(orderInfoMap, key) {
	
	
	//get gl account
	
	//console.log(orderInfoMap.get("shippingCharges"));
	var rows;
	var count=0;
	accountDB.getGlAccountInfo(orderInfoMap.get("salesRepPartyId"),"PAXCOM",function(rows){
	rows.forEach(function(row,key) {
	   if(row["gl_account_type_id"]=="TAX_ACCOUNT"){
		    txaccountGlAccountId=row["gl_account_id"];
			txaccountGlAccountClassId=row["gl_account_class_id"]
		}
		else if(row["gl_account_type_id"]=="COMMISSION_EXPENSE"){
		    cmexpGlAccountId=row["gl_account_id"];
			cmexpGlAccountClassId=row["gl_account_class_id"];
		}
		else if(row["gl_account_type_id"]=="ACCOUNTS_RECEIVABLE"){
		   accrcblGlAccountName=row["gl_account_id"];
		   accrcblGlAccountClassId=row["gl_account_class_id"];
		}
		else if(row["gl_account_type_id"]=="CANCELLATION_EXPENSE"){
		   cnexpGlAccountId=row["gl_account_id"];
		   cnexpGlAccountClassId=row["gl_account_class_id"];
		}
		else if(row["gl_account_type_id"]=="SHIPPING_EXPENSE"){
		   shpexpGlAccountId=row["gl_account_id"];
		   shpexpGlAccountClassId=row["gl_account_class_id"];
		}
		else if(row["gl_account_type_id"]=="REV_SHIPPING_EXPENSE"){
		   rvshpexpGlAccountId=row["gl_account_id"];
		   rvshpexpGlAccountId=row["gl_account_class_id"];
		}
		else if(row["gl_account_type_id"]=="CUSTOMER_ACCOUNT"){
		   cstacctGlAccountId=row["gl_account_id"];
		   cstacctGlAccountId=row["gl_account_class_id"];
		}
		else if(row["gl_account_type_id"]=="BANK_STLMNT_ACCOUNT"){
		   bankStmGlAccountId=row["gl_account_id"];
		   bankStmGlAccountClassId=row["gl_account_class_id"];
		}
	count++;
	if(count==rows.length-1)
	mainfunction(orderInfoMap);
	});
	
	
	});
	//console.log(orderInfoMap.get("salesRepPartyId"));
	
	
	// console.log("ship"+shpexpGlAccountId);
	// console.log("cance"+cnexpGlAccountId);
	// console.log("accr"+accrcblGlAccountName);
	// console.log("commi"+cmexpGlAccountId);
	// //
	
});}

function insertAcctgTrans(acctg_trans_id, acctg_trans_type_id, description, transaction_date, is_posted,  voucher_ref, voucher_date, order_id,  inventory_item_id, party_id){
      accountDB.insertAcctgTrans(acctg_trans_id, acctg_trans_type_id, description, transaction_date, is_posted,  voucher_ref, voucher_date, order_id, inventory_item_id, party_id);
}

function insertAcctgTransEntry(acctg_trans_id, acctg_trans_entry_seq_id, acctg_trans_entry_type_id,party_id, role_type_id, gl_account_type_id , gl_account_id, organization_party_id, amount, currency_uom_idT, debit_credit_flag, reconcile_status_id, gl_account_class){
      accountDB.insertAcctgTransEntry(acctg_trans_id, acctg_trans_entry_seq_id, acctg_trans_entry_type_id,party_id, role_type_id, gl_account_type_id , gl_account_id, organization_party_id, amount, currency_uom_idT, debit_credit_flag, reconcile_status_id, gl_account_class);
}

function mainfunction(orderInfoMap){
var orderStatus=orderInfoMap.get("orderStatus");
	//console.log("======orderStatus======"+orderStatus);
	if(((orderStatus.indexOf("delivered") != -1) || (orderStatus.indexOf("shipped") != -1) || (orderStatus.indexOf("confirmed")!=-1) || 
	   (orderStatus.indexOf("dispute_resolved")!=-1) || (orderStatus.indexOf("Shipping Services")!=-1) || (orderStatus.indexOf("Order")!=-1)) && Number(orderInfoMap.get("totalMarketPlaceFee")) > 0) 
	   {
		var bankAmount = Number(orderInfoMap.get("invoiceAmount")) - Number(orderInfoMap.get("totalMarketPlaceFee"));
		var debitCreditFlag;
		if(bankAmount >= 0) {
			debitCreditFlag = "D";
		} else {
			debitCreditFlag = "C";
		}				
		//Get data from GlAccount entity
		  var acctg_trans_id = uuid.v4();
		  insertAcctgTrans(acctg_trans_id,"PAYMENT_ACCTG_TRANS","Payment", Date.now(),"Y",orderInfoMap.get("settlementRefNo"),
			 orderInfoMap.get("settlementDate"), orderInfoMap.get("externalOrderId"),null, null);
		//1st entry
			var acctg_trans_entry_id = uuid.v4();
			insertAcctgTransEntry(acctg_trans_id,acctg_trans_entry_id,"_NA_",null,null,
			"BANK_STLMNT_ACCOUNT",bankStmGlAccountId,"PAXCOM",bankAmount,"INR", debitCreditFlag, "AES_NOT_RECONCILED",bankStmGlAccountClassId);
		//2nd entry
		if(orderInfoMap.get("serviceTax") != null) {
			acctg_trans_entry_id = uuid.v4();
			insertAcctgTransEntry(acctg_trans_id, acctg_trans_entry_id, "_NA_",null,"SERVICE_TAX_AUTH",
			"TAX_ACCOUNT", txaccountGlAccountId,"PAXCOM",Number(orderInfoMap.get("serviceTax")),"INR", "D", "AES_NOT_RECONCILED", txaccountGlAccountClassId);
		}
		//3rd entry
		if(orderInfoMap.get("cancellationFee") != null){
			acctg_trans_entry_id = uuid.v4();
			insertAcctgTransEntry(acctg_trans_id, acctg_trans_entry_id, "_NA_",null,"CNCL_AGENT",
			"CANCELLATION_EXPENSE", cnexpGlAccountId,"PAXCOM",Number(orderInfoMap.get("cancellationFee")),"INR", "D", "AES_NOT_RECONCILED", cnexpGlAccountClassId);
		}
		//4rth entry
		if(orderInfoMap.get("shippingCharges") != null) {
			acctg_trans_entry_id = uuid.v4();
			insertAcctgTransEntry(acctg_trans_id, acctg_trans_entry_id, "_NA_","carrierPartyId","CARRIER",
			 "SHIPPING_EXPENSE", shpexpGlAccountId,"PAXCOM",Number(orderInfoMap.get("shippingCharges")),"INR", "D", "AES_NOT_RECONCILED",shpexpGlAccountClassId);
		}
		//5th entry
		if(orderInfoMap.get("commissionFee") != null){
			acctg_trans_entry_id = uuid.v4();
			insertAcctgTransEntry(acctg_trans_id, acctg_trans_entry_id, "_NA_",null,"COMSN_AGENT",
			"COMMISSION_EXPENSE", cmexpGlAccountId,"PAXCOM",Number(orderInfoMap.get("commissionFee")),
			"INR", "D", "AES_NOT_RECONCILED", cmexpGlAccountClassId);
		}
		
		//6th entry
		// if(orderInfoMap["commissionFee"] != null){
			// acctg_trans_entry_id = uuid.v4();
			// insertAcctgTransEntry(acctg_trans_id, acctg_trans_entry_id, "_NA_",orderInfoMap.get("settlementDate"), 
			// orderInfoMap.get("salesRepPartyId"),"SALES_REP", "ACCOUNTS_RECEIVABLE", "BANK_001","PAXCOM",
			// Number(orderInfoMap.get("invoiceAmount")),"INR", "C", "AES_NOT_RECONCILED", "ASSET");
		// }
		
		//2nd Transaction
		acctg_trans_id = uuid.v4();
		insertAcctgTrans(acctg_trans_id,"PAYMENT_ACCTG_TRANS","Payment", Date.now(),"Y",orderInfoMap.get("settlementRefNo"),
		orderInfoMap.get("settlementDate"), orderInfoMap.get("externalOrderId"),null, null, "BILL_TO_CUSTOMER");
		//1st entry
		acctg_trans_entry_id = uuid.v4();
		insertAcctgTransEntry(acctg_trans_id, acctg_trans_entry_id, "_NA_", orderInfoMap
			.get("salesRepPartyId"),"SALES_REP", "ACCOUNTS_RECEIVABLE", accrcblGlAccountName,"PAXCOM",Number(orderInfoMap.get("invoiceAmount")),"INR", 
			"D", "AES_NOT_RECONCILED", accrcblGlAccountClassId);
		//2nd entry
		acctg_trans_entry_id = uuid.v4();
		insertAcctgTransEntry(acctg_trans_id, acctg_trans_entry_id, "_NA_",orderInfoMap
			.get("salesRepPartyId"),"CUSTOMER", "ACCOUNTS_RECEIVABLE", accrcblGlAccountName,"PAXCOM",Number(orderInfoMap.get("invoiceAmount")),"INR", "C", "AES_NOT_RECONCILED",accrcblGlAccountClassId);
		   //Add code to settle/unsettle transactions(Currently all are posted)
	} else if(orderStatus.indexOf( "cancelled")!=-1  && Number(orderInfoMap.get("totalMarketPlaceFee")) > 0) {
		//Get data from GlAccount entity
		//1st Transaction
		acctg_trans_id = uuid.v4();
		acctg_trans_entry_id = uuid.v4();
		insertAcctgTrans(acctg_trans_id ,"PAYMENT_ACCTG_TRANS","Payment", Date.now(),"Y",orderInfoMap.get("settlementRefNo"), 
			orderInfoMap.get("settlementDate"), orderInfoMap.get("externalOrderId"),null, null, "BILL_TO_CUSTOMER");
		 //1st entry
		insertAcctgTransEntry(acctg_trans_id,acctg_trans_entry_id,"_NA_",null,null,"BANK_STLMNT_ACCOUNT",
		   bankStmGlAccountId,"PAXCOM",bankAmount,"INR", "C", "AES_NOT_RECONCILED", bankGlAccountClassId);
		  //2nd entry
		  if(orderInfoMap.get("serviceTax") != null) {
		  acctg_trans_entry_id = uuid.v4();
		
		   insertAcctgTransEntry(acctg_trans_id, acctg_trans_entry_id, "_NA_",null,"SERVICE_TAX_AUTH",
		   "TAX_ACCOUNT", txaccountGlAccountId,"PAXCOM",Number(orderInfoMap.get("serviceTax")),"INR", "D", "AES_NOT_RECONCILED", txaccountGlAccountClassId);
		  }
		  //3rd entry
		  if(orderInfoMap.get("commissionFee") != null){
		   acctg_trans_entry_id = uuid.v4();
		
		   insertAcctgTransEntry(acctg_trans_id, acctg_trans_entry_id, "_NA_",null,"COMSN_AGENT",
		   "COMMISSION_EXPENSE", cmexpGlAccountId,"PAXCOM",Number(orderInfoMap.get("commissionFee")),"INR", "D", "AES_NOT_RECONCILED", cmexpGlAccountClassId);
		  }
		  //4rth entry
		  if(orderInfoMap.get("cancellationFee") != null){
		  acctg_trans_entry_id = uuid.v4();
		  insertAcctgTransEntry(acctg_trans_id, acctg_trans_entry_id, "_NA_",null,"CNCL_AGENT",
		   "CANCELLATION_EXPENSE", cnexpGlAccountId,"PAXCOM",Number(orderInfoMap.get("cancellationFee")),"INR", "D", "AES_NOT_RECONCILED",cnexpGlAccountClassId);
		  }
	 } else if(orderStatus.indexOf( "Refund")!=-1) {
	  //Get returnId
	  //1st Transaction
	  acctg_trans_id = uuid.v4();
		acctg_trans_entry_id = uuid.v4();
		
		insertAcctgTrans(acctg_trans_id,"PAYMENT_ACCTG_TRANS","Payment", Date.now(),"Y",orderInfoMap.get("settlementRefNo"), 
			orderInfoMap.get("settlementDate"), orderInfoMap.get("externalOrderId"),null, null, "BILL_TO_CUSTOMER");
	  //1st entry
	  acctg_trans_entry_id = uuid.v4();
		
	  insertAcctgTransEntry(acctg_trans_id,acctg_trans_entry_id, "_NA_", orderInfoMap.get("salesRepPartyId"),
	  "SALES_REP", "ACCOUNTS_RECEIVABLE", accrcblGlAccountName,"PAXCOM",Number(orderInfoMap.get("invoiceAmount")),"INR", "D", "AES_NOT_RECONCILED", accrcblGlAccountClassId);
	  //2nd entry
	  acctg_trans_entry_id = uuid.v4();
		
	  insertAcctgTransEntry(acctg_trans_id,acctg_trans_entry_id,"_NA_",null,null,"BANK_STLMNT_ACCOUNT",
	   bankStmGlAccountId,"PAXCOM",bankAmount,"INR", "C", "AES_NOT_RECONCILED", bankStmGlAccountClassId);
	  //3rd entry
	  acctg_trans_entry_id = uuid.v4();
		
	  if(orderInfoMap.get("serviceTax") != null) {
	   insertAcctgTransEntry(acctg_trans_id, acctg_trans_entry_id, "_NA_",null,"SERVICE_TAX_AUTH",
	   "TAX_ACCOUNT", txaccountGlAccountId,"PAXCOM",Number(orderInfoMap.get("serviceTax")),"INR", "D", "AES_NOT_RECONCILED", txaccountGlAccountClassId);
	  }
	  //4rth entry
	  acctg_trans_entry_id = uuid.v4();
		
	  if(orderInfoMap.get("shippingCharges") != null) {
	   insertAcctgTransEntry(acctg_trans_id, acctg_trans_entry_id, "_NA_",
			"carrierPartyId","CARRIER",     "SHIPPING_EXPENSE", shpexpGlAccountId,"PAXCOM",Number(orderInfoMap.get("shippingCharges")),
			  "INR", "D", "AES_NOT_RECONCILED",     shpexpGlAccountClassId);
	  }
	  //5th entry
	    acctg_trans_entry_id = uuid.v4();
	
	  if(orderInfoMap.get("commissionFee") != null){
	   insertAcctgTransEntry(acctg_trans_id,acctg_trans_entry_id , "_NA_",null,"COMSN_AGENT",
	   "COMMISSION_EXPENSE", cmexpGlAccountId,"PAXCOM",Number(orderInfoMap.get("commissionFee")),"INR", "D", "AES_NOT_RECONCILED",cmexpGlAccountClassId);
	  }
	  //2nd Transaction
	   acctg_trans_id = uuid.v4();
		acctg_trans_entry_id = uuid.v4();
	
	  insertAcctgTrans(acctg_trans_id,"PAYMENT_ACCTG_TRANS","Payment", Date.now(),"Y",
		orderInfoMap.get("settlementRefNo"),  orderInfoMap.get("settlementDate"), orderInfoMap.get("externalOrderId"),null, null,
		"BILL_TO_CUSTOMER");
	  //1st entry
	  acctg_trans_entry_id = uuid.v4();
	
	  insertAcctgTransEntry(acctg_trans_id, acctg_trans_entry_id, "_NA_", "custPartyId","CUSTOMER",
		"ACCOUNTS_RECEIVABLE", accrcblGlAccountName,"PAXCOM",Number(orderInfoMap.get("invoiceAmount")),"INR", "D", "AES_NOT_RECONCILED",accrcblGlAccountClassId);
	  //2nd entry
	  acctg_trans_entry_id = uuid.v4();
	
	  insertAcctgTransEntry(acctg_trans_id, acctg_trans_entry_id, "_NA_", orderInfoMap.get("salesRepPartyId")
		,"SALES_REP", "ACCOUNTS_RECEIVABLE", accrcblGlAccountName,"PAXCOM",Number(orderInfoMap.get("invoiceAmount")),
		 "INR", "C", "AES_NOT_RECONCILED", accrcblGlAccountClassId);
	 }
	 //Put transactionId in OrderHeader
	 //Mark transactions settle/unsettle
	 
	}
	
	function tableViewTransResponse(res){
	  var view;
	  view="<table border='1'><th>AcctgTransId</th><th>AcctgTransTypeId</th><th>Description</th><th>Transaction Date</th><th>Voucher Ref Id</th><th>Voucher Ref Date</th><th>OrderId</th>";
	  accountDB.acctTransView(view,function(views){
	  console.log(views);
	  res.send(views);
	  res.end();
	  });
	}
	
	function tableViewTransEntryResponse(res){
	  var view;
	  view="<table border='1'> "+
	      "<th>AcctgTransId</th> <th>AcctgTransEntryId</th> <th>AcctgTransEntryTypeId</th> <th>PartyId</th> <th>RoleTypeId</th> <th>GlAccountTypeId</th> <th>GlAccountId</th> <th>OrganisationPartyId</th>"+
		  "<th>Amount</th> <th>CurrencyUomId</th> <th>DebitCreditFlag</th> <th>ReconcileStatusId</th> <th>GlAccountClass</th>";
	  
	accountDB.acctTransEntryView(view,function(views){
	  res.send(views);
	  res.end();});
	}
	
	function orderExistsCount(orderId,fun){
		accountDB.orderExists(orderId,function(count){fun(count);});
	}
	
	function orderItemExists(orderId,fun){
	accountDB.orderItemExists(orderId,function(rows){
		//	console.log('int the db');
		if(rows.length>0){
			fun(rows[0]["order_item_order_id"]);
		}
		else fun('');
	});
}

	function orderExists(orderId,fun){
		accountDB.orderExists(orderId,function(rows){
			console.log(rows);
			if(rows.length>0)fun(rows[0]["orders_id"]);
		else return fun('');
		});
}

	function temp(){
		return csvParser.temp();
	}

exports.tableViewTransResponse=tableViewTransResponse;
exports.tableViewTransEntryResponse=tableViewTransEntryResponse;
exports.storePaymentSheetData=storePaymentSheetData;
exports.createAmazonPaymentSheet=createAmazonPaymentSheet;
exports.createFlipkartPaymentSheet=createFlipkartPaymentSheet;
exports.createPaymentTransactions=createPaymentTransactions;
exports.orderExistsCount=orderExistsCount;
exports.temp=temp;
exports.orderItemExists=orderItemExists;
exports.orderExists=orderExists;