require('dotenv').config();

const unirest       = require('unirest');
const reboot        = require('nodejs-system-reboot');

var displayKey      = process.env.DISPLAY_KEY;
var endpoint        = process.env.LIVE;

var syncInterval    = 2; //Seconds
var syncTimeout;

function sync() {

    clearTimeout(syncTimeout);

    unirest.get(endpoint + 'home/' + displayKey)
    .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
    .timeout(10000)
    .send()
    .end(function (response) {
        if(response.statusType == 2 && isJson(response.body)) {
            response = JSON.parse(response.body);
            console.log(response);
            if(parseInt(response.reboot)) {
                reboot( function (err, stderr, stdout) {
                    if(!err && !stderr) {
                        console.log(stdout);
                    }
                });
            }
        }
        restartSync();
    });
}

sync();

function restartSync() {
    syncTimeout = setTimeout(sync, syncInterval * 1000);
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
