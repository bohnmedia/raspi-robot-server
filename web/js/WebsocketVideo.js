class WebsocketVideo {

    constructor(socket) {

        this.bitrate = 0;

        this.player = new Player({
            size: {
                width: 960,
                height: 540
            }
        });

        socket.on('connect', () => {
	  
            socket.on('video', e => {
                const messageData = new Uint8Array(e);
                this.player.decode(messageData);
                this.bitrate += e.byteLength;
                window.setTimeout(() => { this.bitrate -= e.byteLength; }, 1000);
            });
            
        });

    }

}