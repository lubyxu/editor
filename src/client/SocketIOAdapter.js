export default class SocketIOAdapter {
    constructor(socket) {
        this.socket = socket;

        socket
        .on('ack', () => {
            this.trigger('ack');
        })
        .on('operation', (clientId, operation, selection) => {
            console.log('there is a coming operation')
            this.trigger('operation', operation);
        })
        .on('reconnect', () => {
            this.trigger('reconnect')
        });
    }

    sendOperation(revision, operation, selection) {
        console.log(`operation1111`, operation)
        this.socket.emit('operation', revision, operation, selection);
        // mock ACK
        // setTimeout(() => {
        //     this.trigger('ack');

        // }, 1000);
    }

    registerCallbacks(cbs) {
        this.callbacks = cbs;
    }

    trigger(event, ...restArgs) {
        var action = this.callbacks && this.callbacks[event];
        if (action) {
            action.apply(this, restArgs);
        }
    }
}