/**
 * 联合 socket & draft-js
 */

import TextOperation from '../TextOperation';

export default class Client {
    constructor(revision, historyOps) {
        this.revision = revision;
        this.historyOps = historyOps;
        this.state = synchronized_;
    }
    initClientContent() {
        if (this.historyOps && this.historyOps.length) {
            var _ops = this.historyOps.map(wrappedOp => wrappedOp.wrapped);
            var initalTextOp = new TextOperation();

            _ops.forEach(op => {
                var _txtOp = TextOperation.fromJSON(OP);
                initalTextOp = initalTextOp.compose(_txtOp);
            })

            this.applyOperation(initalTextOp);
        }
    }

    sendOperation(revision, operation) {
        throw new Error('sendOperation must be defined in child class');
    }
    applyOperation(operation) {
        throw new Error('applyOperation must be defined in child class');
    }
    setState(state) {
        this.state = state;
    }
    applyClient(operation) {
        console.log(`operation`, operation)
        this.setState(this.state.applyClient(this, operation));
    }
    applyServer(operation) {
        this.revision++;
        this.setState(this.state.applyServer(this, operation));
    }
    serverAck() {
        this.revision++;
        this.setState(this.state.serverAck(this));
    }
}

// In the 'Synchronized' state, there is no pending operation that the client
// has sent to the server.
// 同步状态中个，client端没有 pending的 operation。
export class Synchronized {
    // 发送一个operation，并返回一个正在等待确认的operation
    // 这个是 blockOperation
    applyClient(client, operation) {
        // When the user makes an edit, send the operation to the server and
        // switch to the 'AwaitingConfirm' state
        client.sendOperation(client.revision, operation);
        return new AwaitingConfirm(operation);
    }
    // 应用个来自服务端的 operation
    applyServer(client, operation) {
        // When we receive a new operation from the server, the operation can be
        // simply applied to the current document
        client.applyOperation(operation);
        return this;
    }
    serverAck(client) {
        throw new Error('There is no pending operation.');
    }
    // Nothing to do because the latest server state and client state are the same.
    transformSelection(selection) {
        return selection;
    }
}

// Singleton
var synchronized_ = new Synchronized();

// In the 'AwaitingConfirm' state, there's one operation the client has sent
// to the server and is still waiting for an acknowledgement.
//  'AwaitingConfirm'，有一个client的操作发送到了 server端，等待被接收中。
export class AwaitingConfirm {
    constructor(outstanding) {
        // Save the pending operation
        this.outstanding = outstanding;
    }

    // AwaitingConfirm 中，client端又产生了一个 operation时，不要立即发送，而是转换成AwaitingWithBuffer状态
    applyClient(client, operation) {
        // When the user makes an edit, don't send the operation immediately,
        // instead switch to 'AwaitingWithBuffer' state
        return new AwaitingWithBuffer(this.outstanding, operation);
    }
    applyServer(client, operation) {
        // This is another client's operation. Visualization:
        //
        //                   /\
        // this.outstanding /  \ operation
        //                 /    \
        //                 \    /
        //  pair[1]         \  / pair[0] (new outstanding)
        //  (can be applied  \/
        //  to the client's
        //  current document)
        var pair = this.outstanding.transform(operation);
        client.applyOperation(pair[1]);
        return new AwaitingConfirm(pair[0]);
    }
    serverAck(client) {
        // The client's operation has been acknowledged
        // => switch to synchronized state
        return synchronized_;
    }
    resend(client) {
        // The confirm didn't come because the client was disconnected.
        // Now that it has reconnected, we resend the outstanding operation.
        client.sendOperation(client.revision, this.outstanding);
    }
    transformSelection(selection) {
        return selection.transform(this.outstanding);
    }
}

// In the 'AwaitingWithBuffer' state, the client is waiting for an operation
// to be acknowledged by the server while buffering the edits the user makes
// 'AwaitingWithBuffer' 表示，client着buffer等待一个 openration 被接收
export class AwaitingWithBuffer {
    constructor(outstanding, buffering) {
        // Save the pending operation and the user's edits since then
        this.outstanding = outstanding;
        this.buffer = buffering;
    }

    applyClient(client, operation) {
        // Compose the user's changes onto the buffer
        var newBuffer = this.buffer.compose(operation);
        return new AwaitingWithBuffer(this.outstanding, newBuffer);
    }
    applyServer(client, operation) {
        // Operation comes from another client
        //
        //                       /\
        //     this.outstanding /  \ operation
        //                     /    \
        //                    /\    /
        //       this.buffer /  \* / pair1[0] (new outstanding)
        //                  /    \/
        //                  \    /
        //          pair2[1] \  / pair2[0] (new buffer)
        // the transformed    \/
        // operation -- can
        // be applied to the
        // client's current
        // document
        //
        // * pair1[1]
        var pair1 = this.outstanding.transform(operation);
        var pair2 = this.buffer.transform(pair1[1]);
        client.applyOperation(pair2[1]);
        return new AwaitingWithBuffer(pair1[0], pair2[0]);
    }
    serverAck(client) {
        // The pending operation has been acknowledged
        // => send buffer
        client.sendOperation(client.revision, this.buffer);
        return new AwaitingConfirm(this.buffer);
    }
    resend(client) {
        // The confirm didn't come because the client was disconnected.
        // Now that it has reconnected, we resend the outstanding operation.
        client.sendOperation(client.revision, this.outstanding);
    }
    transformSelection(selection) {
        return selection.transform(this.outstanding).transform(this.buffer);
    }
}
