import TextOperation from '../TextOperation';
import WrappedOperation from '../WrappedOperation';

class Server {
    constructor(document, operations) {
        this.document = document;
        this.operations = operations || [];
    }
    // 从client端获取operation
    // revision 客户端的某个版本
    /**
     * 找到 服务端 从 client端revision版本开始之后的为处理operations。
     * 与发来的operation做transfrom。将当前operation转化成 operations‘
     * 应用到document中。
     * 将transform过的operation存入队列。
     * @param {*} revision 
     * @param {*} operation 
     * @returns 
     */
    receiveOperation(revision, operation) {
        if (this.operations.length < revision) {
            throw new Error('operation revision not in history');
        }
        // 从客户端第 revision 版本开始，找到所有未处理的操作
        var concurrentOperations = this.operations.slice(revision);

        // 转operation
        for (var i = 0; i < concurrentOperations.length; i++) {
            operation = WrappedOperation.transform(operation, concurrentOperations[i])[0];
        }

        // this.document = operation.apply(this.document);
        this.operations.push(operation);

        return operation;
    }
}

class EditorServer extends Server {
    constructor(document, operations, docId, mayWrite) {
        super(document, operations);
        this.docId = docId;
        this.clients = {};
    }

    // step1：将发来的operation 转换一下
    // step2：根据revision，将server队列里的操作与当前 operation 走一遍流程。找到 operation'。
    // step3：发送ack，表明operation被确认。
    // step4：将转化后的operation广而告之
    onOperation(socket, revision, operation, selection) {
        var wrapped;
        try {
            wrapped = new WrappedOperation(
                TextOperation.fromJSON(operation),
                // selection 表示 meta
                selection && Selection.fromJSON(selection)
            );
        }
        catch (exc) {
            console.error('Invalid operation received: ' + exc);
            return;
        }

        try {
            var clientId = socket.id;
            var wrappedPrim = this.receiveOperation(revision, wrapped);
            console.log('new operation:' + wrapped);
            // this.getClient(clientId).selection = wrappedPrime.meta;
            socket.emit('ack');
            socket.broadcast['in'](this.docId).emit(
                'operation',
                clientId,
                wrappedPrim.wrapped.toJSON(),
                wrappedPrim.meta,
            );
        }
        catch (exc) {
            console.error(exc)
        }
    }

    addClient(socket) {
        socket
            .join(this.docId)
            .emit('doc', {
                document: this.document,
                revision: this.operations.length,
                clients: this.clients,
                // replay the operations on the clients, so the rich text will show correctly
                operations: this.operations
            })
            .on('operation', (revision, operation, selection) => {
                // this.mayWrite(socket, (mayWrite) => {
                //   if (!mayWrite) {
                //     console.log("User doesn't have the right to edit.")
                //     return
                //   }
                this.onOperation(socket, revision, operation, selection)
                // })
            });
        
        this.clients[socket.id] = {
            id: socket.id,
            name: socket.id,  
        };
        socket.broadcast['in'](this.docId).emit('client_join', this.clients[socket.id])
    }
}


export default EditorServer;