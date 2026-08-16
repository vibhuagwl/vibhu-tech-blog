'use client';

import Link from 'next/link';
import type {DemoSourceFile, DemoTreeNode} from '@/lib/oauth-demo-source';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import {PROBLEM_COUNT, PROBLEM_GROUPS} from '@/lib/java-streams/catalog';
import {
  BAD_CODE,
  CHEAT,
  DOMAIN_MODELS,
  EXCEPTION_HANDLING,
  FILE_STREAMS,
  INTERNALS,
  JAVA_VERSIONS,
  JPA_WARNINGS,
  LEVELS,
  OPS_CLASSIFICATION,
  PARALLEL_GUIDE,
  PERFORMANCE,
  SPLITERATOR,
  STREAM_VS_LOOP,
} from '@/lib/java-streams/concepts';
import {MEMORY_SENTENCE, STREAMS_TOC, VERSION_NOTE} from '@/lib/java-streams/toc';
import {CODING_ROUND, DEBUGS, PREDICTIONS, TOP100_RANKED} from '@/lib/java-streams/top100';
import {ALL as INTERVIEW_ALL} from '@/lib/java-streams/interview';
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';
import ProblemBrowser from './problem-browser';
import StickyToc from './sticky-toc';
import ApiCoverageChecklist from './api-coverage-checklist';

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

function Pre({children}: {children: string}) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-[12px] leading-5 text-slate-100 dark:border-slate-800">
      {children.trim()}
    </pre>
  );
}

const RANK_LABEL = {must: '🔥 Must Know', advanced: '⭐ Advanced', expert: '🚀 Expert', staff: '🏆 Staff/Principal'} as const;

