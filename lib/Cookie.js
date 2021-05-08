module.exports = class Cookie {

    getKey(req) {

        const cookie = req.headers.cookie;
        const cookies = cookie ? cookie.split('; ') : [];

        for (var i=0; i<cookies.length; i++) {

            // Gib den Token aus dem Cookie zurück
            if (cookies[i].substring(0,6) === "token=") return cookies[i].substring(6);

        }

        // Kein Token gefunden
        return null;

    }

}