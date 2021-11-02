import EditorAdapter from "../EditorAdapter";
import EditorClient from "./EditorClient";

export default class SharedEditor {
    constructor(socket) {
        this.rtcmAdapter = new EditorAdapter();

        socket.on('doc', data => {
            this.socketIOAdapter = new SocketIOAdapter(socket);

            this.client = new EditorClient(data, this.socketIOAdapter, this.rtcmAdapter);
        })
    }
}