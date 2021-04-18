const NALseparator = Buffer.from([0,0,0,1]);

module.exports = class Room {

    constructor(room, options) {

        this.room = room;
        this.name = options.name;
        this.authToken = options.authToken;

    }

    // Setze Socket als Broadcaster ein
    setBroadcaster(socket) {

        console.log('Attach broadcaster to room \'' + this.room + '\'');

        // Falls es bereits einen Broadcaster gibt, entferne die Events
        if (this.broadcaster) this.broadcaster.removeAllListeners();

        // Füge neuen Broadcaster hinzu
        this.broadcaster = socket;

        // Füge dem Broadcaster einen Listener hinzu
        this.broadcaster.on('video', this.onVideo.bind(this));

    }

    // Prüfe den AuthToken
    isAuthToken(authToken) {
        return (authToken === this.authToken);
    }

    // Sende Videochunks in den Raum
    onVideo(chunk) {

        // Sende Videodaten in den Raum
        this.broadcaster.to(this.room).emit('video', Buffer.concat([NALseparator, chunk]));

    }

    // Füge socket hinzu
    appendSocket(socket) {

        // Sende Headerdaten und Keyframe für schnelleren Einstieg
        this.sendFirstFrames(socket);

        // Wechsle in den Raum um die Livedaten zu erhalten
        socket.join(this.room)
        
        console.log('User joined \'' + this.room + '\'');
        
    }

    // Sende die ersten Frames
    sendFirstFrames(socket) {

        // Brich ab, wenn keine Frames zur Verfügung stehen
        if (!this.broadcaster || !this.broadcaster.firstFrames) return;

        console.log('Send cached frames to user');

        // Sende Metadaten
        this.broadcaster.firstFrames.forEach(chunk => {
            socket.emit('video', Buffer.concat([NALseparator, chunk]));
        });

        // Sende keyframe
        if (this.broadcaster.lastIdrFrame) socket.emit('video', Buffer.concat([NALseparator, this.broadcaster.lastIdrFrame]));

    }

}