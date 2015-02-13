var nodemailer = require("nodemailer");
var fs = require("fs");
var logger = require('../lib/logger');
var appFolder = process.env.USERPROFILE + "\\Paxcom";
var logFilename = 'Log_' + getTimeStamp() + '.log';
var	logFile = appFolder + '\\' + logFilename; //'\\file.log',

var body = {
    isChecked: '',
    text: ''
};

var smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "paxcomfeedback@paxcel.net",
        pass: "paxcel@123"
    }
});


exports.setMailContents = function (ischecked,text) {
    body.isChecked =ischecked ;
    body.text = text;
}

exports.sendMail = function (cb) {
    logger.debug("text to send is "+body.text);
    logger.debug("path of log file "+logFile);
    var fileData;
    var mailOptions;
    var isError = false;
    
    if(body.isChecked){
        fileData = fs.readFileSync(logFile, 'utf8');
        mailOptions = {
        to: "paxcomfeedback@paxcel.net",
        subject: "Feedback!",
        text: body.text,
        attachments: [{
            'filename': "logFile",
            'content': fileData
        }]
    }
    }else{
        mailOptions = {
        to: "paxcomfeedback@paxcel.net",
        subject: "Feedback!",
        text: body.text,
    }
    }

    smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            logger.debug("error");
            isError = true;
            cb(isError);
        } else {
            logger.debug("success");
            isError = false;
            cb(isError);
        }
    });
}

function getTimeStamp() {
	now = new Date();
	year = "" + now.getFullYear();
	month = "" + (now.getMonth() + 1);
	if (month.length == 1) {
		month = "0" + month;
	}
	day = "" + now.getDate();
	if (day.length == 1) {
		day = "0" + day;
	}
	hour = "" + now.getHours();
	if (hour.length == 1) {
		hour = "0" + hour;
	}
	minute = "" + now.getMinutes();
	if (minute.length == 1) {
		minute = "0" + minute;
	}
	second = "" + now.getSeconds();
	if (second.length == 1) {
		second = "0" + second;
	}
	//  return year + "-" + month + "-" + day + " " + hour + "-" + minute + "-" + second;
	return year + "-" + month + "-" + day;
}