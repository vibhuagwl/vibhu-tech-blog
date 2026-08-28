'use client';

import {useMemo, useState} from 'react';
import Mermaid from '@/components/mermaid';
import {AWS_MEMORY_GROUPS, MEMORY_DIAGRAMS} from '@/lib/aws-interview/memory-diagrams';

export default function AwsMemoryDiagramsSection() {
  const [activeGroup, setActiveGroup] = useState<string>('All');

  const grouped = useMemo(() => {
    const map = new Map<string, typeof MEMORY_DIAGRAMS>();
    for (const g of AWS_MEMORY_GROUPS) {
      map.set(g, MEMORY_DIAGRAMS.filter((d) => d.group === g));
    }
    return map;
  }, []);

  const visible =
    activeGroup === 'All' ? MEMORY_DIAGRAMS : MEMORY_DIAGRAMS.filter((d) => d.group === activeGroup);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {All: MEMORY_DIAGRAMS.length};
    for (const g of AWS_MEMORY_GROUPS) {
      counts[g] = MEMORY_DIAGRAMS.filter((d) => d.group === g).length;
    }
    return counts;
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-900 dark:bg-orange-950/30">
        <p className="text-sm font-semibold text-orange-950 dark:text-orange-100">
          {MEMORY_DIAGRAMS.length} diagrams · {AWS_MEMORY_GROUPS.length} groups · every AWS interview topic visualized
        </p>
        <p className="mt-1 text-sm text-orange-900 dark:text-orange-200">
          Whiteboard these from memory — each hook is one line interview recall. Links jump to full CLI/code topics.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['All', ...AWS_MEMORY_GROUPS].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setActiveGroup(g)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
              activeGroup === g
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {g} ({groupCounts[g] ?? 0})
          </button>
        ))}
      </div>

      {activeGroup === 'All' ? (
        AWS_MEMORY_GROUPS.map((group) => {
          const items = grouped.get(group) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={group} className="space-y-4">
              <h3 className="border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-[.12em] text-slate-500 dark:border-slate-800">
                {group} · {items.length} diagrams
              </h3>
              <div className="space-y-6">
                {items.map((d) => (
                  <DiagramCard key={d.id} d={d} />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="space-y-6">
          {visible.map((d) => (
            <DiagramCard key={d.id} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function DiagramCard({d}: {d: (typeof MEMORY_DIAGRAMS)[number]}) {
  return (
    <article
      id={`memory-${d.id}`}
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
        <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-800 dark:bg-orange-950 dark:text-orange-200">
          {d.group}
        </span>
        <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{d.title}</h3>
        <p className="mt-1 font-mono text-sm font-semibold text-orange-700 dark:text-orange-400">{d.hook}</p>
        {d.anchors && d.anchors.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {d.anchors.map((a) => (
              <a
                key={a.id}
                href={`#${a.id}`}
                className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:text-orange-700 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-700"
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
  );
}
