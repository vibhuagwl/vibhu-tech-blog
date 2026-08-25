import type {Metadata} from 'next';
import {Suspense} from 'react';
import SpringCacheHub from '@/components/spring-cache/spring-cache-hub';
import {buildSpringCacheLabTree, listSpringCacheLabFiles} from '@/lib/spring-cache-lab-source';

export const metadata: Metadata = {
  title: 'Spring Caching Master Guide — Caffeine · Redis · Interview',
  description:
    'Complete Spring Cache curriculum: abstraction vs provider, LRU/LFU, @Cacheable/@CachePut/@CacheEvict, Caffeine TTL/TTI, Redis serialization, L1/L2, stampede/penetration/avalanche, FinTech guidance, runnable lab, and 45 interview Q&As.',
};

export default function SpringCachePage() {
  const files = listSpringCacheLabFiles();
  const tree = buildSpringCacheLabTree(files);
  const defaultPath =
    files.find((f) => f.path === 'README.md')?.path ??
    files.find((f) => f.path.includes('ProductService.java'))?.path ??
    files[0]?.path ??
    '';

  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Spring Cache guide…</div>}>
        <SpringCacheHub files={files} tree={tree} defaultPath={defaultPath} />
      </Suspense>
    </main>
  );
}
