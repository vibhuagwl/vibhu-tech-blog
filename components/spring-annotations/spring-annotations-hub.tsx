'use client';

import {useState} from 'react';
import Link from 'next/link';
import {MEMORY_SENTENCE, SA_TOC, SA_TOC_THEORY, VERSION_NOTE} from '@/lib/spring-annotations/toc';
import {STEREOTYPE} from '@/lib/spring-annotations/parts-stereotype';
import {AOP_TX} from '@/lib/spring-annotations/parts-aop-tx';
import {BOOT} from '@/lib/spring-annotations/parts-boot';
import {PROXY_MATRIX, PROCESSOR_MAP} from '@/lib/spring-annotations/parts-proxy-matrix';
import {CHEAT_ROWS, MEMORY_RULES, SPOKEN} from '@/lib/spring-annotations/interview';
import {
  INVENTORY_DISCLAIMER,
  INVENTORY_STATS,
  SCOPE_NOTE,
  unifyInventory,
} from '@/lib/spring-annotations/inventory';
import {
  ARCHITECT_CHEAT,
  ARCHITECT_PICKS,
  MEMORY_STRIP,
  SA_STORIES,
} from '@/lib/spring-annotations/stories';
import type {AnnotationCard} from '@/lib/spring-annotations/types';
import StickyToc from './sticky-toc';
import CodePanel from './code-panel';
import StoryWalkthrough from './story-walkthrough';

const UNIFIED = unifyInventory();
const INVENTORY_CATEGORIES = [...new Set(UNIFIED.map((r) => r.category))].sort();
const THEORY_CARDS: AnnotationCard[] = [...STEREOTYPE, ...AOP_TX, ...BOOT].slice(0, 24);

