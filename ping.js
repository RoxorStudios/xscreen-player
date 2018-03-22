const path          = require('path')
const fs            = require('fs')
const unirest       = require('unirest')
const reboot        = require('nodejs-system-reboot')
const getIP         = require('external-ip')()
const internalIp    = require('internal-ip')
const procStats     = require('process-stats')
const download      = require('download')
const del           = require('del')
const copy          = require('recursive-copy')

require('dotenv').config({
    path: path.join(__dirname+'/.env')
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
                runReboot();
            }
            if(parseInt(response.update)) {
                runUpdate();
            }

        }
        restartSync();
    });
}

sync();

function restartSync() {
    syncTimeout = setTimeout(sync, syncInterval * 1000);
}


function runUpdate() {
    console.log('start');
    download('https://github.com/RoxorStudios/xscreen-player/archive/master.zip',path.join(__dirname+'/install'),{
        extract: true
    }).then(data => {
        console.log('download done!')
        //Check if directory exists
        if (fs.existsSync(path.join(__dirname+'/install/xscreen-player-master/dist'))) {
            console.log('dist folder found')
            del([path.join(__dirname+'/install/*'),"!" + path.join(__dirname+'/install/xscreen-player-master')],{
                force: true
            }).then(function(paths){
                console.log('dist folder cleaned');
                copy(path.join(__dirname+'/install/xscreen-player-master/dist'), path.join(__dirname+'/install'))
                .then(function(results) {
                    console.info('Copied ' + results.length + ' files to install folder');
                    del([path.join(__dirname+'/install/xscreen-player-master')],{
                        force: true
                    }).then(function(paths){
                        console.log('Installation folder remove, update succeeded')
                        runReboot();
                    })
                    .catch(function(error) {
                        console.error('Problem removing master folder: ' + error)
                    });
                })
                .catch(function(error) {
                    console.error('Copy failed: ' + error)
                });
            })
            .catch(function(error) {
                console.error('Cleaning dist folder failed: ' + error)
            });
        } else {
            console.error('Dist folder not found')
        }
    }).catch(function(error) {
        console.error('Could not download repository: ' + error)
    });
}

function runReboot(){
    console.log('Going down for reboot...');
    reboot( function (err, stderr, stdout) {
        if(!err && !stderr) {
            console.log(stdout);
        }
    });
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