export default function JavaStreamsHub({
  files = [],
  tree = [],
  defaultPath = '',
}: {
  files?: DemoSourceFile[];
  tree?: DemoTreeNode[];
  defaultPath?: string;
}) {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Java 21 · Staff · Principal · Architect · 21+ years interview prep
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Java Streams — Complete Interview Program Collection
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Not a beginner tutorial. A systematic catalog of Stream problems with solutions, pipelines, complexity,
          traps, and senior judgment — plus parallel, Spliterator, JPA, files, and when <em>not</em> to use Streams.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 text-sm text-slate-500">{VERSION_NOTE}</p>
        <p className="mt-3 text-sm text-slate-500">
          {PROBLEM_COUNT} programs · API checklist · {INTERVIEW_ALL.length} prompts · {CODING_ROUND.length} coding-round drills ·{' '}
          <Link href="/java-concurrency" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Concurrency
          </Link>
          {' · '}
          <Link href="/java-versions" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Java versions
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={STREAMS_TOC} />
        <div className="min-w-0 space-y-16">
          <Section id="overview" title="00. Overview · how seniors use Streams" lead="Identify the operation, collector, complexity, and whether Streams belong at all.">
            <CodePanel title="Domain models" code={DOMAIN_MODELS} language="java" />
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Each category below is a filterable problem browser. Every card includes Problem → Input → Output →
              Solution → Pipeline → Why → Complexity → Trap → Senior insight.
            </p>
          </Section>

          <Section
            id="api-checklist"
            title="00b. Java Stream API Coverage Checklist"
            lead="Systematic API coverage — not just lots of programs. Every important factory, intermediate, terminal, primitive, Collector, and internal is marked."
          >
            <ApiCoverageChecklist />
          </Section>

          {PROBLEM_GROUPS.map((g, idx) => (
            <Section
              key={g.id}
              id={g.id}
              title={`${String(idx + 1).padStart(2, '0')}. ${g.title} (${g.problems.length})`}
              lead={g.lead}
            >
              <ProblemBrowser problems={g.problems} />
            </Section>
          ))}

          <Section id="internals" title="26. Internals · Spliterator">
            <Pre>{INTERNALS}</Pre>
            <div className="mt-4">
              <Pre>{SPLITERATOR}</Pre>
            </div>
            <div className="mt-4">
              <Pre>{OPS_CLASSIFICATION}</Pre>
            </div>
          </Section>

          <Section id="performance" title="27. Performance · Streams vs loops · parallel">
            <Pre>{PERFORMANCE}</Pre>
            <div className="mt-4">
              <Pre>{STREAM_VS_LOOP}</Pre>
            </div>
            <div className="mt-4">
              <Pre>{PARALLEL_GUIDE}</Pre>
            </div>
          </Section>

          <Section id="bad-code" title="28. Clever-but-bad Stream code">
            <div className="space-y-4">
              {BAD_CODE.map((b) => (
                <div key={b.title} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white">{b.title}</h3>
                  <div className="mt-3">
                    <CodePanel title="Bad" code={b.bad} tone="danger" language="java" />
                  </div>
                  <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{b.why}</p>
                  <div className="mt-3">
                    <CodePanel title="Better" code={b.better} tone="ok" language="java" />
                  </div>
                  <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">{b.senior}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Pre>{JPA_WARNINGS}</Pre>
              <Pre>{FILE_STREAMS}</Pre>
            </div>
            <div className="mt-4">
              <Pre>{EXCEPTION_HANDLING}</Pre>
            </div>
          </Section>

          <Section id="coding-round" title="29. Coding-round set" lead="30 timed drills — approach first, then reveal solution.">
            <div className="space-y-4">
              {CODING_ROUND.map((c) => (
                <details key={c.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <summary className="cursor-pointer font-bold text-slate-900 dark:text-white">
                    {c.id.toUpperCase()} · {c.difficulty} · ~{c.expectedMinutes}m — {c.question}
                  </summary>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    <p>
                      <strong>Approach:</strong> {c.approach}
                    </p>
                    <p>
                      <strong>Hints:</strong> {c.hints.join(' · ')}
                    </p>
                    <CodePanel title="Solution" code={c.solution} language="java" />
                    <p>
                      <strong>Complexity:</strong> {c.complexity}
                    </p>
                    <p>
                      <strong>Follow-up:</strong> {c.followUp}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </Section>

          <Section id="prediction" title="30. Output prediction" lead="Lazy evaluation and short-circuiting traps.">
            <div className="space-y-4">
              {PREDICTIONS.map((p) => (
                <details key={p.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <summary className="cursor-pointer font-bold text-slate-900 dark:text-white">
                    {p.id} — {p.question}
                  </summary>
                  <div className="mt-3">
                    <CodePanel title="Code" code={p.code} language="java" />
                    <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">
                      <strong>Answer:</strong> {p.answer}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{p.explanation}</p>
                  </div>
                </details>
              ))}
            </div>
          </Section>

          <Section id="debugging" title="31. Debugging broken pipelines">
            <div className="space-y-4">
              {DEBUGS.map((d) => (
                <div key={d.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <CodePanel title={`Bug ${d.id}`} code={d.badCode} tone="danger" language="java" />
                  <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">
                    <strong>Bug:</strong> {d.bug}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    <strong>Fix:</strong> {d.fix}
                  </p>
                  <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
                    <strong>Lesson:</strong> {d.lesson}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="architect-q" title="32. Architect questions">
            <InterviewMode />
            <p className="mt-3 text-sm text-slate-500">Use Staff / Architect tabs for design-judgment prompts.</p>
          </Section>

          <Section id="java-versions" title="33. Java 8 → 21+">
            <Pre>{JAVA_VERSIONS}</Pre>
          </Section>

          <Section id="levels" title="34. What interviewers expect">
            <Pre>{LEVELS}</Pre>
          </Section>

          <Section id="top100" title="35. Top 100 must-know" lead="Ranked slice of the catalog for revision sprints.">
            <div className="grid gap-2 md:grid-cols-2">
              {TOP100_RANKED.map((t) => (
                <div key={t.id} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{RANK_LABEL[t.rank]}</div>
                  <div className="font-semibold text-slate-900 dark:text-white">{t.title}</div>
                  <div className="text-xs text-slate-500">
                    {t.id} · {t.category}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="cheat" title="36. Cheat sheet">
            <Pre>{CHEAT}</Pre>
          </Section>

          <Section id="interview" title="37. Interview bank">
            <InterviewMode />
          </Section>

          <Section id="lab" title="38. Runnable lab" lead="java-streams-lab — focused demos you can run with Maven.">
            <CodePanel
              title="Quick start"
              code={`cd java-streams-lab
mvn -q test
mvn -q exec:java -Dexec.mainClass=com.vibhu.streams.StreamsLabMain`}
            />
            {files.length > 0 && (
              <div className="mt-6">
                <OAuthCodeExplorer
                  files={files}
                  tree={tree}
                  defaultPath={defaultPath}
                  routeBase="/java-streams"
                  ariaLabel="Java Streams lab source"
                />
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
