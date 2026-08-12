'use client';

import {useEffect,useMemo,useState} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import {ChevronDown,ChevronRight,Copy,Check,FileCode2,Folder} from 'lucide-react';
import type {DemoSourceFile,DemoTreeNode} from '@/lib/oauth-demo-source';

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

export default function OAuthCodeExplorer({
  files,
  tree,
  defaultPath,
}:{
  files:DemoSourceFile[];
  tree:DemoTreeNode[];
  defaultPath:string;
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
    router.replace(`/oauth-jwt-demo?file=${encodeURIComponent(path)}`,{scroll:false});
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
        <nav aria-label="OAuth demo source tree" className="max-h-[70vh] overflow-auto p-2">
          <Tree nodes={filteredTree} active={active} onSelect={select}/>
        </nav>
      </aside>

      <section className="min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-semibold text-slate-900 dark:text-white">
              {current?.path}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {current?.language} · {current?.lines} lines
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
        <pre className="max-h-[75vh] overflow-auto p-4 text-[12.5px] leading-5">
          <code className="font-mono text-slate-800 dark:text-slate-100 whitespace-pre">
            {current?.content}
          </code>
        </pre>
      </section>
    </div>
  );
}
