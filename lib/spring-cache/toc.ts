import type {TocItem} from './types';

export const SPRING_CACHE_TOC: TocItem[] = [
  {id: 'mission', label: '00. Mission & rule'},
  {id: 'abstraction', label: '01. Spring Cache ≠ distributed'},
  {id: 'manual', label: '02. Manual cache first'},
  {id: 'lru', label: '03. LRU'},
  {id: 'lfu', label: '04. LFU'},
  {id: 'algo-table', label: '05. Eviction table'},
  {id: 'enable', label: '06. @EnableCaching · AOP'},
  {id: 'cacheable', label: '07. @Cacheable'},
  {id: 'params', label: '08. condition vs unless · sync'},
  {id: 'put-evict', label: '09. @CachePut · @CacheEvict'},
  {id: 'caching-config', label: '10. @Caching · @CacheConfig'},
  {id: 'keys-spel', label: '11. Keys · SpEL · KeyGenerator'},
  {id: 'caffeine', label: '12. Caffeine · TTL vs TTI'},
  {id: 'redis', label: '13. Redis · serialization'},
  {id: 'local-vs-dist', label: '14. Local vs distributed'},
  {id: 'l1l2', label: '15. L1 + L2'},
  {id: 'patterns', label: '16. Cache patterns'},
  {id: 'failures', label: '17. Stampede · penetration · avalanche'},
  {id: 'advanced', label: '18. Self-invocation · tx · multi CM'},
  {id: 'ecommerce', label: '19. Product API example'},
  {id: 'fintech', label: '20. FinTech what to cache'},
  {id: 'lab', label: '21. Runnable lab'},
  {id: 'cheat', label: '22. Memory framework'},
  {id: 'interview', label: '23. 40+ interview Q&A'},
];

export const CORE_RULE =
  'Spring Cache is an abstraction (CacheManager → provider). Local vs distributed is decided by the backend (Caffeine vs Redis), not by @Cacheable.';

export const VERSION_NOTE =
  'Spring Boot 3.4 · Java 21 · Spring Cache + Caffeine + Redis. Companion deep-dive: /distributed-caching · lab: spring-cache-lab/';
