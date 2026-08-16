import type {InterviewQ} from './types';

function q(partial: Omit<InterviewQ, 'id'> & {id: string}): InterviewQ {
  return partial;
}

export const SENIOR: InterviewQ[] = [
  q({
    id: 's1',
    level: 'senior',
    topic: 'Requirements',
    question: 'What does a distributed rate limiter actually guarantee?',
    answer30s: 'A shared, approximately global quota so N app servers cannot grant N× the limit.',
    answer2m:
      'Per identity and route we admit or reject with remaining tokens and Retry-After. Consistency is single-key atomic in Redis, not multi-region linearizability. Availability is a declared fail policy.',
    followUps: ['What is not guaranteed?'],
    expects: 'Shared quota + identity + 429 semantics + fail policy',
    wrongAnswer: 'Perfect global consistency across all regions forever',
    seniorInsight: 'Say what you give up: cross-region exactness and multi-key atomic AND.',
    trick: 'Claiming every region shares one perfectly consistent counter.',
  }),
  q({
    id: 's2',
    level: 'senior',
    topic: 'Algorithm',
    question: 'Why Token Bucket over Fixed Window?',
    answer30s: 'Burst + sustained in one model; fixed window allows ~2× at boundaries.',
    answer2m:
      'Capacity is burst; refillRate/period is sustained; Retry-After = deficit/rate; O(1) memory. Fixed window INCR is cheap but a client can spend limit at :59 and again at :00.',
    followUps: ['When leaky bucket?', 'When sliding log?'],
    expects: 'Boundary burst explanation + capacity vs refill',
    wrongAnswer: 'They are the same if the window is one second',
    seniorInsight: 'Name industry defaults (Stripe/AWS/Envoy-style buckets).',
  }),
  q({
    id: 's3',
    level: 'senior',
    topic: 'Redis',
    question: 'Why Lua?',
    answer30s: 'Refill and consume must be one atomic operation on one key.',
    answer2m:
      'GET then SET from Java races: two pods read 1 token and both admit. EVAL is single-threaded per shard. Cluster: one KEY so no CROSSSLOT. TTL via PEXPIRE.',
    followUps: ['WATCH/MULTI instead?', 'Redis 7 functions?'],
    expects: 'Race demo + single-key script',
    wrongAnswer: 'INCR alone is a token bucket',
    seniorInsight: 'Show the two-thread GET=1 failure on a whiteboard.',
  }),
  q({
    id: 's4',
    level: 'senior',
    topic: 'Placement',
    question: 'Gateway vs application rate limiting?',
    answer30s: 'Both. Gateway for unauth floods; app library for JWT identity and per-API quotas.',
    answer2m:
      'Gateway often lacks stable user ids before auth. A remote limiter service adds a hop that blows a 5ms SLO. Platform library + Redis is the usual Staff answer; WAF is not a product quota.',
    followUps: ['Sidecar/Envoy ratelimit?'],
    expects: 'Defense in depth with clear roles',
    wrongAnswer: 'Only gateway OR only app',
  }),
  q({
    id: 's5',
    level: 'senior',
    topic: 'Failure',
    question: 'Redis is down. Fail open or fail closed?',
    answer30s: 'Per-route. Payments fail-closed; public reads may fail-open briefly.',
    answer2m:
      'Never a global religion. Payments/OTP: fail-closed. Marketing GET: fail-open + page. Internal workers: local fallback. Timeouts must be milliseconds or the app dies waiting.',
    followUps: ['Slow Redis vs down?'],
    expects: 'Business risk → policy mapping',
    wrongAnswer: 'Always fail-open for availability',
    trick: 'Always fail-open “because availability”.',
  }),
  q({
    id: 's6',
    level: 'senior',
    topic: 'HTTP',
    question: 'What do you return on reject?',
    answer30s: '429, Retry-After, X-RateLimit-Limit/Remaining/Reset.',
    answer2m:
      'Not 401/403. Body may include policy id. Remaining is 0. Reset is when a token should exist. Be careful exposing exact internal global caps to attackers.',
    followUps: ['503 vs 429?'],
    expects: 'Header set + semantic distinction from auth',
    wrongAnswer: '403 Forbidden',
  }),
  q({
    id: 's7',
    level: 'senior',
    topic: 'Multi-level',
    question: 'How do global + tenant + user limits compose?',
    answer30s: 'AND. Fail-fast sequential EVAL per key.',
    answer2m:
      'A request needs a token from every matching policy. We do not MULTI across hash slots. Outer reject skips inner spend — a documented trade-off.',
    followUps: ['Atomic AND with hash-tags?'],
    expects: 'AND semantics + CROSSSLOT awareness',
    wrongAnswer: 'One Redis MULTI across unrelated keys in Cluster without tags',
  }),
  q({
    id: 's8',
    level: 'senior',
    topic: 'Distributed',
    question: '10 servers each with local limit 100 — what happens?',
    answer30s: 'Up to 1,000 cluster-wide. Local maps are not global quotas.',
    answer2m:
      'This is the #1 interview trap. Shared Redis (or gateway) is required for a true 100/s identity limit. Local is only pre-limit or fallback.',
    followUps: ['Resilience4j RateLimiter?'],
    expects: 'N× multiplication insight',
    wrongAnswer: 'It is fine if we use AtomicInteger',
  }),
  q({
    id: 's9',
    level: 'senior',
    topic: 'Hot keys',
    question: 'How do you handle Redis hot keys?',
    answer30s: 'Detect, pre-limit locally, hierarchical keys, shard celebrity keys.',
    answer2m:
      'One slot melts under a viral tenant. Gateway caps first. Local fractional bucket. Split into N keys with approximate sum. Isolate payment Redis. Alert hot_keys before CPU=100%.',
    followUps: ['Hash tags making it worse?'],
    expects: 'Detection + multiple mitigations',
    wrongAnswer: 'Just add more Redis memory',
  }),
  q({
    id: 's10',
    level: 'senior',
    topic: 'Clock',
    question: 'Does clock skew break token bucket?',
    answer30s: 'Yes if apps supply wall time. Prefer Redis TIME; clamp negative elapsed.',
    answer2m:
      'A fast clock refills faster and steals quota. Client device clocks are untrusted. Lab clamps elapsed < 0; production Lua can call TIME.',
    followUps: ['Monotonic vs wall clock?'],
    expects: 'Redis TIME / clamp',
    wrongAnswer: 'Java nanoTime across pods',
  }),
  q({
    id: 's11',
    level: 'senior',
    topic: 'Retry',
    question: 'How do you avoid retry storms after 429?',
    answer30s: 'Honor Retry-After; exponential backoff + jitter; max attempts.',
    answer2m:
      'Immediate retry turns a soft overload into a hard one. SDKs must default correctly. Gateways may connection-limit abusive clients.',
    followUps: ['Idempotency keys on payment retry?'],
    expects: 'Backoff + Retry-After',
    wrongAnswer: 'Client retries every 10ms until success',
  }),
  q({
    id: 's12',
    level: 'senior',
    topic: 'Security',
    question: 'Is IP-only rate limiting enough?',
    answer30s: 'No. Bots rotate IPs; NAT collapses users. Key by principal.',
    answer2m:
      'Authenticate first. Limit user/API key/tenant. IP is secondary for unauth. WAF/Shield handle volumetric DDoS — app quotas are a different layer.',
    followUps: ['Credential stuffing?'],
    expects: 'Identity strategy',
    wrongAnswer: 'IP is always the best key',
  }),
  q({
    id: 's13',
    level: 'senior',
    topic: 'DB',
    question: 'Why not rate limit with PostgreSQL?',
    answer30s: 'Hot-row locks and latency turn the DB into the bottleneck.',
    answer2m:
      'UPDATE counters on every request contends. Redis O(1) hash + Lua is the hot path; Postgres stores durable policies.',
    followUps: ['When is DB OK?'],
    expects: 'Contention argument',
    wrongAnswer: 'DB is strongly consistent so it is better for rate limits',
  }),
  q({
    id: 's14',
    level: 'senior',
    topic: 'Concurrency',
    question: 'Rate limit vs concurrency limit?',
    answer30s: 'Rate = how often; concurrency = how many in flight.',
    answer2m:
      '100 rps of 2s calls needs ~200 concurrency mathematically. Cap both: rate for fairness, concurrency for pools.',
    followUps: ['Bulkhead?'],
    expects: 'Both needed for slow handlers',
  }),
  q({
    id: 's15',
    level: 'senior',
    topic: 'Observability',
    question: 'What do you page on?',
    answer30s: 'Reject storms on payments, Redis p99, errors, fail-open volume, unconfigured requests.',
    answer2m:
      'Distinguish customers hitting plan from Redis sickness. Cardinality-careful labels. Do not INFO-log every 429 during an attack.',
    followUps: ['Sampling strategy?'],
    expects: 'Signal taxonomy',
  }),
];

