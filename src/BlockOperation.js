import TextOperation from "./TextOperation";

export default class BlockOperation {
    constructor() {
        this.blockMap = {};
    }

    createTextOperation(blockKey, currentContent) {
        console.log('createTextOperation');
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

    setTextOpertaion(blockKey, opertaion, blockEndLength) {
        this.blockMap[blockKey].opertaion = opertaion;
        this.blockMap[blockKey].blockEndLength = blockEndLength;
    }


    compose() {}
}