document.domain = 'xscreen.io';

//Socket
var socket = null;

//Timeouts
var pingTimeOut;
var overlayTimeout;
var printTimeout;

//Playlist
var screenData = null;
var currentSlide = 0;

var removeSlides = [];

var newsInterval = 5;
var newsIntervalCounter = 0;

var weatherInterval = 15;
var weatherIntervalCounter = 0;

var reloadScreenTimeout;
var slideErrorTimeout;
var first = true;

createjs.Sound.registerSound("/assets/sounds/bling.mp3", "counterSound");

$(window).on('load',function(e){
    hideCursor();
    player.init();
    loadScreen();
});

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
            }, 10000);
            setInterval(function () {
                player.ping();
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
                
                document.domain = config.domain;

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
                    //player.goOnline();
                }
                if(!status.online) {
                    //player.goOffline();
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
        },
        showScreen: function() {
            setTimeout(function(){
                $('#loading').fadeOut('fast');
            }, 500);
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
                    $('.print-message').html('Tik hier met één vinger<br>voor je volgnummer');
                }, 3000);
            })
            .fail(function() {
                $('.print-message').html('Tik hier met één vinger<br>voor je volgnummer');
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
                case 190:
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

function loadScreen() {
    
    $.get( "/screendata", function(response) {

    },'json')
    .done(function(response) {

        if(response == 'error') {
            retryLoadScreen();
        } else {
            if(screenData){
                first = false;
            }
            screenData = response;
            if(first){
                startShow();
            }

        }
    })
    .fail(function() {
        retryLoadScreen();
    })
    player.showScreen();
}

function retryLoadScreen() {
    //Try again in 5 seconds
    clearTimeout(reloadScreenTimeout);
    reloadScreenTimeout = setTimeout(function(){
        loadScreen();
    }, 10000);
}

function startShow() {
    $('iframe').remove();
    if(screenData.playlist.length > 0) {
        loadSlide(0);
    }
}

function loadSlide(index) {

    //Start screen, hide loading in parent

    var url;
    var uid;

    if(index == 'news') {
        uid = 'news-' + Math.floor((Math.random() * 1000) + 1);
        url = 'http://xscreen.io/live/news?uid=' + uid;
    }

    if(index == 'weather') {
        uid = 'weather-' + Math.floor((Math.random() * 1000) + 1);
        url = 'http://xscreen.io/live/weather?uid=' + uid;
    }

    if(typeof screenData.playlist[index] !== 'undefined') {
        uid = index+'-'+screenData.playlist[index].uid;
        type = screenData.playlist[index].type;
        url = '/slide/' + screenData.playlist[index].uid + '?uid=' + uid;
    }

    if(url && uid) {

        //Create new iframe
        slideErrorTimeout = setTimeout(function(){
            clearTimeout(slideErrorTimeout);
            screenData = null;
            loadScreen();
        }, 25000);

        var slide = document.createElement('iframe');
        slide.setAttribute('id', uid);
        slide.setAttribute('class', 'slide_frame');
        slide.src = url;
        slide.width = screenData.screen.width;
        slide.height = screenData.screen.height;
        slide.style.display = 'none';
        document.body.appendChild(slide);
        slide.onload = function(){
            slide.style.display = 'block';
            clearRemoveSlides();
        };
    } else {
        //Slides does not exist, reload
        retryLoadScreen();
    }
}

function clearSlideErrorTimeout() {
    clearTimeout(slideErrorTimeout);
}

function slideEnd(uid) {
    removeSlides.push(uid);
    nextSlide();
}

function nextSlide() {

    if(parent.player.status.online){
        //Check if news is required
        if(screenData.news && newsIntervalCounter == newsInterval){
            loadSlide('news');
            newsIntervalCounter = 0;
            return;
        }

        //Check if weather is required
        if(screenData.weather && weatherIntervalCounter == weatherInterval){
            loadSlide('weather');
            weatherIntervalCounter = 0;
            return;
        }
    }

    newsIntervalCounter++;
    weatherIntervalCounter++;

    if(typeof screenData.playlist[currentSlide+1] !== 'undefined') {
        currentSlide++;
    } else {
        currentSlide = 0;
        loadScreen();
    }
    loadSlide(currentSlide);
}

function clearRemoveSlides() {
    if(removeSlides.length > 0){
        for(i=0;i<removeSlides.length;i++){
            var element = document.getElementById(removeSlides[i]);
            if(element) {
                var i = element.parentNode;
                if(i) {
                    i.removeChild(element);
                }
                element = null;
            }
        }
    }
    removeSlides = [];
}

//Key listeners
document.addEventListener('keyup', receiveKeys, false);

function receiveKeys(e) {
    e.preventDefault();
    $('#remote-signal').hide();
    $('#remote-signal').show();
    $('#remote-signal').fadeOut('fast');
    var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
    player.setCounter(key);
}

//Hide cursor
var cursorInterval;

cursorInterval = setInterval(function(){
    hideCursor();
}, 10000);

function hideCursor() {
    $('body').css('cursor', 'none');
    $('html').css('cursor', 'none');
}