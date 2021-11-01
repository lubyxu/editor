/**
 * 获取diff
 */
import TextOperation from "./TextOperation";


function getDocEndBlockLength() {}

function getBlockKey() {}

export function operationFromChanges(editorState, char) {
    const selection = editorState.getSelection();

    const blockKey = getBlockKey();
    const docEndBlocklLength = getDocEndBlockLength(blockKey);
    const blockIndex = getBlockStartIndex(blockKey);

    // 保持住当前选择的区域
    let operation = new TextOperation(blockKey).retain(docEndBlocklLength);

    // insert-characters
    // 实际操作，每增加一个字符都会调用一次
    return insertOpertaion(blockKey, blockIndex, char, operation);
}

function insertOpertaion(blockKey, blockIndex, char, baseOpertaion) {
    return (
        new TextOperation(blockKey)
            // 保持住当前区域
            .retain(blockIndex)
            // 当前区域插入文本
            .insert(char, char.attributes)
            // 合并之前的文本
            .compose(baseOpertaion)
    );
}

// function deleteOperation(startSelection, char, baseOpertaion) {
//     return (
//         new TextOperation()
//             // 保持住当前区域
//             .retain(selection)
//             // 当前区域插入文本
//             .delete(char, char.attributes)
//             // 合并之前的文本
//             .compose(baseOpertaion)
//     );
// }
