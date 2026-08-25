/** Abstraction, local vs distributed, mental model. */

export const MISSION = `Spring Caching — Complete Real-World + Interview Implementation

Goal: go from @Cacheable to production L1/L2 architecture and answer:
  "Explain Spring Cache from annotation level to distributed design."

Teach through executable flows: HIT / MISS / DB — not theory dumps.`;

export const ABSTRACTION = `Is Spring Cache distributed?

NO — Spring Cache itself is NOT a cache implementation.

Spring Cache  →  CacheManager  →  Cache provider
  ├── ConcurrentMapCacheManager
  ├── CaffeineCacheManager
  ├── RedisCacheManager
  ├── Hazelcast / Ehcache / custom

Local (Caffeine / ConcurrentMap)
  Load Balancer → App1(Caffeine) + App2(Caffeine)
  Each JVM has its own map → values can diverge

Distributed (Redis)
  Load Balancer → App1 + App2 → same Redis
  Shared cache → consistency / network / Redis failure become your problem

MEMORY: Spring Cache = WHERE to plug a provider, not the provider itself.`;

export const FINAL_ARCH = `                    Client
                      |
                 Load Balancer
                  /         \\
                 ↓           ↓
              App-1        App-2
                |             |
           L1 Caffeine   L1 Caffeine   ← fastest, local, may diverge
                |             |
                └──────┬──────┘
                       ↓
                    Redis L2          ← shared, network hop
                       |
                       ↓
                  PostgreSQL          ← source of truth

L1 = micro-latency hot keys
L2 = shared across pods
DB = never treat cache as SoT`;

export const MENTAL_MODEL = `CACHE = WHERE + WHAT + WHEN + HOW + FAILURE

WHERE: Local | Distributed | L1/L2
WHAT:  Key | Value | Serialization | versioning
WHEN:  TTL | TTI | Eviction (provider policy)
HOW:   Cache-aside | Read-through | Write-through | Write-behind
FAILURE: Stampede | Penetration | Avalanche | Hot key | Redis down | Stale`;
