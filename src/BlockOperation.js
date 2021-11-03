import TextOperation from "./TextOperation";

export default class BlockOperation {
    constructor() {
        this.blockMap = {};

        // new Proxy(this, {
        //     get: function (target, propKey) {
        //         console.log(`propKey`, propKey);
        //         const map = Reflect.get(target, 'blockMap');
        //         console.log(`map`, map)
        //         return map[propKey];
        //     }
        // });
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
}