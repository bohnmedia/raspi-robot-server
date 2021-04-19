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

        // Erzeuge in leeres Array für die ersten Frames
        this.broadcaster.firstFrames = [];

        // Füge dem Broadcaster einen Listener hinzu
        this.broadcaster.on('video', chunk => {
            this.onVideo(chunk, socket);
        });

    }

    // Sende Videochunks in den Raum
    onVideo(chunk, socket) {

        // Ermittle den Chunk-Type
        const chunkType = chunk[0] & 0b11111;

        // Sende Videodaten in den Raum
        this.broadcaster.to(this.room).emit('video', chunk);

        // Wenn chunkType 7 oder 8, packe die Chunks in firstFrames,
        // damit sie am Anfang jeder Verbindung ausgegeben werden können
        if (chunkType === 7 || chunkType === 8) socket.firstFrames.push(chunk);

        // Speichere Keyframe
        if (chunkType === 5) socket.lastIdrFrame = chunk;

    }

    // Füge socket hinzu
    join(socket) {

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
            socket.emit('video', chunk);
        });

        // Sende keyframe
        if (this.broadcaster.lastIdrFrame) socket.emit('video', this.broadcaster.lastIdrFrame);

    }

}