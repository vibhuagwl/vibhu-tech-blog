import Link from 'next/link';
import {Code2,Github,Linkedin} from 'lucide-react';

const COLUMNS=[
  {
    title:'Start',
    links:[
      {href:'/learn',label:'Learning paths'},
      {href:'/search',label:'Search topics'},
      {href:'/interview-questions',label:'Interview practice'},
      {href:'/about',label:'About'},
    ],
  },
  {
    title:'Core topics',
    links:[
      {href:'/system-design',label:'System design'},
      {href:'/distributed-systems',label:'Distributed systems'},
      {href:'/design-patterns',label:'Design Patterns'},
      {href:'/realtime-issues',label:'Real-time issues'},
      {href:'/jpmc-experience',label:'JPMC experience'},
      {href:'/spring-security',label:'Spring Security hub'},
      {href:'/complexity',label:'Complexity'},
    ],
  },
  {
    title:'Interview banks',
    links:[
      {href:'/kafka-interview',label:'Kafka interview'},
      {href:'/redis-interview',label:'Redis interview'},
      {href:'/behavioral-interview',label:'Behavioral interview'},
      {href:'/leadership-principles',label:'Leadership principles'},
    ],
  },
];

export default function SiteFooter(){
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-12 md:grid-cols-[1.2fr_2fr]">
        <div>
          <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Vibhu Tech
          </div>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Senior Engineering Interview Hub — real-world Java, Spring Boot, Kafka, system design,
            and production engineering. Learn it. Remember it. Explain it. Defend it.
          </p>
          <div className="mt-5 flex gap-3 text-slate-500">
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

        <div className="grid gap-8 sm:grid-cols-3">
          {COLUMNS.map((col)=>(
            <div key={col.title}>
              <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">{col.title}</div>
              <ul className="mt-3 space-y-2">
                {col.links.map((l)=>(
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm font-medium text-slate-700 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-400">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
