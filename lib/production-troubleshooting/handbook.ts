/**
 * Production Engineer Hub — 15+ YOE IC content.
 * Evidence-driven incident response: mitigate ≠ RCA, measure before change.
 * No typed imports — string constants and string[][] only.
 */

export const MINDSET_ASCII = `
PRODUCTION IC MINDSET (15+ YOE)
════════════════════════════════════════════════════════════════

  SYMPTOM  ≠  ROOT CAUSE
    Alert / 5xx / lag / OOM is a symptom.
    Root cause is the mechanism (slow SQL, pool math, retry storm, bad deploy).
    Never stop at the first red panel.

  IMMEDIATE  ≠  PERMANENT
    Immediate: stop bleeding (shed, rollback, kill one query, open CB).
    Permanent: fix mechanism + prevent recurrence (index, timeout budget, canary).
    Saying "we restarted" in a postmortem is not a root cause.

  NEVER CARGO-CULT RESTART
    Restart buys minutes; it destroys evidence (heaps, thread dumps, WAL position).
    Capture dump / lag / EXPLAIN / deploy marker FIRST when safe.
    Rolling restart is a controlled mitigation — not a diagnosis.

  EVIDENCE LADDER (speak this)
    Impact → Change window → Golden signals → Trace → Layer metrics → One change

  IC CONTRACT
    Own the blast radius. Narrate decisions. One variable at a time.
    Prefer reversible mitigations. Write the prevent ticket before you close.
`.trim();

export const UNIVERSAL_FRAMEWORK_ASCII = `
UNIVERSAL INCIDENT FRAMEWORK (IC)
════════════════════════════════════════════════════════════════

  Alert → Triage → Impact → Mitigate → Contain → RCA → Recover → Validate → Postmortem → Prevent

  Alert        Page / SLO burn / customer ticket — confirm it is real
  Triage       Severity, blast radius, recent change, "is money moving?"
  Impact       Who / what / when; error budget burn; write vs read path
  Mitigate     Stop bleeding NOW (shed, rollback, CB, kill one query)
  Contain      Limit spread (isolate shard, pause consumer, feature flag)
  RCA          Mechanism with evidence — not "it was slow"
  Recover      Restore capacity safely (scale after fix, drain, rebalance)
  Validate     Signals back to baseline; smoke critical money paths
  Postmortem   Blameless timeline + action items with owners
  Prevent      Guardrails: alert, test, canary, capacity, runbook

  ── Measure / Trace / Resource tree (IC-focused) ──

                    USER / ALERT / SLO BURN
                             |
                             ↓
                    Measure RED + USE + change window
                    (P50/P95/P99, errors, saturation, deploy)
                             |
                             ↓
                     Distributed Trace (where time went)
                             |
          +------------------+------------------+
          ↓                  ↓                  ↓
        CPU                Memory             I/O / Wait
          |                  |                  |
     JFR / top /        Heap / GC /        DB · Redis · Kafka
     flame graph        OOMKilled          · network · disk
          |                  |                  |
          +------------------+------------------+
                             |
                             ↓
                    Name ONE bottleneck mechanism
                             |
                             ↓
              Mitigate (reversible)  then  Fix mechanism
                             |
                             ↓
                    Validate vs baseline → Prevent

  Rule: never optimize or restart without a named bottleneck + evidence.
`.trim();

export const FIRST_MINUTES_ROWS: string[][] = [
  ['Window', 'Establish', 'Decide'],
  [
    '0–30s',
    'Alert real? Scope (one service / region / tenant)? Severity gut-check.',
    'Join bridge; declare incident commander if P1/P2; start timeline note.',
  ],
  [
    '0–2m',
    'Blast radius + money path? Recent deploy/config? Golden signals vs baseline.',
    'Mitigate vs investigate-first; assign roles (comms, digger, scribe).',
  ],
  [
    '0–5m',
    'Trace sample + top dependency; change marker; error class (4xx/5xx/timeout).',
    'Pick ONE immediate lever (rollback / shed / CB / kill query) — announce it.',
  ],
  [
    '0–15m',
    'Containment holding? Evidence packed (dump/lag/EXPLAIN)? Customer impact trend.',
    'Escalate if burn continues; freeze multi-changes; prepare recover plan.',
  ],
  [
    'After recovery',
    'Baseline restored; smoke money paths; no silent lag/debt left behind.',
    'Open RCA + prevent tickets; schedule postmortem; clear incident status.',
  ],
];

