import TextOperation from './TextOperation';
import BlockOperation from './BlockOperation';
import Selection from './Selection';
import { Modifier, SelectionState, EditorState, convertToRaw, ContentState, RichUtils } from 'draft-js';
export default class EditorAdapter {
    constructor(ref, editorState) {
        this.selectionBefore = null;
        this.selectionAfter = null;

        this.selectionBlock = null;

        this.editorState = editorState;

        this.changes = [];
        this.patch = null;
        this.ref = ref;

        this.mount = false;
    }

    registerCallbacks(cb) {
        this.callbacks = cb;
    }

    blockLen(currentContent) {
        const blocks = currentContent.getBlocksAsArray();

        return blocks.reduce((len, cur) => {
            return len + cur.text.length;
        }, 0);
    }

    onChange(editorState) {
        // 忽略第一次onChange
        if (!this.mount) {
            this.mount = true;
            return;
        }

        const currentContent = editorState.getCurrentContent();
        const blockKey = editorState.getSelection().getAnchorKey();
        const contentBlock = currentContent.getBlockForKey(blockKey);
        const lastChangeType = editorState.getLastChangeType();
        const totalLen = this.blockLen(currentContent);

        if (
            this.editorState &&
            this.editorState.getCurrentContent() ===
                editorState.getCurrentContent()
        ) {
            // focuse / selection 会触发
            this.selectionBefore = currentContent.getSelectionBefore();
            // const startOffset = this.getSelectionStartOffset(editorState);

        } else if (this.editorState && lastChangeType === 'insert-characters') {
            // this.getInsertDiff(editorState);
            const change = this.getInsertChar(editorState);
            this.changes.push(change);
        }
        else if (this.editorState && lastChangeType === 'backspace-character') {
            const change = this.getDelChar(editorState);
            this.changes.push(change);
        }
        else if (lastChangeType === 'remove-range') {
            const change = this.getRemoveRanegChange(editorState);
            console.log(`change`, change)
            this.changes.push(change);
        }
        this.editorState = editorState;
        if (!this.changes.length) {
            return;
        }
        const pair = EditorAdapter.operationFromCodeMirrorChanges(
            this.changes,
            totalLen
        );
        this.changes = [];
        this.trigger('change', pair[0], pair[1]);
    }

    getBlockIndexByBlockKey(blockKey) {
        const blocks = this.editorState.getCurrentContent().getBlocksAsArray();
        return blocks.findIndex((item) => item === blockKey);
    }

    getSelection(editorState) {
        const selection = editorState.getSelection();
        return selection;
    }

    getSelectionRange(editorState) {
        const selection = editorState.getSelection();

        const startKey = selection.getStartKey();
        const startOffset = selection.getStartOffset();

        const endKey = selection.getEndKey();
        const endOffset = selection.getEndOffset();

        return [ {key: startKey, offset: startOffset}, { key: endKey, offset: endOffset } ];
    }

    // 插入文本
    getInsertChar(editorState) {
        const contentState = editorState.getCurrentContent();
        const blocks = contentState.getBlocksAsArray();
        const selection = editorState.getSelection();
        const blockKey = selection.getStartKey();
        const startOffset = selection.getStartOffset();

        const contentBlock = contentState.getBlockForKey(blockKey);
        const text = contentBlock.getText()[startOffset - 1];

        let position = 0;
        let i = 0;
        let block = blocks[i];
        while (true) {
            if (block.getKey() !== blockKey) {
                position += block.length;
                continue;
            }
            else {
                position += startOffset;
                break;
            }
        }

        return {
            start: position - 1,
            end: position,
            text,
            removed: '',
            attributes: {}
        };
    }

    getDelChar(editorState) {
        // const startOffset = this.getSelectionStartOffset(editorState);
        const [ start, end ] = Selection.getSelectionRange(editorState);
        console.log(`start`, start);
        console.log(`end`, end)
        return {
            start: end.offset,
            end: start.offset,
            text: '',
            removed: 'a',
            attributes: {}
        };
    }

    getRemoveRanegChange(editorState) {
        const [ start, end ] = Selection.getSelectionRange(editorState);
        return {
            start,
            end,
            text: '',
            removed: new Array(end - start).fill('1').join(''),
            attributes: {},
        };
    }

    getLastChange() {
        if (this.changes.length) {
            return this.changes[this.changes.length - 1];
        }
        return null;
    }

