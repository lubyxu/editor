/**
 * 目标：
 */
export default class Selection {
    static getOffsetByKey(blocks, key) {
        let pos = 0;
        let i = 0;
        while (true) {
            if (i >= blocks.length) {
                break;
            }
            if (blocks[i].getKey() === key) {
                return pos;
            }
            pos += blocks[i].getLength();
            i++;
        }
        return pos;
    }
    static getSelectionRange(editorState) {
        const contentState = editorState.getCurrentContent();
        // const before = contentState.getSelectionBefore();
        const [ before, end ] = Selection.getRange(editorState);
    
        const blocks = contentState.getBlocksAsArray();

        const beforeKey = before.getStartKey();
        const beforeOffset = before.getStartOffset();
        const endKey = end.getEndKey();
        const endOffset = end.getEndOffset();

        console.log(`end.toJS()`, end.toJS(), endKey, endOffset);
        console.log(`before.toJS()`, before.toJS(), beforeKey, beforeOffset)


        let cursorStartOffset = Selection.getOffsetByKey(blocks, beforeKey) + beforeOffset;
        let cursorEndOffset = Selection.getOffsetByKey(blocks, endKey) + endOffset;

        return [ cursorStartOffset, cursorEndOffset ];

        // return position;
    }
    // 将selection 转化成 [ offset1, offset2 ]。
    static getRange(editorState) {
        const contentState = editorState.getCurrentContent();
        const selection = editorState.getSelection();
        const selectionBefore = contentState.getSelectionBefore();
        const selectionAfter = contentState.getSelectionAfter();

        if (selection.getIsBackward()) {
            return [selectionBefore, selectionAfter];
        }
        else {
            return [selectionAfter, selectionBefore];
        }

    }
}