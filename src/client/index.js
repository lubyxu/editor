import EditorClient from "./EditorClient";
import SocketIOAdapter from './SocketIOAdapter';
export default class SharedEditor {
    constructor(socket, adapter, apis) {
        this.rtcmAdapter = adapter;

        socket.on('doc', data => {
            this.socketIOAdapter = new SocketIOAdapter(socket);
            console.log(`data`, data)
            this.client = new EditorClient(data, this.socketIOAdapter, this.rtcmAdapter, apis);
        })
    }
}