var io = require('socket.io')(3000);
const Raven         = require('raven');

io.on('connection', function (socket) {

    console.log("New connection from " + socket.handshake.address);

    socket.on('counter', function (count) {
        socket.broadcast.emit('setcounter', count);
    });
    socket.on('disconnect', function () {
        console.log("Lost connection with " + socket.handshake.address);
    });
    
});
