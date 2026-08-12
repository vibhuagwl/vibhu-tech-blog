'use client';

import Editor,{type OnMount} from '@monaco-editor/react';
import {useEffect,useRef} from 'react';

type Props={
  path:string;
  value:string;
  onChange:(value:string)=>void;
  onSelectionChange?:(selection:string)=>void;
  compileMarkers?:{line:number;column:number;message:string;severity:'Error'|'Warning'}[];
  theme?:'light'|'dark';
};

export default function MonacoJavaEditor({
  path,
  value,
  onChange,
  onSelectionChange,
  compileMarkers=[],
  theme='light',
}:Props){
  const editorRef=useRef<Parameters<OnMount>[0]|null>(null);
  const monacoRef=useRef<Parameters<OnMount>[1]|null>(null);

  const handleMount:OnMount=(editor,monaco)=>{
    editorRef.current=editor;
    monacoRef.current=monaco;

    editor.updateOptions({
      fontSize:14,
      minimap:{enabled:false},
      automaticLayout:true,
      tabSize:4,
      insertSpaces:true,
      autoIndent:'full',
      matchBrackets:'always',
      formatOnPaste:true,
      formatOnType:true,
      quickSuggestions:true,
      suggestOnTriggerCharacters:true,
      wordBasedSuggestions:'currentDocument',
      scrollBeyondLastLine:false,
      renderLineHighlight:'line',
      bracketPairColorization:{enabled:true},
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,()=>{
      editor.getAction('editor.action.formatDocument')?.run();
    });

    editor.onDidChangeCursorSelection(()=>{
      const model=editor.getModel();
      const sel=editor.getSelection();
      if(!model || !sel || !onSelectionChange) return;
      onSelectionChange(model.getValueInRange(sel));
    });
  };

  useEffect(()=>{
    const monaco=monacoRef.current;
    const editor=editorRef.current;
    if(!monaco || !editor) return;
    const model=editor.getModel();
    if(!model) return;
    monaco.editor.setModelMarkers(
      model,
      'javac',
      compileMarkers.map((m)=>({
        startLineNumber:Math.max(1,m.line),
        startColumn:Math.max(1,m.column),
        endLineNumber:Math.max(1,m.line),
        endColumn:Math.max(1,m.column+1),
        message:m.message,
        severity:m.severity==='Warning'?monaco.MarkerSeverity.Warning:monaco.MarkerSeverity.Error,
      })),
    );
  },[compileMarkers,path,value]);

  return (
    <div className="h-full min-h-[320px] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <Editor
        path={path}
        language="java"
        value={value}
        theme={theme==='dark'?'vs-dark':'light'}
        onChange={(v)=>onChange(v ?? '')}
        onMount={handleMount}
        options={{
          ariaLabel:`Java editor ${path}`,
        }}
        loading={<div className="p-4 text-sm text-slate-500">Loading editor…</div>}
      />
    </div>
  );
}
