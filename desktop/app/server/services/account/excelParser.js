var excelParser = require('excel-parser');
var accountService=require('./accountService');

var HashMap=require('hashmap').HashMap;
var response;
var responseMap;

var nodeExcel = require('excel-export');
var nodeExcel = require('excel-export');
var responseMap;
var successCount ;
var failCount ;
var alreadyCount;
var actualResponse;
var totalCounted;
var tillCounted;
var actualResponse = [];
 
function excelParse(file, sheetType,res){ 
var count=0;
	var validated=false;
	successCount=0;
	failCount=0;
	alreadyCount=0;
	actualResponse=[];
	totalCounted=0;
	tillCounted=0;
var responseMap=new HashMap();
var count=0;
var validated=false;
excelParser.parse({
  inFile: file,
  worksheet: 1,
},function(err, records){
	//console.log("========file============"+records);
  if(err) console.error(err);
  if(records.length>0){
			var count=0;
			var validated=false;
			if(sheetType == "amazon") 
			{
			 var orderInfo = new HashMap();
				for(var i=0;i<records.length;i++){
					data=records[i];
					if(count<8){
			if(count==7){
			if(data.length==21)
			{ 
			if(!sequenceCheck(data,sheetType)){resquestHandler(res,'csv sheet seqence problem');count++;return;}
			else {validated=true;//resquestHandler(res,"all done");
			}
			}
			else {resquestHandler(res,'csv sheet row count not correct');count++;return;}
			}
			count++;
			}
			else 
			{
			  if(validated)	{
				  console.log('kuwalisngh');
				  
				  if(data[3]!=''){
					  totalCounted++;
					   accountService.orderExistsCount(data[3],function(rowCount){
						   
                               accountService.createAmazonPaymentSheet(data,function(bool){
						   console.log('kulwntsinghksjfljslfjldsfjdlskfjsldjlk'+rowCount);
				         if(rowCount!=0){
							 tillCounted++;
						 responseMap.set(data[3]+"_already","It already exist in order entity"); 
					  } else{
					    if(data[1]==''){
							tillCounted++;
							responseMap.set(data[3]+"_fail","settlement id empty");  
						} else if(data[0]==''){
							tillCounted++;
							resopnseMap.set(data[3]+"_fail","date/time is empty");
						} else if(data[2]==''){
							tillCounted++;
						  responseMap.set(data[3]+"_fail","type is empty");
						} else{
							   
								   if(!bool){
									   tillCounted++;
								responseMap.set(data[3]+"_fail","settlement id already exists");}
							else {
								tillCounted++;
								responseMap.set(data[3]+"_success","Successfull");
								var refundedPayment = false;	
								var productIdInfo = {};
								if(data[2] == "Refund") {
									refundedPayment = "true";
									//Create OrderPaymentPreference and Payment
								}
								if(data[4] != "") {
									productIdInfo[data[4]]=  data[6];
								}
								if(orderInfo.get(data[3])!= null) {
									var orderMap=new HashMap();
									var tempMap = orderInfo.get(data[3]);
									orderMap.set("productIdInfo",productIdInfo);
									orderMap.set("settlementRefNo",data[1]);
									orderMap.set("settlementDate" ,data[0]);
									orderMap.set("commissionFee",Number(data[16]) + Number(data[18]) + Number(tempMap["commissionFee"]));
									orderMap.set("invoiceAmount", Number(data[12]) + Number(tempMap["invoiceAmount"]));
									orderMap.set("salesTax", Number(data[13]) + Number(tempMap["salesTax"]));
									orderMap.set("externalOrderId", data[3]);
									orderMap.set("shippingCharges" ,Number(data[13]) + Number(tempMap["shippingCharges"]));
									orderMap.set("promotionalRebate", Number(data[14]) + Number(tempMap["promotionalRebate"]));
									orderMap.set("fbaFee", Number(data[17]) + Number(tempMap["fbaFee"]));
									orderMap.set("orderStatus", data[2]);
									orderMap.set("otherTransactionFee", Number(data[18]) + Number(tempMap["otherTransactionFee"]));
									orderMap.set("invoiceId", "INV11");
									orderMap.set("salesRepPartyId","AMAZON");
									var totalMarketplaceFee = Number(data[16]) + Number(data[18]) + Number(data[13]);
									orderMap.set("totalMarketPlaceFee", totalMarketplaceFee + Number(tempMap["totalMarketPlaceFee"]));
									orderMap.set("refundedPayment", refundedPayment);
									console.log("===========orderMap===22222========="+orderMap);
									orderInfo.set(data[3], orderMap);
									} 
									else {
									var orderMap = new HashMap();
									if(data[4]!=null){
										productIdInfo[data[4]]=data[6];
									}
									orderMap.set("productIdInfo", productIdInfo);
									orderMap.set("settlementRefNo",data[1]);
									orderMap.set("settlementDate", data[0]);
									orderMap.set("commissionFee" ,Number(data[16]) + Number(data[18]));
									orderMap.set("invoiceAmount", data[12]);
									orderMap.set("salesTax" ,data[13]);
									orderMap.set("externalOrderId" , data[3]);
									orderMap.set("shippingCharges", data[13]);
									orderMap.set("promotionalRebate" , data[14]);
									orderMap.set("fbaFee" , data[17]);
									orderMap.set("orderStatus" , data[2]);
									orderMap.set("otherTransactionFee" , data[18]);
									orderMap.set("invoiceId" , "INV11");
									var totalMarketplaceFee = Number(data[16]) + Number(data[18]) + Number(data[13]);
									orderMap.set("totalMarketPlaceFee" , totalMarketplaceFee);
									orderMap.set("refundedPayment" ,refundedPayment);
									orderMap.set("salesRepPartyId","AMAZON");
									console.log("===========orderMap===1========="+orderMap);
									orderInfo.set(data[3], orderMap);
									}
						          } 
		                    
							   }
							}
							console.log('=====totalcounted ======'+totalCounted);
							console.log('=====tillcounted ======'+tillCounted);
						 	
						 			if(totalCounted==tillCounted) {
									accountService.createPaymentTransactions(orderInfo);
									MPCsvParse(orderInfo,responseMap,res);}
							});		  
							
							
						 });				
			}	
			} }}}
			else if (sheetType == "flipkart") {
			   var orderInfo = new HashMap();
				for(var i=0;i<records.length;i++){
					data=records[i];	
					 //queries.queryInsert(db,data,'csv');
					if(count==0){
					//console.log(data);
					if(data.length==39){ if(!sequenceCheck(data,sheetType)){resquestHandler(res,'csv sheetseqence problem');count++;return;}
					else {validated=true;
					resquestHandler(res,"all done");
					}
					}
					else {
						resquestHandler(res,'csv sheet row count not correct');
						count++;
						return;
						}
					count++;
					}
					else {
						if(validated){	
							totalCounted++;
				if(data[2]!=''&&data[3]!=''&&data[5]!=''){
		       // console.log('======kulwasijngh======');
	       	    accountService.orderItemExists(data[3],function(orderItemId){
				console.log(orderItemId);
			    if(orderItemId==''){tillCounted++;responseMap.set(data[2]+'_fail','External Order Item :'+data[3]+' does not match');}
			    else{
				//console.log('kulwtiangoh');
			    accountService.orderExists(data[2],function(orderId){
					
					//c//onsole.log('ia md here sn soyusbnmlsfh');
					
					//console.log("here in ");
					accountService.createFlipkartPaymentSheet(data,function(bool){
					//	tillCounted++;
						console.log('=====orderId===='+orderId);
				       if(orderId==''){tillCounted++;responseMap.set(data[2]+'_fail','Order Id does not exists');}
				       else if(orderItemId!=''&&orderItemId!=orderId){tillCounted++;responseMap.set(data[2]+'_fail',"External Order Id : " + data[2].trim() + " does not match with orderId in external order item : " + data[3].trim() +" .");}
						else if(data[0]==''){tillCounted++;responseMap.set(data[2]+'_fail',"Settlement Ref is missing");}
						else if(data[1]==''){tillCounted++;responseMap.set(data[2]+'_fail',"Settlement Data is missing");}
						else{
					    tillCounted++;
						if(bool){
						responseMap.set(data[2]+'_success',"sucessfull");
						var orderInfoMap = new HashMap();
					var productIdInfo = new HashMap();
					productIdInfo.set(data[6],data[7]);
					orderInfoMap.set("productIdInfo", productIdInfo);
					var commissionFeeVal = Number(data[20]) + Number(data[21]) + Number(data[30]);
					   orderInfoMap.set("commissionFee",commissionFeeVal);
					   orderInfoMap.set("marketPlaceFee", data[17]);
					   orderInfoMap.set("settlementDate", data[1]);
					   orderInfoMap.set("settlementRefNo", data[0]);
					   orderInfoMap.set("protectionFund", data[16]);
					   //orderInfoMap.set("feeDiscount", insetMap.get("feeDiscount"));
					   orderInfoMap.set("refund", data[13]);
					   orderInfoMap.set("orderStatus", data[5]);
					   orderInfoMap.set("emiFee", data[22]);
					   orderInfoMap.set("invoiceAmount", data[10]);
					   orderInfoMap.set("serviceTax", data[31]);
					   orderInfoMap.set("shippingCharges", data[26]);
					   orderInfoMap.set("reverseShippingCharges", data[28]);
					   orderInfoMap.set("settlementValue", data[11]);
					   orderInfoMap.set("cancellationFee", data[29]);
					   orderInfoMap.set("invoiceId", data[8]);
					   orderInfoMap.set("externalOrderId", data[2]);
					   orderInfoMap.set("totalMarketPlaceFee" , data[17]);
					   orderInfoMap.set("salesRepPartyId", "FLIPKART");
					   orderInfo.set(data[2], orderInfoMap);
						}
						else {responseMap.set(data[2]+'_already',"Already exist in DataBase");console.log('kuwlajsijdfhisdhfksdhfk');}
						};
					console.log('====totalcouted====='+totalCounted);
				console.log('=====tillCounted====='+tillCounted);
				if(totalCounted==tillCounted)	{ accountService.createPaymentTransactions(orderInfo);
					MPCsvParse(orderInfo,responseMap,res);
					}
				
                    				   
				});
				
			});
			}
		});
	}else {tillCounted++;}
						} 
					}
					
					//Check Column's name and length
					//Call queries from accountDAO, SAve
					}
			}
		}

		function resquestHandler(res,code)
		{
			var color ;
			if(code == 'all done')
			color="#00FF00";
			else color ="#FF0040";
			
			var data ={'code' : code,'color' : color}
			res.send(data);
			res.end();
		}

		function sequenceCheck(data,sheetType){

		if(sheetType=='amazon'){

		if(data[0].toString().trim()=='date/time'&&data[1].toString().trim()=='settlement id'&&data[2].toString().trim()=='type'&&data[3].toString().trim()=='order id'&&data[4].toString().trim()=='Sku'&&data[5].toString().trim()=='description'&&data[6].toString().trim()=='quantity'&&
		data[7].toString().trim()=='marketplace'&&data[8].toString().trim()=='fulfillment'&&data[9].toString().trim()=='order city'&&
		data[10].toString().trim()=='order state'&&data[11].toString().trim()=='order postal'&&data[12].toString().trim()=='product sales'&&
		data[13].toString().trim()=='shipping credits'&&data[14].toString().trim()=='promotional rebates'&&data[15].toString().trim()=='sales tax collected'&&data[16].toString().trim()=='selling fees'&&data[17].toString().trim()=='fba fees'&&data[18].toString().trim()=='other transaction fees'&&data[19].toString().trim()=='other'&&data[20].toString().trim()=='total')
		   return true;
		   else return false;}
		else if(sheetType='flipkart'){

		if(data[0].toString().trim()=='Settlement Ref No.'&&data[1].toString().trim()=='Settlement Date'&&data[2].toString().trim()=='Order ID/FSN'&&data[3].toString().trim()=='Order Item ID'&&data[4].toString().trim()=='Order Date'&&data[5].toString().trim()=='Order Status'&&data[6].toString().trim()=='Seller SKU'&&data[7].toString().trim()=='Quantity'&&data[8].toString().trim()=='Invoice ID (Invoice to Buyer)'
		&&data[9].toString().trim()=='Invoice Date (Invoice to Buyer)'&&data[10].toString().trim()=='Invoice Amount (Invoice to Buyer)'
		&&data[11].toString().trim()=='Settlement Value (Rs.)'&&data[12].toString().trim()=='Order Item Value (Rs.)'&&data[13].toString().trim()=='Refund (Rs.)'&&data[14].toString().trim()=='Hold (Rs.)'&&data[15].toString().trim()=='Performance Reward (Rs.)'&&data[16].toString().trim()=='Protection Fund (Rs.)'&&data[17].toString().trim()=='Total Marketplace Fee (Rs.)'&&data[18].toString().trim()=='Sub Category'&&data[19].toString().trim()=='Commission Rate'&&data[20].toString().trim()=='Commission (Rs.)'&&data[21].toString().trim()=='Fixed Fee (Rs.)'&&data[22].toString().trim()=='EMI Fee (Rs.)'&&data[23].toString().trim()=='Total Weight/Slab'&&data[24].toString().trim()=='Shipping Zone'
		&&data[25].toString().trim()=='Shipping Fee(per 500 gms)'&&data[26].toString().trim()=='Shipping Fee (Rs.)'&&data[27].toString().trim()=='Reverse Shipping Fee(per 500 gms)'&&data[28].toString().trim()=='Reverse Shipping Fee (Rs.)'&&data[29].toString().trim()=='Cancellation Fee (Rs.)'&&data[30].toString().trim()=='Fee Discount (Rs.)'&&data[31].toString().trim()=='Service Tax (Rs.)'&&data[32].toString().trim()=='Dispatch Date'&&data[33].toString().trim()=='Delivery Date'&&data[34].toString().trim()=='Cancellation Date'&&data[35].toString().trim()=='Dispute Date'&&data[36].toString().trim()=='Total Offer Amount'&&data[37].toString().trim()=='My Offer Share'&&data[38].toString().trim()=='Flipkart Offer Share'  )
		   return true;
		   else return false;
		}

			  
		  }
		});
}


