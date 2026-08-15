'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {highlightCode, normalizeLanguage} from '@/lib/syntax-highlight';

function isInternalHref(href: unknown) {
  return typeof href === 'string' && href.startsWith('/') && !href.startsWith('//');
}

function FencedCode({className, children}: {className?: string; children?: React.ReactNode}) {
  const raw = String(children ?? '').replace(/\n$/, '');
  const match = /language-([\w+-]+)/.exec(className ?? '');
  const lang = normalizeLanguage(match?.[1] ?? 'plaintext') ?? 'plaintext';
  const html = highlightCode(raw, lang).html;

  return (
    <div className="code-block my-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.08em] text-slate-500 dark:border-slate-700 dark:bg-slate-900">
        <span>{lang}</span>
      </div>
      <pre className="m-0 overflow-x-auto bg-slate-950 p-4 text-[12.5px] leading-5">
        <code
          className={`hljs language-${lang} font-mono whitespace-pre text-slate-100`}
          dangerouslySetInnerHTML={{__html: html}}
        />
      </pre>
    </div>
  );
}

/** Renders markdown as a readable blog-style document (not raw source). */
export default function MarkdownDocView({content}: {content: string}) {
  return (
    <div className="markdown-doc-panel max-h-[75vh] overflow-auto px-5 py-6 sm:px-8">
      <article className="prose-design mx-auto max-w-3xl">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({children}) => (
              <h1 className="mb-4 mt-0 text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
                {children}
              </h1>
            ),
            h2: ({children}) => (
              <h2 className="mb-3 mt-10 scroll-mt-28 border-b border-slate-200 pb-2 text-xl font-bold text-slate-900 dark:border-slate-700 dark:text-white">
                {children}
              </h2>
            ),
            h3: ({children}) => (
              <h3 className="mb-2 mt-8 text-lg font-semibold text-slate-900 dark:text-white">{children}</h3>
            ),
            h4: ({children}) => (
              <h4 className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-slate-100">{children}</h4>
            ),
            p: ({children}) => <p className="mb-4 leading-7 text-slate-700 dark:text-slate-300">{children}</p>,
            ul: ({children}) => (
              <ul className="mb-4 list-disc space-y-1.5 pl-5 text-slate-700 dark:text-slate-300">{children}</ul>
            ),
            ol: ({children}) => (
              <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-slate-700 dark:text-slate-300">{children}</ol>
            ),
            li: ({children}) => <li className="leading-7">{children}</li>,
            blockquote: ({children}) => (
              <blockquote className="my-4 border-l-4 border-slate-400 bg-slate-50 py-3 pl-4 pr-3 text-slate-700 dark:border-slate-500 dark:bg-slate-900/60 dark:text-slate-300">
                {children}
              </blockquote>
            ),
            a: ({href, children}) => {
              if (isInternalHref(href)) {
                return (
                  <Link href={href!} className="font-semibold text-slate-800 underline-offset-2 hover:underline dark:text-blue-400">
                    {children}
                  </Link>
                );
              }
              const external = typeof href === 'string' && /^https?:\/\//i.test(href);
              return (
                <a
                  href={href}
                  className="font-semibold text-slate-800 underline-offset-2 hover:underline dark:text-blue-400"
                  {...(external ? {target: '_blank', rel: 'noopener noreferrer'} : {})}
                >
                  {children}
                </a>
              );
            },
            code: ({className, children, ...props}) => {
              const isBlock = typeof className === 'string' && className.includes('language-');
              if (isBlock) {
                return (
                  <FencedCode className={className} {...props}>
                    {children}
                  </FencedCode>
                );
              }
              return (
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                  {children}
                </code>
              );
            },
            pre: ({children}) => <>{children}</>,
            table: ({children}) => (
              <div className="table-wrap my-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="min-w-full border-collapse text-sm">{children}</table>
              </div>
            ),
            thead: ({children}) => <thead className="bg-slate-50 dark:bg-slate-900">{children}</thead>,
            th: ({children}) => (
              <th className="border-b border-slate-200 px-3 py-2.5 text-left font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                {children}
              </th>
            ),
            td: ({children}) => (
              <td className="border-b border-slate-100 px-3 py-2.5 align-top text-slate-700 dark:border-slate-800 dark:text-slate-300">
                {children}
              </td>
            ),
            hr: () => <hr className="my-8 border-slate-200 dark:border-slate-700" />,
            strong: ({children}) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
