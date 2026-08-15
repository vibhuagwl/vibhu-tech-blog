'use client';

import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {MEMORY_SENTENCE, SA_KIT_TOC_IDS, SA_TOC, VERSION_NOTE} from '@/lib/spring-annotations/toc';
import {STEREOTYPE} from '@/lib/spring-annotations/parts-stereotype';
import {DI} from '@/lib/spring-annotations/parts-di';
import {CONFIG} from '@/lib/spring-annotations/parts-config';
import {LIFECYCLE} from '@/lib/spring-annotations/parts-lifecycle';
import {AOP_TX} from '@/lib/spring-annotations/parts-aop-tx';
import {BOOT} from '@/lib/spring-annotations/parts-boot';
import {WEB} from '@/lib/spring-annotations/parts-web';
import {ASYNC_CACHE} from '@/lib/spring-annotations/parts-async-cache-events';
import {KAFKA_DATA_SEC} from '@/lib/spring-annotations/parts-kafka-data-security';
import {GAPS_CORE} from '@/lib/spring-annotations/parts-gaps-core';
import {GAPS_WEB_TEST} from '@/lib/spring-annotations/parts-gaps-web-test';
import {GAPS_DATA_SEC_ACT} from '@/lib/spring-annotations/parts-gaps-data-sec-actuator';
import {ECOSYSTEM} from '@/lib/spring-annotations/parts-ecosystem';
import {
  DOES_PROXY,
  ORDERING_NOTES,
  PAYMENT_TRACE,
  PROCESSOR_MAP,
  PROXY_MATRIX,
  WHO_PROCESSES,
} from '@/lib/spring-annotations/parts-proxy-matrix';
import {STARTUP_SECTIONS} from '@/lib/spring-annotations/parts-startup';
import {CHEAT_ROWS, MEMORY_RULES, SPOKEN, INTERVIEW_EXPORT_COUNTS} from '@/lib/spring-annotations/interview';
import {
  INVENTORY_DISCLAIMER,
  INVENTORY_STATS,
  SCOPE_NOTE,
  unifyInventory,
} from '@/lib/spring-annotations/inventory';
import {OWNERSHIP_MATRIX} from '@/lib/spring-annotations/inventory-ecosystem';
import {
  ARCHITECT_CHEAT,
  ARCHITECT_PICKS,
  MEMORY_STRIP,
  SA_STORIES,
} from '@/lib/spring-annotations/stories';
import {
  ANNOTATION_INCIDENTS,
  AUTOWIRE_MERMAID,
  BOOT_MERMAID,
  BOOT_RUN_ASCII,
  CHEAT_ASYNC,
  CHEAT_CACHE,
  CHEAT_DI,
  CHEAT_KAFKA,
  CHEAT_REST,
  CHEAT_TX,
  DECISION_GUIDE_ROWS,
  HIERARCHY_ASCII,
  KAFKA_MERMAID,
  MVC_MERMAID,
  PIPELINE_ASCII,
  PIPELINE_MERMAID,
  PRINCIPAL_EXPECTATION,
  PROXY_DETECT_CODE,
  RELATED_HUBS,
  TX_MERMAID,
  TX_SEQUENCE_ASCII,
  WRONG_VS_CORRECT,
} from '@/lib/spring-annotations/internals-handbook';
import type {AnnotationCard} from '@/lib/spring-annotations/types';
import StickyToc from './sticky-toc';
import CodePanel from './code-panel';
import StoryWalkthrough from './story-walkthrough';
import InterviewMode from './interview-mode';

const UNIFIED = unifyInventory();
const INVENTORY_CATEGORIES = [...new Set(UNIFIED.map((r) => r.category))].sort();
const GAPS_ALL = [...GAPS_CORE, ...GAPS_WEB_TEST, ...GAPS_DATA_SEC_ACT];

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

