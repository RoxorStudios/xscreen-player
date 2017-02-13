//Ping interval
var pingTimeOut;

//Vue instance
var player = new Vue({
    el: '#player',
    data: {
        status: {
            online: true,
        },
        config: null,
        printable: null,
        count: null,
        counter: null
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

            if(this.config.print)
            {

                //$('#view').css('height', '30px');
            }

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
        ping: function() {
            clearTimeout(pingTimeOut);
            pingTimeOut = setTimeout(() => this.reloadScreen(), 10000);
        },
        print: function() {
            if(this.printable) {
                $.get( "/print",function() {

                },'json')
                .done(function(data) {
                })
                .fail(function() {
                    console.log('print configuration error');
                })
            }
        },
        setCounter: function(e) {
            if(this.count) {
                switch (e.keyCode) {
                    case 33:
                        var counter = this.counter -1;
                        break;
                    case 34:
                        var counter = this.counter +1;
                        break;
                }
                if(typeof counter !== 'undefined'){
                    $.get( "/setcounter", {counter: counter}, function() {

                    },'json')
                    .done(function(data) {
                        player.counter = data.counter;
                    })
                    .fail(function() {
                        console.log('configuration error');
                    })
                }
            }
        }
    }
});

$(window).on('load',function(e){
    player.init();
});
