// Verbinde dich mit dem Server
const socket = io("https://robot.bohn.media/",{
    auth: {room: 'uturm'}
});

// Erzeuge den Player
const video = new WebsocketVideo(socket);
document.getElementById('player').appendChild(video.player.canvas);

// Overlay
const overlay = $('#overlay');
const overlayInside = overlay.find('.inside');
const overlayClose = overlay.find('.button-close');
overlayInside.click(function(e){
    if (this === e.target) overlay.fadeOut(300);
});
overlayClose.click(function(){
    overlay.fadeOut(300);
});

// Einladungslink
$('#invitation-button').click(function(){
    overlay.find('.box').hide();
    overlay.find('#overlay-invitation').show();
    overlay.fadeIn(300);
});

// Einladungsmail verschicken
$('#form-invitation').submit(function(event){
    const formInvitation = $(this);
    const formInvitationEmail = $('#form-invitation-email');
    const formInvitationMessage = $('#form-invitation-message');
    formInvitationEmail.prop( "disabled", true );
    event.preventDefault();
    socket.emit('request-invitation', formInvitationEmail.val(), function(response){
        if (response.status === "ok") {
            formInvitation.hide();
            formInvitationMessage.text(response.message).show();
        }
    });
});