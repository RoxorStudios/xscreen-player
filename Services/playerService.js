require('dotenv').config();

const express       = require('express')
const app           = express()
const path          = require("path");
const isOnline      = require('is-online');
const escpos        = require('escpos');
const fs            = require('fs');

const counterFile   = path.join(__dirname, '../Logs/counters.json');

// Load counters from file or use defaults
function loadCounters() {
    try {
        if (fs.existsSync(counterFile)) {
            const data = fs.readFileSync(counterFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading counters:', error);
    }
    return { counter: 1, printCounter: 0 };
}

// Save counters to file
function saveCounters() {
    try {
        fs.writeFileSync(counterFile, JSON.stringify({ counter, printCounter }, null, 2));
    } catch (error) {
        console.error('Error saving counters:', error);
    }
}

// Initialize counters
const counters = loadCounters();
var counter = counters.counter;
var printCounter = counters.printCounter;

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

    saveCounters();

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        counter : counter
    }));

});

app.get('/print', function (req, res) {

    printCounter++;
    printCounter = printCounter > 99 ? 1 : printCounter;

    var realNumber = printCounter;

    saveCounters();

    if(process.env.PRINT) {
        print();
    } else {
        console.log('Print not configured - skipping physical print');
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        counter: realNumber
    }));

    return;
})

function print() {

    try {
        var device  = new escpos.Network(process.env.PRINT);
        var printer = new escpos.Printer(device);
        var realNumber = printCounter;

        var logo = escpos.Image.load(__dirname+'/../Public/client/logo.png', function(logo){

            var number = escpos.Image.load(__dirname+'/../Public/assets/images/numbers/'+realNumber+'.png', function(number){
                device.open(function(error){
                    if(error) {
                        console.error('Printer connection error:', error);
                        return;
                    }
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
    } catch(error) {
        console.error('Print function error:', error);
    }
}

function getTicketMessage() {
    var message = "";
    if(process.env.TICKET_MESSAGE) {
        message = process.env.TICKET_MESSAGE;
    }
    message = message.split("\\n");
    return message.join("\n");
}
