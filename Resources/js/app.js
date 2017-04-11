//Socket

var socket = null;

//Timeouts
var pingTimeOut;
var overlayTimeout;
var printTimeout;

createjs.Sound.registerSound("/assets/sounds/bling.mp3", "counterSound");

//Vue instance
var player = new Vue({
    el: '#player',
    data: {
        status: {
            online: true,
        },
        config: null,
        printable: null,
        printing: false,
        count: null,
        counter: 1,
        printCounter: 1,
    },
    methods: {
        init: function() {
            this.fetchConfig();
            this.fetchStatus();
            setInterval(function(){
                player.fetchStatus();
            }, 5000);
        },
        fetchConfig: function() {
            $.get( "/config", function(config) {

            },'json')
            .done(function(config) {

                player.config = config;
                player.printable = player.config.print;
                player.count = player.config.count;
                player.counter = player.config.counter;
                player.printCounter = player.config.printCounter;

                if(typeof io !== 'undefined'){
                    socket = io(player.config.socket);

                    socket.on('setcounter', function (count) {
                        player.updateCounter(count);
                    });

                }
                player.loadScreen();
            })
            .fail(function() {
                console.log('configuration error');
            })
        },
        fetchStatus: function() {
            $.get( "/status", function(status) {

            },'json')
            .done(function(status) {
                if(!player.status.online && status.online) {
                    player.goOnline();
                }
                if(!status.online) {
                    player.goOffline();
                }
                player.status = status;
            })
            .fail(function() {
                console.log('connection error');
            })
        },
        loadScreen: function () {
            $('#loading').show();
            $('#offline').hide();
            document.domain = this.config.domain;
            $('#view').attr('src',this.config.live + 'screen/' + this.config.displayKey + '?cdn=' + this.config.contentPath);
        },
        showScreen: function() {
            setTimeout(function(){
                $('#loading').fadeOut('fast');
            }, 10);
        },
        hideScreen: function() {
            $('#loading').show();
        },
        goOnline: function (event) {
            this.loadScreen();
        },
        goOffline: function (event) {
            $('#offline').fadeIn('fast');
        },
        reloadScreen: function () {
            location.reload();
        },
        socketEmit: function(method,data) {
            if(socket){
                socket.emit(method,data);
            }
        },
        ping: function() {
            clearTimeout(pingTimeOut);
            pingTimeOut = setTimeout(() => this.reloadScreen(), 10000);
        },
        print: function() {
            clearTimeout(printTimeout);
            $('.print-hand').removeClass('show');
            $('.print-message').html('Even geduld a.u.b.');
            $.get( "/print",function() {

            },'json')
            .done(function(data) {
                $('.print-message').html('Je hebt nummer ' + data.counter);
                printTimeout = setTimeout(function(){
                    $('.print-message').html('Druk hier voor je volgnummer');
                }, 3000);
            })
            .fail(function() {
                $('.print-message').html('Druk hier voor je volgnummer');
                console.log('print configuration error');
            })
        },
        setCounter: function(keycode) {
            switch (keycode) {
                case 33:
                    var counter = this.counter - 1;
                    break;
                case 34:
                    var counter = this.counter + 1;
                    break;
                case 186:
                    player.print();
                    return;
                    break;
            }
            if(typeof counter !== 'undefined'){

                var realcount = counter <= 0 ? 99 : (counter >= 100 ? 1 : counter);

                $.get( "/setcounter", {counter: counter}, function() {

                },'json')
                .done(function(data) {

                })
                .fail(function() {
                    console.log('configuration error');
                })
                .always(function() {
                    player.counter = realcount;
                    player.socketEmit('counter',realcount);
                    player.showCounterOverlay();
                });
            }
        },
        updateCounter: function(counter) {

            var realcount = counter;

            $.get( "/setcounter", {counter: realcount}, function() {

            },'json')
            .done(function(data) {

            })
            .always(function(){
                player.counter = realcount;
                player.showCounterOverlay();
            });
        },
        showCounterOverlay: function() {
            clearTimeout(overlayTimeout);
            $('#count-overlay').show();
            overlayTimeout = setTimeout(function(){
                $('#count-overlay').fadeOut('fast',function(e){
                    hideCursor();
                });
            },3000);
            createjs.Sound.play("counterSound");
        }
    }
});

$(window).on('load',function(e){
    player.init();
    hideCursor();
});

document.addEventListener('keyup', receiveKeys, false);

function receiveKeys(e) {
    alert('received!');
    e.preventDefault();
    $('#remote-signal').hide();
    $('#remote-signal').show();
    $('#remote-signal').fadeOut('fast');
    var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
    player.setCounter(key);
}

setTimeout(function(){
    document.removeEventListener('keyup', receiveKeys, false);
    document.addEventListener('keyup', receiveKeys, false);
},10000);

var cursorInterval;

cursorInterval = setInterval(function(){
    hideCursor();
}, 10000);

function hideCursor() {
    $('body').css('cursor', 'none');
    $('html').css('cursor', 'none');
}

var handInterval;
handInterval = setInterval(function(){
    $('.print-hand').toggleClass('show');
}, 3000);
