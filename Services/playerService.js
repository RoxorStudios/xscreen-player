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
            const counters = JSON.parse(data);
            console.log('[COUNTERS] Loaded from file:', counters);
            return counters;
        } else {
            console.log('[COUNTERS] File does not exist, using defaults');
        }
    } catch (error) {
        console.error('[COUNTERS] Error loading counters:', error);
    }
    return { counter: 1, printCounter: 0 };
}

// Save counters to file
function saveCounters() {
    try {
        const data = { counter, printCounter };
        fs.writeFileSync(counterFile, JSON.stringify(data, null, 2));
        console.log('[COUNTERS] Saved to file:', data);
    } catch (error) {
        console.error('[COUNTERS] Error saving counters:', error);
    }
}

// Initialize counters
const counters = loadCounters();
var counter = counters.counter;
var printCounter = counters.printCounter;

console.log('[STARTUP] Player service starting...');
console.log('[STARTUP] Counter initialized to:', counter);
console.log('[STARTUP] Print counter initialized to:', printCounter);
console.log('[STARTUP] PRINT configured:', process.env.PRINT || 'NOT SET');

if(process.env.PRINT) {
    const device  = new escpos.Network(process.env.PRINT);
    const printer = new escpos.Printer(device);
    console.log('[STARTUP] Printer device initialized');
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
    console.log('[STARTUP] Server listening on port:', process.env.PORT);
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

    console.log('[ENDPOINT] /print called');

    printCounter++;
    printCounter = printCounter > 99 ? 1 : printCounter;

    var realNumber = printCounter;

    console.log('[ENDPOINT] Counter incremented to:', realNumber);
    saveCounters();

    if(process.env.PRINT) {
        console.log('[ENDPOINT] PRINT configured, calling print()');
        print();
    } else {
        console.log('[ENDPOINT] PRINT not configured - skipping physical print');
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        counter: realNumber
    }));

    return;
})

function print() {

    console.log('[PRINT] Function called for counter:', printCounter);

    try {
        console.log('[PRINT] Connecting to printer at:', process.env.PRINT);
        var device  = new escpos.Network(process.env.PRINT);
        var printer = new escpos.Printer(device);
        var realNumber = printCounter;

        var logoPath = __dirname+'/../Public/client/logo.png';
        console.log('[PRINT] Loading logo from:', logoPath);

        var logo = escpos.Image.load(logoPath, function(logo, logoError){
            if(logoError) {
                console.error('[PRINT] Logo load error:', logoError);
                return;
            }
            console.log('[PRINT] Logo loaded successfully');

            var numberPath = __dirname+'/../Public/assets/images/numbers/'+realNumber+'.png';
            console.log('[PRINT] Loading number image from:', numberPath);

            var number = escpos.Image.load(numberPath, function(number, numberError){
                if(numberError) {
                    console.error('[PRINT] Number image load error:', numberError);
                    return;
                }
                console.log('[PRINT] Number image loaded successfully');
                console.log('[PRINT] Opening device connection...');

                device.open(function(error){
                    if(error) {
                        console.error('[PRINT] Printer connection error:', error);
                        return;
                    }
                    console.log('[PRINT] Device opened, sending print job...');

                    try {
                        // Align center
                        printer.align('ct');

                        // Print logo image
                        printer.image(logo, 'd24');

                        // Feed line
                        printer.feed(1);

                        // Print number image
                        printer.image(number, 'd24');

                        // Feed line
                        printer.feed(1);

                        // Print message text
                        printer.text(getTicketMessage());

                        // Feed 2 lines
                        printer.feed(2);

                        // Cut paper
                        printer.cut('partial');

                        // Close connection
                        printer.close();

                        console.log('[PRINT] Print job sent successfully');
                    } catch(printError) {
                        console.error('[PRINT] Error sending print job:', printError);
                    }
                });
            });
        });
    } catch(error) {
        console.error('[PRINT] Print function error:', error);
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
