const Server = require("socket.io");
const Room = require("./Room.js");

module.exports = class WebSocketServer {

    constructor(options) {

        // Stelle die Räume der Klasse zur Verfügung
        this.rooms = this.createRooms(options.rooms);

        // Starte den Websocket-Server
        console.log('Listen on port ' + options.port);
        const io = Server(options.port, {
            serveClient: true
        });

        // Ein Client hat sich verbunden
        io.on("connection", socket => {

            // Sammle Videodaten
            this.dataCollector(socket);

            // Validiere den AuthToken
            this.validateAuthToken(socket);

            // Wechsle in einen Raum
            socket.on("join", room => {
                this.join(socket, room);
            });

        });

    }

    // Prüfe den AuthToken
    validateAuthToken(socket) {

        const token = socket.handshake.auth.token;
        const room = token ? this.getRoomByAuthToken(token) : false;

        // Überspringe die Prüfung, wenn kein AuthToken übergeben wurde
        if (!token) {
            console.log('No AuthToken found. Skip Authorisation.');
            return;
        }

        // Wenn kein Raum gefunden wurde, trenne die Verbindung
        if (!room) {
            console.log('Wrong AuthToken. Disconnect client.');
            return socket.disconnect(true);
        }

        room.setBroadcaster(socket);

    }

    // Erhalte einen zugehörigen Raum anhand des Auth-Tokens
    getRoomByAuthToken(authToken) {
        for (var roomKey in this.rooms) {
            // Gib den Raum zurück, wenn der AuthKey passt
            if (this.rooms[roomKey].isAuthToken(authToken)) return this.rooms[roomKey];
        }
        return false;
    }

    // Erzeuge ein Objekt für jeden Raum
    createRooms(rooms) {
        const output = {};
        for (var roomKey in rooms) {
            output[roomKey] = new Room(roomKey, rooms[roomKey]);
        }
        return output;
    }

    // Ein Client betritt den Raum
    join(socket, room) {

        // Brich ab, wenn der Raum nicht existiert
        if (!this.rooms[room]) return;

        this.rooms[room].appendSocket(socket);

    }

    // Sammle Videodaten (Metadaten + Keyframe)
    dataCollector(socket) {

        socket.firstFrames = [];

        socket.on('video', chunk => {

            const chunkType = chunk[0] & 0b11111;

            // Wenn chunkType 7 oder 8, packe die Chunks in firstFrames,
            // damit sie am Anfang jeder Verbindung ausgegeben werden können
            if (chunkType === 7 || chunkType === 8) {
                socket.firstFrames.push(chunk);
            }

            // Keyframe
            if (chunkType === 5) socket.lastIdrFrame = chunk;

        });

    }

}