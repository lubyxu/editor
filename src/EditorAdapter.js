import TextOperation from './TextOperation';
import BlockOperation from './BlockOperation';
export default class EditorAdapter {
    constructor() {
        this.selectionBefore = null;
        this.selectionAfter = null;

        this.selectionBlock = null;

        this.editorState = null;

        this.changes = [];
        this.patch = null;
    }
    registerCallbacks(cb) {
        this.callbacks = cb;
    }

    onChange(editorState) {
        const currentContent = editorState.getCurrentContent();
        const blockKey = editorState.getSelection().getAnchorKey();
        const contentBlock = currentContent.getBlockForKey(blockKey);

        console.log(`editorState.toJS()`, editorState.toJS())

        const lastChangeType = editorState.getLastChangeType();

        if (
            this.editorState &&
            this.editorState.getCurrentContent() ===
                editorState.getCurrentContent()
        ) {
            // focuse / selection 会触发
            this.selectionBefore = currentContent.getSelectionBefore();
        } else if (this.editorState && lastChangeType === 'insert-characters') {
            // this.getInsertDiff(editorState);
            const change = this.getInsertChar(editorState);
            this.changes.push(change);
        }
        this.editorState = editorState;
        const pair = EditorAdapter.operationFromEditorChange(this.changes, contentBlock);
        // console.log(`pair`, pair);
        // this.trigger('change', pair[0], pair[1]);
    }

    getInsertDiff(editorState) {
        const currentContent = editorState.getCurrentContent();
        const selectionBefore = currentContent.getSelectionBefore();
        const selectionAfter = currentContent.getSelectionAfter();
        const blockKey = selectionBefore.getAnchorKey();
        const contentBlock = currentContent.getBlockForKey(blockKey);

        const lastChange = this.getLastChange();

        if (lastChange && lastChange.selectionBefore === selectionBefore) {
            // 合并选项
            mergeChange(lastChange, {
                selectionAfter,
                selectionBefore,
                contentBlock
            });
        } else {
            const change = createChange({
                selectionAfter,
                selectionBefore,
                contentBlock
            });
            this.changes.push(change);
        }
    }

    getInsertChar(editorState) {
        const currentContent = editorState.getCurrentContent();
        const selection = editorState.getSelection();
        const blockKey = selection.getAnchorKey();
        const contentBlock = currentContent.getBlockForKey(blockKey);
        const startOffset = selection.getStartOffset();
        const text = contentBlock.getText()[startOffset - 1];

        const change = {
            blockKey,
            start: startOffset - 1,
            text,
            removed: '',
            attributes: {},
        }
        return change;
    }

    getLastChange() {
        if (this.changes.length) {
            return this.changes[this.changes.length - 1];
        }
        return null;
    }

    static operationFromEditorChange(changes, currentContent) {
        let blockEndLength = contentBlock.getLength();
        const blockKey = contentBlock.getKey();

        const blockOperation = new BlockOperation();

        // var operation = new TextOperation().retain(
        //     blockEndLength,
        //     blockKey
        // );
        // var inverse = new TextOperation().retain(blockEndLength, blockKey);

        for (var i = changes.length - 1; i >= 0; i--) {
            var change = changes[i];
            // var blockKey = changes.blockKey;

            var { operation, blockEndLength } = blockOperation.createTextOperation(blockKey, currentContent);
            var fromIndex = change.start;
            var restLength = blockEndLength - fromIndex - change.text.length;

            // 保持住fromIndex，做delete操作，插入操作，保持住剩余的length，合并之前的operation
            operation = new TextOperation()
                .retain(fromIndex)
                .delete(change.removed.length)
                .insert(change.text, change.attributes)
                // 用于结束遍历
                .retain(restLength)
                .compose(operation);

            // inverse = inverse.compose(
            //     new TextOperation()
            //         .retain(fromIndex, blockKey)
            //         .delete(change.text.length, blockKey)
            //         .insert(change.removed, change.removedAttributes, blockKey)
            //         .retain(restLength, blockKey)
            // );

            blockEndLength += change.removed.length - change.text.length;
            blockOperation.setTextOpertaion(blockKey, operation);
        }
        return [operation, inverse];
    }

    applyOperation(operation) {
        const ops = operation.ops;

        for (var i = 0, l = ops.length; i < l; i++) {
            var op = ops[i];
            // 保持光标
            if (op.isRetain()) {
                updateTextAttributes(op);
            } else if (op.isInsert()) {
                insertText(op);
            } else if (op.isDelete()) {
                removeText(op);
            }
        }
    }

    trigger(event) {
        var args = Array.prototype.slice.call(arguments, 1);
        var action = this.callbacks && this.callbacks[event];
        if (action) {
            action.apply(this, args);
        }
    }
}

function getSelection(editorState) {
    let cursorBlockKey, cursorIndex, lastIndex, lastChangeType;

    const selection = editorState.getSelection();
    cursorBlockKey = selection.getAnchorKey();
    cursorIndex = selection.getStartOffset();

    const content = editorState.getCurrentContent();
    lastIndex = content.getBlockForKey(cursorBlockKey);
}

function getText({ selectionBefore, selectionAfter, contentBlock }) {
    const start = selectionBefore.getStartOffset();
    const end = selectionAfter.getEndOffset();

    const text = contentBlock.getText().slice(start, end);
    return text;
}

function getRemoved({ selectionBefore, selectionAfter, contentBlock }) {
    const start = selectionBefore.getStartOffset();
    const end = selectionAfter.getEndOffset();

    if (end < start) {
        const text = contentBlock.getText().slice(end, start);
        return text;
    } else {
        return '';
    }
}

function getattributes({ selectionBefore, selectionAfter, contentBlock }) {
    return {};
}

function getStart({ selectionBefore }) {
    return selectionBefore.getStartOffset();
}

function createChange({ selectionBefore, selectionAfter, contentBlock }) {
    const text = getText({ selectionBefore, selectionAfter, contentBlock });
    const removedText = getRemoved({
        selectionBefore,
        selectionAfter,
        contentBlock
    });
    const attributes = getattributes({
        selectionBefore,
        selectionAfter,
        contentBlock
    });
    const start = getStart({ selectionBefore, selectionAfter });
    return {
        blockKey: selectionBefore.getAnchorKey(),
        start,
        text,
        removed: removedText,
        attributes,
        selectionBefore
    };
}

function mergeChange(
    source,
    { selectionBefore, selectionAfter, contentBlock }
) {
    source.text = getText({ selectionBefore, selectionAfter, contentBlock });
}



class InsertOperation {
    
}