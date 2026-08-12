'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useRouter,useSearchParams} from 'next/navigation';
import {hrefForPost} from '@/lib/href';
import {KNOWLEDGE_TYPE_FILTERS} from '@/lib/technology-hub';

const LEVELS=['Beginner','Intermediate','Senior','Staff','Principal'] as const;

const TECH_HINTS=[
  {label:'Kafka',match:'kafka'},
  {label:'JPMC',match:'jpmc'},
  {label:'Redis',match:'redis'},
  {label:'System Design',match:'system design'},
  {label:'Real-Time Issues',match:'real-time'},
] as const;

export default function SearchClient({
  posts,
}:{
  posts:{slug:string;title:string;description:string;category:string;difficulty:string;tags:string[]}[];
}){
  const params=useSearchParams();
  const router=useRouter();
  const initial=params.get('q') ?? '';
  const [q,setQ]=useState(initial);
  const [type,setType]=useState(params.get('type') ?? '');
  const [level,setLevel]=useState(params.get('level') ?? '');
  const [tech,setTech]=useState(params.get('tech') ?? '');

  useEffect(()=>{
    setQ(params.get('q') ?? '');
    setType(params.get('type') ?? '');
    setLevel(params.get('level') ?? '');
    setTech(params.get('tech') ?? '');
  },[params]);

  useEffect(()=>{
    const handle=(e:KeyboardEvent)=>{
      if((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='k'){
        e.preventDefault();
        const el=document.getElementById('site-search-input') as HTMLInputElement|null;
        el?.focus();
      }
    };
    window.addEventListener('keydown',handle);
    return ()=>window.removeEventListener('keydown',handle);
  },[]);

  function syncUrl(next:{q?:string;type?:string;level?:string;tech?:string}){
    const query=new URLSearchParams();
    const qq=(next.q ?? q).trim();
    const tt=next.type ?? type;
    const ll=next.level ?? level;
    const th=next.tech ?? tech;
    if(qq) query.set('q',qq);
    if(tt) query.set('type',tt);
    if(ll) query.set('level',ll);
    if(th) query.set('tech',th);
    const qs=query.toString();
    router.replace(`/search${qs?`?${qs}`:''}`,{scroll:false});
  }

  const results=useMemo(()=>{
    const s=q.trim().toLowerCase();
    let list=posts;
    if(tech){
      const t=tech.toLowerCase();
      list=list.filter((p)=>
        p.category.toLowerCase().includes(t)
        || p.tags.some((tag)=>tag.toLowerCase().includes(t))
        || p.title.toLowerCase().includes(t)
      );
    }
    if(type){
      list=list.filter((p)=>p.tags.some((tag)=>tag.toLowerCase()===type.toLowerCase())
        || p.title.toLowerCase().includes(type.toLowerCase()));
    }
    if(level){
      list=list.filter((p)=>p.difficulty.toLowerCase()===level.toLowerCase());
    }
    if(s){
      list=list.filter((p)=>`${p.title} ${p.description} ${p.category} ${p.tags.join(' ')}`.toLowerCase().includes(s));
    } else if(!type && !level && !tech){
      list=list.slice(0,24);
    }
    return list;
  },[q,posts,type,level,tech]);

  function onChange(value:string){
    setQ(value);
    syncUrl({q:value});
  }

  return (
    <>
      <div className="flex gap-2">
        <input
          id="site-search-input"
          value={q}
          onChange={(e)=>onChange(e.target.value)}
          placeholder="JPMC Cashlines, Kafka lag, consumer groups, system design..."
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          aria-label="Search articles"
        />
        <span className="hidden items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-500 sm:flex dark:border-slate-700 dark:bg-slate-900">
          ⌘ K
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3" role="group" aria-label="Search filters">
        <label className="block text-xs font-semibold uppercase tracking-[.08em] text-slate-500">
          Technology
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            value={tech}
            onChange={(e)=>{setTech(e.target.value);syncUrl({tech:e.target.value});}}
            aria-label="Filter by technology"
          >
            <option value="">Any</option>
            {TECH_HINTS.map((t)=>(
              <option key={t.label} value={t.match}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[.08em] text-slate-500">
          Type
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            value={type}
            onChange={(e)=>{setType(e.target.value);syncUrl({type:e.target.value});}}
            aria-label="Filter by knowledge type"
          >
            <option value="">Any</option>
            {KNOWLEDGE_TYPE_FILTERS.map((t)=>(
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[.08em] text-slate-500">
          Level
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            value={level}
            onChange={(e)=>{setLevel(e.target.value);syncUrl({level:e.target.value});}}
            aria-label="Filter by level"
          >
            <option value="">Any</option>
            {LEVELS.map((l)=>(
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-3 text-sm text-slate-500">
        {q.trim() || type || level || tech
          ? `${results.length} result${results.length===1?'':'s'}`
          : `Showing ${results.length} recent guides — type to filter or use Technology / Type / Level.`}
      </p>
      <div className="mt-6 space-y-3">
        {results.map((p)=>(
          <Link href={hrefForPost(p.category,p.slug)} className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 dark:border-slate-800 dark:bg-slate-950" key={p.slug}>
            <div className="text-[10px] font-semibold uppercase tracking-[.12em] text-blue-700 dark:text-blue-400">
              {p.category} · {p.difficulty}
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{p.title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{p.description}</p>
            {p.tags.length>0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.tags.slice(0,5).map((tag)=>(
                  <span key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
        {results.length===0 && (
          <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500 dark:border-slate-700">
            No articles matched. Try Technology=Kafka and Type=Experience, or search for consumer lag.
          </div>
        )}
      </div>
    </>
  );
}
