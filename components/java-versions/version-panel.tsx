'use client';

import {useState} from 'react';
import type {VersionSection} from '@/lib/java-versions/types';
import StatusBadge from './status-badge';
import CodeCompare from './code-compare';
import HighlightedCode from '@/components/highlighted-code';

function BulletList({items}:{items:string[]}){
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
      {items.map((i)=><li key={i}>{i}</li>)}
    </ul>
  );
}

export default function VersionPanel({section}:{section:VersionSection}){
  const [openFeature,setOpenFeature]=useState<string | null>(section.majorFeatures[0]?.name ?? null);

  return (
    <section id={section.id} className="scroll-mt-28">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          {section.version}
        </h2>
        {section.lts && <StatusBadge status="LTS"/>}
        <span className="text-sm font-semibold text-slate-500">{section.year}</span>
      </div>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
        {section.overview}
      </p>
      <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-slate-900 dark:text-white">Why it matters: </span>
        {section.whyMatters}
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {(
          [
            ['Language', section.language],
            ['API', section.api],
            ['JVM', section.jvm],
            ['GC', section.gc],
            ['Concurrency', section.concurrency],
            ['Security', section.security],
            ['Performance', section.performance],
            ['Deprecated', section.deprecated],
            ['Removed', section.removed],
            ['Production usage', section.productionUsage],
            ['Migration impact', section.migrationImpact],
          ] as const
        ).map(([title,items])=>(
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-sm font-bold uppercase tracking-[.12em] text-slate-500">{title}</h3>
            <BulletList items={[...items]}/>
          </div>
        ))}
      </div>

      <h3 className="mt-10 text-xl font-bold text-slate-900 dark:text-white">Major features</h3>
      <div className="mt-4 space-y-3">
        {section.majorFeatures.map((f)=>{
          const open=openFeature===f.name;
          return (
            <div key={f.name} className="rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={()=>setOpenFeature(open?null:f.name)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">{f.name}</span>
                  {f.status && <StatusBadge status={f.status}/>}
                  {f.jep && <span className="text-xs font-semibold text-slate-500">{f.jep}</span>}
                </div>
                <span className="text-slate-400">{open?'−':'+'}</span>
              </button>
              {open && (
                <div className="space-y-3 border-t border-slate-200 px-5 py-4 text-sm leading-7 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  <p><span className="font-semibold text-slate-900 dark:text-white">Problem: </span>{f.problem}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Before: </span>{f.before}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Solution: </span>{f.solution}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Production: </span>{f.production}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Interview: </span>{f.interview}</p>
                  {f.codeBefore && (
                    <div className="overflow-hidden rounded-xl bg-slate-950">
                      <div className="border-b border-slate-800 px-3 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">Before</div>
                      <HighlightedCode code={f.codeBefore} language="java" className="p-4 text-[.82rem]"/>
                    </div>
                  )}
                  {f.code && (
                    <div className="overflow-hidden rounded-xl bg-slate-950">
                      <div className="border-b border-slate-800 px-3 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-emerald-300/80">Modern</div>
                      <HighlightedCode code={f.code} language="java" className="p-4 text-[.82rem]"/>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {section.seniorTopics && section.seniorTopics.length>0 && (
        <>
          <h3 className="mt-10 text-xl font-bold text-slate-900 dark:text-white">Senior-level topics</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {section.seniorTopics.map((t)=>(
              <div key={t.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                <h4 className="font-bold text-slate-900 dark:text-white">{t.title}</h4>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{t.body}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {section.codePairs.length>0 && (
        <div className="mt-10 space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Before vs After</h3>
          {section.codePairs.map((p)=><CodeCompare key={p.title} pair={p}/>)}
        </div>
      )}

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">Interview questions</h3>
          <BulletList items={section.interviewQuestions}/>
        </div>
        <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">Architect questions</h3>
          <BulletList items={section.architectQuestions}/>
        </div>
        <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">Common mistakes</h3>
          <BulletList items={section.commonMistakes}/>
        </div>
      </div>
    </section>
  );
}
