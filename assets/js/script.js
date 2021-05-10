const room = 'uturm';
const interval = {};

// Verbinde dich mit dem Server
const socket = io("https://robot.bohn.media/",{
    auth: {room: room}
});

// Erzeuge den Player
const video = new WebsocketVideo(socket);
$('#playerWrapper').append(video.container);

// Overlay
const overlay = $('#overlay');
const overlayInside = overlay.find('.inside');
const overlayClose = overlay.find('.button-close, .button-abort, .button--success');
const showOverlay = function(selector) {
    overlay.find('.box').hide();
    overlay.find(selector).show();
    overlay.fadeIn(300);
}

// SetCountdown
const setCountdown = function(selector, secondsInt) {

    const performanceStart = performance.now();
    const countdown = $(selector);

    const update = function() {
        const progress = Math.round((performance.now() - performanceStart) / 1000);
        const rest = Math.max(0, secondsInt - progress);
        const hours = Math.floor(rest / 3600);
        const minutes = Math.floor((rest - hours * 3600) / 60);
        const seconds = rest - hours * 3600 - minutes * 60;
        const h = (hours < 10) ? "0" + hours : hours;
        const m = (minutes < 10) ? "0" + minutes : minutes;
        const s = (seconds < 10) ? "0" + seconds : seconds;
        countdown.html(h + ':' + m + ':' + s);

        if (rest === 0 && interval[selector]) {
            window.clearInterval(interval[selector]);
            delete interval[selector];
        }

    }

    // Set Interval
    if (interval[selector]) window.clearInterval(interval[selector]);
    interval[selector] = window.setInterval(update, 1000);
    update();

}

// StopCountdown
const stopCountdown = function(selector) {
    if (interval[selector]) window.clearInterval(interval[selector]);
    delete interval[selector];
}

// Starte Start-Countdown
const setStartCountdown = function(seconds) {
    setCountdown('#start-countdown .countdown', seconds);
    $('#start-countdown').show();
}

// Stoppe StartCountdown bei Abbruch
const stopStartCountdown = function() {
    stopCountdown('#start-countdown .countdown');
    $('#start-countdown').hide();
}

// Starte End-Countdown
const setEndCountdown = function(seconds) {
    setCountdown('#end-countdown .countdown', seconds);
    $('#end-countdown').show();
}

// Stoppe EndCountdown bei Abbruch
const stopEndCountdown = function() {
    stopCountdown('#end-countdown .countdown');
    $('#end-countdown').hide();
}

overlayInside.click(function(e){
    if (this === e.target) overlay.fadeOut(300);
});
overlayClose.click(function(){
    overlay.fadeOut(300);
});

// Overlays
$('#request-control-button').click(() => { showOverlay('#request-control'); });
$('#abort-reservation-button').click(() => { showOverlay('#abort-reservation'); });
$('#abort-control-button').click(() => { showOverlay('#abort-control'); });

// Steuerung anfordern
$('#request-control .button--success').click(function(){
    socket.emit('requestControl');
});

// Steuerung abbrechen
$('#abort-reservation .button--success, #abort-control .button--success').click(function(){
    socket.emit('abortControl');
});

socket.on("secondsToStart", seconds => {
    $('#request-control-button').hide();
    $('#abort-reservation-button').show();
    setStartCountdown(seconds);
});

socket.on("secondsToEnd", seconds => {
    $('#start-countdown').hide();
    $('#abort-reservation-button').hide();
    $('#abort-control-button').show();
    setEndCountdown(seconds);
});

socket.on("abortControl", () => {
    $('#abort-reservation-button').hide();
    $('#abort-control-button').hide();
    $('#request-control-button').show();
    stopStartCountdown();
    stopEndCountdown();
});