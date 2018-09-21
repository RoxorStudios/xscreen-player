const path          = require('path')
const unirest       = require('unirest')
const fs            = require('fs')
const https         = require('https')
const async         = require('async')
const jsonfile      = require('jsonfile')
const Raven         = require('raven');

require('dotenv').config({
    path: path.join(__dirname+'/../../.env')
});

var storagePath     = path.join(__dirname+'/../../public/content/');
var screenPath      = path.join(__dirname+'/../../public/screen/');
var contentPath     = process.env.CONTENT_PATH;
var displayKey      = process.env.DISPLAY_KEY;
var endpoint        = 'http://xscreen.io/live/';

var syncInterval    = 60; //Seconds

var media;
var mediaFiles;
var syncTimeout;

//Init Sentry
Raven.config('https://b774cabf2ed04b67a8d8c3f977b4dd8c@sentry.io/1285635',{
    name: displayKey
}).install();

function sync() {

    clearTimeout(syncTimeout);

    media = [];
    mediaFiles = [];

    unirest.get(endpoint + 'sync2/' + displayKey)
    .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
    .timeout(10000)
    .send()
    .end(function (response) {
        if(response.statusType == 2 && isJson(response.body)) {
            var syncData = JSON.parse(response.body);
            saveScreenData(syncData.screendata);
            downloadMedia(syncData.media);
        } else {
            console.log('Error calling sync route');
            restartSync();
        }
    });
}

sync();

function restartSync() {
    syncTimeout = setTimeout(sync, syncInterval * 1000);
}

function saveScreenData(screenData) {
    jsonfile.writeFile(screenPath+'screendata.json', screenData, function (err) {
        if(err){
            console.log('Error saving screendata: ' + err);
            console.error(err)
        }
    })
}

function downloadMedia(media) {

    async.each(media, function(file, callback) {

        if(file.media){

            mediaFiles.push(file.media);

            //Images
            if(parseInt(file.type) == 1 || parseInt(file.type) == 2) {
                if (!fs.existsSync(storagePath+file.media)) {
                    var dest = storagePath + '_' + file.media;
                    var destFile = fs.createWriteStream(dest);
                    var request = https.get(file.original, function(response) {
                        if(response.statusCode == 200){
                            response.pipe(destFile);
                            destFile.on('finish', function() {
                                destFile.close(function(){
                                    fs.rename(dest, storagePath+file.media, function(err){
                                        //Done
                                        callback();
                                    });
                                });
                            });
                        } else {
                            fs.unlink(dest);
                            callback('Status problem ' + file.media);
                        }
                    }).on('error', function(err) { // Handle errors
                        fs.unlink(dest);
                        callback('Connection error ' + file.media);
                    });
                } else {
                    callback();
                }

            } else {
                //Other
                callback();
            }
        } else {
            //callback('No media for ' + file.id);
            callback();
        }
    }, function(err){
        if(err){
            console.log('Error downloading media: ' + err);
            console.error(err);
        }
        removeMedia();
    });

}

function removeMedia() {

    fs.readdir(storagePath, function(err, dirfiles) {

        if(err) {
            console.log('Error removing media: ' + err);
            console.error(err);
        }

        dirfiles.forEach(function(file,index) {
            if(file.substring(0, 1) != '_'){
                //File
                if(mediaFiles.indexOf(file) == -1 && file != '.gitignore'){
                    fs.unlink(storagePath+file);
                };
            } else {
                //Temporary file
                fs.unlink(storagePath+file);
            }
        });

    });

    restartSync();

}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
