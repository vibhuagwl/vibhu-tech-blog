'use client';

import {useState} from 'react';
import {Check, Copy} from 'lucide-react';
import Link from 'next/link';
import HighlightedCode from '@/components/highlighted-code';

/** Java locking / concurrency panels with Run link to the compiler */
export default function CodePanel({
  title,
  code,
  tone = 'dark',
  language = 'java',
}: {
  title: string;
  code: string;
  tone?: 'dark' | 'danger' | 'ok';
  language?: string;
}) {
  const [copied, setCopied] = useState(false);
  const border =
    tone === 'danger' ? 'border-rose-800' : tone === 'ok' ? 'border-emerald-800' : 'border-slate-800';
  const head =
    tone === 'danger' ? 'text-rose-300' : tone === 'ok' ? 'text-emerald-300' : 'text-slate-400';

  return (
    <div className={`code-panel overflow-hidden rounded-xl border bg-slate-950 ${border}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-3 py-2">
        <span className={`text-[11px] font-bold uppercase tracking-[.12em] ${head}`}>{title}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code);
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
          <Link
            href="/java-compiler"
            className="rounded-md px-2 py-1 text-xs font-semibold text-teal-300 hover:bg-slate-800"
          >
            Run
          </Link>
        </div>
      </div>
      <HighlightedCode
        code={code}
        language={language}
        title={title}
        className="p-4 text-[.82rem] leading-relaxed"
      />
    </div>
  );
}
