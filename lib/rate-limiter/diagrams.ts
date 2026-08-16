/** Mermaid diagrams for the rate-limiter interview board. */

export const MERMAID_HLD = `flowchart TB
  Clients[Clients / Partners / Bots]
  CF[CloudFront]
  WAF[AWS WAF rate-based rules]
  GW[API Gateway / ALB]
  App[Payment Service pods]
  RL[Embedded RateLimiter library]
  Redis[(ElastiCache Redis Cluster)]
  DB[(PostgreSQL)]
  Kafka[[Kafka]]
  Provider[Card / UPI provider]

  Clients --> CF --> WAF --> GW --> App
  App --> RL
  RL -->|EVAL Lua single key| Redis
  App --> DB
  App --> Kafka
  App --> Provider`;

export const MERMAID_ALLOW = `sequenceDiagram
  participant C as Client
  participant G as API Gateway
  participant F as RateLimitFilter
  participant S as RateLimitService
  participant R as Redis
  participant P as PaymentController

  C->>G: POST /payments
  G->>F: JWT + headers
  F->>S: allow(ctx)
  S->>R: EVAL token_bucket.lua
  R-->>S: allowed=1 remaining=87
  S-->>F: Allow + headers
  F->>P: proceed
  P-->>C: 200 + X-RateLimit-*`;

export const MERMAID_REJECT = `sequenceDiagram
  participant C as Client
  participant F as RateLimitFilter
  participant S as RateLimitService
  participant R as Redis

  C->>F: POST /payments
  F->>S: allow(ctx)
  S->>R: EVAL token_bucket.lua
  R-->>S: allowed=0 retry_after_ms=2000
  S-->>F: Reject
  F-->>C: 429 Retry-After: 2`;

export const MERMAID_TOKEN = `sequenceDiagram
  participant T as Thread/Pod
  participant L as Lua on Redis shard
  Note over L: Single-threaded per shard
  T->>L: HMGET tokens,ts
  L->>L: elapsed = max(0, now-ts)
  L->>L: tokens = min(cap, tokens + elapsed*rate)
  alt tokens >= cost
    L->>L: tokens -= cost; allowed=1
  else
    L->>L: retry_after = deficit/rate; allowed=0
  end
  L->>L: HSET + PEXPIRE
  L-->>T: {allowed, remaining, retry_after, limit}`;

export const MERMAID_CLASS = `classDiagram
  class RateLimiter {
    <<interface>>
    +allow(RequestContext) RateLimitResult
  }
  class TokenBucketRateLimiter
  class CompositeRateLimiter
  class RateLimitStore {
    <<interface>>
    +consume(key, policy, cost) RateLimitResult
  }
  class RedisRateLimitStore
  class InMemoryRateLimitStore
  class RateLimiterFactory
  class RateLimitFilter
  RateLimiter <|.. TokenBucketRateLimiter
  RateLimiter <|.. CompositeRateLimiter
  TokenBucketRateLimiter --> RateLimitStore
  CompositeRateLimiter --> RateLimiter
  RateLimitStore <|.. RedisRateLimitStore
  RateLimitStore <|.. InMemoryRateLimitStore
  RateLimiterFactory --> RateLimiter
  RateLimitFilter --> RateLimiter`;

export const MERMAID_LAYERS = `flowchart LR
  subgraph Edge
    WAF[WAF]
    GW[Gateway throttle]
  end
  subgraph App
    Local[Local pre-limiter]
    RedisL[Redis token bucket]
  end
  subgraph Downstream
    Conc[Concurrency limit]
    CB[Circuit breaker]
    Dep[DB / Provider]
  end
  WAF --> GW --> Local --> RedisL --> Conc --> CB --> Dep`;

export const MERMAID_PAYMENT = `flowchart TB
  C[Client]
  CF[CloudFront]
  WAF[WAF]
  GW[API Gateway tenant/global]
  PS[Payment Service]
  SL[Service-level limits user+API]
  K[Kafka payment.commands]
  PP[Payment Processor]
  DB[(Ledger DB)]

  C --> CF --> WAF --> GW --> PS
  PS --> SL
  SL -->|allow| K --> PP --> DB
  SL -->|deny| R429[HTTP 429]`;
