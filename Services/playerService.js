require('dotenv').config();

const express       = require('express')
const app           = express()
const path          = require("path");
const isOnline      = require('is-online');
const escpos        = require('escpos');

var counter         = 1;
var printCounter    = 0;

if(process.env.PRINT) {
    const device  = new escpos.Network(process.env.PRINT);
    const printer = new escpos.Printer(device);
}

app.use(express.static('../Public'));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname+'/../Views/player.html'));
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

app.get('/status', function (req, res) {

    var online = false;

    res.setHeader('Content-Type', 'application/json');

    isOnline().then(online => {
        res.send(JSON.stringify({
            online : online
        }));
    });
})

app.listen(process.env.PORT, function () {
    //Server started
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
    printCounter = printCounter > 100 ? 1 : printCounter;

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