export const LAYER_CHAIN_ASCII = `
WHERE TO LOOK (payment / API path)
════════════════════════════════════════════════════════════════

  Client → CF → APIGW → ALB → Service → Redis → PG → Kafka → Downstream
    |       |     |      |       |        |      |     |         |
    FE/CDN  Edge  Auth   LB    App/JVM  Cache   DB   Events    Vendor
    chunks  WAF   429    502   threads  miss   locks lag       timeout
    CORS    cache 403    504   pools    hotkey plans rebal     CB OPEN

  Quick "which layer?" prompts
  • Browser-only / ChunkLoadError ………… Client / CF
  • 401/403/429 at edge …………………… APIGW (+ WAF/authorizer)
  • 502/503/504 before app logs ………… ALB / targets / idle timeout
  • App p99↑, deps OK ……………………… Service (CPU/GC/pool/lock)
  • Hit ratio↓ + DB QPS↑ ………………… Redis stampede / flush
  • Wait events / seq scans ……………… PG
  • Consumer lag / rebalance …………… Kafka (+ Debezium if CDC)
  • External span dominates …………… Downstream (+ retry storm)

  IC rule: start at the highest failing hop with evidence, then walk down.
`.trim();

export const IMMEDIATE_VS_PERMANENT_ROWS: string[][] = [
  ['Situation', 'Immediate mitigation', 'Permanent fix', 'Never'],
  [
    'Bad deploy → 5xx spike',
    'Rollback / flag OFF / canary halt',
    'Test gap + canary gates + change freeze policy',
    'Forward-fix while customers burn without a plan',
  ],
  [
    'Hikari timeouts under peak',
    'Shed RPS; kill top slow query; pause noncritical jobs',
    'Shorten TX hold; pool math vs DB max; index/query fix',
    'Blindly raise maximumPoolSize across all pods',
  ],
  [
    'Kafka consumer lag',
    'Pause producers carefully OR scale consumers if CPU-bound handler',
    'Faster handler; partition plan; processing SLO + DLQ policy',
    'Add partitions mid-incident without rebalance plan',
  ],
  [
    'JVM OOM / OOMKilled',
    'Rolling restart after heap dump if possible; reduce traffic',
    'Fix leak / bound cache; right-size limit+request; alloc budget',
    'Only raise -Xmx and walk away',
  ],
  [
    'PG CPU pegged',
    'Cancel one expensive query; read replica for heavy reports',
    'Index / rewrite; statement_timeout; workload isolation',
    'Kill sessions randomly or VACUUM FULL at peak',
  ],
  [
    'Downstream timeout cascade',
    'Open CB / fail soft / disable nested retries',
    'Timeout budgets; bulkheads; idempotent retry owner',
    'Increase retries and timeouts everywhere',
  ],
  [
    'Cache flush / miss storm',
    'Rate-limit rebuild; singleflight; serve stale if safe',
    'TTL jitter; soft dependency design; warm strategy',
    'FLUSHALL "to fix inconsistency" in prod',
  ],
  [
    'Debezium / CDC lag',
    'Pause noisy consumers; check slot + WAL disk; scale Connect carefully',
    'Snapshot strategy; slot monitoring; transform cost; topic sizing',
    'Drop replication slot to "free disk" without recovery plan',
  ],
];

export const ANTI_PATTERNS: string[][] = [
  ['Never do', 'Why dangerous', 'Do instead'],
  [
    'Blind restart of all pods',
    'Destroys dumps/traces; masks leak; can cause thundering herd',
    'Capture evidence; rolling restart only as named mitigation',
  ],
  [
    'Raise connection pools "for capacity"',
    'Fleet × pool exceeds DB max_connections → worse outage',
    'Fix hold time + query; budget pools globally',
  ],
  [
    'Add Kafka partitions mid-fire',
    'Rebalance storm; key ordering surprises; brief zero progress',
    'Scale consumers or speed handler first; plan partition change',
  ],
  [
    'Bump heap / -Xmx only',
    'Hides leaks; longer GC; still OOMKilled by cgroup',
    'Heap dump → retained set; align limit with container',
  ],
  [
    'Raise thread pool max',
    'Amplifies DB/lock contention; Little\'s Law queues grow',
    'Find wait stacks; bulkhead; fix blocking dependency',
  ],
  [
    'Nested retries (client+GW+app+SDK)',
    'Retry storm multiplies load during outage',
    'One retry owner; jitter; CB; idempotency keys',
  ],
  [
    'Kill DB sessions blindly',
    'May kill critical writers; rollback storms; data surprises',
    'Identify blocker via pg_stat_activity; cancel targeted PID',
  ],
  [
    'Run expensive ANALYZE/EXPLAIN/report SQL at peak',
    'Steals CPU/IO from money path',
    'Use replicas; rate-limit admin; statement_timeout',
  ],
  [
    'Change many knobs at once',
    'Cannot attribute recovery; reintroduces risk',
    'One variable; announce; measure; then next',
  ],
  [
    'Silence / delete noisy alerts',
    'Removes early warning; hides next incident',
    'Tune threshold/SLO burn; fix flappy probe; document',
  ],
  [
    'Logs-only observability',
    'No latency/saturation story; cannot find wait vs CPU',
    'Metrics + traces + profiles + infra/DB/Kafka panels',
  ],
  [
    'Disable circuit breaker "to keep trying"',
    'Turns partial outage into full cascade',
    'Keep CB; improve fallback; fix dependency',
  ],
  [
    'Scale replicas before fixing bad query',
    'Multiplies load and cost against the same bottleneck',
    'Fix mechanism, then scale with headroom math',
  ],
  [
    'Flush Redis to "clear bad state"',
    'Stampede to DB; possible consistency cliff',
    'Key-level invalidate; singleflight; controlled rebuild',
  ],
  [
    'Force-push schema rollback that is incompatible',
    'Extends outage; dual-write corruption risk',
    'Expand/contract; fix forward with compatibility matrix',
  ],
  [
    'Ignore lag "because API is green"',
    'Silent money/event debt; surprise when consumers catch up',
    'Treat lag SLO as first-class; validate after recovery',
  ],
  [
    'Copy prod traffic to debug without redaction',
    'PII/secrets leak; compliance incident on top of outage',
    'Synthetic repro; scrubbed samples; approved tooling',
  ],
];

