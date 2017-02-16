//Socket

var socket = null;

//Timeouts
var pingTimeOut;
var overlayTimeout;

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
        counter: 1
    },
    methods: {
        init: function() {
            this.fetchConfig();
            this.fetchStatus();
            window.addEventListener('keyup', this.setCounter);
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
            if(this.printable && !this.printing) {
                this.printing = true;
                $('.print-hand').removeClass('show');
                $('.print-message').html('Even geduld a.u.b.');
                $.get( "/print",function() {

                },'json')
                .done(function(data) {
                    player.printing = false;
                    $('.print-message').html('Je hebt nummer ' + data.counter);
                    var timeout = setTimeout(function(){
                        clearTimeout(timeout);
                        $('.print-message').html('Druk hier voor je volgnummer');
                    }, 3000);
                })
                .fail(function() {
                    player.printing = false;
                    $('.print-message').html('Druk hier voor je volgnummer');
                    console.log('print configuration error');
                })
            }
        },
        setCounter: function(e) {
            switch (e.keyCode) {
                case 33:
                    var counter = this.counter - 1;
                    break;
                case 34:
                    var counter = this.counter + 1;
                    break;
                case 66:
                    player.print();
                    return;
                    break;
            }
            if(typeof counter !== 'undefined'){
                $.get( "/setcounter", {counter: counter}, function() {

                },'json')
                .done(function(data) {
                    player.socketEmit('counter',data.counter);
                    player.updateCounter(data.counter);
                })
                .fail(function() {
                    console.log('configuration error');
                })
            }
        },
        updateCounter: function(count) {
            clearTimeout(overlayTimeout);
            player.counter = count;
            $('#count-overlay').show();
            overlayTimeout = setTimeout(function(){
                $('#count-overlay').fadeOut('fast');
            },3000);
            createjs.Sound.play("counterSound");
        }
    }
});

$(window).on('load',function(e){
    player.init();
});

var handInterval;
handInterval = setInterval(function(){
    $('.print-hand').toggleClass('show');
}, 3000);
