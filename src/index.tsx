import React, { useState } from 'react';
// import Editor from '@draft-js-plugins/editor';
import Editor  from './Editor';

import { EditorState } from 'draft-js';

// import createButtonPlugin from 'draft-js-buttons-plugin';
import createSidebarPlugin from 'last-draft-js-sidebar-plugin';
import 'last-draft-js-sidebar-plugin/lib/plugin.css'

const sidebarPlugin = createSidebarPlugin();

const { Sidebar } = sidebarPlugin;

// const plugins = [createMarkdownShortcutsPlugin(), sidebarPlugin];

const WhaleEditor = () => {
    const [ editorState, setEditorState ] = useState(EditorState.createEmpty());

    return (
        <div style={{margin: '2.5% auto 0px', height: '95%', width: '95%'}}>
            <Editor
                editorState={editorState}
                onChange={setEditorState}
                // plugins={plugins}
            />
            <Sidebar />
        </div>
    );
};

export default WhaleEditor;