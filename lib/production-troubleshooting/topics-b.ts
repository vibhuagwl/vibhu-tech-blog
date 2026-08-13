import type {ProdTopic} from './types';

export const TOPICS_B: ProdTopic[] = [
  {
    id: 'spring',
    title: 'Spring Boot · Threads · JVM',
    badge: 'Java',
    problem: 'p95 5s — threads waiting, CPU high, or pool full?',
    whenToUse: 'Backend latency, 5xx, stuck requests, OOM, GC.',
    whenAvoid: 'Raising tomcat.max threads as first “fix”.',
    mermaid: `flowchart TB
  SB[Spring Boot] --> CPU --> GC
  SB --> MEM[Heap]
  SB --> TH[Threads / pools]
  TH --> DEP[DB Kafka Redis HTTP]
  REQ[Request] --> TOM[Tomcat thread] --> SLOW[Slow DB] --> WAIT[Thread waits]
  WAIT --> EXH[Pool exhausted] --> REJ[Reject / queue]`,
    code: `server.tomcat.threads.max: 200   # not a free lunch

jcmd <pid> Thread.print
jstack <pid>
jcmd <pid> GC.heap_info
jstat -gc <pid> 1s

Thread dump pattern:
  80 WAITING HikariPool
  10 WAITING HttpClient
  5 BLOCKED ReentrantLock
  5 RUNNABLE

Deadlock:
synchronized(a){ synchronized(b){} }
synchronized(b){ synchronized(a){} }
Fix: consistent lock order

OOM: capture ONE heap dump carefully (disk!), analyze dominators
High CPU: top → PID → nid → jstack stack

Waterfall via trace:
  Controller 5ms · Service 10ms · Redis 5ms · DB 4500ms ← culprit`,
    failure: 'More threads × slow DB = more connections → deeper cascade.',
    production: 'JFR continuous + on-call dump SOP; Hikari metrics on dashboard.',
    interview30s: 'Trace finds slow span; dump shows wait reason; fix dependency — not thread count.',
    followUp: 'TIMED_WAITING vs BLOCKED?',
    tradeoff: 'Dump overhead vs blind restart.',
    memoryTrick: 'Stuck threads point at the slow friend.',
  },
  {
    id: 'cascade',
    title: 'Cascading Failure · Retry Storm',
    badge: 'Critical',
    problem: 'One slow DB takes down the whole payment mesh.',
    whenToUse: 'Multi-service outages with rising timeouts.',
    whenAvoid: 'Adding more retries during the storm.',
    mermaid: `flowchart TD
  DB[DB slow] --> C[Service C latency]
  C --> B[B threads blocked]
  B --> A[A threads blocked]
  A --> GW[Gateway 504]
  R[100 req x 3 retries] --> OVER[300 load] --> WORSE[Worse overload]
  DEP --> TO[Timeout] --> CB[CircuitBreaker] --> BH[Bulkhead] --> RL[RateLimit]`,
    code: `ONE SLOW DEP → thread accumulate → pool exhaust → timeouts
  → retries → MORE LOAD → CASCADE

@CircuitBreaker(name="paymentService", fallbackMethod="fallback")
@Bulkhead(name="payment")
// Retry only bounded + jitter + idempotent

Mitigate storm: shed load, open CB, disable non-critical paths,
  stop nested retries, scale carefully (may amplify DB)

Prevention: timeouts + CB + bulkhead + backoff + load shedding`,
    failure: 'Retry amplification 3×3×3 during bank outage.',
    production: 'Game-day cascade drills; dependency SLOs on dashboards.',
    interview30s: 'Slow dep → blocked threads → timeouts → retries → cascade; break with CB/BH/timeouts.',
    followUp: 'Why bulkhead helps when CB alone is late?',
    tradeoff: 'Fail-fast UX vs waiting for recovery.',
    memoryTrick: 'Retries without brakes feed the fire.',
  },
  {
    id: 'data',
    title: 'Database · Redis · Kafka',
    badge: 'Data',
    problem: 'Which datastore is the latency culprit?',
    whenToUse: 'Backend slow with dependency suspicion.',
    whenAvoid: 'Restarting Redis before checking hit-ratio→DB storm.',
    mermaid: `flowchart TD
  DBSLOW[DB slow?] --> CPUQ[CPU → expensive SQL]
  DBSLOW --> CONN[Connections → leak/slow]
  DBSLOW --> LOCK[Locks → blocker]
  DBSLOW --> IOPS
  REDIS[Hit 90%→60%] --> DBSTORM[DB traffic↑] --> APILAT[API latency↑]
  KAFKA[Consumer-2 slow] --> LAG[Partition lag↑]`,
    code: `-- PostgreSQL
EXPLAIN ANALYZE SELECT * FROM transactions
 WHERE customer_id = $1 AND transaction_date > $2;
-- Seq Scan 10s → Index Scan 100ms

SELECT pid, state, wait_event, query, now()-xact_start
FROM pg_stat_activity WHERE state <> 'idle';

Hikari: active/idle/pending/max/timeout — pending↑ = pool starvation

Redis: INFO · SLOWLOG · hit ratio · evictions · failover
Kafka: consumer lag · rebalance · ISR · DLQ depth · skew

Disk full → writes fail: df -h · free space · truncate logs carefully · expand volume`,
    failure: 'Cache miss storm after flush → DB CPU melt.',
    production: 'Per-query budgets; lag alerts; never flush prod Redis as first step.',
    interview30s: 'DB: EXPLAIN+locks+pool; Redis: hit ratio cascade; Kafka: lag per partition.',
    followUp: 'Replication lag vs primary CPU?',
    tradeoff: 'Cache TTL vs consistency.',
    memoryTrick: 'Miss storm = accidental load test on DB.',
  },
  {
    id: 'aws',
    title: 'AWS · Kubernetes · Network · IAM',
    badge: 'Infra',
    problem: 'Is it the app or the platform under it?',
    whenToUse: 'Health/target/DNS/TLS/IAM/pod failures.',
    whenAvoid: 'Only app restarts when SG blocks DB port.',
    mermaid: `flowchart TD
  CL[Client] --> DNS --> LB --> VPC --> SG --> SVC --> DB
  POD --> CLB[CrashLoop] --> OOMK[OOMKilled] --> PEND[Pending]
  POD --> READY[Readiness] --> LIVE[Liveness]`,
    code: `# Linux
top · free -m · df -h · iostat · vmstat · ss -s · dig · curl -v
openssl s_client -connect host:443

# K8s
kubectl get pods · describe pod · logs --previous · get events · top pod
kubectl rollout history · rollout undo

Readiness = should receive traffic?
Liveness = should restart process?

IAM AccessDenied → who/role/policy/resource/trust/explicit deny
DNS: dig + Route53 TTL/failover/weighted
TLS: expiry, SAN, chain, TLS version

AWS: CloudWatch · ALB metrics · CloudTrail · VPC Flow Logs · CLI`,
    failure: 'Liveness too aggressive → kill healthy pods under GC pause.',
    production: 'Probe timeouts aligned with JVM pause budget; SG change peer review.',
    interview30s: 'Layer OSI+AWS: DNS→TLS→SG→target health→pod probes→IAM.',
    followUp: 'ImagePullBackOff vs CrashLoop?',
    tradeoff: 'Strict probes vs flapping.',
    memoryTrick: 'Probe wrong = self-inflicted outage.',
  },
  {
    id: 'deploy',
    title: 'Deploy · Rollback · Fix-Forward · Flags',
    badge: 'Change',
    problem: 'Errors spike at deploy time — rollback or fix forward?',
    whenToUse: 'Strong time correlation with release/config/migration.',
    whenAvoid: 'Rolling back app across irreversible DB migration.',
    mermaid: `flowchart TD
  INC[Incident] --> DEP{Recent deploy?}
  DEP -->|YES| SAFE{Rollback safe?}
  SAFE -->|YES| RB[Rollback]
  SAFE -->|NO| FF[Fix forward / flag OFF]
  RB --> VAL[Validate]
  FF --> VAL
  BG[Blue 90% / Green 10%] -->|Green bad| CUT[Green 0%]`,
    code: `Correlation ≠ proof — but strong evidence:
  Version A healthy → B deploy → latency/errors/CPU↑

Rollback OK: bad release, compatible DB, tested previous artifact
Rollback DANGER: App V1 + DB V2 migration already applied

Expand → deploy compatible app → migrate → contract later (Flyway)

Feature flag OFF beats full rollback for isolated features

Rollback runbook: artifact · config · DB compat · flags · traffic · cache · smoke · monitors

Canary: Green p95 5s / err 10% → shift 100% Blue`,
    failure: 'App rollback only → schema mismatch → worse outage.',
    production: 'Pre-declare rollback owner + DB compatibility matrix per release.',
    interview30s: 'If change correlated and rollback safe → rollback; else mitigate + fix forward.',
    followUp: 'Config-only change causing thread exhaustion?',
    tradeoff: 'Speed of rollback vs data-layer risk.',
    memoryTrick: 'Flags for features · Expand/Contract for schema.',
  },
  {
    id: 'observe',
    title: 'Logs · Traces · Correlation · RCA',
    badge: 'Evidence',
    problem: 'Connect one user complaint across FE→DB.',
    whenToUse: 'Every P1/P2 investigation and postmortem.',
    whenAvoid: 'RCA that stops at “CPU high” as root cause.',
    mermaid: `flowchart TD
  S[Symptom] --> TL[Timeline] --> EV[Evidence] --> HY[Hypothesis]
  HY --> VER[Verify] --> RC[Root Cause] --> CF[Contributing] --> FIX --> PREV[Prevent]
  REQ[traceId=ABC] --> FE --> GW --> PAY --> PG[(Postgres 4000ms)]`,
    code: `{"level":"ERROR","service":"payment-service","traceId":"abc123",
 "requestId":"req789","error":"TimeoutException"}

5 Whys:
 API slow → DB slow → full scan → missing index → new query shipped
 → no prod query perf test

Symptom vs root:
 CPU 95% · pool exhausted · slow query · missing index ← root

Prevent / Detect / Mitigate / Recover action items

Escalate WITH EVIDENCE pack — not "DB is down"`,
    failure: 'Blame game RCA without prevention actions.',
    production: 'Blameless postmortem within 48h; action owners + dates.',
    interview30s: 'Same traceId across hops; 5 Whys past symptoms to missing control.',
    followUp: 'What belongs in vendor escalation?',
    tradeoff: 'Deep RCA time vs shipping preventions.',
    memoryTrick: 'CPU is a symptom until the index is named.',
  },
  {
    id: 'playbook',
    title: 'P1 Playbook · Tickets · Escalation',
    badge: 'Ops',
    problem: 'How do you run the bridge and ask for help?',
    whenToUse: 'Declared P1/P2 with customer impact.',
    whenAvoid: 'Escalating without metrics/traces/actions tried.',
    mermaid: `flowchart TD
  P1 --> DEC[Declare] --> IC[Incident Commander]
  IC --> FRZ[Freeze deploys] --> TIME[Timeline] --> BR[Blast radius]
  BR --> MIT[Mitigate] --> COM[Communicate] --> REC[Recover]
  REC --> VAL[Validate] --> CLOSE --> RCA`,
    code: `Title: [P1] Payment API latency increased in production
Env/Region/Start/Impact/Symptoms/Metrics/Recent changes/
Logs/TraceIds/Hypothesis/Evidence/Mitigation/Status/
Action required/Owner/Escalation team

Escalate pack:
 service · region · start · impact% · p99 · DB CPU · pool ·
 slow query · deploy version · traceIds · tried · need help

Vendor (AWS/DB/CDN): account · region · timestamps · request IDs ·
 metrics · logs · network · changes · business impact
 NEVER paste secrets/PII/tokens

Comms every N minutes: impact · status · ETA · next update`,
    failure: 'Silent bridge — stakeholders discover via Twitter.',
    production: 'IC checklist + status page owner + severity clock.',
    interview30s: 'Declare, IC, freeze, mitigate, timed comms, validate, RCA with evidence escalations.',
    followUp: 'P2 vs P1 staffing difference?',
    tradeoff: 'Update frequency vs engineering focus.',
    memoryTrick: 'Escalate with a brief, not a vibe.',
  },
];
