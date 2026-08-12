'use client';

import {useState} from 'react';
import {Check,Copy} from 'lucide-react';

function languageFromClassName(className?:string){
  const m=/language-([a-z0-9_+-]+)/i.exec(className ?? '');
  return m?.[1] ?? '';
}

export default function CodeBlock({
  children,
  className,
  ...rest
}:{
  children?:React.ReactNode;
  className?:string;
} & React.HTMLAttributes<HTMLPreElement>){
  const [copied,setCopied]=useState(false);
  const language=languageFromClassName(className);

  async function onCopy(){
    const text=typeof children==='string'
      ? children
      : extractText(children);
    try{
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1600);
    }catch{
      /* clipboard may be unavailable */
    }
  }

  return (
    <div className="code-block group relative my-5 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/80 px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-400">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied?'Copied':'Copy code'}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {copied?<Check size={14}/>:<Copy size={14}/>}
          {copied?'Copied':'Copy'}
        </button>
      </div>
      <pre className={`m-0 overflow-x-auto rounded-none border-0 bg-transparent p-4 text-[.85rem] leading-relaxed text-slate-100 ${className ?? ''}`} {...rest}>
        {children}
      </pre>
    </div>
  );
}

function extractText(node:React.ReactNode):string{
  if(node==null || typeof node==='boolean') return '';
  if(typeof node==='string' || typeof node==='number') return String(node);
  if(Array.isArray(node)) return node.map(extractText).join('');
  if(typeof node==='object' && node!==null && 'props' in node){
    return extractText((node as {props?:{children?:React.ReactNode}}).props?.children);
  }
  return '';
}
