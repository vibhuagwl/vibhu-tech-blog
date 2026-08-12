import {Suspense} from 'react';
import {getAllPosts} from '@/lib/posts';
import SearchClient from '@/components/search-client';

export const metadata={title:'Search'};

export default function Search(){
  const posts=getAllPosts().map(({slug,title,description,category,difficulty,tags})=>({
    slug,title,description,category,difficulty,tags,
  }));

  return (
    <main className="mx-auto max-w-5xl px-5 py-14">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Search interview topics</h1>
      <p className="mt-3 max-w-2xl text-slate-500">
        Find Java, Kafka, Spring Boot, system design, production troubleshooting, and leadership guides.
      </p>
      <div className="mt-7">
        <Suspense fallback={<div className="text-sm text-slate-500">Loading search…</div>}>
          <SearchClient posts={posts}/>
        </Suspense>
      </div>
    </main>
  );
}
