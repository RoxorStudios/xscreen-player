//Vue instance
var player = new Vue({
    el: '#player',
    data: {
        status: {
            online: true,
        },
        config: null,
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
        goOnline: function (event) {
            this.loadScreen();
        },
        goOffline: function (event) {
            $('#offline').fadeIn('fast');
        },
    }
});

$(window).on('load',function(e){
    player.init();
});
