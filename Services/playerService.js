require('dotenv').config();

const express     = require('express')
const app         = express()
const path        = require("path");
const isOnline    = require('is-online');

app.use(express.static('../Public'));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname+'/../Views/player.html'));
})

app.get('/config', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        domain: process.env.DOMAIN,
        live: process.env.LIVE,
        contentPath: process.env.CONTENT_PATH,
        displayKey : process.env.DISPLAY_KEY,
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
