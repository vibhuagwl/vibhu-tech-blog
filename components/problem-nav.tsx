'use client';

import Link from 'next/link';
import {useMemo,useState} from 'react';
import {usePathname} from 'next/navigation';
import {BookOpen,ChevronDown,Layers3,PanelLeft,Search} from 'lucide-react';

export type NavPost={
  slug:string;
  title:string;
  category:string;
  difficulty:string;
  readingTime:string;
};

const GROUP_ORDER=[
  'Fundamentals',
  'System Design',
  'Infrastructure',
  'Caching',
  'Messaging',
  'Distributed Systems',
  'FinTech',
];

const difficultyClass=(d:string)=>{
  const v=d.toLowerCase();
  if(v==='beginner') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
  if(v==='intermediate') return 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300';
  if(v==='advanced') return 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300';
  if(v==='staff') return 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
};

function groupPosts(posts:NavPost[]){
  const map=new Map<string,NavPost[]>();
  for(const p of posts){
    const key=p.category||'Other';
    if(!map.has(key)) map.set(key,[]);
    map.get(key)!.push(p);
  }
  for(const list of map.values()){
    list.sort((a,b)=>a.title.localeCompare(b.title));
  }
  const keys=[
    ...GROUP_ORDER.filter((g)=>map.has(g)),
    ...[...map.keys()].filter((g)=>!GROUP_ORDER.includes(g)).sort(),
  ];
  return keys.map((category)=>({category,posts:map.get(category)!}));
}

export default function ProblemNav({posts}:{posts:NavPost[]}){
  const pathname=usePathname();
  const [query,setQuery]=useState('');
  const [open,setOpen]=useState(false);

  const groups=useMemo(()=>{
    const q=query.trim().toLowerCase();
    const filtered=q
      ? posts.filter((p)=>
          p.title.toLowerCase().includes(q)
          || p.category.toLowerCase().includes(q)
          || p.difficulty.toLowerCase().includes(q)
        )
      : posts;
    return groupPosts(filtered);
  },[posts,query]);

  const activeSlug=pathname?.startsWith('/system-design/')
    ? pathname.split('/')[2]
    : '';

  const navBody=(
    <>
      <div className="border-b border-slate-200/80 px-4 pb-4 pt-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-blue-600">
            <Layers3 size={18}/>
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[.14em] text-blue-600">Catalog</div>
            <div className="text-sm font-black tracking-tight text-slate-900 dark:text-white">System Design</div>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          {posts.length} guides · click any problem to open it
        </p>
        <label className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
          <Search size={14} className="shrink-0 text-slate-400"/>
          <input
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
            placeholder="Filter problems…"
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
        </label>
      </div>

      <div className="max-h-[min(70vh,720px)] space-y-5 overflow-y-auto px-3 py-4 lg:max-h-[calc(100vh-11rem)]">
        {groups.length===0 && (
          <div className="px-2 text-sm text-slate-500">No problems match “{query}”.</div>
        )}
        {groups.map(({category,posts:items})=>(
          <section key={category}>
            <div className="mb-2 flex items-center gap-2 px-2">
              <BookOpen size={13} className="text-slate-400"/>
              <h2 className="text-[11px] font-black uppercase tracking-[.14em] text-slate-500">{category}</h2>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800">{items.length}</span>
            </div>
            <ul className="space-y-1">
              {items.map((p)=>{
                const active=p.slug===activeSlug;
                return (
                  <li key={p.slug}>
                    <Link
                      href={`/system-design/${p.slug}`}
                      onClick={()=>setOpen(false)}
                      className={[
                        'group block rounded-xl border px-3 py-2.5 transition',
                        active
                          ? 'border-blue-200 bg-blue-50 shadow-sm dark:border-blue-900 dark:bg-blue-950/60'
                          : 'border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm dark:hover:border-slate-700 dark:hover:bg-slate-900',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={`text-sm font-semibold leading-5 ${active?'text-blue-700 dark:text-blue-300':'text-slate-800 dark:text-slate-100'}`}>
                          {p.title}
                        </div>
                        {active && <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-600"/>}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${difficultyClass(p.difficulty)}`}>
                          {p.difficulty}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">{p.readingTime}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={()=>setOpen((v)=>!v)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm dark:border-slate-800 dark:bg-slate-950"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <PanelLeft size={16} className="text-blue-600"/>
            Browse all problems
          </span>
          <ChevronDown size={16} className={`text-slate-400 transition ${open?'rotate-180':''}`}/>
        </button>
        {open && (
          <nav className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950">
            {navBody}
          </nav>
        )}
      </div>

      {/* Desktop sticky sidebar */}
      <aside className="hidden lg:block">
        <nav className="problem-nav sticky top-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,.06)] dark:border-slate-800 dark:bg-slate-950">
          {navBody}
        </nav>
      </aside>
    </>
  );
}