export const DECISION_TREES = {
  apiSlow: `
API SLOW (p95/p99↑) — decision tree
START: Scope (one route?) + change window + trace sample
  ├─ Time mostly outside this service?
  │     ├─ Downstream p99↑ → their SLO / CB / timeout budget
  │     ├─ Fan-out N sequential → parallelize or aggregate
  │     └─ LB/GW idle timeout near p99 → budget mismatch
  ├─ Time in DB / Redis / Kafka?
  │     ├─ Slow SQL / seq scan → EXPLAIN; index; kill one query
  │     ├─ Pool wait (Hikari) → hold time + fleet×pool math
  │     ├─ Redis miss/hot key → singleflight; split key
  │     └─ Kafka sync path → make async + status
  └─ Time in app CPU / GC / locks?
        ├─ Flame/JFR hot frames → fix alloc/hot path
        ├─ GC pauses correlate → cut churn; heap size evidence
        └─ Thread dump BLOCKED/WAITING → lock or dep timeout
`.trim(),

  kafkaLag: `
KAFKA CONSUMER LAG — decision tree
START: Lag by partition + produce vs consume rate + rebalance count
  ├─ Produce >> consume?
  │     ├─ Handler slow (DB/HTTP inside poll) → speed path / batch
  │     ├─ Consumer CPU maxed → scale consumers (if partitions allow)
  │     └─ Too few partitions → plan increase (not mid-chaos if avoidable)
  ├─ Frequent rebalances?
  │     ├─ GC / OOM / probe kills → stabilize membership
  │     ├─ session.timeout / max.poll.interval → tune with evidence
  │     └─ Scaling thrash → cool down; sticky assignor if appropriate
  ├─ Poison message / stuck partition?
  │     └─ DLQ + skip with audit; fix deserializer/handler
  └─ Broker / disk / ISR issues?
        └─ Cluster health first; app tuning second
`.trim(),

  oom: `
OOM / OOMKilled — decision tree
START: JVM OOM vs cgroup OOMKilled? Heap dump available?
  ├─ Heap dump → retained set
  │     ├─ Unbounded cache/map → bound + TTL + size metric
  │     ├─ Listener / static leak → fix reference graph
  │     └─ Huge payload / buffer → stream; size limits
  ├─ No dump, RSS climbs, heap flat?
  │     └─ Direct/native/metaspace → NMT; DirectByteBuffer; threads
  ├─ After deploy only?
  │     └─ Rollback; compare alloc rate / cache defaults
  └─ Undersized limit only?
        └─ Right-size WITH leak check; align -Xmx < limit
`.trim(),

  pgCpu: `
POSTGRES CPU HIGH — decision tree
START: top SQL + wait events + connections + autovacuum
  ├─ One query dominates CPU?
  │     ├─ Seq scan / bad plan → EXPLAIN ANALYZE (on replica if heavy)
  │     ├─ Missing/wrong index → add online; stats
  │     └─ Cancel PID if money path blocked
  ├─ Many short queries?
  │     ├─ N+1 from app → fix ORM/batch
  │     └─ Connection stampede → pool budget; pgbouncer if designed
  ├─ Locks / blocked sessions?
  │     └─ Long TX / idle-in-transaction → kill blocker carefully
  └─ Maintenance / vacuum / analytics on primary?
        └─ Move to replica; schedule off-peak; IO budget
`.trim(),

  mongoSlow: `
MONGO SLOW / TIMEOUTS — decision tree
START: slow query log + explain + WT cache + replication lag
  ├─ COLLSCAN / bad plan?
  │     └─ Index; reshape filter; avoid unbounded sort
  ├─ Hot document / large array updates?
  │     └─ Model change; bucket; avoid multi-MB docs
  ├─ WiredTiger cache eviction pressure?
  │     └─ Working set vs RAM; right-size; reduce scan
  ├─ Secondary reads stale / lag?
  │     └─ Read concern / primary for strong needs
  └─ Connection pool / thread pile-up from app?
        └─ Timeouts; pool size; fail fast
`.trim(),

  k8sRestart: `
K8s RESTART LOOP — decision tree
START: kubectl describe + logs --previous + events + probe config
  ├─ OOMKilled (137)?
  │     └─ See oom tree; raise only after evidence
  ├─ Crash on boot / CrashLoopBackOff?
  │     ├─ Bad config/secret → restore prior; fix mount
  │     ├─ Migration/lock at startup → decouple; backoff
  │     └─ Dependency required at boot → soft-dep or init order
  ├─ Liveness killing healthy-but-slow?
  │     └─ Separate readiness; fix probe path; lengthen carefully
  └─ Node pressure / eviction?
        └─ Node health; requests/limits; pod priority
`.trim(),

  fiveXx: `
5xx SPIKE — decision tree
START: Status class + deploy marker + dependency errors + saturation
  ├─ Correlated with deploy/config?
  │     └─ Rollback / flag OFF first if safe
  ├─ 502/503 at LB, app green?
  │     └─ Targets unhealthy; connection reset; graceful shutdown
  ├─ App 500 with exception storm?
  │     ├─ NPE/bug → rollback or hotfix
  │     └─ Dep failure bubbled → CB + fallback; fix dep
  ├─ Saturation (pool/CPU/threads)?
  │     └─ Shed load; fix bottleneck; do not only scale
  └─ Partial (one shard/AZ/tenant)?
        └─ Isolate; failover that slice; avoid global restart
`.trim(),

  gateway504: `
GATEWAY / ALB 504 — decision tree
START: Idle timeout vs target p99; which hop returns 504?
  ├─ Target response > idle timeout?
  │     ├─ Backend truly slow → fix path (trace); temporary shed
  │     └─ Timeout too aggressive vs SLO → align budgets (parent > child)
  ├─ APIGW integration timeout?
  │     └─ Same budget story; check authorizer latency too
  ├─ Only some targets?
  │     └─ Drain bad instance; noisy neighbor; connection reuse bugs
  └─ Client retries amplifying?
        └─ Disable nested retries; idempotency; backoff
`.trim(),

  poolExhausted: `
POOL EXHAUSTED (Hikari / HTTP / threads) — decision tree
START: active=max + pending + acquire timeout + dump/trace
  ├─ Hold time high?
  │     ├─ Slow SQL → fix query; statement_timeout
  │     ├─ HTTP inside @Transactional → move out / outbox
  │     └─ Lock waits → shorten critical section
  ├─ Leak (connections never returned)?
  │     └─ Find unclosed path; leakDetectionThreshold
  ├─ Fleet math: pods × pool > DB max?
  │     └─ Cap pool; global budget; queue at app not DB
  └─ Traffic spike only?
        └─ Shed + autoscale AFTER mechanism OK; bulkheads
`.trim(),

  debeziumLag: `
DEBEZIUM / CDC LAG — decision tree
START: Slot lag + WAL disk + Connect task state + topic produce rate
  ├─ Slot / WAL growing?
  │     ├─ Consumer/Connect down → restore pipeline before disk full
  │     └─ NEVER drop slot without recovery plan
  ├─ Snapshot in progress / heavy?
  │     └─ Throttle; off-peak; incremental where supported
  ├─ Transform / SMT CPU bound?
  │     └─ Simplify; scale Connect workers carefully
  ├─ Kafka produce slow / quota?
  │     └─ Broker/topic health; batching; partitioning
  └─ Downstream consumer lag only (slot OK)?
        └─ Treat as Kafka consumer lag tree
`.trim(),

  deployFail: `
DEPLOY FAIL / REGRESSION — decision tree
START: Version markers + error class + canary metrics + DB migration state
  ├─ App errors, schema OK?
  │     └─ Rollback image/config; keep DB compatible
  ├─ Migration failed / locked?
  │     └─ Expand/contract recovery; never incompatible rollback
  ├─ Canary red, baseline green?
  │     └─ Halt rollout; diff flags/config; do not push "to finish"
  ├─ Only one region/AZ?
  │     └─ Isolate; compare artifact digests; network/IAM
  └─ Success metrics lag (async)?
        └─ Watch lag/DLQ before declaring green
`.trim(),
};

