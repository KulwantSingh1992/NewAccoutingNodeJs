/*

 1. Check the manifest for version (from your running "old" app).
 2. If the version is different from the running one, download new package to a temp directory.
 3. Unpack the package in temp.
 4. Run new app from temp and kill the old one (i.e. still all from the running app).
 5. The new app (in temp) will copy itself to the original folder, overwriting the old app.
 6. The new app will run itself from original folder and exit the process.

*/

var pkg = require('../package.json'); // Insert your app's manifest here
var updater = require('node-webkit-updater');
var upd = new updater(pkg);


// ------------- Step 1 -------------
exports.checkNewVersion = function (cb) {
    var result = 'No updates available.';
    upd.checkNewVersion(function (error, newVersionExists, manifest) {
        if (error) {
            result = 'error to check for new version exists, error:\n' + error;
            console.log(result);
        } else {
            console.log('check for new version exists: ' + manifest.version);
            if(newVersionExists) {
                result = 'completed';
            }
        }
        cb(result);
    });
}

exports.updateNewVersion = function () {
    var updaterFile = upd.getAppPath() + '\\Updater.exe';
    upd.run(updaterFile, null);
}