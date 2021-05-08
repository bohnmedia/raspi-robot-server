const SocketIO = require("socket.io");
const Room = require("./Room.js");

const express = require('express');
const http = require("http");
const path = require('path');

module.exports = class Server {

    constructor(options) {

        // Erzeuge http Server
        const app = express();
        const httpServer = http.createServer(app);

        // Stelle die Räume der Klasse zur Verfügung
        this.rooms = this.createRooms(options.rooms);

        // Starte den Websocket-Server
        const io = SocketIO(httpServer);        

        // Ein Client hat sich verbunden
        io.on("connection", socket => {

            const room = socket.handshake.auth.room;
            const authToken = socket.handshake.auth.token;

            // Brich ab, wenn der angeforderte Raum nicht existiert
            if (!this.rooms[room]) return socket.disconnect(true);

            // Broadcaster
            if (authToken) {

                // Wenn ein AuthToken übergeben wurde, brich die Verbindung ab, wenn dieser nicht stimmt
                if (!this.validateAuthToken(room, authToken)) return socket.disconnect(true);

                // Definiere Socket als neuen Broadcaster 
                this.rooms[room].setBroadcaster(socket);

            // Zuschauer
            } else {

                this.rooms[room].join(socket);

            }

            // Pause
            socket.on('pause', () => {
                socket.leave(room);
            });

            // Play
            socket.on('play', () => {
                this.rooms[room].join(socket);
            });

            // Steuerung anfordern
            socket.on('request-control', () => {
                this.rooms[room].requestControl(socket);
            });

        });

        // EJS
        app.set('views', './views');
        app.set('view engine', 'ejs');

        // Streamingseite
        app.get(['','/token/\w{32}'], (req, res) => {
            res.render('index');
        });  

        httpServer.listen(options.port);

    }

    // Prüfe den AuthToken
    validateAuthToken(room, authToken) {

        if (!room) {
            console.log('No room defined.'); return false;
        }

        if (!authToken) {
            console.log('No auth token defined.'); return false;
        }

        if (!this.rooms[room]) {
            console.log('Room not found.'); return false;
        }

        if (this.rooms[room].authToken !== authToken) {
            console.log('Wrong auth token.'); return false;
        }

        return true;

    }

    // Erzeuge ein Objekt für jeden Raum
    createRooms(rooms) {
        const output = {};
        for (var roomKey in rooms) {
            output[roomKey] = new Room(roomKey, rooms[roomKey]);
        }
        return output;
    }

}