export const DEBEZIUM_ASCII = `
DEBEZIUM / CDC PATH
════════════════════════════════════════════════════════════════

  PG → WAL → replication slot → Debezium → Kafka Connect → Kafka → Consumer
   |     |           |              |            |           |        |
  writes redo    retains WAL    reads changes  tasks     topics   apply
                 until consumed  (snapshot+     SMT        partitions  side
                                  streaming)               keys       effects

  Incident intuition
  • Slot lag ↑ = WAL retained = disk risk on primary
  • Connect task FAILED ≠ "Kafka is down" — check task trace
  • Snapshot storms look like DB CPU + network, not "app bug"
  • Consumer lag after CDC is healthy can still break money reconciliation
`.trim();

export const DEBEZIUM_ROWS: string[][] = [
  ['Symptom', 'First check', 'Mitigate', 'Never'],
  [
    'Replication slot lag ↑',
    'Slot LSN vs confirmed; WAL disk %',
    'Restore Connect; pause heavy consumers; free disk plan',
    'Drop slot to reclaim disk without rebuild plan',
  ],
  [
    'Connect task FAILED',
    'Task stack; offset; PK/schema change',
    'Fix transform/schema; restart task once with eyes on',
    'Restart loop without reading the error',
  ],
  [
    'Snapshot taking forever',
    'Table size; incremental vs full; DB CPU',
    'Throttle; off-peak; split tables',
    'Run full snapshot on primary at peak for fun',
  ],
  [
    'Duplicate / out-of-order events',
    'Key strategy; tombstones; consumer idempotency',
    'Idempotent apply; dedupe store',
    'Assume exactly-once without evidence',
  ],
  [
    'Schema change broke stream',
    'Compatibility; SMT; Avro/JSON evolution',
    'Compat fix forward; pause producers of breaking DDL',
    'Force incompatible evolve in prod silently',
  ],
  [
    'WAL disk near full',
    'Who holds slot; backlog age',
    'Escalate; capacity; controlled slot rebuild if designed',
    'rm WAL files by hand',
  ],
];