function MPCsvParse(orderInfo,responseMaps,res){
	console.log("==============end======orderInfo===="+orderInfo);
			   
			//fs.remove('../../../TempUploaded/file.csv');
			    responseMaps.forEach(function(value,key){
					var keyArr = key.split("_");
					var keyVal = keyArr[0];
					var status = keyArr[1];
					if(status == "fail") {
						console.log('fail');
						failCount ++;
					}else if(status=="already"){alreadyCount++;console.log('already');}
					else {
						console.log('success');
						successCount ++;
					}
					var tempArr = [];
					tempArr.push(keyVal);
					tempArr.push(value);
					actualResponse.push(tempArr);
					//actualResponse+=",["+key + "," +value+"]"
				});
				
				//actualResponse+="]";
				//console.log(actualResponse);
					// var conf ={};
					// conf.cols = [{
						// caption:'orderId',
						// type:'string' 
						// },
					  // {caption:'Status',
						// type:'string'
				// }];
					// conf.rows = actualResponse;
					// var result = nodeExcel.execute(conf);
					// console.log(result);
					// // res.setHeader('Content-Type', 'application/vnd.openxmlformats');
					// // res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");
					// // res.end(result, 'binary');
				// //console.log(actualResponse);
				resquestHandler(res,"all done");
								
}


