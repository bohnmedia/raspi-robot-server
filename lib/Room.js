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

    // Setze socket als Controller ein
    setController(socket) {

        const secondsToEnd = Math.floor(this.controlTime / 1000);

        this.controller = socket;

        // Übergebe die Sekunden bis zum Ende der Steuerung
        socket.emit('secondsToEnd', secondsToEnd);

        // Setze einen Timeout zum automatischen beenden der Steuerung
        if (socket.timeout) clearTimeout(socket.timeout);
        socket.timeout = setTimeout(() => {

            // Falls Socket der Controller ist, entferne diesen aus dem controller property
            if (this.controller === socket) this.controller = null;

            // Entferne die Timeout-ID
            delete socket.timeout;

            // Sende Befehl zum Abbrechen der Steuerung an Client
            socket.emit('abortControl');

            // Entferne die StartTime, damit ein erneutes Anfordern der Steuerung möglich ist
            delete socket.startTime;

            // Stoppe den Roboter
            if (this.broadcaster) this.broadcaster.emit("direction", [0, 0]);

        }, this.controlTime);

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
        socket.join(this.room);

        // Sende Sekunden bis zum nächsten Startzeitpunkt
        socket.emit("secondsToNext", this.secondsToNextStart());
        
        console.log('User joined \'' + this.room + '\'');
        
    }

    // Entferne den socket
    leave(socket) {

        // Beende timeouts
        if (socket.timeout) clearTimeout(socket.timeout);

        // Broadcaster
        if (socket === this.broadcaster) {
            this.broadcaster.removeAllListeners();
            delete this.broadcaster;
        }

        if (socket === this.controller) {
            delete this.controller;
            if (this.broadcaster) this.broadcaster.emit("direction", [0, 0]);
        }

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

        const startTime = this.getNextStartTime();
        const d = new Date(startTime);
        const startTimeStr = d.getDate() + '.' + d.getMonth() + '.' + d.getFullYear() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
        const secondsToStart = Math.ceil((startTime - Date.now()) / 1000);

        // Skip if start time was already set
        if (socket.startTime) return;

        // Schreibe die Startzeit ins Socket-Objekt
        socket.startTime = startTime;

        // Übergebe die Sekunden bis zur Steuerung
        socket.emit('secondsToStart', secondsToStart);

        // Setze einen Timeout bis zur Steuerung
        if (socket.timeout) clearTimeout(socket.timeout);
        socket.timeout = setTimeout(() => {
            this.setController(socket);
        }, secondsToStart * 1000);

        // Aktualisiere den Countdown bei allen Usern
        socket.to(this.room).emit('secondsToNext', this.secondsToNextStart());
        
        // Konsole
        console.log('Slot for ' + startTimeStr + ' reserved');
        console.log('Seconds to start: ' + secondsToStart);

    }

    // Steuerung abbrechen
    abortControl(socket) {

        // Entferne Startzeit für Socket
        delete socket.startTime;

        // Entferne Socket als Controller
        if (this.controller === socket) {
            this.controller = null;

            // Stoppe den Roboter
            if (this.broadcaster) this.broadcaster.emit("direction", [0, 0]);
        }

        // Sende Abbruch an Client
        socket.emit('abortControl');

        // Aktualisiere den Countdown bei allen Usern
        this.broadcaster.to(this.room).emit('secondsToNext', this.secondsToNextStart());

        // Beende alle Timeouts
        if (socket.timeout) clearTimeout(socket.timeout);

    }

    // Sende Steuerungsbefehl an den Roboter
    direction(socket, direction) {
        if (socket === this.controller && this.broadcaster) {
            this.broadcaster.emit("direction", direction);
        }
    }

    // Sekunden bis zum nächsten Start
    secondsToNextStart() {
        const startTime = this.getNextStartTime();
        return Math.ceil((startTime - Date.now()) / 1000);
    }

}