export const MONGO_ROWS: string[][] = [
  ['Incident', 'Signals', 'Likely cause', 'First move'],
  [
    'Query timeouts',
    'slowms log; explain COLLSCAN',
    'Missing index / bad filter',
    'Explain + index; statement time limits',
  ],
  [
    'Hot document',
    'One _id dominates locks/CPU',
    'Write contention on single doc',
    'Isolate key; redesign bucket/shard key',
  ],
  [
    'WT cache eviction',
    'eviction metrics; page faults',
    'Working set > RAM',
    'Reduce scan; right-size; check indexes',
  ],
  [
    'Replica lag',
    'secondaryDelay; stale reads',
    'Secondary overload / network',
    'Read primary for strong path; fix secondary load',
  ],
  [
    'Connection spike',
    'conn pool wait; thread block',
    'App pool mis-size / no timeout',
    'Fail fast; cap pools; fix slow ops',
  ],
  [
    'Unbounded array growth',
    'Doc size → 16MB ceiling',
    'Anti-pattern growth pattern',
    'Stop writes; archive; model change',
  ],
  [
    'Balancer / chunk storms (sharded)',
    'Balancer ops; jumbo chunks',
    'Bad shard key / hot range',
    'Pause balancer if safe; fix key long-term',
  ],
  [
    'Auth / TLS sudden fails',
    'auth errors after rotate',
    'Cert/user rotation skew',
    'Restore creds; dual-run rotation next time',
  ],
];

