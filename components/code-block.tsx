'use client';

import {useMemo, useState} from 'react';
import {Check, Copy} from 'lucide-react';
import {highlightCode, languageLabel, normalizeLanguage} from '@/lib/syntax-highlight';

function languageFromClassName(className?: string) {
  const m = /language-([a-z0-9_+-]+)/i.exec(className ?? '');
  return m?.[1] ?? '';
}

function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (typeof node === 'object' && node !== null && 'props' in node) {
    return extractText((node as {props?: {children?: React.ReactNode}}).props?.children);
  }
  return '';
}

export default function CodeBlock({
  children,
  className,
  language: languageProp,
}: {
  children?: React.ReactNode;
  className?: string;
  language?: string;
} & React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false);
  const fenceLang = languageProp || languageFromClassName(className);
  const text = useMemo(
    () => (typeof children === 'string' ? children : extractText(children)),
    [children],
  );
  const {html, language} = useMemo(
    () => highlightCode(text, normalizeLanguage(fenceLang) ?? fenceLang),
    [text, fenceLang],
  );

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard may be unavailable */
    }
  }

  return (
    <div className="code-block group relative my-5 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/80 px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-400">
          {languageLabel(language)}
        </span>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="syntax-pre m-0 overflow-x-auto rounded-none border-0 bg-transparent p-4 text-[.85rem] leading-relaxed">
        <code
          className={`hljs language-${language} font-mono syntax-code`}
          dangerouslySetInnerHTML={{__html: html}}
        />
      </pre>
    </div>
  );
}
