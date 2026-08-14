export type CodeSequence = {
  id: string;
  title: string;
  endpoint: string;
  classes: string[];
  why: string;
  mermaid: string;
};

export const CODE_SEQUENCES: CodeSequence[] = [
  {
    id: 'lookup-miss',
    title: 'Definitely absent → 404',
    endpoint: 'GET /api/users/no-such-user',
    classes: ['UserService', 'BloomFilter', 'BloomFilterService'],
    why: 'Bloom returns false ⇒ element was never inserted (no false negatives). Skip Redis and DB entirely — this kills cache penetration.',
    mermaid: `sequenceDiagram
  participant C as Client
  participant API as UserController
  participant BF as BloomFilter
  participant R as Cache
  participant DB as Database
  C->>API: GET /users/no-such
  API->>BF: mightContain
  BF-->>API: false
  API-->>C: 404
  Note over R,DB: never touched`,
  },
  {
    id: 'lookup-hit',
    title: 'Maybe present → cache → DB',
    endpoint: 'GET /api/users/user-1',
    classes: ['UserService', 'InMemoryUserCache', 'UserRepository'],
    why: 'True means maybe. Source of truth remains Redis/DB. False positives only cost an extra lookup.',
    mermaid: `sequenceDiagram
  participant API as API
  participant BF as Bloom
  participant R as Cache
  participant DB as DB
  API->>BF: mightContain(user-1)
  BF-->>API: true (maybe)
  API->>R: get
  alt cache hit
    R-->>API: user
  else cache miss
    API->>DB: findById
    DB-->>API: user
    API->>R: put
  end`,
  },
  {
    id: 'create',
    title: 'Create user updates Bloom',
    endpoint: 'POST /api/users',
    classes: ['UserService', 'BloomFilterService'],
    why: 'After DB insert, add the id to the filter. Otherwise new users false-negative until rebuild.',
    mermaid: `flowchart TD
  P[POST /users] --> DB[(INSERT users)]
  DB --> BF[bloom.add userId]
  BF --> Cache[cache.put]
  Cache --> 201[201 Created]`,
  },
  {
    id: 'rebuild',
    title: 'Rebuild from DB',
    endpoint: 'POST /api/bloom/rebuild',
    classes: ['BloomFilterService'],
    why: 'Startup and healing path: load all ids, clear bits, re-add. For zero downtime, build a new filter then swap atomically.',
    mermaid: `flowchart LR
  DB[(SELECT id)] --> Rebuild[rebuildFrom]
  Rebuild --> Bits[BitSet replaced]
  Bits --> Stats[metrics updated]`,
  },
  {
    id: 'idempotency',
    title: 'Kafka: Bloom hint + truth store',
    endpoint: 'IdempotencyGuard.tryProcess',
    classes: ['IdempotencyGuard'],
    why: 'Bloom alone must not skip events — FPs would drop never-seen messages. Truth = Redis SET NX / DB UNIQUE.',
    mermaid: `flowchart TD
  E[eventId] --> BF{Bloom maybe?}
  BF -->|definitely no| Proc[Process]
  BF -->|maybe| Truth{Redis/DB seen?}
  Truth -->|yes| Skip[Skip duplicate]
  Truth -->|no| Proc
  Proc --> Record[Record truth + Bloom.add]`,
  },
];
