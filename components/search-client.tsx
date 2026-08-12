'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useRouter,useSearchParams} from 'next/navigation';
import {hrefForPost} from '@/lib/href';

export default function SearchClient({
  posts,
}:{
  posts:{slug:string;title:string;description:string;category:string;difficulty:string;tags:string[]}[];
}){
  const params=useSearchParams();
  const router=useRouter();
  const initial=params.get('q') ?? '';
  const [q,setQ]=useState(initial);

  useEffect(()=>{
    setQ(params.get('q') ?? '');
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

  const results=useMemo(()=>{
    const s=q.trim().toLowerCase();
    return s
      ? posts.filter((p)=>`${p.title} ${p.description} ${p.category} ${p.tags.join(' ')}`.toLowerCase().includes(s))
      : posts.slice(0,24);
  },[q,posts]);

  function onChange(value:string){
    setQ(value);
    const next=value.trim()?`?q=${encodeURIComponent(value.trim())}`:'';
    router.replace(`/search${next}`,{scroll:false});
  }

  return (
    <>
      <div className="flex gap-2">
        <input
          id="site-search-input"
          value={q}
          onChange={(e)=>onChange(e.target.value)}
          placeholder="Kafka, Java 17, stuck thread, circuit breaker, system design..."
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          aria-label="Search articles"
        />
        <span className="hidden items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-500 sm:flex dark:border-slate-700 dark:bg-slate-900">
          ⌘ K
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-500">
        {q.trim()?`${results.length} result${results.length===1?'':'s'}`:`Showing ${results.length} recent guides — type to filter.`}
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
            No articles matched “{q}”. Try Kafka, Redis, stuck thread, or Java migration.
          </div>
        )}
      </div>
    </>
  );
}
