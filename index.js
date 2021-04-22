const Server = require('./lib/Server.js');
const config = JSON.parse(require('fs').readFileSync('config.json'));

// Erzeuge den Server
const wss = new Server(config);