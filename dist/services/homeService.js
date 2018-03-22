const unirest       = require('unirest');
const reboot        = require('nodejs-system-reboot');
const getIP         = require('external-ip')();
const internalIp    = require('internal-ip');
const procStats     = require('process-stats');

require('dotenv').config({
    path: path.join(__dirname+'/../../.env')
});

var displayKey      = process.env.DISPLAY_KEY;
var endpoint        = 'http://xscreen.io/live/';

var syncInterval    = 10; //Seconds
var syncTimeout;

var systemData = {
    'ip_remote': null,
    'ip_local': null
}

function sync() {

    clearTimeout(syncTimeout);
    
    //Get external ip
    getIP((err, ip) => {
        if (!err) {
            systemData.ip_remote = ip
        }
    });
    //Get local ip
    internalIp.v4().then(ip => {
        systemData.ip_local = ip
    });

    //System stats
    var systemStats = procStats();
    systemData.uptime = systemStats.uptime.pretty;

    unirest.get(endpoint + 'home/' + displayKey)
    .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
    .timeout(10000)
    .query(systemData)
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
