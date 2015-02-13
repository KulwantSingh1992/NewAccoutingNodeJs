var logger = require('../../lib/logger');
var util = require('../util/util');

var XMLPath = "./server/templates/tally/ratioAnalysisRequestFormat.xml";
var requestXml;
/**This function returns object with ratio analysis annual details*/
exports.getAccountingDetails = function (cred, startDate, endDate, cb, err) {
	logger.debug('Loading Accounting information from tally');
	var serverIp = cred.URL.replace("http://", "").replace("https://", "").split(':')[0];
	var serverPort = cred.URL.replace("http://", "").replace("https://", "").split(':')[1];
	if (!serverIp || !serverPort) {
		var errorObject = {
			STATUS: 'ERROR',
			MSG: 'Missing Server Ip or Port number'
		}
		logger.error(JSON.stringify(errorObject));
		cb(errorObject);
		return;
		//}
		/*if (!cred.CompanyName || cred.CompanyName.trim().length == 0 || !cred.URL || cred.URL.trim().length == 0) {
		var errorObject = {
			STATUS: 'ERROR',
			MSG: 'Missing Tally Credentials'
		}
		cb(errorObject);
		return;
		logger.error("tally credentials not found,  proceded further.. handle this");
*/
	} else {
		var localStartDate = '';
		var localEndDate = '';

		if (!requestXml) {
			requestXml = getXmlTemplate(XMLPath);
		}
		if (startDate) {
			localStartDate = startDate.getDate() + '-' + (startDate.getMonth() + 1) + '-' + startDate.getFullYear();
		}

		if (endDate) {
			localEndDate = startDate.getDate() + '-' + (startDate.getMonth() + 1) + '-' + startDate.getFullYear();
		}

		var dateData = {
			companyName: cred.CompanyName, // must not empty
			startDate: localStartDate,
			endDate: localEndDate
		}


		var modifiedXml = util.templateEditor(requestXml, dateData); // calling getTemplate function inside templateEditor


		//creating json object for mustache template value insertion 
		var postheaders = {
			'SOAPAction': null,
			'Content-Length': modifiedXml.length,
			'Content-Type': "text/plain;charset=UTF-8",
			'Accept': "*/*"
		};
		/*var serverIp = cred.URL.replace("http://", "").replace("https://", "").split(':')[0];
		var serverPort = cred.URL.replace("http://", "").replace("https://", "").split(':')[1];
		if (!serverIp || !serverPort) {
			var errorObject = {
				STATUS: 'ERROR',
				MSG: 'Missing Server Ip or Port number'
			}
			logger.error(JSON.stringify(errorObject));
			cb(errorObject);
			return;
		}*/
		var options = {
			host: serverIp.trim(), //cred.URL.replace("http://", "").replace("https://", "").split(':')[0],
			port: serverPort.trim(), //cred.URL.replace("http://", "").replace("https://", "").split(':')[1],
			method: 'POST',
			path: '/',
			headers: postheaders
		};
		try {
			var http = require('http');
			var req = http.request(options, function (res) {
				var ratioObject;
				var buffer = "";
				res.on('data', function (data) {
					buffer += data;

				});
				res.on('error', function (err) {
					logger.error(err);
				});
				res.on('end', function () {
					/*var parseString;
					try {
						parseString = require('xml2js').parseString;
					} catch (parsingException) {
						logger.debug(parsingException);
						var errorObject = {
							STATUS: 'ERROR',
							MSG: 'Parsing error '
						}
						logger.error('Parsing error ');
						cb(errorObject);
						//err(parsingException);
						return;
					}
*/
					var parseString = require('xml2js').parseString;
					parseString(buffer, function (err, result) {
						if (!result.ENVELOPE) {
							var errorObject = {
								STATUS: 'ERROR',
								MSG: 'Unexpected Server Response. Please check server port.'
							}
							logger.error('Unexpected Server Response. Please check server port.');
							cb(errorObject);
							return;
						}
						if (err) {
							var errorObject = {
								STATUS: 'ERROR',
								MSG: 'Parsing error '
							}
							logger.error('Parsing error ' + err);
							cb(errorObject);
							return;
						} else if (result.ENVELOPE.BODY) {
							logger.error("CRITICAL : Invalid Tally settings. Error  : " + result.ENVELOPE.BODY[0].DATA[0].LINEERROR);
							var errorObject = {
								STATUS: 'ERROR',
                                MSG :"Invalid Company Name"
								//MSG: result.ENVELOPE.BODY[0].DATA[0].LINEERROR
							}
							cb(errorObject);
						} else {
							//logger.debug("tally response json : "+JSON.stringify(result));    
							var j;
							ratioObject = {};

							if (result) {
								//logger.debug("Tally Response :"+JSON.stringify(result));
								for (j = 0; j <= result.ENVELOPE.RATIONAME.length; j++) {
									var key = result.ENVELOPE.RATIONAME[j];
									if (key) {
										var data = result.ENVELOPE.RATIOVALUE[j];
										if (data) {
											data = data.replace(/,/g, '');
											try {
												data = parseFloat(data).toFixed(2);
											} catch (err) {
												logger.error('Invalid data');
											}
										} else {
											data = "0.00";
										}
										if (key == 'Bank Accounts') {
											ratioObject['cib'] = data;
										}
										if (key == 'Sundry Debtors') {
											ratioObject['receivable'] = data;
										}
										if (key == 'Sundry Creditors') {
											ratioObject['payable'] = data;
										}
										if (key == 'Stock-in-hand') {
											ratioObject['inventoryValue'] = data;
										}
										if (key == 'Sales Accounts') {
											ratioObject['revenue'] = data;
										}
										if (key == 'Nett Profit') {
											ratioObject['profit'] = data;
										}
										if (key == 'Nett Profit %') {
											ratioObject['percentProfit'] = data;
										}

									}
								}
								cb(ratioObject);
							} else {
								logger.error("Data not recieved from tally, possible cause Tally server not running.");
								var errorObject = {
									STATUS: 'ERROR',
									MSG: 'Data not recieved from tally, possible cause Tally server not running.'
								}
								cb(errorObject);
							}
						}
					});
				});
			});
			req.on('error', function (err) {
				var errorObject = {
					STATUS: 'ERROR',
					MSG: 'Check server IP and Port number'
				}
				logger.error('Error Account getting data from tally. ' + err);
				cb(errorObject);
			});
			req.end(modifiedXml, "utf-8");
		} catch (err) {
			var errorObject = {
				STATUS: 'ERROR',
				MSG: 'Exception getting Account data from tally'
			}
			logger.error('Exception getting Account data from tally'+ err);
			cb(errorObject);
		}
	} // else of credential check ends here
}

/*This function returns file content as sting*/
var getXmlTemplate = function (templatePath) {
	var fs = require('fs');
	var xmlData = fs.readFileSync(templatePath, 'ascii');
	return xmlData;
}