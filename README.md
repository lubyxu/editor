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

## 协同流程：

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


一个 link的example
```js
const Link = ({entityKey, children}) => {
  const {url} = Entity.get(entityKey).getData()

  return (
    <a
      target="_blank"
      href={url}
    >
      {children}
    </a>
  )
}

// 创建插件的函数，因为插件可能可以接受不同的参数进行初始化。返回的对象就是一个 Draft.js 插件
const linkTitlePlugin = () => {
  return {
    decorators: [
      {
        // 找到对应 type 为 link 的 entity 的文字位置
        strategy: (contentBlock, callback) => {
          // contentblock 里找实体，找到后，调用Link组件
          contentBlock.findEntityRanges(
            character => {
              const entityKey = character.getEntity()
              return (
                entityKey !== null &&
                Entity.get(entityKey).getType() === 'link'
              )
            },
            callback
          )
        },
        component: Link,
      },
    ],
    handlePastedText: (text, html, {getEditorState, setEditorState}) => {
    
      // 如果粘贴进来的不是链接，return false 告诉 Draft.js 进行粘贴操作的默认处理
      const isPlainLink = !html && linkify.test(text)
      if (!isPlainLink) return false
      
      fetch(`/scraper?url=${text}`) // 抓取网页标题的后端服务
      .then((res) => res.json())
      .then((data) => {
        const title = data.title
        const editorState = getEditorState()
        const contentState = editorState.getCurrentContent()
        const selection = editorState.getSelection()
        let newContentState
        if (title && title !== text) {
          // 创建一个 link实体。
          const entityKey = Entity.create('link', 'IMMUTABLE', {url: text}) // 创建新 entity
          // 作用到 contentState中。
          newContentState = Modifier.replaceText(contentState, selection, title, null,
            entityKey) // 在当前选区位置插入带 entity 的文字，文字内容为抓取到的 title
        } else {
          newContentState = Modifier.replaceText(contentState, selection, text)
        }
        // 往editor里，push一个changeType， 用于 undo / redo
        const newEditorState = EditorState.push(editorState, newContentState, 'insert-link')    
        if (newEditorState) {
          setEditorState(newEditorState)
        }
      }, () => {
        // 请求失败，插入不带 entity 的纯文本，文字内容为粘贴来的原内容
        const editorState = getEditorState()
        const contentState = editorState.getCurrentContent()
        const selection = editorState.getSelection()
        const newContentState = Modifier.replaceText(contentState, selection, text)
        const newEditorState = EditorState.push(editorState, newContentState, 'insert-characters')
        if (newEditorState) {
          setEditorState(newEditorState)
        }
      })
      // return true 告诉 Draft.js 我已经处理完毕这次粘贴事件，Draft.js 不必再进行处理
      return true
    },
  }
}

export default linkTitlePlugin
```

## 插件作用到sidebar中。