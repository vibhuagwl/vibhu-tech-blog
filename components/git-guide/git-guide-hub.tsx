'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {GIT_TOC} from '@/lib/git-guide/toc';
import {TOPICS} from '@/lib/git-guide/topics';
import {
  CHEAT,
  DECISION,
  ERRORS,
  FIVE_MIN,
  GOLDEN,
  MERGE_REBASE,
  RESET_REVERT,
  SIXTY,
  TOP25,
} from '@/lib/git-guide/comparison';
import StickyToc from './sticky-toc';
import TopicPanel from './topic-panel';
import InterviewMode from './interview-mode';
import CodePanel from './code-panel';

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
          {rows.map((r) => (
            <tr key={r.join('|')} className="border-t border-slate-200 dark:border-slate-800">
              {r.map((c, i) => (
                <td key={i} className={`px-2 py-2 ${i === 0 ? 'font-semibold' : ''}`}>
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

export default function GitGuideHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Staff · Principal · Architect · Java · Spring · Microservices · CI/CD
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Git Master Guide
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Command-first production Git — branching, rebase, hotfix cherry-picks, revert vs reset, reflog
          recovery, bisect, PR/CI, secrets, monorepos. ~90% commands and scenarios.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Related:{' '}
          <Link href="/production-troubleshooting" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Prod Troubleshooting
          </Link>
          {' · '}
          <Link href="/api-gateway" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            API Gateway
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={GIT_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="overview"
            title="Git Mental Model"
            lead="Minimum theory: working tree → staging → local commits → remote. Everything else is inspecting, integrating, or recovering."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <Mermaid
                  chart={`flowchart TD
  DEV[Developer] --> WT[Working Directory]
  WT -->|git add| ST[Staging]
  ST -->|git commit| LOC[Local Repository]
  LOC -->|git push| REM[Remote]
  REM --> GH[GitHub / GitLab]`}
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <Mermaid
                  chart={`flowchart TB
  GIT[GIT COMMANDS]
  GIT --> SETUP[config init clone]
  GIT --> DAILY[status add commit fetch push]
  GIT --> ADV[rebase cherry-pick reflog bisect worktree]`}
                />
              </div>
            </div>
            <CodePanel
              title="Setup sketch"
              code={`git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
ssh-keygen -t ed25519
ssh -T git@github.com
# HTTPS vs SSH: tokens vs keys — org policy decides`}
            />
          </Section>

          {TOPICS.map((t) => (
            <TopicPanel key={t.id} t={t} />
          ))}

          <Section id="tables" title="Interview Tables">
            <MiniTable
              headers={['Command', 'Purpose', 'Rewrites?', 'Shared-safe?']}
              rows={RESET_REVERT.map((r) => [r.c, r.p, r.rw, r.shared])}
            />
            <div className="mt-4">
              <MiniTable
                headers={['Scenario', 'Prefer']}
                rows={MERGE_REBASE.map((r) => [r.s, r.p])}
              />
            </div>
            <div className="mt-4">
              <MiniTable
                headers={['Error', 'Meaning', 'Fix']}
                rows={ERRORS.map((r) => [r.e, r.m, r.f])}
              />
            </div>
          </Section>

          <Section id="top25" title="Top Commands to Memorize">
            <div className="grid gap-2 md:grid-cols-2">
              {TOP25.map(([cmd, meaning, mistake], i) => (
                <div key={cmd} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-bold">
                    {i + 1}. <code>{cmd}</code>
                  </div>
                  <div className="text-slate-500">{meaning}</div>
                  <div className="text-xs text-rose-600 dark:text-rose-300">Mistake: {mistake}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="architecture" title="Decision Tree · Whiteboard">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  U[Need to undo?] --> F{Uncommitted file?}
  F -->|Yes| RES[restore]
  F -->|No| S{Shared commit?}
  S -->|No| RESET[reset / rebase -i]
  S -->|Yes| REV[revert]
  U2[Lost commit?] --> RL[reflog]
  U3[Need other branch fix?] --> CP[cherry-pick]
  U4[Find bug birth?] --> BI[bisect / blame / -S]`}
              />
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  GIT --> DEV[DEVELOP branch commit rebase push]
  GIT --> REL[RELEASE tag merge cherry-pick deploy]
  GIT --> REC[RECOVER reflog revert reset bisect]
  DEV --> CI --> PROD --> INC[Incident] --> HF[Hotfix] --> CP[Cherry-pick]`}
              />
            </div>
            <div className="mt-4 space-y-2">
              {DECISION.map((d) => (
                <div key={d.q} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-semibold">{d.q}</div>
                  <div className="text-slate-500">Yes → {d.yes}</div>
                  <div className="text-slate-500">No → {d.no}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="interview" title="Interview Mode">
            <InterviewMode />
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">60-second answer</div>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{SIXTY}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">5-minute architect answer</div>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{FIVE_MIN}</p>
              </div>
            </div>
          </Section>

          <Section id="cheat" title="Cheat Sheet · Golden Rules">
            <div className="grid gap-2 md:grid-cols-2">
              {CHEAT.map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-bold">{k}</div>
                  <div className="text-slate-500">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {GOLDEN.map((g, i) => (
                <div key={g} className="rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
                  <span className="font-bold">{i + 1}.</span> {g}
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
