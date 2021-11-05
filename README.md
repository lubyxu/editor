## 数据结构定义

```typescript
type CoreDraftBlockType =
  | 'unstyled'
  | 'paragraph'
  | 'header-one'
  | 'header-two'
  | 'header-three'
  | 'header-four'
  | 'header-five'
  | 'header-six'
  | 'unordered-list-item'
  | 'ordered-list-item'
  | 'blockquote'
  | 'code-block'
  | 'atomic';

type Depth = number; // 用在 列表里
type EntityKey = string;

interface IContentBlockProps {
  type: CoreDraftBlockType | string;
  depth: Depth;
  entityRanges: {
    key: EntityKey; // 实体key值
    length: number; // 实体长度
    offset: number; //实体开始的 偏移量
  }[];
  inlineStyleRanges: {
    style: string;
    offset: number;
    length: number;
  }[];
  key: string; // contentBlock的key值，
  text: string; // 文本。当是多媒体的时候，text是空。
}

type IEntityMap = {
  type: string;
  mutability: 'IMMUTABLE' | 'MUTABLE'; // 是否能修改data
  data: any;
}[];

interface EditorSchema {
  blocks: IContentBlockProps[];
  entityMap: Record<EntityKey, IEntityMap>;
};
```


## DIFF

```typescript
interface ISelection {
  anchorKey: string; // 光标开始的段落key值
  anchorOffset: number; // 光标开始的offset
  focusKey: string; // 光标最后结束的段落key值
  focusOffset: number; // 光标结束的offset
  hasFocus: boolean; // 最后是否聚焦
  isBackward: boolean; // 是从前到后删除，还是从后到前删除
}

type ChangeType =
  | 'backspace-character' // 从后往前删除文字
  | 'delete-character' // 从前往后删除文字
  | 'remove-range' // 删除一片区域
  | 'insert-characters' // 插入文字
  | 'split-block' // 将一行文字 回车 折成 两行
  | 'adjust-depth' // 调整深度。??? 不知道怎么用。。
  | 'apply-entity' // 应用实体，主要是用在插件上.
  | 'change-block-data' // The data value of one or more ContentBlock objects is being changed. ??? 不知道怎么用。。
  | 'change-block-type' // 需改某个block的type。
  | 'change-inline-style' // 修改某个selection的样式 | 当鼠标focus的时候 也会触发
  | 'move-block' // 删除一整行
  | 'insert-fragment' // 猜测是增加一|n整行

interface IDiff {
  type: ChangeType,
  selectionBefore: ISelection
  selectionAfter: ISelection
}
// 计算出diff
type DiffFn = (selectionAfter: Seleciton, selectionBefore: Seleciton, blockMap: Map<string, ContentBlock>): Selection;
// 合并diff
type ApplyFn = (selection: Selection, currentContentState: ContentState): ContentState;
```

## diff 推送

```

ws: diff  =》 createTask or 对比之前操作mergeTask
        ------------------------------
task队列：| task1 | task2 | ... | taskn
        ------------------------------

setTimout -> 消费task队列

```

## 接入API插件
```typescript
interface Plugin {
  blockRendererFn?:  (block: ContentBlock) => ?Object; // 自定义段落渲染
  blockStyleFn?: (block: ContentBlock) => string; // 定义段落className
  handleKeyCommand: // 注册某个key command。
  decorators: // 支持block内的一些规则的样式渲染。 满足某些条件的时候，走某个样式。
  handleBeforeInput: //
  handlePastedText: //
  handlePastedFiles: //
  handleDroppedFiles: //
  handleDrop: //
  onEscape: //
  onTab: //
  onUpArrow: //
  onDownArrow: //
}
```


```js
// decorator 例子
{
  strategy: (contentBlock, callback) => {
	 contentBlock.findEntityRanges(
	   character => {
	     const entityKey = character.getEntity()
	     return (
	       entityKey !== null &&
	       Entity.get(entityKey).getType() === 'mention'
	     )
	   },
	   callback
	 )
  },
  component: Mention,
}
```


## Opts

### 光标保持操作
`retain(blockIndex, cursorIndex)`

### 插入操作
`insert(text)`

### 换n行
`split(n)`

### 删n行
`blockDel(n)`

### 删除操作
`delete(n)`

## 例子

STR: 'abc'.

clientA: retain(0, 1) insert('clientA')
clientB: retain(0, 1) insert('B')

假设 clientA 先到， B 需要transfrom => retain(0, 1 + 7) insert('B');