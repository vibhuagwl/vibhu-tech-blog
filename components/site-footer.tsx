import Link from 'next/link';
import {Code2,Github,Linkedin} from 'lucide-react';
import {TOPIC_GROUPS} from '@/lib/site-nav';

const START_LINKS=[
  {href:'/learn',label:'Learning paths'},
  {href:'/interview-questions',label:'Interview practice'},
  {href:'/search',label:'Search topics'},
  {href:'/java-compiler',label:'Java Compiler IDE'},
  {href:'/about',label:'About'},
];

export default function SiteFooter(){
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-[1400px] px-5 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_2.4fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-black tracking-wide text-white dark:bg-blue-600">
                VA
              </span>
              <div>
                <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Vibhu Tech Lab</div>
                <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">Senior Interview Hub</div>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
              Structured preparation for senior Java/Spring interviews: system design, production
              performance, Kafka, Redis, and behavioral leadership.
            </p>
            <div className="mt-5 flex gap-2 text-slate-500">
              <a href="https://www.linkedin.com/in/vibhuagwl/" aria-label="LinkedIn" className="rounded-lg p-2 hover:bg-slate-100 hover:text-blue-700 dark:hover:bg-slate-900">
                <Linkedin size={18}/>
              </a>
              <a href="https://github.com/vibhuagwl" aria-label="GitHub" className="rounded-lg p-2 hover:bg-slate-100 hover:text-blue-700 dark:hover:bg-slate-900">
                <Github size={18}/>
              </a>
              <a href="https://leetcode.com/u/vibhuagwl/" aria-label="LeetCode" className="rounded-lg p-2 hover:bg-slate-100 hover:text-blue-700 dark:hover:bg-slate-900">
                <Code2 size={18}/>
              </a>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">Start</div>
              <ul className="mt-3 space-y-2">
                {START_LINKS.map((l)=>(
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm font-medium text-slate-700 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-400">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {TOPIC_GROUPS.map((group)=>(
              <div key={group.id}>
                <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">{group.title}</div>
                <ul className="mt-3 space-y-2">
                  {group.topics.map((t)=>(
                    <li key={t.href}>
                      <Link href={t.href} className="text-sm font-medium text-slate-700 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-400">
                        {t.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