export const ARCHITECT: InterviewQ[] = [
  q({
    id: 'a1',
    level: 'architect',
    topic: 'Scale',
    question: 'Design for 1M RPS.',
    answer30s: 'Regional Redis, local admission, hierarchical keys, isolate money paths, edge enforcement.',
    answer2m:
      'Do not funnel 1M EVAL to one primary. Partition by region. Local buckets cut Redis QPS. Sliding counter for coarsest global key if needed. Payment Redis separate failure domain.',
    followUps: ['Capacity math?'],
    expects: 'Assumptions + layered design',
    wrongAnswer: 'One global Redis in us-east-1 for the world',
    trick: 'One global Redis Cluster in us-east-1 for the world.',
  }),
  q({
    id: 'a2',
    level: 'architect',
    topic: 'Consistency',
    question: 'Is the limiter linearizable?',
    answer30s: 'Per key on one Redis primary, yes. Across regions, no.',
    answer2m:
      'Lua on a primary is linearizable for that key. Async replication can lose a few tokens on failover. Dual-write two regions over-admits. Hard global caps need a slower central product.',
    followUps: ['WAIT / sync replication?'],
    expects: 'Scope of linearizability',
  }),
  q({
    id: 'a3',
    level: 'architect',
    topic: 'Multi-region',
    question: 'How do you rate limit across 20 AWS regions?',
    answer30s: 'Usually regional Redis with approximate globals; hard globals are a different service.',
    answer2m:
      'Options: one global Redis (latency/availability pain), regional independent (over-admit), or approximate via sampling/central aggregator. Staff answer: regional product quotas + edge; hard global only if finance requires it.',
    followUps: ['Latency vs correctness?'],
    expects: 'Three options + trade-offs',
    wrongAnswer: 'Cross-region Redis Cluster with multi-key transactions',
  }),
  q({
    id: 'a4',
    level: 'architect',
    topic: 'CAP',
    question: 'Explain rate limiting under partition.',
    answer30s: 'You choose reject-on-uncertainty or admit-on-uncertainty per route.',
    answer2m:
      'Not “pick any two.” When app↔Redis partitions, fail-closed leans C for money; fail-open leans A for public reads. Dual primaries for one key is broken — fail closed.',
    followUps: ['AP vs CP stores?'],
    expects: 'Nuanced CAP for the limiter dependency',
  }),
  q({
    id: 'a5',
    level: 'architect',
    topic: 'Fairness',
    question: 'How do you keep one tenant from eating the cluster?',
    answer30s: 'Per-tenant quotas, plan tiers, reserved capacity, gateway fairness.',
    answer2m:
      'Hard tenant buckets; premium reserved headroom; weighted shedding; alert when tenant approaches tenant+global. Isolation is key design, not hope.',
    followUps: ['Noisy neighbor Redis CPU?'],
    expects: 'Product + infra fairness',
  }),
  q({
    id: 'a6',
    level: 'architect',
    topic: 'AWS',
    question: 'WAF vs API Gateway vs app Redis — who does what?',
    answer30s: 'WAF=flood/bot; Gateway=coarse keys; App Redis=product quotas.',
    answer2m:
      'Shield/WAF absorb volumetric abuse. Gateway usage plans help API keys. JWT tenant/user/API quotas live in the service with Redis Lua and proper 429 semantics.',
    followUps: ['When is managed enough?'],
    expects: 'Layered ownership',
  }),
  q({
    id: 'a7',
    level: 'architect',
    topic: 'Adaptive',
    question: 'Dynamically adjust limits based on downstream saturation?',
    answer30s: 'Yes — feedback from DB/provider lag into effective refill, carefully.',
    answer2m:
      'Adaptive concurrency (Netflix/TCP Vegas-style) pairs with rate limits. Lower refill when provider error rate rises. Never thrash quotas every second; dampen. Keep product floor/ceiling.',
    followUps: ['Oscillation risk?'],
    expects: 'Feedback control caution',
  }),
  q({
    id: 'a8',
    level: 'architect',
    topic: 'Kafka',
    question: 'Rate limit Kafka consumers?',
    answer30s: 'Admit before DB write; pause/delay when limited; lag is backpressure.',
    answer2m:
      'Protect DB IOPS with per-tenant allow before write. Do not busy-spin. Producer throttle similarly. Distinguish pause/resume from offset commit mistakes.',
    followUps: ['Partition key choice?'],
  }),
  q({
    id: 'a9',
    level: 'architect',
    topic: 'Config',
    question: 'Change quotas without restart?',
    answer30s: 'DB + Kafka fan-out to in-memory policy maps; next allow() sees new rates.',
    answer2m:
      'Version policies; validate; shadow then enforce; audit. Existing Redis tokens refill toward new capacity — do not silently wipe unless intended.',
    followUps: ['Poison config?'],
  }),
  q({
    id: 'a10',
    level: 'architect',
    topic: 'Cost',
    question: 'How do you minimize Redis cost at scale?',
    answer30s: 'Local pre-limit, fewer policies evaluated, O(1) algorithms, TTL, isolate clusters.',
    answer2m:
      'Every EVAL costs. Cut QPS with local admission; fail-fast policy order; avoid sliding-log; expire idle keys; right-size Cluster; do not store request logs for everyone.',
    followUps: ['When add a limiter fleet?'],
  }),
];