export const MULTI_LAYER: {id: string; title: string; chain: string; rootCause: string; interview: string}[] = [
  {
    id: 'ml01',
    title: 'ALB 504 from slow SQL',
    chain: 'Client → ALB 504 → Service threads waiting → Hikari → PG seq scan',
    rootCause: 'Missing index on new filter; p99 > idle timeout',
    interview: 'Timeout budgets must shrink down the chain; fix SQL before raising ALB timeout.',
  },
  {
    id: 'ml02',
    title: 'Retry storm after vendor blip',
    chain: 'Downstream 500 → SDK retry → App retry → APIGW retry → ALB saturation',
    rootCause: 'Nested retries without jitter or single owner',
    interview: 'One retry owner + CB beats "more retries" every time.',
  },
  {
    id: 'ml03',
    title: 'Cache flush cascade',
    chain: 'Redis FLUSH → miss storm → PG CPU → pool exhaust → 5xx',
    rootCause: 'Hard dependency on cold cache; no singleflight',
    interview: 'Treat cache as soft dep; stampede control is mandatory.',
  },
  {
    id: 'ml04',
    title: 'Deploy + migration skew',
    chain: 'CI green → migrate expands → app expects new column → rollback app → DB ahead',
    rootCause: 'Incompatible rollback path',
    interview: 'Expand/contract; never require down-migration under P1.',
  },
  {
    id: 'ml05',
    title: 'Kafka lag → stale API',
    chain: 'Producer OK → consumer lag → read model stale → CF caches old JSON',
    rootCause: 'Sync UX on async pipeline without freshness SLO',
    interview: 'Expose lag/freshness; do not hide CDC behind "API is 200".',
  },
  {
    id: 'ml06',
    title: 'OOMKilled then rebalance storm',
    chain: 'Heap leak → OOMKilled → Kafka rebalance → lag spike → payment delay',
    rootCause: 'Unbounded in-memory batch + tight memory limit',
    interview: 'Link k8s restarts to consumer group stability.',
  },
  {
    id: 'ml07',
    title: 'Pool math outage',
    chain: 'HPA scales pods → each opens Hikari 30 → PG max_connections → auth failures',
    rootCause: 'No global connection budget',
    interview: 'Example: 40 pods × 30 = 1200 > DB max ~400 — scale multiplies pain.',
  },
  {
    id: 'ml08',
    title: 'CF stale HTML + new hashed JS',
    chain: 'Client loads old index.html → requests missing chunk → blank app → support spike',
    rootCause: 'HTML cached; assets immutable hashed',
    interview: 'Invalidate HTML; versioned assets; never cache HTML like JS.',
  },
  {
    id: 'ml09',
    title: 'APIGW 429 mistaken for app outage',
    chain: 'Burst clients → APIGW throttle → FE retries → worse 429 → fake "backend down"',
    rootCause: 'Usage plan ceiling + client retry',
    interview: 'Read the status source; throttle ≠ 5xx root cause.',
  },
  {
    id: 'ml10',
    title: 'Debezium slot disk scare',
    chain: 'Connect down → slot retains WAL → PG disk 95% → write failures → API 500',
    rootCause: 'Unmonitored replication slot',
    interview: 'CDC lag is a disk risk on the primary, not "just Kafka lag".',
  },
  {
    id: 'ml11',
    title: 'GC pause → LB unhealthy',
    chain: 'Alloc spike → long GC → failed liveness → ALB 503 → cascading retries',
    rootCause: 'Probe too aggressive + allocation regression',
    interview: 'Separate liveness from heavy readiness; fix alloc first.',
  },
  {
    id: 'ml12',
    title: 'Mongo hot doc in checkout',
    chain: 'Service → Mongo update one cart doc → lock/CPU → thread pool full → APIGW 504',
    rootCause: 'Single-document write hotspot',
    interview: 'Hot key/doc is a multi-layer saturation story.',
  },
  {
    id: 'ml13',
    title: 'Feature flag default wrong',
    chain: 'Flag ON in prod → expensive path → Redis + PG load → error budget burn',
    rootCause: 'Flag default / targeting mistake',
    interview: 'Flags are deploys; canary flags like code.',
  },
  {
    id: 'ml14',
    title: 'Cross-AZ chatter tax',
    chain: 'Service AZ-a → Redis AZ-b → PG AZ-c → p99 climbs → timeouts',
    rootCause: 'Topology anti-affinity for chatty tiers',
    interview: 'Measure AZ hops; co-locate chatty paths.',
  },
  {
    id: 'ml15',
    title: 'DLQ ignore → replay bomb',
    chain: 'Poison msgs → DLQ grows ignored → naive replay → DB write storm',
    rootCause: 'No DLQ ownership or rate-limited replay',
    interview: 'Replay is a controlled deploy, not a button mash.',
  },
  {
    id: 'ml16',
    title: 'Read replica lag money bug',
    chain: 'Write primary → read replica → user sees old balance → retries double submit',
    rootCause: 'Read-your-writes violated',
    interview: 'Strong path reads primary or session consistency.',
  },
  {
    id: 'ml17',
    title: 'Thread dump shows HTTP in TX',
    chain: 'API → @Transactional → outbound HTTP → pool held → Hikari timeout → 5xx',
    rootCause: 'Network inside DB transaction',
    interview: 'Hold connections for DB work only; outbox for side effects.',
  },
  {
    id: 'ml18',
    title: 'WAF false positive',
    chain: 'Client → CF/WAF block → APIGW never hit → "auth broken" ticket storm',
    rootCause: 'New WAF rule on legitimate payload',
    interview: 'Check edge allows before debugging JWT for hours.',
  },
  {
    id: 'ml19',
    title: 'HPA on CPU, bottleneck is DB',
    chain: 'Latency↑ → HPA adds pods → more DB sessions → worse latency',
    rootCause: 'Wrong scaling signal',
    interview: 'Scale on SLI/saturation of the real bottleneck.',
  },
  {
    id: 'ml20',
    title: 'Partial region DNS failover',
    chain: 'DNS cutover → some clients cached old → split brain writes → Kafka duplicates',
    rootCause: 'TTL / dual-write without idempotency',
    interview: 'DR needs idempotent consumers + TTL math, not only DNS flip.',
  },
  {
    id: 'ml21',
    title: 'Expensive admin report on primary',
    chain: 'Analyst SQL on primary → IO sat → OLTP p99↑ → ALB 504',
    rootCause: 'No workload isolation',
    interview: 'Reports on replicas; statement_timeout; admissions control.',
  },
  {
    id: 'ml22',
    title: 'Connect SMT CPU starves CDC',
    chain: 'Heavy SMT → Connect lag → slot lag → WAL disk → app writes fail',
    rootCause: 'Transform cost in the critical CDC path',
    interview: 'Keep CDC path thin; push heavy reshape downstream.',
  },
];

