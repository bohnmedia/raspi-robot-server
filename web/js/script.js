// Verbinde dich mit dem Server
const socket = io("https://robot.bohn.media/",{
    auth: {room: 'uturm'}
});

// Erzeuge den Player
const video = new WebsocketVideo(socket);
document.getElementById('player').appendChild(video.player.canvas);

