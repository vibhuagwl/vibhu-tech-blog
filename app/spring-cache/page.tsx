import type {Metadata} from 'next';
import SpringCacheHub from '@/components/spring-cache/spring-cache-hub';

export const metadata: Metadata = {
  title: 'Spring Caching Master Guide — Caffeine · Redis · Interview',
  description:
    'Complete Spring Cache curriculum: abstraction vs provider, LRU/LFU, @Cacheable/@CachePut/@CacheEvict, Caffeine TTL/TTI, Redis serialization, L1/L2, stampede/penetration/avalanche, FinTech guidance, runnable lab, and 45 interview Q&As.',
};

export default function SpringCachePage() {
  return (
    <main>
      <SpringCacheHub />
    </main>
  );
}
