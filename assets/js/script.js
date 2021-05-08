const room = 'uturm';

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
overlayInside.click(function(e){
    if (this === e.target) overlay.fadeOut(300);
});
overlayClose.click(function(){
    overlay.fadeOut(300);
});

// Einladungslink
$('#request-control-button').click(function(){
    overlay.find('.box').hide();
    overlay.find('#request-control').show();
    overlay.fadeIn(300);
});

// Einladungsmail verschicken
$('#request-control .button--success').click(function(){
    socket.emit('request-control');
});

socket.on("startTime", (startTime) => {
    console.log(startTime);
});