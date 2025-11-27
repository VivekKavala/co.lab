import React, { useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../store/store';
import { setCode, setIsConnected } from '../store/roomSlice';
import axios from 'axios';

interface CodeEditorProps {
  roomId: string;
}

import Header from './Header';

const CodeEditor: React.FC<CodeEditorProps> = ({ roomId }) => {
  const dispatch = useDispatch();
  const code = useSelector((state: RootState) => state.room.code);
  const isConnected = useSelector((state: RootState) => state.room.isConnected);
  
  const socketRef = useRef<WebSocket | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  useEffect(() => {
    // Connect to WebSocket
    const API_URL = import.meta.env.VITE_API_URL;
    const WS_URL = API_URL.replace(/^http/, 'ws');
    const ws = new WebSocket(`${WS_URL}/ws/${roomId}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      dispatch(setIsConnected(true));
    };

    ws.onmessage = (event) => {
      console.log("Received WS message:", event.data);
      const data = JSON.parse(event.data);
      if (data.type === 'init' || data.type === 'code_update') {
        dispatch(setCode(data.code));
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      dispatch(setIsConnected(false));
    };

    return () => {
      ws.close();
    };
  }, [roomId, dispatch]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      dispatch(setCode(value));
      // Send update to server
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'code_update', code: value }));
      }
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register Inline Completions Provider
    monaco.languages.registerInlineCompletionsProvider('python', {
      provideInlineCompletions: async (model: any, position: any, context: any, token: any) => {
        // Debounce: Wait 600ms
        await new Promise(resolve => setTimeout(resolve, 600));

        if (token.isCancellationRequested) {
          return { items: [] };
        }

        const fullCode = model.getValue();
        const cursorOffset = model.getOffsetAt(position);

        try {
          const response = await axios.post(`${import.meta.env.VITE_API_URL}/autocomplete`, {
            code: fullCode,
            cursorPosition: cursorOffset,
            language: 'python'
          });

          const suggestion = response.data.suggestion;
          if (suggestion) {
            return {
              items: [{
                insertText: suggestion,
                range: new monaco.Range(
                  position.lineNumber,
                  position.column,
                  position.lineNumber,
                  position.column
                )
              }]
            };
          }
        } catch (error) {
          console.error("Autocomplete error", error);
        }

        return { items: [] };
      },
      freeInlineCompletions: () => {}
    });
  };

  const copyRoomUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert("Room URL copied to clipboard!");
    });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ 
        padding: '10px 20px', 
        background: '#2d2d2d', 
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            background: isConnected ? '#4caf50' : '#f44336',
            display: 'inline-block'
          }}></span>
          <span style={{ color: '#ccc', fontSize: '0.9rem' }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
           <span style={{ color: '#888', fontSize: '0.9rem' }}>Room ID: {roomId}</span>
           <button onClick={copyRoomUrl} className="btn-primary" style={{ padding: '5px 15px', fontSize: '0.9rem' }}>
             Share Room
           </button>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
