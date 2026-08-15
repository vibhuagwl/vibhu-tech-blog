'use client';

import {useState} from 'react';
import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {MEMORY_SENTENCE, SA_TOC, VERSION_NOTE} from '@/lib/spring-annotations/toc';
import {STARTUP_SECTIONS} from '@/lib/spring-annotations/parts-startup';
import {STEREOTYPE} from '@/lib/spring-annotations/parts-stereotype';
import {CONFIG} from '@/lib/spring-annotations/parts-config';
import {DI} from '@/lib/spring-annotations/parts-di';
import {BOOT} from '@/lib/spring-annotations/parts-boot';
import {LIFECYCLE} from '@/lib/spring-annotations/parts-lifecycle';
import {AOP_TX} from '@/lib/spring-annotations/parts-aop-tx';
import {ASYNC_CACHE} from '@/lib/spring-annotations/parts-async-cache-events';
import {WEB} from '@/lib/spring-annotations/parts-web';
import {KAFKA_DATA_SEC} from '@/lib/spring-annotations/parts-kafka-data-security';
import {
  DOES_PROXY,
  ORDERING_NOTES,
  PAYMENT_TRACE,
  PROCESSOR_MAP,
  PROXY_MATRIX,
  WHO_PROCESSES,
} from '@/lib/spring-annotations/parts-proxy-matrix';
import {
  ALL,
  CHEAT_ROWS,
  COVERAGE_CHECKLIST,
  MEMORY_RULES,
  RAPID_QS,
  SCENARIOS,
  SPOKEN,
  TRAP_QS,
} from '@/lib/spring-annotations/interview';
import {SA_STORIES} from '@/lib/spring-annotations/stories';
import type {AnnotationCard} from '@/lib/spring-annotations/types';
import StickyToc from './sticky-toc';
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';
import StoryWalkthrough from './story-walkthrough';

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