function Section({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{title}</h2>
      {lead && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MiniTable({headers, rows}: {headers: string[]; rows: string[][]}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-slate-200 dark:border-slate-800">
              {r.map((c, i) => (
                <td
                  key={i}
                  className={`px-2 py-2 align-top ${i === 0 ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SlimCard({c}: {c: AnnotationCard}) {
  return (
    <details className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
      <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">
        {c.annotation} <span className="font-normal text-slate-500">— {c.memory}</span>
      </summary>
      <div className="mt-2 space-y-2 text-slate-600 dark:text-slate-300">
        <p>
          <strong>Say:</strong> {c.answer60s}
        </p>
        <p className="text-rose-700 dark:text-rose-300">
          <strong>Trap:</strong> {c.traps[0] ?? c.mistakes[0]}
        </p>
      </div>
    </details>
  );
}

function PickDrill() {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const q = ARCHITECT_PICKS[idx];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
        Debug {idx + 1} / {ARCHITECT_PICKS.length}
      </p>
      <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{q.symptom}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Reveal
        </button>
        <button
          type="button"
          onClick={() => {
            setIdx((i) => (i + 1) % ARCHITECT_PICKS.length);
            setOpen(false);
          }}
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold dark:bg-slate-900"
        >
          Next
        </button>
      </div>
      {open && (
        <div className="mt-4 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
          <p>
            <strong>Cause:</strong> {q.answer}
          </p>
          <p>
            <strong>Say:</strong> {q.say}
          </p>
          <p>
            <strong>Fix:</strong> {q.fix}
          </p>
        </div>
      )}
    </div>
  );
}

function InventoryBrowser() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const filtered = UNIFIED.filter((r) => {
    if (cat !== 'all' && r.category !== cat) return false;
    if (!q.trim()) return true;
    const s = q.trim().toLowerCase();
    return (
      r.annotation.toLowerCase().includes(s) ||
      r.processor.toLowerCase().includes(s) ||
      r.memory.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-3">
      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        {INVENTORY_DISCLAIMER}
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-300">{SCOPE_NOTE}</p>
      <p className="text-xs text-slate-500">
        {INVENTORY_STATS.uniqueNames} annotations indexed — search only when you need a name, do not memorize the list.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter annotation / processor…"
          className="min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="all">All categories</option>
          {INVENTORY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <MiniTable
        headers={['Annotation', 'Processor', 'Memory']}
        rows={filtered.slice(0, 40).map((r) => [r.annotation, r.processor, r.memory])}
      />
      <p className="text-xs text-slate-500">Showing {Math.min(40, filtered.length)} of {filtered.length}</p>
    </div>
  );
}

export default function SpringAnnotationsHub() {
  const [view, setView] = useState<'kit' | 'theory'>('kit');
  const toc = view === 'kit' ? SA_TOC : [...SA_TOC, ...SA_TOC_THEORY];

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Architect interview kit · Pipeline · Proxy · Debug
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Spring annotations you can draw — not 200 names to memorize
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Interviews reward the <strong>pipeline</strong> and the <strong>proxy trap</strong>. Inventory encyclopedia
          stays optional.
        </p>
        <p className="mt-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ['kit', 'Interview kit (default)'],
              ['theory', 'Encyclopedia (optional)'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                view === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {VERSION_NOTE}{' '}
          <Link href="/spring-security" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Security
          </Link>
          {' · '}
          <Link href="/microservice-communication" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            How services talk
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[220px_minmax(0,1fr)]">
        <StickyToc items={toc} />
        <div className="min-w-0 space-y-14">
          <Section
            id="decide"
            title="01. 30-second mental model"
            lead="Say this before naming any annotation."
          >
            <pre className="overflow-x-auto rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">{`SCAN → REGISTER → INJECT → PROXY → EXECUTE

External caller → Proxy → @Transactional / @Async / @Cacheable
this.method()   → raw target → advice SKIPPED`}</pre>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {MEMORY_STRIP.slice(0, 4).map((m) => (
                <div key={m.title} className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                  <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">{m.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{m.line}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="stories"
            title="02. Draw these stories"
            lead={`${SA_STORIES.length} scenes — self-invocation, @Configuration, @Async, Boot.`}
          >
            <StoryWalkthrough />
          </Section>

          <Section id="spoken" title="03. Say this out loud">
            <div className="space-y-4">
              {(
                [
                  ['60 seconds', SPOKEN.sixtySec],
                  ['2 minutes', SPOKEN.twoMin],
                  ['Staff close', SPOKEN.staff],
                ] as const
              ).map(([label, text]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">{label}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <MiniTable
                headers={['Memory', 'Rule']}
                rows={MEMORY_RULES.slice(0, 10).map((m) => [m.title, m.rule])}
              />
            </div>
          </Section>

          <Section id="picks" title="04. Debug picks" lead="Guess the cause — then rehearse the one sentence.">
            <PickDrill />
          </Section>

          <Section id="cheat" title="05. One-page cheat">
            <CodePanel title="Architect cheat sheet" code={ARCHITECT_CHEAT} />
            <div className="mt-4">
              <MiniTable
                headers={['Annotation', 'Processor', 'Proxy?', 'Trap']}
                rows={CHEAT_ROWS.slice(0, 14).map((r) => [r.annotation, r.processor, r.proxy, r.trap])}
              />
            </div>
          </Section>

          <Section id="drill" title="06. Memory strip">
            <div className="grid gap-2 sm:grid-cols-2">
              {MEMORY_STRIP.map((m) => (
                <div key={m.title} className="rounded-xl border border-slate-200 px-3 py-3 dark:border-slate-800">
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">{m.title}</p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{m.line}</p>
                </div>
              ))}
            </div>
          </Section>

          {view === 'kit' && (
            <Section
              id="theory-hint"
              title="Need an annotation name?"
              lead="Only open the encyclopedia when you must look something up — do not study it cover to cover."
            >
              <button
                type="button"
                onClick={() => setView('theory')}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Open encyclopedia
              </button>
            </Section>
          )}

          {view === 'theory' && (
            <>
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                Optional depth. Prefer the Interview kit for recall. Cards below are trimmed to say + trap.
              </p>

              <Section id="proxy" title="Proxy matrix" lead="Does it create a proxy?">
                <MiniTable
                  headers={['Annotation', 'Proxy?', 'Why', 'Trap']}
                  rows={PROXY_MATRIX.slice(0, 20).map((r) => [r.annotation, r.proxy, r.why, r.exception])}
                />
              </Section>

              <Section id="inventory" title="Inventory search">
                <InventoryBrowser />
              </Section>

              <Section id="stereotype" title="Core cards (stereotype · TX · Boot)">
                <div className="space-y-2">
                  {THEORY_CARDS.map((c) => (
                    <SlimCard key={c.id} c={c} />
                  ))}
                </div>
              </Section>

              <Section id="aop-tx" title="Processor cheat (top rows)">
                <MiniTable
                  headers={['Annotation', 'Processor', 'Proxy?', 'Phase', 'Trap']}
                  rows={PROCESSOR_MAP.slice(0, 25).map((r) => [
                    r.annotation,
                    r.processor,
                    r.proxy,
                    r.phase,
                    r.trap,
                  ])}
                />
              </Section>

              <Section id="boot" title="Boot spoken (deep)">
                <div className="space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                  <p>
                    <strong>60s:</strong> {SPOKEN.bootAutoConfig.s60}
                  </p>
                  <p>
                    <strong>TX 60s:</strong> {SPOKEN.transactional.s60}
                  </p>
                  <p>
                    <strong>Proxy 60s:</strong> {SPOKEN.proxy.s60}
                  </p>
                </div>
              </Section>

              <Section id="web" title="Web note">
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  MVC mappings and validation still ride the same rule: container registers handlers at startup;
                  method security / TX on web layer is usually the wrong boundary — keep @Transactional on services
                  and hit them through the proxy.
                </p>
              </Section>

              <Section id="checklist" title="Recall checklist (short)">
                <ul className="grid gap-1 sm:grid-cols-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
                  {[
                    'Pipeline: SCAN REGISTER INJECT PROXY EXECUTE',
                    'Self-invocation skips proxy',
                    '@Transactional = interceptor on proxy',
                    '@Async = new thread, no TX',
                    'proxyBeanMethods=false can duplicate @Bean',
                    '@Qualifier / @Primary for NoUniqueBean',
                    'Boot 3 AutoConfiguration.imports + conditions',
                    'Debug: proxy in stack + --debug report',
                  ].map((c) => (
                    <li key={c} className="flex gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
