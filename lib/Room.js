module.exports = class Room {

    constructor(io, room, options) {

        this.io = io;
        this.room = room;
        this.name = options.name;
        this.authToken = options.authToken;
        this.controlTime = options.controlTime;

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

    // Liste alle sockets im Raum auf
    getSockets() {
        const clients = this.io.sockets.adapter.rooms.get(this.room);
        const clientSockets = [];
        clients.forEach(clientId => {
            clientSockets.push(this.io.sockets.sockets.get(clientId));
        });
        return clientSockets;
    }

    // Get next time
    getNextStartTime() {

        var startTime;
        const sockets = this.getSockets();
        const now = Date.now();

        // Sammle Zeiten in einem absteigenden Array
        const startTimes = [];
        sockets.forEach(socket => {
            if (socket.startTime) startTimes.push(socket.startTime);
        });
        startTimes.sort().reverse();

        // Gib den aktuellen Zeitstempel zurück, wenn keine Zeiten reserviert wurden
        if (startTimes.length === 0) return now;

        // Arbeite dich vom letzten bis zum ersten Zeitstempel vor und suche eine Lücke
        for (let i=0; i<startTimes.length; i++) {

            // Prüfe auf eine Lücke
            let thisStartTime = Math.max(startTimes[i] + this.controlTime, now);
            if (i === 0 || thisStartTime <= startTimes[i-1] - this.controlTime) startTime = thisStartTime;

        }

        return startTime;

    }

    // Steuerung anfordern
    requestControl(socket) {
        socket.startTime = this.getNextStartTime();
        socket.emit('startTime', socket.startTime);
    }

}