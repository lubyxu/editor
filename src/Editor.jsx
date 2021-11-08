import React, { Component } from 'react';
import Editor, { composeDecorators } from 'draft-js-plugins-editor';
import {
    EditorState,
    ContentState,
    RichUtils,
    getDefaultKeyBinding,
    KeyBindingUtil,
    convertToRaw
} from 'draft-js';
import { fromJS, get } from 'immutable';
import io from 'socket.io-client'

/* Emoji plugin */
import createEmojiPlugin from 'draft-js-emoji-plugin';
import 'draft-js-emoji-plugin/lib/plugin.css';
const emojiPlugin = createEmojiPlugin();
const { EmojiSuggestions } = emojiPlugin;

/* Hashtag plugin */
import createHashtagPlugin from 'draft-js-hashtag-plugin';
import 'draft-js-hashtag-plugin/lib/plugin.css';
const hashtagPlugin = createHashtagPlugin();

/* Image with Alignment, dnd, focus, resize plugin */
import createImagePlugin from 'draft-js-image-plugin';
import createAlignmentPlugin from 'draft-js-alignment-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';
import createResizeablePlugin from 'draft-js-resizeable-plugin';
import createDndPlugin from 'draft-js-drag-n-drop-plugin';

import 'draft-js-alignment-plugin/lib/plugin.css';
import 'draft-js-focus-plugin/lib/plugin.css';

import createMarkdownShortcutsPlugin from 'draft-js-markdown-shortcuts-plugin';

const focusPlugin = createFocusPlugin();
const resizeablePlugin = createResizeablePlugin();
const dndPlugin = createDndPlugin();
const alignmentPlugin = createAlignmentPlugin();
const { AlignmentTool } = alignmentPlugin;

const decorator = composeDecorators(
    resizeablePlugin.decorator,
    alignmentPlugin.decorator,
    focusPlugin.decorator,
    dndPlugin.decorator
);
const imagePlugin = createImagePlugin({ decorator });

/* Linkify */
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import 'draft-js-linkify-plugin/lib/plugin.css';
const linkifyPlugin = createLinkifyPlugin();

/* Mentions */

import createMentionPlugin, {
    defaultSuggestionsFilter
} from 'draft-js-mention-plugin';
const mentionPlugin = createMentionPlugin();
const { MentionSuggestions } = mentionPlugin;
import 'draft-js-mention-plugin/lib/plugin.css';

/* ld plugins */

/* Toolbar */
import createToolbarPlugin from 'last-draft-js-toolbar-plugin';
import 'last-draft-js-toolbar-plugin/lib/plugin.css';
const toolbarPlugin = createToolbarPlugin();
const { Toolbar } = toolbarPlugin;

/* Side Toolbar */
import createSidebarPlugin from 'last-draft-js-sidebar-plugin'
import 'last-draft-js-sidebar-plugin/lib/plugin.css'
const sidebarPlugin = createSidebarPlugin()
const { Sidebar } = sidebarPlugin

/* Embed plugin */
import createEmbedPlugin from 'draft-js-embed-plugin';
import 'draft-js-embed-plugin/lib/plugin.css';
const embedPlugin = createEmbedPlugin();

/* Link plugin */
import createLinkPlugin from 'draft-js-link-plugin';
import 'draft-js-link-plugin/lib/plugin.css';
const linkPlugin = createLinkPlugin();

/* Color */
import { colorStyleMap } from 'draft-js-color-picker-plugin';

import EditorAdapter from './EditorAdapter';
import SharedEditor from './client';
import Utils from './Utils.js';

import EditorServer from './server/server';

/* init the plugins */
const plugins = [
    dndPlugin,
    focusPlugin,
    alignmentPlugin,
    resizeablePlugin,
    imagePlugin,
    emojiPlugin,
    hashtagPlugin,
    linkifyPlugin,
    mentionPlugin,
    toolbarPlugin,
    embedPlugin,
    linkPlugin,
    sidebarPlugin,
    createMarkdownShortcutsPlugin()
];