function sequenceCheck(data,sheetType){

if(sheetType=='amazon'){

if(data[0].toString().trim()=='date/time'&&data[1].toString().trim()=='settlement id'&&data[2].toString().trim()=='type'&&data[3].toString().trim()=='order id'&&data[4].toString().trim()=='Sku'&&data[5].toString().trim()=='description'&&data[6].toString().trim()=='quantity'&&
data[7].toString().trim()=='marketplace'&&data[8].toString().trim()=='fulfillment'&&data[9].toString().trim()=='order city'&&
data[10].toString().trim()=='order state'&&data[11].toString().trim()=='order postal'&&data[12].toString().trim()=='product sales'&&
data[13].toString().trim()=='shipping credits'&&data[14].toString().trim()=='promotional rebates'&&data[15].toString().trim()=='sales tax collected'&&data[16].toString().trim()=='selling fees'&&data[17].toString().trim()=='fba fees'&&data[18].toString().trim()=='other transaction fees'&&data[19].toString().trim()=='other'&&data[20].toString().trim()=='total')
   return true;
   else return false;}
else if(sheetType='flipkart'){

if(data[0].toString().trim()=='Settlement Ref No.'&&data[1].toString().trim()=='Settlement Date'&&data[2].toString().trim()=='Order ID/FSN'&&data[3].toString().trim()=='Order Item ID'&&data[4].toString().trim()=='Order Date'&&data[5].toString().trim()=='Order Status'&&data[6].toString().trim()=='Seller SKU'&&data[7].toString().trim()=='Quantity'&&data[8].toString().trim()=='Invoice ID (Invoice to Buyer)'
&&data[9].toString().trim()=='Invoice Date (Invoice to Buyer)'&&data[10].toString().trim()=='Invoice Amount (Invoice to Buyer)'
&&data[11].toString().trim()=='Settlement Value (Rs.)'&&data[12].toString().trim()=='Order Item Value (Rs.)'&&data[13].toString().trim()=='Refund (Rs.)'&&data[14].toString().trim()=='Hold (Rs.)'&&data[15].toString().trim()=='Performance Reward (Rs.)'&&data[16].toString().trim()=='Protection Fund (Rs.)'&&data[17].toString().trim()=='Total Marketplace Fee (Rs.)'&&data[18].toString().trim()=='Sub Category'&&data[19].toString().trim()=='Commission Rate'&&data[20].toString().trim()=='Commission (Rs.)'&&data[21].toString().trim()=='Fixed Fee (Rs.)'&&data[22].toString().trim()=='EMI Fee (Rs.)'&&data[23].toString().trim()=='Total Weight/Slab'&&data[24].toString().trim()=='Shipping Zone'
&&data[25].toString().trim()=='Shipping Fee(per 500 gms)'&&data[26].toString().trim()=='Shipping Fee (Rs.)'&&data[27].toString().trim()=='Reverse Shipping Fee(per 500 gms)'&&data[28].toString().trim()=='Reverse Shipping Fee (Rs.)'&&data[29].toString().trim()=='Cancellation Fee (Rs.)'&&data[30].toString().trim()=='Fee Discount (Rs.)'&&data[31].toString().trim()=='Service Tax (Rs.)'&&data[32].toString().trim()=='Dispatch Date'&&data[33].toString().trim()=='Delivery Date'&&data[34].toString().trim()=='Cancellation Date'&&data[35].toString().trim()=='Dispute Date'&&data[36].toString().trim()=='Total Offer Amount'&&data[37].toString().trim()=='My Offer Share'&&data[38].toString().trim()=='Flipkart Offer Share'  )
   return true;
   else return false;
}

}


function resquestHandler(res,code)
{
	var color ;
	if(code == 'all done')
	color="#00FF00";
	else color ="#FF0040";
	
	var data ={'code' : code,'color' : color,'success':successCount,'unsuccess':failCount,'already':alreadyCount}
	res.send(data);
	res.end();
	
}

//excelParse("kul.xlsx");
//excel('F:\\paxcel\\node\\sample1.xlsx');
exports.excelParse=excelParse;
