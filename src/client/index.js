import EditorClient from "./EditorClient";
import SocketIOAdapter from './SocketIOAdapter';
export default class SharedEditor {
    constructor(socket, adapter, apis) {
        this.rtcmAdapter = adapter;

        socket.on('doc', data => {
            this.socketIOAdapter = new SocketIOAdapter(socket);

            this.client = new EditorClient({revision: 0, operations: []}, this.socketIOAdapter, this.rtcmAdapter, apis);
        })
    }
}