class Event {}
export default class WhaleEditor extends Component {
    constructor(props) {
        super(props);
        this.state = { suggestions: props.mentions || fromJS([]) };
        this.keyBindings = this.props.keyBindings || [];

        this.socket = io('http://localhost:4001');

        console.log('this.socket :>> ', this.socket);
        this.ref = new Event();

        Utils.makeEventEmitter(Event, ['change'], this.ref);
        this.ref.on('change', this.props.onChange);

        this.adapter = new EditorAdapter(this.ref, this.props.editorState);
        this.shareEditor = new SharedEditor(this.socket, this.adapter, {
            forceUpdate: this.forceUpdate.bind(this)
        });

        const defaultContent = ContentState.createFromText('hello world');
        const newState = EditorState.set(props.editorState, {
            currentContent: defaultContent
        });
        this.props.onChange(newState);
    }

    setEditorState = (editorState) => {
        this.props.onChange(editorState);
    }

    onChange = (editorState) => {
        this.props.onChange(editorState);
        const json = editorState.toJS();
        // console.log('json :>> ', json);
    
        this.adapter.onChange(editorState);

        // const operation = this.shareEditor.client?.state;
        // console.log('opertaion :>> ', operation);
    };

    onMock = () => {
        setTimeout(() => {
            const currentContent = this.props.editorState.getCurrentContent();
            const contentBlock = currentContent.getFirstBlock();
            const blockLength = contentBlock.getLength();

            const blockOperation = this.adapter.mockOpertaion(blockLength, contentBlock.getKey());
            this.adapter.applyBlockOperation(blockOperation);
        }, 3000);
    }

    onMockTransform = () => {
        this.adapter.mockTransformOperation();
    }

    focus = () => {
        this.editor.focus();
    };

    onSearchChange = ({ value }) => {
        if (this.props.mentionSearchAsync !== undefined) {
            /* async */
            this.props.mentionSearchAsync(value).then((data) => {
                this.setState({ suggestions: fromJS(data.suggestions) });
            });
        } else {
            /* static list of users */
            this.setState({
                suggestions: defaultSuggestionsFilter(
                    value,
                    this.props.mentions
                )
            });
        }
    };

    handleKeyCommand = (command) => {
        if (this.keyBindings.length) {
            const kb = this.keyBindings.find((k) => k.name === command);
            if (kb) {
                kb.action();
                return true;
            }
        }
        const newState = RichUtils.handleKeyCommand(
            this.props.editorState,
            command
        );
        if (newState) {
            this.props.onChange(newState);
            return true;
        }
        return false;
    };

    handleReturn = (event) => {
        if (!event.shiftKey) {
            return false;
        }
        const newState = RichUtils.insertSoftNewline(this.props.editorState);
        this.props.onChange(newState);
        return true;
    };

    handleBeforeInput = (chars, editorState, eventTimeStamp) => {
        // console.log('chars :>> ', chars);
        // console.log('editorState.toJS() :>> ', editorState.toJS());
        return true;
    };

    clientData = () => {
        const client = this.shareEditor.client;

        let arr = [];
        
        if (client) {
            arr.push('状态：'+ client.state.constructor.name);
            arr.push('版本：' + client.revision);
        }
        else {
            arr.push('client 还未初始化');
        }

        return arr;
    }

    render() {
        return (
            <div>
                <button onClick={this.onMock}>模拟 retain(1) insert(22)</button>
                <button onClick={this.onMockTransform}>模拟 transform</button>
                <div style={{display: 'flex'}}>
                    <div
                        className='editor'
                        style={{ border: '1px solid #000', marginTop: 10, width: 800 }}
                    >
                        <Editor
                            editorState={this.props.editorState}
                            onChange={this.onChange}
                            plugins={plugins}
                            customStyleMap={colorStyleMap}
                            handleKeyCommand={this.handleKeyCommand}
                            handleReturn={this.handleReturn}
                            handleBeforeInput={this.handleBeforeInput}
                            ref={(element) => {
                                this.editor = element;
                            }}
                        />
                        {/* <AlignmentTool /> */}
                        <Toolbar />
                        <Sidebar />
                        {/* <EmojiSuggestions />
            <MentionSuggestions
                onSearchChange={this.onSearchChange}
                suggestions={this.state.suggestions}
                onClose={() => this.setState({suggestions: fromJS([])})}
            /> */}
                    </div>

                    <div>
                        <h1>client信息</h1>
                        {this.clientData()}
                    </div>
                </div>
            </div>
        );
    }
}
