'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {ISLAND_MAP, ISLAND_PROBLEMS, ISLAND_SENTENCE, ISLAND_WHEN} from '@/lib/dsa/islands';
import {SLIDING_WINDOW_PROBLEMS, WINDOW_MAP, WINDOW_SENTENCE, WINDOW_WHEN} from '@/lib/dsa/sliding-window';
import {WINDOW_FAMILIES} from '@/lib/dsa/window-families';
import {DSA_TOC} from '@/lib/dsa/toc';
import ProblemClassroom from './problem-classroom';
import StickyToc from './sticky-toc';
import WindowCatalog from './window-catalog';

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

export default function DsaHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          DSA · Java · BFS · DFS · Sliding Window · Interview
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Data Structures &amp; Algorithms — Islands and Sliding Window
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Two interview families, every problem statement in one place. Grid BFS/DFS is the Number of Islands
          cluster. Arrays and strings that look nested are usually a sliding window.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Big-O derivations live on{' '}
          <Link href="/complexity" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Complexity
          </Link>
          {' · '}
          <Link href="/complexity/bfs-complexity" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            BFS
          </Link>
          {' · '}
          <Link href="/complexity/dfs-complexity" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            DFS
          </Link>
          {' · '}
          <Link href="/complexity/sliding-window-complexity" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Sliding Window
          </Link>
          . Paste Java into the{' '}
          <Link href="/java-compiler" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Java Compiler
          </Link>
          .
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={DSA_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="overview"
            title="Two families, not fifty random problems"
            lead="Memorize the invariant, then the catalog is just the same loop with a different score."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
                {ISLAND_SENTENCE}
              </div>
              <div className="rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
                {WINDOW_SENTENCE}
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <Mermaid chart={ISLAND_MAP} />
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <Mermaid chart={WINDOW_MAP} />
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              {ISLAND_PROBLEMS.length} island / grid BFS-DFS problems · {SLIDING_WINDOW_PROBLEMS.length} sliding
              window problems in {WINDOW_FAMILIES.length} families. Click a name, then Problem / How it works / Java /
              Remember.
            </p>
          </Section>

          <Section
            id="islands"
            title="BFS / DFS — Number of Islands family"
            lead="Every island question is a connected component on a grid. DFS or BFS flood-fill marks a blob. Border-first paint handles closed/enclave variants. Multi-source BFS handles distance. Union-Find handles online inserts."
          >
            <div className="mb-5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-3 py-2 text-left">You need</th>
                    <th className="px-3 py-2 text-left">Problem</th>
                    <th className="px-3 py-2 text-left">Tool</th>
                  </tr>
                </thead>
                <tbody>
                  {ISLAND_WHEN.map((row) => (
                    <tr key={row.need} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-3 py-2 font-semibold">{row.need}</td>
                      <td className="px-3 py-2">{row.problem}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.tool}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ProblemClassroom problems={ISLAND_PROBLEMS} allLabel={`All ${ISLAND_PROBLEMS.length} islands`} />
          </Section>

          <Section
            id="sliding-window"
            title="Sliding window — every problem statement"
            lead="Fixed windows add one and drop one. Variable windows grow right and shrink left. Count-exactly-K questions are atMost(K) minus atMost(K−1). Window max uses a decreasing deque, not a heap. Filter by family so similar problems sit together; How it works walks brute force to optimized with time and space."
          >
            <div className="mb-5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-3 py-2 text-left">You need</th>
                    <th className="px-3 py-2 text-left">Family</th>
                    <th className="px-3 py-2 text-left">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {WINDOW_WHEN.map((row) => (
                    <tr key={row.need} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-3 py-2 font-semibold">{row.need}</td>
                      <td className="px-3 py-2">{row.kind}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <WindowCatalog problems={SLIDING_WINDOW_PROBLEMS} />
          </Section>

          <Section id="cheat" title="Cheat sheet">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['Island count', 'Unseen land → ++answer → flood-fill mark visited'],
                ['Max area / fish', 'Flood-fill returns size or sum'],
                ['Closed / enclave', 'Paint border land first, then count what remains'],
                ['Shortest bridge', 'DFS paint island A, BFS through water to B'],
                ['Distance grids', 'Multi-source BFS from all gates / zeros / rotten'],
                ['Islands II', 'Union-Find, not DFS after every insert'],
                ['Fixed window', 'Add a[r], drop a[r-K]'],
                ['Longest valid', 'Expand right, shrink left while invalid, track max length'],
                ['Shortest valid', 'Expand until valid, shrink while still valid, track min length'],
                ['Exactly K', 'atMost(K) − atMost(K−1)'],
                ['Window max', 'Monotonic decreasing deque of indices'],
                ['Window median', 'Two heaps + lazy delete — not a deque'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-bold">{k}</div>
                  <div className="text-slate-500">{v}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
