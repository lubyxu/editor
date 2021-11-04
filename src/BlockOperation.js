import TextOperation from "./TextOperation";

export default class BlockOperation {
    constructor() {
        this.blockMap = {};
    }

    createTextOperation(blockKey, currentContent) {
        if (this.blockMap[blockKey]) {
            return this.blockMap[blockKey];
        }

        const contentBlock = currentContent.getBlockForKey(blockKey);
        const blockEndLength = contentBlock.getLength();

        this.blockMap[blockKey] = {
            operation: new TextOperation().retain(blockEndLength),
            blockEndLength,
        };
        return this.blockMap[blockKey];
    }

    setTextOpertaion(blockKey, operation, blockEndLength) {
        if (!this.blockMap[blockKey]) {
            this.blockMap[blockKey] = {};
        }
        this.blockMap[blockKey].operation = operation;
        this.blockMap[blockKey].blockEndLength = blockEndLength;
    }

    // 为每个段落做合并操作
    compose(blockOperation1) {
        const otherKeys = Object.keys(blockOperation1.blockMap);
        otherKeys.forEach(key => {
            let { operation: operation1 } = blockOperation1.blockMap[key];

            let { operation: originOperation, blockEndLength } = this.blockMap[key] || {};
            
            if (this.blockMap[key]) {
                this.blockMap[key] = {
                    operation: originOperation.compose(operation1),
                    // 这个blockEndLength应该是没用的。有用的话，这个blockEndLength 就是个bug
                    blockEndLength,
                };
            }
            else {
                this.blockMap[key] = {
                    operation: operation1,
                    blockEndLength: blockOperation1.blockMap[key].blockEndLength,
                };
            }
        });
        return this;
    }

    transform(blockOperation1) {
        const otherKeys = Object.keys(blockOperation1.blockMap);
        otherKeys.forEach(key => {
            let { operation: operation1 } = blockOperation1.blockMap[key];

            let { operation: originOperation, blockEndLength } = this.blockMap[key] || {};
            
            if (this.blockMap[key]) {
                this.blockMap[key] = {
                    operation: originOperation.transform(operation1),
                    // 这个blockEndLength应该是没用的。有用的话，这个blockEndLength 就是个bug
                    blockEndLength,
                };
            }
            else {
                this.blockMap[key] = {
                    operation: operation1,
                    blockEndLength: blockOperation1.blockMap[key].blockEndLength,
                };
            }
        });
        return this;
    }

    toJSON() {
        const keys = Object.keys(this.blockMap);
        const json = keys.reduce((prev, key) => {
            const { operation } = this.blockMap[key];
            return {
                ...prev,
                [key]: operation.toJSON(),
            };
        }, {});
        console.log(`json`, json);
        return json;
    }
}