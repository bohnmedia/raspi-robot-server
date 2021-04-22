class WebsocketVideo {

    constructor(socket) {

        this.bitrate = 0;
        this.keyframebuffer = 2;

        this.player = new Player({
            size: {
                width: 1280,
                height: 720
            }
        });

        socket.on('connect', () => {

            socket.on('video', e => {
                const messageData = new Uint8Array(e);
                const chunkType = messageData[0] & 0b11111;
                if (chunkType === 5 && this.keyframebuffer > 0) {
                    this.keyframebuffer--;
                    if (this.keyframebuffer === 0) {
                        $('#player .loading').fadeOut(300);
                    }
                }
                this.player.decode(messageData);
                this.bitrate += e.byteLength;
                window.setTimeout(() => { this.bitrate -= e.byteLength; }, 1000);
            });

        });

    }

}