function AnnCard({c}: {c: AnnotationCard}) {
  const [open, setOpen] = useState(false);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
    >
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">{c.annotation}</span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            {c.family}
          </span>
          <span className="text-xs text-slate-500">{c.proxy.startsWith('Yes') || c.proxy.startsWith('Usually') ? 'Proxy?' : ''}</span>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{c.what}</p>
        <p className="mt-1 text-xs font-semibold text-emerald-800 dark:text-emerald-200">Memory: {c.memory}</p>
      </summary>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
        <p>
          <strong>Why:</strong> {c.why}
        </p>
        <p>
          <strong>Processor:</strong> {c.processor}
        </p>
        <p>
          <strong>When:</strong> {c.when}
        </p>
        <p>
          <strong>Lifecycle:</strong> {c.lifecycle}
        </p>
        <p>
          <strong>Proxy:</strong> {c.proxy}
        </p>
        <p>
          <strong>Runtime:</strong> {c.runtime}
        </p>
        <CodePanel title="Example" code={c.example} />
        <CodePanel title="Internal flow" code={c.flow} />
        <p>
          <strong>Failure:</strong> {c.failure}
        </p>
        <p>
          <strong>Debug:</strong> {c.debug}
        </p>
        <p>
          <strong>Production:</strong> {c.production}
        </p>
        <ul className="list-disc pl-5">
          {c.mistakes.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <ul className="list-disc pl-5 text-rose-700 dark:text-rose-300">
          {c.traps.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {c.tables?.map((t, i) => (
          <MiniTable key={i} headers={t.headers} rows={t.rows} />
        ))}
        <div className="rounded-xl bg-slate-900 p-4 text-slate-100">
          <p className="text-[11px] uppercase tracking-[.14em] text-slate-400">15s</p>
          <p className="mt-1">{c.answer15s}</p>
          <p className="mt-3 text-[11px] uppercase tracking-[.14em] text-slate-400">60s</p>
          <p className="mt-1">{c.answer60s}</p>
          <p className="mt-3 text-[11px] uppercase tracking-[.14em] text-slate-400">3m Staff</p>
          <p className="mt-1">{c.answer3m}</p>
        </div>
      </div>
    </details>
  );
}

function AnnGroup({cards}: {cards: AnnotationCard[]}) {
  return (
    <div className="space-y-3">
      {cards.map((c) => (
        <AnnCard key={c.id} c={c} />
      ))}
    </div>
  );
}

function ScenarioBrowser() {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const q = SCENARIOS[idx];
  if (!q) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-lg font-semibold text-slate-900 dark:text-white">{q.title}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{q.symptom}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setRevealed(true)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Reveal
        </button>
        <button
          type="button"
          onClick={() => {
            setIdx((i) => (i + 1) % SCENARIOS.length);
            setRevealed(false);
          }}
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold dark:bg-slate-900"
        >
          Next
        </button>
      </div>
      {revealed && (
        <div className="mt-4 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
          <p>
            <strong>Cause:</strong> {q.cause}
          </p>
          <p>
            <strong>Mechanism:</strong> {q.mechanism}
          </p>
          <p>
            <strong>Debug:</strong> {q.debug}
          </p>
          <p>
            <strong>Fix:</strong> {q.fix}
          </p>
          <p>
            <strong>Prevent:</strong> {q.prevent}
          </p>
          <p className="font-semibold">{q.interviewAnswer}</p>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-400">
        {idx + 1}/{SCENARIOS.length}
      </p>
    </div>
  );
}

function WhoGame({items}: {items: {q: string; a: string}[]}) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const item = items[idx];
  if (!item) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-lg font-semibold text-slate-900 dark:text-white">{item.q}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setRevealed(true)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Reveal
        </button>
        <button
          type="button"
          onClick={() => {
            setIdx((i) => (i + 1) % items.length);
            setRevealed(false);
          }}
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold dark:bg-slate-900"
        >
          Next
        </button>
      </div>
      {revealed && <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300">{item.a}</p>}
      <p className="mt-3 text-xs text-slate-400">
        {idx + 1}/{items.length}
      </p>
    </div>
  );
}

export default function SpringAnnotationsHub() {
  const [view, setView] = useState<'stories' | 'deep'>('stories');
  const cardCount =
    STEREOTYPE.length +
    CONFIG.length +
    DI.length +
    BOOT.length +
    LIFECYCLE.length +
    AOP_TX.length +
    ASYNC_CACHE.length +
    WEB.length +
    KAFKA_DATA_SEC.length;

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Architect · Spring Framework 6 · Boot 3 · Jakarta
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Spring Annotations — Internals Interview Mastery
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Not a cheat sheet — who processes each annotation, when BeanDefinitions form, which BeanPostProcessor
          injects, when proxies appear, and why <code className="text-sm">this.tx()</code> skips @Transactional.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ['stories', 'Story + pipeline first'],
              ['deep', 'Full annotation deep-dive'],
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
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka
          </Link>
          {' · '}
          <Link href="/distributed-caching" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Cache
          </Link>
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            `${SA_STORIES.length} stories`,
            `${cardCount} annotation cards`,
            `${ALL.length} interview prompts`,
            `${SCENARIOS.length} debug scenarios`,
          ].map((x) => (
            <div
              key={x}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-800"
            >
              {x}
            </div>
          ))}
        </div>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={SA_TOC} />
        <div className="min-w-0 space-y-16">
          <Section id="overview" title="00. Start here" lead="Ask four questions for every annotation in an interview.">
            <CodePanel
              title="Staff checklist"
              code={`1. Who processes it? (scanner / ConfigurationClassPostProcessor / BPP / interceptor)
2. When? (definition time vs populateBean vs method call)
3. Proxy? (usually no for stereotypes; yes for @Transactional/@Async/@Cacheable/@PreAuthorize)
4. Self-invocation? (this.method() skips proxy — classic trap)`}
            />
          </Section>

          <Section id="stories" title="01. Mental model stories" lead="Draw these before naming processors.">
            <StoryWalkthrough />
          </Section>

          <Section id="startup" title="02. Startup pipeline" lead="BeanDefinition first — objects later.">
            <div className="space-y-4">
              {STARTUP_SECTIONS.map((s) => (
                <details
                  key={s.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">{s.title}</summary>
                  <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">{s.body}</p>
                  <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <Mermaid chart={s.flow} />
                  </div>
                  <ul className="mt-3 list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
                    {s.remember.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">Trap: {s.trap}</p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    <strong>60s:</strong> {s.answer60s}
                  </p>
                </details>
              ))}
            </div>
          </Section>

          <Section id="stereotype" title="03. @Component family">
            <AnnGroup cards={STEREOTYPE} />
          </Section>
          <Section id="config" title="04. @Configuration · @Bean · @Import">
            <AnnGroup cards={CONFIG} />
          </Section>
          <Section id="di" title="05. DI · @Autowired · Qualifier · Primary">
            <AnnGroup cards={DI} />
          </Section>

          {view === 'deep' && (
            <>
              <Section id="boot" title="06. Boot · auto-config · conditions">
                <AnnGroup cards={BOOT} />
              </Section>
              <Section id="lifecycle" title="07. Lifecycle · scope · @Lazy">
                <AnnGroup cards={LIFECYCLE} />
              </Section>
              <Section id="aop-tx" title="08. AOP · @Transactional">
                <AnnGroup cards={AOP_TX} />
              </Section>
              <Section id="async-cache" title="09. @Async · @Cache · events">
                <AnnGroup cards={ASYNC_CACHE} />
              </Section>
              <Section id="web" title="10. MVC · validation · advice">
                <AnnGroup cards={WEB} />
              </Section>
              <Section id="kafka-data-sec" title="11. Kafka · Data · Security">
                <AnnGroup cards={KAFKA_DATA_SEC} />
              </Section>
            </>
          )}

          {view === 'stories' && (
            <Section id="deep-hint" title="Open full annotation cards" lead="Stereotype / Config / DI always visible above. Boot→Security deep cards unlock here.">
              <button
                type="button"
                onClick={() => setView('deep')}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Show Boot · Lifecycle · TX · Async · Web · Kafka · Security cards
              </button>
            </Section>
          )}

          <Section id="proxy" title="12. Proxy · ordering · matrix">
            <CodePanel title="Advisor nesting" code={ORDERING_NOTES} />
            <div className="mt-4">
              <MiniTable
                headers={['Annotation', 'Proxy?', 'Why', 'Exception']}
                rows={PROXY_MATRIX.slice(0, 25).map((r) => [r.annotation, r.proxy, r.why, r.exception])}
              />
              <p className="mt-2 text-xs text-slate-500">{PROXY_MATRIX.length} rows total in data · showing first 25</p>
            </div>
          </Section>

          <Section id="payment-trace" title="13. Payment end-to-end">
            <MiniTable
              headers={['Step', 'Annotations', 'Internals']}
              rows={PAYMENT_TRACE.map((p) => [p.step, p.annotations, p.internals])}
            />
          </Section>

          <Section id="who-processes" title="14. Who processes? · Does it proxy?">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold">Who processes?</p>
                <WhoGame items={WHO_PROCESSES} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Does it create a proxy?</p>
                <WhoGame items={DOES_PROXY} />
              </div>
            </div>
          </Section>

          <Section id="scenarios" title="15. Debug scenarios">
            <ScenarioBrowser />
            <div className="mt-6 space-y-2">
              {TRAP_QS.slice(0, 8).map((q) => (
                <details key={q.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                  <summary className="cursor-pointer font-medium">{q.question}</summary>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">{q.answer30s}</p>
                </details>
              ))}
            </div>
          </Section>

          <Section id="spoken" title="16. Spoken answers">
            <div className="space-y-4">
              {(Object.entries(SPOKEN) as [string, {s15: string; s60: string; s3m: string}][]).map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">{k}</p>
                  <p className="mt-2 text-sm">
                    <strong>15s:</strong> {v.s15}
                  </p>
                  <p className="mt-2 text-sm">
                    <strong>60s:</strong> {v.s60}
                  </p>
                  <p className="mt-2 text-sm">
                    <strong>3m:</strong> {v.s3m}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <MiniTable headers={['Title', 'Rule']} rows={MEMORY_RULES.map((m) => [m.title, m.rule])} />
            </div>
          </Section>

          <Section id="interview" title="17. Interview mode">
            <InterviewMode />
            <p className="mt-3 text-sm text-slate-500">{RAPID_QS.length} rapid · {ALL.length} total unique prompts</p>
          </Section>

          <Section id="cheatsheet" title="18. Cheat sheet — processor map">
            <MiniTable
              headers={['Annotation', 'Processor', 'Proxy?', 'Phase', 'Trap']}
              rows={CHEAT_ROWS.slice(0, 40).map((r) => [r.annotation, r.processor, r.proxy, r.phase, r.trap])}
            />
            <p className="mt-2 text-xs text-slate-500">{PROCESSOR_MAP.length} processor rows</p>
          </Section>

          <Section id="checklist" title="19. Coverage checklist">
            <ul className="grid gap-1 sm:grid-cols-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
              {COVERAGE_CHECKLIST.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
