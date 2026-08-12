'use client';

import Link from 'next/link';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {Menu,Search,X,ChevronDown} from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';

const TOPICS=[
  {href:'/system-design',label:'System Design',blurb:'Architecture problems & trade-offs'},
  {href:'/distributed-systems',label:'Distributed Systems',blurb:'Locking, messaging, resilience'},
  {href:'/design-patterns',label:'Design Patterns',blurb:'23 GoF patterns · source · revision · mock interview'},
  {href:'/java-compiler',label:'Java Compiler',blurb:'Monaco IDE · local JDK compile & run'},
  {href:'/realtime-issues',label:'Real-Time Issues',blurb:'Production incidents & on-call'},
  {href:'/jpmc-experience',label:'JPMC Experience',blurb:'Hadron · Tax · RSU · Platform'},
  {href:'/spring-security',label:'Spring Security',blurb:'OAuth + JWT, Authn + Authz, and IDAnywhere OIDC'},
  {href:'/kafka-interview',label:'Kafka',blurb:'Knowledge · Experience · Interview'},
  {href:'/redis-interview',label:'Redis Interview',blurb:'Caching, HA, locks'},
  {href:'/complexity',label:'Complexity',blurb:'Big-O from Java code'},
  {href:'/behavioral-interview',label:'Behavioral Interview',blurb:'Staff+ STAR bank'},
  {href:'/leadership-principles',label:'Leadership Principles',blurb:'Amazon LPs with follow-ups'},
  {href:'/fintech',label:'FinTech',blurb:'Payments & correctness'},
  {href:'/behavior',label:'Behavior',blurb:'Ownership & leadership stories'},
];

function linkActive(pathname:string|null,href:string){
  if(!pathname) return false;
  if(href==='/') return pathname==='/';
  return pathname===href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader(){
  const pathname=usePathname();
  const [open,setOpen]=useState(false);
  const [topicsOpen,setTopicsOpen]=useState(false);

  useEffect(()=>{
    setOpen(false);
    setTopicsOpen(false);
  },[pathname]);

  useEffect(()=>{
    document.body.style.overflow=open?'hidden':'';
    return ()=>{document.body.style.overflow='';};
  },[open]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-[color:var(--surface)]/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden dark:border-slate-700 dark:text-slate-200"
            aria-label={open?'Close navigation':'Open navigation'}
            aria-expanded={open}
            onClick={()=>setOpen((v)=>!v)}
          >
            {open?<X size={18}/>:<Menu size={18}/>}
          </button>
          <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Vibhu<span className="text-[color:var(--accent)]">.</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 text-sm font-semibold text-slate-600 md:flex dark:text-slate-300" aria-label="Primary">
          <Link
            href="/learn"
            className={`rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white ${linkActive(pathname,'/learn')?'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white':''}`}
          >
            Learning Paths
          </Link>

          <div className="relative">
            <button
              type="button"
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white ${topicsOpen?'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white':''}`}
              aria-expanded={topicsOpen}
              aria-haspopup="true"
              onClick={()=>setTopicsOpen((v)=>!v)}
            >
              Topics
              <ChevronDown size={15} className={`transition ${topicsOpen?'rotate-180':''}`}/>
            </button>
            {topicsOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-[22rem] rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-950">
                <ul className="grid gap-0.5">
                  {TOPICS.map((t)=>(
                    <li key={t.href}>
                      <Link
                        href={t.href}
                        className="block rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900"
                        onClick={()=>setTopicsOpen(false)}
                      >
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{t.label}</div>
                        <div className="text-xs text-slate-500">{t.blurb}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Link
            href="/java-compiler"
            className={`rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white ${linkActive(pathname,'/java-compiler')?'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white':''}`}
          >
            Java Compiler
          </Link>
          <Link
            href="/interview-questions"
            className={`rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white ${linkActive(pathname,'/interview-questions')?'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white':''}`}
          >
            Interview Practice
          </Link>
          <Link
            href="/about"
            className={`rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white ${linkActive(pathname,'/about')?'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white':''}`}
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Search"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <Search size={18}/>
          </Link>
          <ThemeToggle/>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden dark:border-slate-800 dark:bg-slate-950">
          <nav className="mx-auto max-h-[calc(100vh-4rem)] max-w-[1400px] space-y-1 overflow-y-auto px-5 py-4" aria-label="Mobile">
            <Link href="/learn" className="block rounded-lg px-3 py-3 text-sm font-semibold">Learning Paths</Link>
            <Link href="/java-compiler" className="block rounded-lg px-3 py-3 text-sm font-semibold">Java Compiler</Link>
            <Link href="/interview-questions" className="block rounded-lg px-3 py-3 text-sm font-semibold">Interview Practice</Link>
            <Link href="/search" className="block rounded-lg px-3 py-3 text-sm font-semibold">Search</Link>
            <Link href="/about" className="block rounded-lg px-3 py-3 text-sm font-semibold">About</Link>
            <div className="pt-3 text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">Topics</div>
            {TOPICS.map((t)=>(
              <Link key={t.href} href={t.href} className="block rounded-lg px-3 py-2.5">
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="text-xs text-slate-500">{t.blurb}</div>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
