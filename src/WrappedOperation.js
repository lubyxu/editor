class WrappedOperation {
    constructor(blockOperation) {
        this.block = {};
        for (let i in blockOperation) {
            // 给每个BlockOperation的 TextOpertaion 包一下
            this.block[i] = {
                wrapped: blockOperation[i],
            };
        }
    }
    // transform a, b 对应的段落。
    // blockOperationA blockOperationB 均为 WrappedOperation 类型
    static transform(blockOperationA, blockOperationB) {
        const blockB = blockOperationB.block;
        const blockKeysB = Object.keys(blockB);

        let blockMerge = {};
        for (let i in blockOperationA) {
            blockMerge[i] = blockOperationA[i].wrapped;
        }

        blockKeysB.forEach(key => {
            if (blockMerge[key]) {
                blockMerge[key] = blockMerge[key].wrapped.transform(blockB[key].wrapped);
            }
            else {
                blockMerge[key] = blockB[key].wrapped;
            }
        });
        
        return [
            new WrappedOperation(blockMerge)
        ];
    }

    toJSON() {
        const json = {};

        for (let i in this.block) {
            // 给每个BlockOperation的 TextOpertaion 包一下
            json[i] = this.block[i].wrapped.toJSON();
        }

        return json;
    }
}

export default WrappedOperation;