export const POSTMORTEM_TEMPLATE = `
BLAMELESS POSTMORTEM TEMPLATE
════════════════════════════════════════════════════════════════

Title:        [service] [symptom] — [date]
Severity:     P1 / P2 / P3
Authors:      [IC + reviewer]
Status:       Draft | Review | Published

1. SUMMARY (5 lines max)
   What broke, user impact, duration, how recovered.

2. IMPACT
   Customers / $ / error budget burn / regions / percentage (example: ~12% checkout fail)

3. TIMELINE (UTC)
   Detect → Notify → Mitigate → Contain → Recover → Validate
   Include decision points and evidence links (graphs, traces, dumps).

4. ROOT CAUSE (mechanism)
   What failed and WHY — not "pod restarted".
   Contributing factors (change, capacity, missing alert).

5. WHAT WENT WELL
   Fast detect? Good rollback? Clear comms?

6. WHAT WENT POORLY
   Blind spots, tool gaps, unclear ownership — no naming/shaming.

7. ACTION ITEMS (SMART)
   | Action | Owner | Due | Prevents recurrence? |
   Prefer detect / mitigate / prevent categories.

8. LESSONS FOR THE SYSTEM
   Guardrails: canary, SLO, pool budgets, runbooks, game days.

Rule: blame process and design, not people. People ship under constraints.
`.trim();

export const SENIORITY_ROWS: string[][] = [
  ['Topic', '5y', '10y', '15y+', 'Staff', 'Principal'],
  [
    'First 5 minutes',
    'Check logs/restart',
    'Golden signals + deploy',
    'Impact→mitigate→evidence',
    'Roles, burn, containment',
    'Org playbook + risk call',
  ],
  [
    'Mitigate vs RCA',
    'Often mixed',
    'Separates consciously',
    'Narrates tradeoffs live',
    'Teaches the split',
    'Sets policy for IC orgs',
  ],
  [
    'Pools / capacity math',
    'Raises max',
    'Knows fleet×pool risk',
    'Budgets + Little\'s Law',
    'Platform defaults safe',
    'Multi-service budgets',
  ],
  [
    'Observability',
    'Logs-first',
    'Metrics+logs',
    'Trace+profile+correlate',
    'SLI design + cardinality',
    'Telemetry strategy/$',
  ],
  [
    'Kafka / CDC incidents',
    'Restart consumer',
    'Lag vs rebalance',
    'Slot/WAL/DLQ narrative',
    'Cross-team lag SLOs',
    'Eventing standards',
  ],
  [
    'DB under fire',
    'Kill sessions',
    'EXPLAIN + index',
    'Workload isolation',
    'Autopilot guardrails',
    'Data-plane architecture',
  ],
  [
    'Postmortems',
    'Timeline notes',
    'Blameless draft',
    'Actions that stick',
    'Quality bar / review',
    'Learning loops org-wide',
  ],
  [
    'Change safety',
    'Hope + rollback',
    'Canary habit',
    'Compat matrix + flags',
    'Progressive delivery',
    'Release risk portfolio',
  ],
  [
    'Communication',
    'Updates when asked',
    'Clear status',
    'Exec-ready impact',
    'Multi-team alignment',
    'External + board risk',
  ],
];