function DeepCard({c}: {c: AnnotationCard}) {
  return (
    <details className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
      <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">
        {c.annotation}{' '}
        <span className="font-normal text-slate-500">
          · {c.family} · {c.memory}
        </span>
      </summary>
      <div className="mt-3 space-y-3 text-slate-600 dark:text-slate-300">
        <p>
          <strong className="text-slate-800 dark:text-slate-100">What:</strong> {c.what}
        </p>
        <p>
          <strong className="text-slate-800 dark:text-slate-100">Why:</strong> {c.why}
        </p>
        <p>
          <strong className="text-slate-800 dark:text-slate-100">Processor:</strong> {c.processor}
        </p>
        <p>
          <strong className="text-slate-800 dark:text-slate-100">When:</strong> {c.when}
        </p>
        <pre className="overflow-x-auto rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 font-mono text-[11px] leading-5 dark:border-slate-700 dark:bg-slate-900/60">
          {c.flow}
        </pre>
        <p>
          <strong className="text-slate-800 dark:text-slate-100">Lifecycle:</strong> {c.lifecycle}
        </p>
        <p>
          <strong className="text-slate-800 dark:text-slate-100">Proxy:</strong> {c.proxy}
        </p>
        <p>
          <strong className="text-slate-800 dark:text-slate-100">Runtime:</strong> {c.runtime}
        </p>
        <p>
          <strong className="text-slate-800 dark:text-slate-100">Failure:</strong> {c.failure}
        </p>
        <p>
          <strong className="text-slate-800 dark:text-slate-100">Debug:</strong> {c.debug}
        </p>
        <p>
          <strong className="text-slate-800 dark:text-slate-100">Production:</strong> {c.production}
        </p>
        <CodePanel title="Example" code={c.example} />
        <ul className="list-disc space-y-1 pl-5">
          {c.mistakes.map((m) => (
            <li key={m}>
              <strong>Mistake:</strong> {m}
            </li>
          ))}
        </ul>
        <ul className="list-disc space-y-1 pl-5 text-rose-700 dark:text-rose-300">
          {c.traps.map((t) => (
            <li key={t}>
              <strong>Trap:</strong> {t}
            </li>
          ))}
        </ul>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/50">
          <p>
            <strong>15s:</strong> {c.answer15s}
          </p>
          <p className="mt-2">
            <strong>60s:</strong> {c.answer60s}
          </p>
          <p className="mt-2">
            <strong>3m:</strong> {c.answer3m}
          </p>
        </div>
        {c.tables?.map((t, i) => (
          <MiniTable key={i} headers={t.headers} rows={t.rows} />
        ))}
      </div>
    </details>
  );
}

function CardStack({cards}: {cards: AnnotationCard[]}) {
  return (
    <div className="space-y-2">
      {cards.map((c) => (
        <DeepCard key={c.id} c={c} />
      ))}
    </div>
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
        {INVENTORY_STATS.uniqueNames} annotations indexed — search by name or processor; do not memorize the list.
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
        rows={filtered.slice(0, 60).map((r) => [r.annotation, r.processor, r.memory])}
      />
      <p className="text-xs text-slate-500">
        Showing {Math.min(60, filtered.length)} of {filtered.length}
      </p>
    </div>
  );
}

