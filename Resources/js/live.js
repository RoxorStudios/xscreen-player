//Get current playlist
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

document.domain = 'xscreen.io';

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

    parent.player.showScreen();

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

function pingHome() {
    parent.player.ping();
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
