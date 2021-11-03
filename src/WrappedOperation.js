class WrappedOperation {
    constructor(operation) {
        this.wrapped = operation;
    }
    static transform(a, b) {
        // A 的 TextOperation 转化 B 的TextOperation
        const pair = a.wrapped.transform(b.wrapped);

        return [
            new WrappedOperation(pair[0]),
            new WrappedOperation(pair[1]),
        ];
    }
}

export default WrappedOperation;