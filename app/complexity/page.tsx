import Link from 'next/link';
import {getPostsByCategories,SECTION_CATEGORIES} from '@/lib/posts';

export const metadata={title:'Time & Space Complexity'};

const ORDER=[
  'complexity-master-index',
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
        <div className="text-xs font-black uppercase tracking-[.16em] text-blue-600">DSA Interview Prep · Java</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-5xl">Time &amp; space complexity — derive it, don’t memorize it.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          A full master guide: fundamentals → data structures → algorithms → graphs → interview traps,
          with Java code, mathematical derivations, practice problems, and a one-page formula sheet.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold dark:bg-slate-900">{posts.length} guides</span>
          {index && (
            <Link href={`/complexity/${index.slug}`} className="rounded-full bg-blue-600 px-3 py-1 font-semibold text-white">
              Start curriculum →
            </Link>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-black">All topics</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {list.map((p)=>(
            <Link key={p.slug} href={`/complexity/${p.slug}`} className="card p-6 transition hover:-translate-y-0.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-600">{p.difficulty} · {p.readingTime}</div>
              <h3 className="mt-3 text-xl font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{p.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
