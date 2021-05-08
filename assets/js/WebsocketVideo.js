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

        // Container
        this.container = $('<div id="player"/>');
        this.container.append(this.player.canvas);

        // Pause
        this.pauseContainer = $('<div class="pause"><i class="fas fa-play"></i></div>').hide();
        this.container.append(this.pauseContainer);
        this.pauseContainer.click(() => {
            this.play();
        });

        // Loading
        this.loadingContainer = $('<div class="loading"/>');
        this.container.append(this.loadingContainer);

        // Websocket-Verbindung
        socket.on('connect', () => {

            socket.on('video', e => {
                const messageData = new Uint8Array(e);
                const chunkType = messageData[0] & 0b11111;
                if (chunkType === 5 && this.keyframebuffer > 0) {
                    this.keyframebuffer--;
                    if (this.keyframebuffer === 0) {
                        $(this.loadingContainer).fadeOut(300);
                    }
                }
                this.player.decode(messageData);
                this.bitrate += e.byteLength;
                window.setTimeout(() => { this.bitrate -= e.byteLength; }, 1000);
            });

        });

    }

    pause() {
        socket.emit('pause');
        this.pauseContainer.fadeIn(300);
    }

    play() {
        socket.emit('play');
        this.pauseContainer.fadeOut(300);
    }

}