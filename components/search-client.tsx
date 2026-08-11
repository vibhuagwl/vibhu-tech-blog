'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {hrefForPost} from '@/lib/href';

export default function SearchClient({
  posts,
}:{
  posts:{slug:string;title:string;description:string;category:string;difficulty:string;tags:string[]}[];
}){
  const [q,setQ]=useState('');
  const results=useMemo(()=>{
    const s=q.trim().toLowerCase();
    return s
      ? posts.filter((p)=>`${p.title} ${p.description} ${p.category} ${p.tags.join(' ')}`.toLowerCase().includes(s))
      : posts;
  },[q,posts]);

  return (
    <>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder="Kafka EOS, DLQ, hot partition, rate limiter..."
          className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:border-blue-500"
        />
        <span className="hidden items-center rounded-lg bg-slate-100 px-4 text-xs font-bold text-slate-500 sm:flex">⌘ K</span>
      </div>
      <div className="mt-8 space-y-3">
        {results.map((p)=>(
          <Link href={hrefForPost(p.category,p.slug)} className="card block p-5" key={p.slug}>
            <div className="text-[10px] font-black uppercase text-blue-600">{p.category} · {p.difficulty}</div>
            <h2 className="mt-2 text-xl font-bold">{p.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{p.description}</p>
          </Link>
        ))}
        {results.length===0 && <div className="py-12 text-center text-slate-500">No articles found.</div>}
      </div>
    </>
  );
}
