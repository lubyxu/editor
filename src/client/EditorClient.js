import TextOperation from '../TextOperation';
import Utils from '../Utils';
import Client from './client';

export default class EditorClient extends Client {
    constructor (data, serverAdapter, editorAdapter, apis) {
        super(data.revision, data.operations);
        
        Utils.makeEventEmitter(EditorClient, ['clientsChanged'], this);

        this.serverAdapter = serverAdapter;
        this.editorAdapter = editorAdapter;

        this.clients = {};

        this.serverAdapter.registerCallbacks({
            ack: () => {
                this.serverAck();
                // DEV 下用于调试。需要删调
                apis.forceUpdate();
            },
            operation: (operation) => {
                this.applyServer(TextOperation.fromJSON(operation))
            }
        });

        this.editorAdapter.registerCallbacks({
            change: this.onChange.bind(this),
        });


        this.initClientContent();
    }

    sendOperation(revision, operation) {
        this.serverAdapter.sendOperation(revision, operation.toJSON());
    }

    applyOperation(operation) {
        this.editorAdapter.applyOperation(operation);
    }

    onChange(textOperation, inverse) {
        this.applyClient(textOperation);
    }
}