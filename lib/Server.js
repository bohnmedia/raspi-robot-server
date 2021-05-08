const SocketIO = require("socket.io");
const Room = require("./Room.js");
const Database = require("./Database.js");
const Mail = require("./Mail.js");

const express = require('express');
const http = require("http");
const path = require('path');

module.exports = class Server {

    constructor(options) {

        // Mailer
        this.mail = new Mail(options.mail);

        // Erzeuge http Server
        const app = express();
        const httpServer = http.createServer(app);

        // Stelle die Räume der Klasse zur Verfügung
        this.rooms = this.createRooms(options.rooms);

        // Starte den Websocket-Server
        const io = SocketIO(httpServer);

        // Verbindund zur NoSQL-Datenbank wird hergestellt
        this.db = new Database(options.db.name);

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

            socket.on('request-invitation', (email, callback) => {

                const key = this.db.addEmailToQueue(email);

                if (key) {

                    // Sende Einladungsmail
                    this.mail.sendInvitation(email, key, () => {
                        callback({
                            'status': 'ok',
                            'message': 'Es wurde eine E-Mail an Ihre E-Mail-Adresse gesendet. Bitte überprüfen Sie den Maileingang. Sollten Sie nicht innerhalb von 10 Minuten auf die Mail reagieren, wird die Einladung automatisch aus unserem System gelöscht.'
                        });
                    });

                }

            });

        });

        // EJS
        app.set('views', './views');
        app.set('view engine', 'ejs');

        // Streamingseite
        app.get('', (req, res) => {
            res.render('index');
        });

        // Token-Link in Mail
        app.get('/token/:key', (req, res) => {

            // Schreibe den Token in die Cookies
            res.cookie('token', req.params.key, {maxAge: 7 * 24 * 60 * 60 * 1000});

            // Leite weiter zur Startseite
            res.redirect(302, '/');

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