export const PRINCIPAL: InterviewQ[] = [
  q({
    id: 'p1',
    level: 'principal',
    topic: '10M RPS',
    question: 'How would you design rate limiting for 10M requests/sec?',
    answer30s: 'Edge shedding + regional clusters + local admission + hierarchical approx globals.',
    answer2m:
      'Most decisions happen at CDN/WAF/gateway. App Redis only for authenticated product keys that survive the edge. Shard by tenant range; isolate money; accept approximate globals; invest in load-test realism.',
    followUps: ['Where does Lua still run?'],
    expects: 'Edge-heavy architecture',
    seniorInsight: 'Principal answer moves work out of the app hot path.',
  }),
  q({
    id: 'p2',
    level: 'principal',
    topic: 'Payments',
    question: 'Special rules for payment APIs?',
    answer30s: 'Fail-closed, strict identity, idempotency, audit, conservative bursts.',
    answer2m:
      'Money paths need fail-closed, lower burst, strong principal keys, idempotency keys on client retries, audit of limit changes, separate Redis domain, and never log PANs in 429 bodies.',
    followUps: ['Regulatory audit of quota changes?'],
  }),
  q({
    id: 'p3',
    level: 'principal',
    topic: 'DR',
    question: 'Recover rate-limit state after disaster recovery?',
    answer30s: 'Buckets are ephemeral — rebuild empty at capacity; policies restore from DB.',
    answer2m:
      'Token buckets are not ledger state. After DR, empty buckets = full capacity (burst). That is usually OK. Policies come from config DB. Document the burst after failover.',
    followUps: ['Customers gaming DR bursts?'],
  }),
  q({
    id: 'p4',
    level: 'principal',
    topic: 'Abuse',
    question: 'Detect abusive clients beyond static quotas?',
    answer30s: 'Anomaly on RPS, error mix, fingerprint; graduated throttle → block.',
    answer2m:
      'Quotas are baseline. Abuse systems watch velocity, device/IP graphs, payment decline rates. Graduated response: tighten refill, challenge, revoke API key, WAF block.',
    followUps: ['False positives on flash sales?'],
  }),
  q({
    id: 'p5',
    level: 'principal',
    topic: 'Org',
    question: 'Who owns conflicting gateway vs service limits?',
    answer30s: 'Platform owns edge flood; product owns quotas; published matrix.',
    answer2m:
      'Without ownership, customers get two 429 languages. Principal sets an ownership matrix, SLOs, and a single customer-facing remaining-quota story where possible.',
    followUps: ['How to migrate legacy?'],
  }),
  q({
    id: 'p6',
    level: 'principal',
    topic: 'Cascade',
    question: 'Can rate limiting itself cause cascading failure?',
    answer30s: 'Yes — slow Redis, no timeouts, retry storms, log storms, fail-closed on everything.',
    answer2m:
      'Limiter without timeouts blocks threads. Logging every reject fills disks. Clients ignoring Retry-After amplify. Fail-closed on non-critical paths creates self-DDoS. Design the limiter like a dependency with SLOs.',
    followUps: ['Load-shed the limiter?'],
    expects: 'Limiter as potential hazard',
  }),
  q({
    id: 'p7',
    level: 'principal',
    topic: 'Hybrid',
    question: 'Local + Redis hybrid — when is it worth it?',
    answer30s: 'When Redis QPS/hot keys dominate; accept bounded over-admit.',
    answer2m:
      'Local fractional quotas reduce Redis load but can over-admit and reset on deploy. Add only with metrics proving Redis is the bottleneck and with documented error bars.',
    followUps: ['Token reservation protocols?'],
  }),
  q({
    id: 'p8',
    level: 'principal',
    topic: 'Testing',
    question: 'What proves correctness under concurrency?',
    answer30s: 'N threads, capacity C, refill≈0 → allowed == C against Redis and memory.',
    answer2m:
      'Plus refill with fake clock, multi-tenant isolation, fail policies, Testcontainers Redis, chaos latency, and client backoff tests. The concurrency test is the design proof.',
    followUps: ['Property-based tests?'],
  }),
];

