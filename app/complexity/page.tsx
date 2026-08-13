import Link from 'next/link';
import {getPostsByCategories,SECTION_CATEGORIES} from '@/lib/posts';

export const metadata={title:'Time & Space Complexity'};

const STORY_PATH=[
  {
    href:'/complexity/complexity-step-by-step-story',
    number:'01',
    title:'Step-by-Step Story',
    blurb:'The work-detective method: code → executions → formula → Big-O, with Java examples you can say out loud in interviews.',
  },
  {
    href:'/complexity/complexity-data-structures-story',
    number:'02',
    title:'Data Structures Story',
    blurb:'Array, list, stack, queue, hash, tree, heap, trie, graph — story hooks + formulas + snippets.',
  },
  {
    href:'/complexity/complexity-algorithms-story',
    number:'03',
    title:'Algorithms Story',
    blurb:'Sort, search, two pointers, sliding window, DP, backtracking, BFS/DFS — pattern picker with derivations.',
  },
  {
    href:'/complexity/calculate-complexity-from-code',
    number:'04',
    title:'More Worked Examples',
    blurb:'Five detailed loop cases: independent nested, triangle, sequential, early break.',
  },
  {
    href:'/complexity/complexity-practice-problems',
    number:'05',
    title:'Practice',
    blurb:'30+ problems: read code, derive complexity, check model answers.',
  },
];

const ORDER=[
  'complexity-master-index',
  'complexity-step-by-step-story',
  'complexity-data-structures-story',
  'complexity-algorithms-story',
  'complexity-fundamentals',
  'calculate-complexity-from-code',
  'logarithmic-complexity',
  'mathematical-complexity',
  'master-theorem',
  'recursion-tree-method',
  'amortized-complexity',
  'arrays-complexity',
  'linked-list-complexity',
  'stack-complexity',
  'queue-complexity',
  'hashmap-hashset-complexity',
  'trees-bst-avl-complexity',
  'tree-traversals-complexity',
  'heap-priorityqueue-complexity',
  'trie-complexity',
  'segment-tree-complexity',
  'fenwick-tree-complexity',
  'union-find-complexity',
  'binary-search-derived',
  'sorting-algorithms-derived',
  'recursion-complexity',
  'backtracking-complexity',
  'dynamic-programming-complexity',
  'bfs-complexity',
  'dfs-complexity',
  'graph-algorithms-complexity',
  'string-algorithms-complexity',
  'sliding-window-complexity',
  'two-pointers-complexity',
  'monotonic-stack-complexity',
  'bit-manipulation-complexity',
  'interview-traps-complexity',
  'complexity-calculation-framework',
  'complexity-cheat-sheet',
  'complexity-practice-problems',
  'complexity-formula-sheet',
  'how-big-o-is-calculated',
  'data-structures-time-space-complexity',
  'sorting-and-searching-complexity',
];

export default function Complexity(){
  const posts=getPostsByCategories([...SECTION_CATEGORIES.complexity]);
  const bySlug=new Map(posts.map((p)=>[p.slug,p]));
  const ordered=ORDER.map((s)=>bySlug.get(s)).filter(Boolean) as typeof posts;
  const rest=posts.filter((p)=>!ORDER.includes(p.slug));
  const list=[...ordered,...rest];
  const index=bySlug.get('complexity-master-index');

  return (
    <main>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,.04)] md:p-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-xs font-black uppercase tracking-[.16em] text-slate-600">DSA Interview Prep · Java</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-5xl">Time &amp; space complexity — derive it, don’t memorize it.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          Story-first guides for data structures and algorithms: count executions, write the formula, simplify to Big-O —
          with Java snippets mapped to common interview patterns.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold dark:bg-slate-900">{posts.length} guides</span>
          {index && (
            <Link href={`/complexity/${index.slug}`} className="rounded-full border px-3 py-1 font-semibold hover:bg-slate-50 dark:hover:bg-slate-900">
              Full curriculum →
            </Link>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-black">Start here — 5-page story path</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">No theory dump. Learn the detective method, then structures, then algorithm patterns.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {STORY_PATH.map((item)=>(
            <Link key={item.href} href={item.href} className="card p-6 transition hover:-translate-y-0.5">
              <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-400">{item.number}</div>
              <h3 className="mt-2 text-xl font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.blurb}</p>
              <div className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Open →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-black">All topics</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {list.map((p)=>(
            <Link key={p.slug} href={`/complexity/${p.slug}`} className="card p-6 transition hover:-translate-y-0.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-600">{p.difficulty} · {p.readingTime}</div>
              <h3 className="mt-3 text-xl font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{p.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
