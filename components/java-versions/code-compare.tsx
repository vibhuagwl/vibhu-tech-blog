'use client';

import {useState} from 'react';
import {Check, Copy} from 'lucide-react';
import type {CodePair} from '@/lib/java-versions/types';
import HighlightedCode from '@/components/highlighted-code';

function CopyBtn({text}: {text: string}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        } catch {
          /* ignore */
        }
      }}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function CodeCompare({pair}: {pair: CodePair}) {
  const [mode, setMode] = useState<'compare' | 'old' | 'new'>('compare');

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="font-semibold text-slate-900 dark:text-white">{pair.title}</div>
        <div className="flex flex-wrap gap-2">
          {(['compare', 'old', 'new'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={[
                'rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
                mode === m
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 dark:bg-slate-950 dark:text-slate-300',
              ].join(' ')}
            >
              {m === 'compare' ? 'Compare' : m === 'old' ? pair.oldLabel : pair.newLabel}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-0 ${mode === 'compare' ? 'md:grid-cols-2' : ''}`}>
        {(mode === 'compare' || mode === 'old') && (
          <div className="border-b border-slate-800 bg-slate-950 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">
              <span>{pair.oldLabel}</span>
              <CopyBtn text={pair.old} />
            </div>
            <HighlightedCode code={pair.old} language="java" className="p-4 text-[.82rem] leading-relaxed" />
          </div>
        )}
        {(mode === 'compare' || mode === 'new') && (
          <div className="bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-emerald-300/80">
              <span>{pair.newLabel}</span>
              <CopyBtn text={pair.new} />
            </div>
            <HighlightedCode code={pair.new} language="java" className="p-4 text-[.82rem] leading-relaxed" />
          </div>
        )}
      </div>

      <div className="grid gap-3 border-t border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 md:grid-cols-2">
        <p>
          <span className="font-semibold text-slate-900 dark:text-white">What changed?</span> {pair.whatChanged}
        </p>
        <p>
          <span className="font-semibold text-slate-900 dark:text-white">Why?</span> {pair.why}
        </p>
        <p>
          <span className="font-semibold text-slate-900 dark:text-white">Workload</span> {pair.workload}
        </p>
        <p>
          <span className="font-semibold text-slate-900 dark:text-white">New bottleneck</span> {pair.newBottleneck}
        </p>
      </div>
    </div>
  );
}
