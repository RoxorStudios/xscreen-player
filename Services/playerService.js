require('dotenv').config();

const express       = require('express')
const app           = express()
const path          = require("path");
const isReachable   = require('is-reachable');
const escpos        = require('escpos');
const jsonfile      = require('jsonfile')

var screenPath      = path.join(__dirname+'/../Public/screen/');

var counter         = 1;
var printCounter    = 0;

if(process.env.PRINT) {
    const device  = new escpos.Network(process.env.PRINT);
    const printer = new escpos.Printer(device);
}

app.use(express.static('../Public'));
app.set('views', path.join(__dirname, '/../Views'));
app.set('view engine', 'pug')

app.get('/', function (req, res) {
    res.render("player");
})

app.get('/config', function (req, res) {
    var printable = process.env.PRINT ? 1 : 0;
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        domain: process.env.DOMAIN,
        live: process.env.LIVE,
        contentPath: process.env.CONTENT_PATH,
        displayKey : process.env.DISPLAY_KEY,
        print:  printable,
        counter: counter,
        printCounter: printCounter,
        count: process.env.COUNT,
        website: process.env.WEBSITE,
        socket: process.env.SOCKET
    }));
})

app.get('/screen', function (req, res) {
    res.render("screen");
})

app.get('/slide/:uid', function (req, res) {
    jsonfile.readFile(screenPath+'screendata.json', function(err, json) {
        if(err){
            res.sendStatus(404)
        } else {            
            var slide = json.playlist.find(function(slide) {
                return slide.uid == req.params.uid;
            });
            if(slide){
                var data = {
                    contentPath: process.env.CONTENT_PATH,
                    screen: json.screen,
                    slide: slide,
                    uid: req.query.uid
                };
                switch(slide.type){
                    case 'slide':
                        res.render("slide",data);
                        break;
                    case 'video':
                        res.render("video",data);
                        break;
                }
            } else {
                res.sendStatus(404)
            }
        }
    })
})

app.get('/screendata', function(req,res) {
    jsonfile.readFile(screenPath+'screendata.json', function(err, json) {
        if(err){
            res.sendStatus(404)
        } else {
            res.setHeader('Content-Type', 'application/json')
            res.send(json)
        }
    })
})

app.get('/status', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    isReachable('xscreen.io').then(reachable => {
        res.send(JSON.stringify({
            online : reachable
        }));
    });
})

app.get('/setcounter', function (req, res, data) {

    var newCounter = typeof req.query.counter !== 'undefined' ? parseInt(req.query.counter) : counter;
    counter = newCounter <= 0 ? 99 : (newCounter >= 100 ? 1 : newCounter);

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        counter : counter
    }));

});

app.get('/print', function (req, res) {

    printCounter++;
    printCounter = printCounter > 99 ? 1 : printCounter;

    var realNumber = printCounter;

    print();

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        counter: realNumber
    }));

    return;
})

function print() {

    var device  = new escpos.Network(process.env.PRINT);
    var printer = new escpos.Printer(device);
    var realNumber = printCounter;

    var logo = escpos.Image.load(__dirname+'/../Public/client/logo.png', function(logo){

        var number = escpos.Image.load(__dirname+'/../Public/assets/images/numbers/'+realNumber+'.png', function(number){
            device.open(function(){
              printer
              .align('ct')
              .image(logo, 'd24')
              .feed(1)
              .image(number, 'd24')
              .feed(1)
              .text(getTicketMessage())
              .feed(2)
              .cut('partial')
              .close();
              });
        });
    });
}

function getTicketMessage() {
    var message = "";
    if(process.env.TICKET_MESSAGE) {
        message = process.env.TICKET_MESSAGE;
    }
    message = message.split("\\n");
    return message.join("\n");
}

app.listen(process.env.PORT, function () {
    //Server started
})
