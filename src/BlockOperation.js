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
            opertaion: new TextOperation().retain(blockLength),
            blockEndLength,
        };
        return this.blockMap[blockKey];
    }

    setTextOpertaion(blockKey, opertaion) {
        this.blockMap[blockKey].opertaion = opertaion;
    }


    compose() {}
}