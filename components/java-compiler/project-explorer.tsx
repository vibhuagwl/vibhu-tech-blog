'use client';

import {ChevronDown,ChevronRight,FileCode2,Folder} from 'lucide-react';
import {useState} from 'react';
import {buildTree,fileNameFromPath} from '@/lib/java-compiler-project';

type Props={
  paths:string[];
  activePath:string;
  onSelect:(path:string)=>void;
  onNewFile:()=>void;
};

function TreeNodes({
  nodes,
  activePath,
  onSelect,
  depth=0,
}:{
  nodes:ReturnType<typeof buildTree>;
  activePath:string;
  onSelect:(path:string)=>void;
  depth?:number;
}){
  return (
    <ul className={depth===0?'space-y-0.5':'mt-0.5 space-y-0.5 border-l border-slate-200 pl-2 dark:border-slate-700'}>
      {nodes.map((node)=>(
        <TreeNode key={(node.path || node.name)+depth} node={node} activePath={activePath} onSelect={onSelect} depth={depth}/>
      ))}
    </ul>
  );
}

function TreeNode({
  node,
  activePath,
  onSelect,
  depth,
}:{
  node:ReturnType<typeof buildTree>[number];
  activePath:string;
  onSelect:(path:string)=>void;
  depth:number;
}){
  const isDir=!!node.children;
  const [open,setOpen]=useState(depth<3);

  if(isDir){
    return (
      <li>
        <button
          type="button"
          onClick={()=>setOpen((v)=>!v)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          {open?<ChevronDown size={14}/>:<ChevronRight size={14}/>}
          <Folder size={14} className="text-amber-600"/>
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children && (
          <TreeNodes nodes={node.children} activePath={activePath} onSelect={onSelect} depth={depth+1}/>
        )}
      </li>
    );
  }

  const selected=node.path===activePath;
  return (
    <li>
      <button
        type="button"
        onClick={()=>node.path && onSelect(node.path)}
        className={[
          'flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-900',
          selected
            ? 'bg-blue-50 font-semibold text-blue-800 dark:bg-blue-950/50 dark:text-slate-300'
            : 'font-medium text-slate-600 dark:text-slate-300',
        ].join(' ')}
      >
        <FileCode2 size={14} className="shrink-0 text-slate-400"/>
        <span className="truncate">{fileNameFromPath(node.path || node.name)}</span>
      </button>
    </li>
  );
}

export default function ProjectExplorer({paths,activePath,onSelect,onNewFile}:Props){
  const tree=buildTree(paths);
  return (
    <aside className="flex h-full flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
        <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">Project</div>
        <button
          type="button"
          onClick={onNewFile}
          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          New file
        </button>
      </div>
      <div className="text-[11px] px-3 py-2 font-medium text-slate-400">src</div>
      <nav className="min-h-0 flex-1 overflow-auto px-2 pb-3" aria-label="Java project files">
        <TreeNodes nodes={tree} activePath={activePath} onSelect={onSelect}/>
      </nav>
    </aside>
  );
}
