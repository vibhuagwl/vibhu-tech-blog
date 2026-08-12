'use client';

import {useEffect,useMemo,useState} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import {ChevronDown,ChevronRight,Copy,Check,FileCode2,Folder} from 'lucide-react';
import hljs from 'highlight.js/lib/core';
import java from 'highlight.js/lib/languages/java';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import properties from 'highlight.js/lib/languages/properties';
import type {DemoSourceFile,DemoTreeNode} from '@/lib/oauth-demo-source';

hljs.registerLanguage('java',java);
hljs.registerLanguage('xml',xml);
hljs.registerLanguage('yaml',yaml);
hljs.registerLanguage('sql',sql);
hljs.registerLanguage('bash',bash);
hljs.registerLanguage('json',json);
hljs.registerLanguage('markdown',markdown);
hljs.registerLanguage('properties',properties);
hljs.registerLanguage('html',xml);

const HLJS_LANG:Record<string,string>={
  java:'java',
  xml:'xml',
  yaml:'yaml',
  sql:'sql',
  bash:'bash',
  json:'json',
  markdown:'markdown',
  properties:'properties',
  html:'html',
  text:'plaintext',
};

function highlight(code:string,language:string){
  const lang=HLJS_LANG[language] ?? 'plaintext';
  try{
    if(lang==='plaintext' || !hljs.getLanguage(lang)){
      return hljs.highlight(code,{language:'plaintext'}).value;
    }
    return hljs.highlight(code,{language:lang}).value;
  }catch{
    return code
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;');
  }
}

function Tree({
  nodes,
  active,
  onSelect,
  depth=0,
}:{
  nodes:DemoTreeNode[];
  active:string;
  onSelect:(path:string)=>void;
  depth?:number;
}){
  return (
    <ul className={depth===0?'space-y-0.5':'mt-0.5 space-y-0.5 border-l border-slate-200 pl-2 dark:border-slate-700'}>
      {nodes.map((node)=>(
        <TreeNode key={(node.path ?? node.name)+depth} node={node} active={active} onSelect={onSelect} depth={depth}/>
      ))}
    </ul>
  );
}

function TreeNode({
  node,
  active,
  onSelect,
  depth,
}:{
  node:DemoTreeNode;
  active:string;
  onSelect:(path:string)=>void;
  depth:number;
}){
  const isDir=!!node.children?.length;
  const [open,setOpen]=useState(
    depth<2 || (!!node.folderPath && active.startsWith(`${node.folderPath}/`))
  );

  useEffect(()=>{
    if(isDir && node.folderPath && active.startsWith(`${node.folderPath}/`)) setOpen(true);
  },[active,isDir,node.folderPath]);

  if(isDir){
    return (
      <li>
        <button
          type="button"
          onClick={()=>setOpen((v)=>!v)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
          aria-expanded={open}
        >
          {open?<ChevronDown size={14}/>:<ChevronRight size={14}/>}
          <Folder size={14} className="text-amber-600"/>
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children && (
          <Tree nodes={node.children} active={active} onSelect={onSelect} depth={depth+1}/>
        )}
      </li>
    );
  }

  const selected=node.path===active;
  return (
    <li>
      <button
        type="button"
        onClick={()=>node.path && onSelect(node.path)}
        className={[
          'flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-900',
          selected
            ? 'bg-blue-50 font-semibold text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
            : 'font-medium text-slate-600 dark:text-slate-300',
        ].join(' ')}
        aria-current={selected?'page':undefined}
      >
        <FileCode2 size={14} className="shrink-0 text-slate-400"/>
        <span className="truncate">{node.name}</span>
      </button>
    </li>
  );
}

function CodePanel({content,language}:{content:string;language:string}){
  const html=useMemo(()=>highlight(content,language),[content,language]);
  const lineCount=content.length===0?0:content.split(/\r?\n/).length;
  const lineNos=useMemo(
    ()=>Array.from({length:lineCount},(_,i)=>String(i+1)).join('\n'),
    [lineCount],
  );

  return (
    <div className="code-explorer-panel max-h-[75vh] overflow-auto">
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className="code-explorer-gutter select-none align-top px-3 py-4 text-right font-mono text-[12px] leading-5 text-slate-400">
              <pre className="m-0">{lineNos}</pre>
            </td>
            <td className="align-top py-4 pr-4">
              <pre className="m-0 overflow-visible text-[12.5px] leading-5">
                <code
                  className={`hljs language-${HLJS_LANG[language] ?? 'plaintext'} font-mono whitespace-pre`}
                  dangerouslySetInnerHTML={{__html:html}}
                />
              </pre>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function OAuthCodeExplorer({
  files,
  tree,
  defaultPath,
  routeBase='/oauth-jwt-demo',
  ariaLabel='Demo source tree',
}:{
  files:DemoSourceFile[];
  tree:DemoTreeNode[];
  defaultPath:string;
  routeBase?:string;
  ariaLabel?:string;
}){
  const params=useSearchParams();
  const router=useRouter();
  const requested=params.get('file') ?? defaultPath;
  const active=files.some((f)=>f.path===requested)?requested:defaultPath;
  const current=useMemo(()=>files.find((f)=>f.path===active) ?? files[0], [files,active]);
  const [copied,setCopied]=useState(false);
  const [filter,setFilter]=useState('');

  const filteredTree=useMemo(()=>{
    const q=filter.trim().toLowerCase();
    if(!q) return tree;
    const matched=new Set(files.filter((f)=>f.path.toLowerCase().includes(q)).map((f)=>f.path));
    function prune(nodes:DemoTreeNode[]):DemoTreeNode[]{
      return nodes.flatMap((n)=>{
        if(n.path) return matched.has(n.path)?[n]:[];
        const children=n.children?prune(n.children):[];
        return children.length?[{...n,children}]:[];
      });
    }
    return prune(tree);
  },[tree,files,filter]);

  function select(path:string){
    router.replace(`${routeBase}?file=${encodeURIComponent(path)}`,{scroll:false});
  }

  async function copy(){
    if(!current) return;
    await navigator.clipboard.writeText(current.content);
    setCopied(true);
    window.setTimeout(()=>setCopied(false),1500);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 p-3 dark:border-slate-800">
          <label className="block text-[11px] font-semibold uppercase tracking-[.08em] text-slate-500">
            Files ({files.length})
            <input
              value={filter}
              onChange={(e)=>setFilter(e.target.value)}
              placeholder="Filter path…"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              aria-label="Filter source files"
            />
          </label>
        </div>
        <nav aria-label={ariaLabel} className="max-h-[70vh] overflow-auto p-2">
          <Tree nodes={filteredTree} active={active} onSelect={select}/>
        </nav>
      </aside>

      <section className="min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-semibold text-slate-900 dark:text-white">
              {current?.path}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-semibold uppercase tracking-[.06em] text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {current?.language}
              </span>
              <span>{current?.lines} lines</span>
              {current?.language==='java' && (
                <span className="text-slate-400">Spring keywords · annotations · types colored</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            {copied?<Check size={14}/>:<Copy size={14}/>}
            {copied?'Copied':'Copy'}
          </button>
        </div>
        {current && <CodePanel content={current.content} language={current.language}/>}
      </section>
    </div>
  );
}
