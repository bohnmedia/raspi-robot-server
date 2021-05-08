const fs = require('fs');
const path = require('path');
const rand = require('generate-key');

module.exports = class Database {

    constructor(dbName) {

        // Dateiname zur Datenbank-Datei
        const filename = path.join(__dirname, '../db', dbName + '.json');

        // Existiert die Datei?
        if (fs.existsSync(filename)) {

            // Erstelle eine neue Datei
            fs.writeFileSync(filename, '{}');

        }

        // Parse die Datei
        this.db = JSON.parse(fs.readFileSync(filename, 'utf-8'));
        this.filename = filename;

    }

    addEmailToQueue(email) {

        // Generiere einen Key, der für die Session verwendet wird
        const key = rand.generateKey(32);

        // Lege ein Objekt für die Warteliste an, wenn keins existiert
        if (!this.db.validKeys) this.db.validKeys = {};

        // Trage Zeit und Key ins Queue-Objekt ein
        this.db.validKeys[email.toLowerCase().substring(0,255)] = {
            requestTime: Date.now(),
            sessionKey: key
        };

        // Speichere den Eintrag
        this.save();

        return key;

    }

    save() {

        // Speichere die Datei
        fs.writeFileSync(this.filename, JSON.stringify(this.db));

    }

}