export const CHECKLIST: string[][] = [
  ['Domain', 'Beginner', 'Intermediate', 'Senior', 'Staff', 'Principal'],
  [
    'Java',
    'Exceptions, threads basics',
    'Dump reading, pools',
    'Lock/wait narratives',
    'Std patterns/libs',
    'Lang risk across fleets',
  ],
  [
    'JVM',
    'Heap vs OOM words',
    'GC logs, -Xmx',
    'JFR/flame, cgroup align',
    'Runtime defaults',
    'JVM platform policy',
  ],
  [
    'Spring',
    'Actuator health',
    'TX boundaries, MVC',
    'OSIV/N+1, timeouts',
    'Starter guardrails',
    'Framework standards',
  ],
  [
    'Kafka',
    'Lag meaning',
    'Rebalance, DLQ',
    'Throughput vs ordering',
    'Multi-cluster playbooks',
    'Event backbone strategy',
  ],
  [
    'CDC',
    'What Debezium is',
    'Slot lag risks',
    'Snapshot/SMT incidents',
    'CDC SLO + ownership',
    'Data movement architecture',
  ],
  [
    'PostgreSQL',
    'Slow query instinct',
    'EXPLAIN, indexes',
    'Locks, bloat, replicas',
    'Autovac/conn budgets',
    'OLTP platform design',
  ],
  [
    'MongoDB',
    'Find slow ops',
    'Indexes, explain',
    'Hot doc, WT cache',
    'Shard key reviews',
    'Document-store standards',
  ],
  [
    'Redis',
    'GET/SET timeouts',
    'Hit ratio, evictions',
    'Hot key, stampede',
    'Soft-dep patterns',
    'Cache platform rules',
  ],
  [
    'AWS',
    'Console metrics',
    'ALB/SG/IAM basics',
    'Multi-AZ failure modes',
    'Account guardrails',
    'Multi-account resilience',
  ],
  [
    'Kubernetes',
    'logs/describe',
    'Probes, OOMKilled',
    'HPA vs real bottleneck',
    'Cluster standards',
    'Fleet scheduling policy',
  ],
  [
    'Observability',
    'Find a log line',
    'RED dashboards',
    'Trace→profile loop',
    'SLI/SLO design',
    'Telemetry economics',
  ],
  [
    'Consistency',
    'Stale read awareness',
    'Read-your-writes',
    'Idempotency keys',
    'Cross-store invariants',
    'Consistency playbook',
  ],
  [
    'DR',
    'Know RTO words',
    'Failover runbook',
    'Game day participant',
    'Game day owner',
    'Multi-region strategy',
  ],
];

export const OBSERVE_CORRELATE_ASCII = `
OBSERVE → CORRELATE (one story, many signals)
════════════════════════════════════════════════════════════════

  Metrics ──┐
  Logs ─────┤
  Traces ───┼──► same time window + deploy marker + traceId/corrId
  Profiles ─┤
  Infra ────┤     CPU/mem/disk/net · node · AZ
  DB ───────┤     top SQL · waits · conns · replication
  Kafka ────┘     lag · rebalance · ISR · produce/consume rate

  Correlation rules
  1. Align clocks/windows (example: alert T+0, deploy T−8m).
  2. Pick one request id and walk Client→…→DB spans.
  3. If latency↑ but CPU low → wait/pool/dep (not "need more CPU").
  4. If only one instance bad → isolate before fleet-wide change.
  5. Profiles explain CPU; traces explain where time waited.

  IC one-liner: metrics show pain, traces show hop, profiles/SQL show mechanism.
`.trim();

export const GOLDEN_SIGNALS_NOTE = `
RED / USE / SLI / SLO / SLA / ERROR BUDGET
════════════════════════════════════════════════════════════════
  RED   Rate · Errors · Duration (per request path)
  USE   Utilization · Saturation · Errors (per resource)
  SLI   Quantitative measure of user happiness (example: p99 < 300ms)
  SLO   Target on an SLI over a window (example: 99.9% monthly)
  SLA   Contractual consequence if SLO missed (legal/business)
  Budget  1 − SLO; burn fast = page; burn slow = ticket
  IC tip: alert on burn + saturation, not raw CPU vanity.
`.trim();

export const RELATED_DEEP_DIVES: {href: string; label: string; useWhen: string}[] = [
  {
    href: '/performance',
    label: 'Performance handbook',
    useWhen: 'You need Measure→Bottleneck→Optimize, JVM/GC, Hikari math, load-test proof.',
  },
  {
    href: '/realtime-issues',
    label: 'Realtime production issues',
    useWhen: 'Deep incident curricula and recurring production failure patterns.',
  },
  {
    href: '/kafka-interview',
    label: 'Kafka interview hub',
    useWhen: 'Lag, rebalance, exactly-once, consumer/producer tuning under fire.',
  },
  {
    href: '/resilience4j',
    label: 'Resilience4j',
    useWhen: 'Circuit breaker, bulkhead, retry owner, cascade containment.',
  },
  {
    href: '/api-gateway',
    label: 'API Gateway',
    useWhen: '429/401/403/latency at the edge; timeout budgets; throttles.',
  },
  {
    href: '/distributed-locking',
    label: 'Distributed locking',
    useWhen: 'Lock contention, fencing, "stuck" work across nodes.',
  },
  {
    href: '/cap-theorem',
    label: 'CAP theorem',
    useWhen: 'Consistency vs availability tradeoffs in partial failure / DR.',
  },
];
