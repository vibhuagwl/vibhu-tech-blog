'use client';

import Mermaid from '@/components/mermaid';
import {MEMORY_DIAGRAMS} from '@/lib/spring-security/memory-diagrams';

export default function MemoryDiagramsSection() {
  return (
    <div className="space-y-8">
      {MEMORY_DIAGRAMS.map((d) => (
        <article
          key={d.id}
          id={`memory-${d.id}`}
          className="scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{d.title}</h3>
            <p className="mt-1 font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">{d.hook}</p>
            {d.anchors && d.anchors.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {d.anchors.map((a) => (
                  <a
                    key={a.id}
                    href={`#${a.id}`}
                    className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:text-emerald-700 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-700"
                  >
                    {a.label} →
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="p-4">
            <Mermaid chart={d.mermaid} />
          </div>
        </article>
      ))}
    </div>
  );
}
