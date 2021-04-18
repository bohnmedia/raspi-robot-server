const WebSocketServer = require('./lib/WebSocketServer.js');

// Erzeuge den Server
const wss = new WebSocketServer({
    port: 8080,
    rooms: {
        uturm: {
            name: "Dortmunder U",
            authToken: "RzDQOtxN9E2fW8iOk51spw9GftgKPDEgQxZ9uRbA7T0q4YaA7kKRKJWquDpqZlEG"
        }
    }
});