export const RAPID: InterviewQ[] = [
  q({id:'r1',level:'rapid',topic:'Rapid',question:'HTTP status when over quota?',answer30s:'429',answer2m:'Retry-After + X-RateLimit-*',followUps:['Not 401'],expects:'429'}),
  q({id:'r2',level:'rapid',topic:'Rapid',question:'Lab port?',answer30s:'8098',answer2m:'spring-rate-limiter-lab',followUps:['mvn test']}),
  q({id:'r3',level:'rapid',topic:'Rapid',question:'Why Lua?',answer30s:'Atomic refill+consume',answer2m:'Single key EVAL',followUps:['CROSSSLOT?']}),
  q({id:'r4',level:'rapid',topic:'Rapid',question:'Payments Redis down?',answer30s:'Fail closed',answer2m:'Public GET fail open',followUps:['Local fallback?']}),
  q({id:'r5',level:'rapid',topic:'Rapid',question:'10 servers local limit 100?',answer30s:'1000 cluster',answer2m:'Need Redis/GW',followUps:['R4j?']}),
  q({id:'r6',level:'rapid',topic:'Rapid',question:'Burst vs sustained?',answer30s:'capacity vs refillRate',answer2m:'cap 120, refill 100/min',followUps:['Leaky?']}),
  q({id:'r7',level:'rapid',topic:'Rapid',question:'Key shape?',answer30s:'rate_limit:{tenant}:scope:id',answer2m:'Hash-tag tenant carefully',followUps:['Hot tag?']}),
  q({id:'r8',level:'rapid',topic:'Rapid',question:'Fixed window bug?',answer30s:'2× at boundary',answer2m:'Use bucket or sliding',followUps:['Log vs counter']}),
  q({id:'r9',level:'rapid',topic:'Rapid',question:'Who owns now?',answer30s:'Redis TIME or NTP',answer2m:'Clamp negative elapsed',followUps:['Client clock?']}),
  q({id:'r10',level:'rapid',topic:'Rapid',question:'Reject header?',answer30s:'Retry-After',answer2m:'Seconds to wait',followUps:['Reset header']}),
  q({id:'r11',level:'rapid',topic:'Rapid',question:'Sliding log structure?',answer30s:'Redis ZSET timestamps',answer2m:'Memory heavy',followUps:['When OK?']}),
  q({id:'r12',level:'rapid',topic:'Rapid',question:'Leaky vs token?',answer30s:'Leaky smooths; token allows burst',answer2m:'APIs usually token',followUps:['Shaping?']}),
  q({id:'r13',level:'rapid',topic:'Rapid',question:'GET+SET race?',answer30s:'Double admit',answer2m:'Use Lua',followUps:['Demo?']}),
  q({id:'r14',level:'rapid',topic:'Rapid',question:'WAF replaces Redis quotas?',answer30s:'No',answer2m:'Different layer',followUps:['Shield?']}),
  q({id:'r15',level:'rapid',topic:'Rapid',question:'Resilience4j distributed?',answer30s:'No — per JVM',answer2m:'Use with Redis layer',followUps:['Bulkhead?']}),
  q({id:'r16',level:'rapid',topic:'Rapid',question:'HTTP header for wait?',answer30s:'Retry-After',answer2m:'Plus X-RateLimit-*',followUps:['Reset']}),
  q({id:'r17',level:'rapid',topic:'Rapid',question:'Multi-level composition?',answer30s:'AND all policies',answer2m:'Fail-fast sequential',followUps:['CROSSSLOT']}),
  q({id:'r18',level:'rapid',topic:'Rapid',question:'Celebrity tenant fix?',answer30s:'Shard + pre-limit',answer2m:'Gateway cap first',followUps:['Hash tag?']}),
];

export const ALL: InterviewQ[] = [...SENIOR, ...ARCHITECT, ...PRINCIPAL, ...RAPID];
