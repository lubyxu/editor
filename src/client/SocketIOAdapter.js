class SocketIOAdapter {
    constructor (socket) {
        this.socket = socket;

        socket
        .on('ack', () => {
            this.trigger('ack');
        })
        .on('operation', (clientId, operation, selection) => {
            this.trigger('operation', operation);
        });
    }
}