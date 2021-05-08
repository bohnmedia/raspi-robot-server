const nodemailer = require("nodemailer");

module.exports = class Mail {

    constructor(options) {

        this.mail = nodemailer.createTransport(options);

        this.mail.verify(function(error, success) {
            if (error) {
                console.log(error);
            } else {
                console.log("Server is ready to take our messages");
            }
        });

    }

    sendInvitation(email, key, callback) {

        this.mail.sendMail({
            from: '"Roboter" <robot@bohn.media>', // sender address
            to: email, // list of receivers
            subject: "Roboter Einladung", // Subject line
            text: "Das ist die Einladungsmail zur Steuerung des Roboters. Bitte klicken Sie auf folgenden Link, um fort zu fahren.\r\n\r\nhttps://robot.bohn.media/token/" + key
        }, callback);

    }

}