    // Converts a CodeMirror change object into a TextOperation and its inverse
    // and returns them as a two-element array.
    // 将codemirror的change对象 转变成 TextOperation。
    // 返回一个数组 [ 操作， 撤回操作 ]
    static operationFromCodeMirrorChanges(changes, docEndLength) {
        console.log('-----changes', changes);
        // Approach: Replay the changes, beginning with the most recent one, and
        // construct the operation and its inverse. We have to convert the position
        // in the pre-change coordinate system to an index. We have a method to
        // convert a position in the coordinate system after all changes to an index,
        // namely CodeMirror's `indexFromPos` method. We can use the information of
        // a single change object to convert a post-change coordinate system to a
        // pre-change coordinate system. We can now proceed inductively to get a
        // pre-change coordinate system for all changes in the linked list.
        // A disadvantage of this approach is its complexity `O(n^2)` in the length
        // of the linked list of changes.
        console.log('------docEndLength', docEndLength);
        var operation = new TextOperation().retain(docEndLength);
        var inverse = new TextOperation().retain(docEndLength);

        for (var i = changes.length - 1; i >= 0; i--) {
            var change = changes[i];
            var fromIndex = change.start;
            var restLength = docEndLength - fromIndex - change.text.length;

            console.log(`restLength`, restLength);

            // 保持住fromIndex，做delete操作，插入操作，保持住剩余的length，合并之前的operation
            operation = new TextOperation()
                .retain(fromIndex)
                .delete(change.removed.length)
                .insert(change.text, change.attributes)
                // 用于结束遍历
                .retain(restLength)
                .compose(operation);

            inverse = inverse.compose(
                new TextOperation()
                    .retain(fromIndex)
                    .delete(change.text.length)
                    .insert(change.removed, change.removedAttributes)
                    .retain(restLength)
            );

            docEndLength += change.removed.length - change.text.length;
            console.log(`docEndLength`, docEndLength, change);
        }
        return [operation, inverse];
    }
    // Converts an attributes changed object to an operation and its inverse.
    // attributes的 operation 转化
    static operationFromAttributesChanges(changes, cm) {
        var docEndLength = codemirrorLength(cm);
        console.log('---maybe it is attributes change----', changes);

        var operation = new TextOperation();
        var inverse = new TextOperation();
        var pos = 0;

        for (var i = 0; i < changes.length; i++) {
            var change = changes[i];
            var toRetain = change.start - pos;
            Utils.assert(toRetain >= 0); // changes should be in order and non-overlapping.
            operation.retain(toRetain);
            inverse.retain(toRetain);

            var length = change.end - change.start;
            operation.retain(length, change.attributes);
            inverse.retain(length, change.attributesInverse);
            pos = change.start + length;
        }

        operation.retain(docEndLength - pos);
        inverse.retain(docEndLength - pos);
        return [operation, inverse];
    }

    // retain(1) insert('hello word'); 模拟光标后移，插入'hello word'
    mockOpertaion(blockEndLength, blockKey) {
        const str = 'hello world';
        const start = 2;
        const blockOperation = new BlockOperation();
        const textOperation = new TextOperation()
            .retain(start)
            .insert(str)
            .retain(blockEndLength - start);
        blockOperation.setTextOpertaion(
            blockKey,
            textOperation,
            blockEndLength - start
        );

        return blockOperation;
    }

    mockTransformOperation() {
        // const blockOperation = new BlockOperation();
        var operationA = new TextOperation();
        operationA.retain(1).insert('operationA');

        var operationB = new TextOperation();
        operationB.retain(1).insert('operationB');

        const finalOperation = operationA.transform(operationB);
        console.log(`finalOperation`, finalOperation);
    }

    getCompactEditorState() {
        const blocks = this.editorState.getCurrentContent().getBlocksAsArray();
        if (!blocks.length) {
            this.editorState = RichUtils.insertSoftNewline(this.editorState);
        }
        return this.editorState;
    }

    getBlockPropertyByCursor(start) {
        this.getCompactEditorState();
        const blocks = this.editorState.getCurrentContent().getBlocksAsArray() || [];

        let restLen = start;
        let cursorBlock = null;
        blocks.forEach(block => {
            const len = block.getLength();
            if (restLen - len <= 0) {
                cursorBlock = block;
                return;
            }
            else {
                restLen = restLen - len;
            }
        });

        console.log(`cursorBlock`, cursorBlock)

        return [cursorBlock, restLen];
    }

    // 这一串待定，因为这一串是 draft-js特有的
    applyOperation(operation) {
        // HACK: If there are a lot of operations; hide CodeMirror so that it doesn't re-render constantly.
        // if (operation.ops.length > 10) {
        //     this.rtcm.codeMirror
        //         .getWrapperElement()
        //         .setAttribute('style', 'display: none');
        // }

        var ops = operation.ops;
        console.log(`ops`, ops)

        var selection = SelectionState.createEmpty();
        const [ block ] = this.getBlockPropertyByCursor(0);
        const blockKey = block.getKey();
        selection = selection.set('anchorKey', blockKey).set('focusKey', blockKey).set('anchorOffset', 0);
        var index = 0; // holds the current index into CodeMirror's content
        for (var i = 0, l = ops.length; i < l; i++) {
            var op = ops[i];
            if (op.isRetain()) {
                const [ block, start ] = this.getBlockPropertyByCursor(index + op.chars);
                selection
                    .set('anchorOffset', start)
                    .set('anchorKey', block.getKey());
                index += op.chars;
            } else if (op.isInsert()) {
                const contentState = this.editorState.getCurrentContent();
                const newContent = Modifier.insertText(
                    contentState,
                    selection,
                    op.text
                );

                selection = SelectionState.createEmpty();
                const newEditorState = EditorState.set(this.editorState, {
                    currentContent: newContent
                });

                this.editorState = newEditorState;

                this.ref.trigger('change', newEditorState);
                index += op.text.length;
            } else if (op.isDelete()) {
                // this.rtcm.removeText(index, index + op.chars, 'RTCMADAPTER');
            }
        }
    }

    insertText(blockKey, start, op) {
        const currentContent = this.editorState.getCurrentContent();
        let tragetRange = SelectionState.createEmpty(blockKey);
        tragetRange = tragetRange
            .set('anchorOffset', start)
            .set('focusOffset', start);

        console.log(`tragetRange.toJS()`, start, tragetRange.toJS());

        const newContent = Modifier.insertText(
            currentContent,
            tragetRange,
            op.text
        );

        const newEditorState = EditorState.set(this.editorState, {
            currentContent: newContent
        });

        this.ref.trigger('change', newEditorState);
        // console.log(`newContent`, newEditorState.toJS());
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