export default function SpringAnnotationsHub() {
  const [tocFocus, setTocFocus] = useState<'kit' | 'full'>('full');
  const tocItems = useMemo(
    () => (tocFocus === 'kit' ? SA_TOC.filter((i) => SA_KIT_TOC_IDS.has(i.id)) : SA_TOC),
    [tocFocus],
  );

  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.replace(/^#/, '');
      if (!id) return;
      if (!SA_KIT_TOC_IDS.has(id)) setTocFocus('full');
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({behavior: 'smooth', block: 'start'});
      });
    };
    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);
    return () => window.removeEventListener('hashchange', scrollToHash);
  }, []);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Architect · Spring Boot 3 · Framework 6 · Internals
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Spring Boot Annotations — Internal Working & Production Interview Masterclass
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Full internals are always on this page — every TOC and hash link (including{' '}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">#proxy</code>,{' '}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">#boot-run</code>,{' '}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">#aop-tx</code>) jumps to a real section.
          Filter the sidebar for a shorter interview path.
        </p>
        <p className="mt-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
          {PRINCIPAL_EXPECTATION}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ['kit', 'Sidebar: interview kit'],
              ['full', 'Sidebar: full TOC'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTocFocus(id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                tocFocus === id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200'
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
          <Link href="/resilience4j" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Resilience4j
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[220px_minmax(0,1fr)]">
        <StickyToc items={tocItems} />
        <div className="min-w-0 space-y-14">
          <Section id="decide" title="01. 30-second mental model" lead="Say this before naming any annotation.">
            <pre className="overflow-x-auto rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">{`SCAN → REGISTER → INJECT → PROXY → EXECUTE

External caller → Proxy → @Transactional / @Async / @Cacheable / @PreAuthorize
this.method()   → raw target → advice SKIPPED

Not every annotation is AOP:
  MVC / KafkaListener / @Scheduled / conditions → different processors`}</pre>
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
            id="pipeline"
            title="02. Annotation → metadata → BeanDefinition → lifecycle → proxy → runtime"
            lead="The only diagram that matters in a Staff interview."
          >
            <Mermaid chart={PIPELINE_MERMAID} />
            <CodePanel title="ASCII pipeline" code={PIPELINE_ASCII} />
            <div className="mt-4">
              <Mermaid chart={AUTOWIRE_MERMAID} />
            </div>
          </Section>

          <Section
            id="hierarchy"
            title="03. Ownership hierarchy"
            lead="Never call Resilience4j or JPA annotations “Spring Boot annotations.”"
          >
            <CodePanel title="Master map" code={HIERARCHY_ASCII} />
            <div className="mt-4">
              <MiniTable
                headers={['Annotation / API', 'Owner', 'Package · dependency']}
                rows={OWNERSHIP_MATRIX.map((r) => [r.annotation, r.owner, `${r.packageName} · ${r.dependency}`])}
              />
            </div>
          </Section>

          <Section id="stories" title="04. Draw these stories" lead={`${SA_STORIES.length} scenes — self-invocation, @Configuration, @Async, Boot.`}>
            <StoryWalkthrough />
          </Section>

          <Section id="spoken" title="05. Say this out loud">
            <div className="space-y-4">
              {(
                [
                  ['60 seconds', SPOKEN.sixtySec],
                  ['2 minutes', SPOKEN.twoMin],
                  ['Staff close', SPOKEN.staff],
                  ['Boot auto-config 60s', SPOKEN.bootAutoConfig.s60],
                  ['@Transactional 60s', SPOKEN.transactional.s60],
                  ['Proxy 60s', SPOKEN.proxy.s60],
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
              <MiniTable headers={['Memory', 'Rule']} rows={MEMORY_RULES.map((m) => [m.title, m.rule])} />
            </div>
          </Section>

          <Section
            id="startup"
            title="06. Startup & BeanDefinition"
            lead="Definitions first — instances later. ConfigurationClassPostProcessor is the hub."
          >
            <div className="space-y-4">
              {STARTUP_SECTIONS.map((s) => (
                <details
                  key={s.id}
                  className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"
                >
                  <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">{s.title}</summary>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    <p>{s.body}</p>
                    <Mermaid chart={s.flow} />
                    <ul className="list-disc pl-5">
                      {s.remember.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                    <p className="text-rose-700 dark:text-rose-300">
                      <strong>Trap:</strong> {s.trap}
                    </p>
                    <p>
                      <strong>60s:</strong> {s.answer60s}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </Section>

          <Section
            id="boot-run"
            title="07. SpringApplication.run & @SpringBootApplication"
            lead="@SpringBootConfiguration + @EnableAutoConfiguration + @ComponentScan — composed meta-annotations."
          >
            <Mermaid chart={BOOT_MERMAID} />
            <CodePanel title="Boot run ASCII" code={BOOT_RUN_ASCII} />
            <div className="mt-6">
              <CardStack cards={BOOT} />
            </div>
          </Section>

          <Section
            id="autoconfig"
            title="08. Auto-configuration deep dive"
            lead="AutoConfiguration.imports → DeferredImportSelector → ConditionEvaluator → BeanDefinitions."
          >
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              Adding <code>spring-boot-starter-data-jpa</code> puts Hibernate/JDBC on the classpath. Boot&apos;s
              auto-configuration classes match <code>@ConditionalOnClass</code>, then often{' '}
              <code>@ConditionalOnMissingBean</code>, and register DataSource, EntityManagerFactory,
              transaction manager, and related infrastructure — unless your beans or properties exclude them.
              Prove with the conditions report (<code>--debug</code> or actuator <code>/conditions</code>).
            </p>
            <div className="mt-4">
              <CodePanel
                title="Starter → beans"
                code={`spring-boot-starter-data-jpa
        ↓
Classpath: Hibernate, spring-orm, …
        ↓
JpaRepositoriesAutoConfiguration / DataSourceAutoConfiguration / …
        ↓
@ConditionalOnClass / OnMissingBean / OnProperty
        ↓
BeanDefinitions registered
        ↓
EntityManagerFactory, PlatformTransactionManager, …`}
              />
            </div>
          </Section>

          <Section id="stereotype" title="09. @Component / @Service / @Repository / @Controller" lead="Stereotypes are meta-@Component — plus role-specific processors.">
            <CardStack cards={STEREOTYPE} />
          </Section>

          <Section id="di" title="10. Dependency injection" lead="AutowiredAnnotationBeanPostProcessor · CommonAnnotationBeanPostProcessor · @Resource.">
            <CardStack cards={DI} />
          </Section>

          <Section
            id="config-beans"
            title="11. @Configuration & @Bean"
            lead="Full @Configuration uses CGLIB so inter-@Bean calls preserve singletons; lite mode does not."
          >
            <CardStack cards={CONFIG} />
          </Section>

          <Section id="lifecycle" title="12. Bean lifecycle annotations" lead="@PostConstruct · @PreDestroy · InitializingBean · BeanPostProcessor phases.">
            <CardStack cards={LIFECYCLE} />
          </Section>

          <Section
            id="aop-tx"
            title="13. @Transactional & AOP"
            lead="Metadata → advisor → TransactionInterceptor → PlatformTransactionManager. Self-invocation is the classic trap."
          >
            <Mermaid chart={TX_MERMAID} />
            <CodePanel title="TX sequence" code={TX_SEQUENCE_ASCII} />
            <div className="mt-6">
              <CardStack cards={AOP_TX} />
            </div>
          </Section>

          <Section id="async-cache" title="14. @Async · cache · scheduling · events">
            <CardStack cards={ASYNC_CACHE} />
          </Section>

          <Section id="web" title="15. Web / MVC annotations" lead="HandlerMapping at startup — not AOP. Argument resolvers interpret parameter annotations.">
            <Mermaid chart={MVC_MERMAID} />
            <div className="mt-6">
              <CardStack cards={WEB} />
            </div>
          </Section>

          <Section
            id="kafka-data"
            title="16. Kafka · Spring Data · Security (ownership labeled on cards)"
            lead="KafkaListenerAnnotationBeanPostProcessor ≠ AOP. Method security uses proxies. JPA @Entity is not Spring."
          >
            <Mermaid chart={KAFKA_MERMAID} />
            <div className="mt-6">
              <CardStack cards={KAFKA_DATA_SEC} />
            </div>
          </Section>

          <Section id="proxy" title="17. Proxy matrix" lead="Which annotations create proxies — and which never do.">
            <CodePanel title="Detect proxies" code={PROXY_DETECT_CODE} />
            <div className="mt-4">
              <MiniTable
                headers={['Annotation', 'Proxy?', 'Why', 'Trap']}
                rows={PROXY_MATRIX.map((r) => [r.annotation, r.proxy, r.why, r.exception])}
              />
            </div>
            <div className="mt-6 space-y-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Does it proxy? Q&A</p>
              {DOES_PROXY.slice(0, 20).map((q) => (
                <details key={q.q} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                  <summary className="cursor-pointer font-semibold">{q.q}</summary>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">{q.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-6">
              <CodePanel title="Advisor ordering notes" code={ORDERING_NOTES} />
            </div>
            <div className="mt-4">
              <MiniTable
                headers={['Step', 'Annotations', 'Internals']}
                rows={PAYMENT_TRACE.map((r) => [r.step, r.annotations, r.internals])}
              />
            </div>
          </Section>

          <Section id="processors" title="18. Annotation → internal component map">
            <MiniTable
              headers={['Annotation', 'Processor', 'Proxy?', 'Phase', 'Trap']}
              rows={PROCESSOR_MAP.map((r) => [r.annotation, r.processor, r.proxy, r.phase, r.trap])}
            />
            <div className="mt-6 space-y-2">
              {WHO_PROCESSES.slice(0, 25).map((q) => (
                <details key={q.q} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                  <summary className="cursor-pointer font-semibold">{q.q}</summary>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">{q.a}</p>
                </details>
              ))}
            </div>
          </Section>

          <Section id="gaps" title="19. Gaps · testing · actuator · remaining cards">
            <CardStack cards={GAPS_ALL} />
          </Section>

          <Section id="ecosystem" title="20. Ecosystem cards" lead="Cloud, Batch, Integration — version-sensitive; prefer modern APIs.">
            <CardStack cards={ECOSYSTEM} />
          </Section>

          <Section
            id="wrong-vs-correct"
            title="21. Wrong vs correct — proxy boundary"
            lead="Same pattern for @Transactional, @Async, @Cacheable, @Retryable, @PreAuthorize."
          >
            <div className="space-y-4">
              {WRONG_VS_CORRECT.map((w) => (
                <div
                  key={w.id}
                  className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{w.annotation}</p>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Wrong</p>
                      <CodePanel title="Bypasses proxy" code={w.wrong} />
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{w.whyWrong}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Correct</p>
                      <CodePanel title="Crosses proxy" code={w.correct} />
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{w.whyCorrect}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="incidents"
            title={`22. Production incidents (${ANNOTATION_INCIDENTS.length})`}
            lead="Symptom → root cause → prove → fix → prevention. Pair with /production-troubleshooting."
          >
            <div className="space-y-2">
              {ANNOTATION_INCIDENTS.map((inc) => (
                <details
                  key={inc.id}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
                >
                  <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">
                    {inc.title}
                  </summary>
                  <div className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
                    <p>
                      <strong>Symptom:</strong> {inc.symptom}
                    </p>
                    <p>
                      <strong>Root cause:</strong> {inc.rootCause}
                    </p>
                    <p>
                      <strong>Prove:</strong> {inc.prove}
                    </p>
                    <p>
                      <strong>Fix:</strong> {inc.fix}
                    </p>
                    <p>
                      <strong>Prevention:</strong> {inc.prevention}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </Section>

          <Section id="decisions" title="23. Annotation decision guide">
            <MiniTable
              headers={['Choice', 'Use when', 'Avoid when']}
              rows={DECISION_GUIDE_ROWS.map((r) => [r.choice, r.useWhen, r.avoidWhen])}
            />
          </Section>

          <Section id="inventory" title="24. Inventory search">
            <InventoryBrowser />
          </Section>

          <Section id="picks" title="25. Debug picks" lead="Guess the cause — then rehearse the one sentence.">
            <PickDrill />
          </Section>

          <Section id="cheat" title="26. Internal working cheat sheets">
            <div className="grid gap-4 lg:grid-cols-2">
              <CodePanel title="DI" code={CHEAT_DI} />
              <CodePanel title="Transaction" code={CHEAT_TX} />
              <CodePanel title="Async" code={CHEAT_ASYNC} />
              <CodePanel title="Cache" code={CHEAT_CACHE} />
              <CodePanel title="Kafka" code={CHEAT_KAFKA} />
              <CodePanel title="REST" code={CHEAT_REST} />
            </div>
            <div className="mt-4">
              <CodePanel title="Architect cheat sheet" code={ARCHITECT_CHEAT} />
            </div>
            <div className="mt-4">
              <MiniTable
                headers={['Annotation', 'Processor', 'Proxy?', 'Trap']}
                rows={CHEAT_ROWS.slice(0, 20).map((r) => [r.annotation, r.processor, r.proxy, r.trap])}
              />
            </div>
          </Section>

          <Section
            id="interview"
            title="27. Interview simulator"
            lead={`${INTERVIEW_EXPORT_COUNTS.uniqueInterviewQ}+ prompts · Senior / Architect / Rapid. Reveal, score yourself against Principal depth.`}
          >
            <InterviewMode />
          </Section>

          <Section id="drill" title="28. Memory strip">
            <div className="grid gap-2 sm:grid-cols-2">
              {MEMORY_STRIP.map((m) => (
                <div key={m.title} className="rounded-xl border border-slate-200 px-3 py-3 dark:border-slate-800">
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">{m.title}</p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{m.line}</p>
                </div>
              ))}
            </div>
            <ul className="mt-6 grid gap-1 sm:grid-cols-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
              {[
                'Pipeline: SCAN REGISTER INJECT PROXY EXECUTE',
                'Self-invocation skips proxy',
                '@Transactional = interceptor on proxy',
                '@Async = other thread; TX ThreadLocal not shared',
                'proxyBeanMethods=false can duplicate @Bean',
                '@Qualifier / @Primary for NoUniqueBean',
                'Boot 3 AutoConfiguration.imports + conditions',
                'MVC / KafkaListener are not primarily AOP',
                'Debug: AopUtils + conditions report + /beans',
                'Label ownership in every interview answer',
              ].map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="related" title="29. Related hubs" lead="Deep specialty pages — do not duplicate here.">
            <div className="grid gap-3 sm:grid-cols-2">
              {RELATED_HUBS.map((h) => (
                <Link
                  key={h.href}
                  href={h.href}
                  className="rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-slate-400 dark:border-slate-800"
                >
                  <p className="font-semibold text-slate-900 dark:text-white">{h.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{h.blurb}</p>
                </Link>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
