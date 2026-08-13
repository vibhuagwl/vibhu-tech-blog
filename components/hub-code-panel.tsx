'use client';

import {useState} from 'react';
import HighlightedCode from '@/components/highlighted-code';

export default function CodePanel({
  title,
  code,
  tone = 'neutral',
  language,
}: {
  title: string;
  code: string;
  tone?: 'neutral' | 'ok' | 'bad';
  language?: string;
}) {
  const [copied, setCopied] = useState(false);
  const border =
    tone === 'ok'
      ? 'border-emerald-200 dark:border-emerald-900'
      : tone === 'bad'
        ? 'border-rose-200 dark:border-rose-900'
        : 'border-slate-200 dark:border-slate-800';

  return (
    <div className={`code-panel overflow-hidden rounded-2xl border ${border} bg-slate-950`}>
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-400">{title}</span>
        <button
          type="button"
          className="text-[11px] font-semibold text-slate-400 hover:text-white"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <HighlightedCode
        code={code}
        language={language}
        title={title}
        className="p-4 text-[12px] leading-6"
      />
    </div>
  );
}
