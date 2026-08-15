import {Suspense} from 'react';
import {getAllPosts} from '@/lib/posts';
import SearchClient from '@/components/search-client';

export const metadata={title:'Search'};

export default function Search(){
  const posts=getAllPosts()
    .filter((p)=>!/\(moved\)/i.test(p.title))
    .map(({slug,title,description,category,difficulty,tags})=>({
    slug,title,description,category,difficulty,tags,
  }));

  return (
    <main className="mx-auto max-w-5xl px-5 py-14">
      <p className="eyebrow">Search</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--ink)]">Search interview topics</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        Filter by technology, knowledge type (Knowledge, Experience, Optimization, Configuration, Interview…), and level — or search free text.
      </p>
      <div className="mt-7">
        <Suspense fallback={<div className="text-sm text-[var(--muted)]">Loading search…</div>}>
          <SearchClient posts={posts}/>
        </Suspense>
      </div>
    </main>
  );
}
