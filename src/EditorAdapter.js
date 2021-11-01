import TextOperation from "./TextOperation";

class EditorAdapter {
    static operationFromEditorChange(editorState) {
        const { cursorBlockKey, cursorIndex, lastIndex, lastChangeType } = getSelection(editorState);

        var operation = new TextOperation(cursorBlockKey).retain(lastIndex);

        var fragOperation = new TextOperation(cursorBlockKey)
            .retain(cursorIndex);
        
        // 插入
        if (lastChangeType === 'insert-cha') {
            const char = getInsertChar(editorState);
            fragOperation = fragOperation.insert(char, char.attributes);
        }
        // 删除
        if (lastChangeType = 'delete-char') {
            const deleteLength = getDeleteLength(editorState);
            fragOperation = fragOperation.delete(deleteLength);
        }
        // 保持住剩下的光标
        const restLength = lastIndex - cursorIndex - char.length;
        fragOperation = fragOperation.retain(restLength);

        operation = fragOperation.compose(operation);
        
        return [ operation ];
    }
}