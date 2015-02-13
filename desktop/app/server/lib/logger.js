var Log = require('log'),
	fs = require('fs'),
	appFolder = process.env.USERPROFILE + "\\Paxcom",
	logFile = appFolder + '\\Log_' + getTimeStamp() + '.log', //'\\file.log',
	existsFolder = fs.existsSync(appFolder);
existsFile = fs.existsSync(logFile);

if (!existsFolder) {
	console.log("Creating log folder " + appFolder);
	fs.mkdir(appFolder);
}

if (!existsFile) {
	console.log("Creating log folder " + logFile);
	fs.openSync(logFile, 'w');
}else{
	fs.openSync(logFile, 'a');
}


var stream = fs.createWriteStream(logFile, {'flags':'a'});

var log = exports = module.exports = new Log('debug', stream);

log.on('line', function (line) {
	console.log(line);
});

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