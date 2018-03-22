var io = require('socket.io')(3000);

io.on('connection', function (socket) {

    socket.on('counter', function (count) {
        socket.broadcast.emit('setcounter', count);
    });
    socket.on('disconnect', function () {

    });
});
