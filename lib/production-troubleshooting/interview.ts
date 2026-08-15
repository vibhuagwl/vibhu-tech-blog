import type {InterviewQ} from './types';

export const SENIOR: InterviewQ[] = [
  {id:'s1',topic:'Senior',question:'First 5 minutes of a payment latency P1?',answer30s:'Confirm impact, blast radius, recent change, golden signals, pick mitigation.',answer2m:'Who/what/when checklist; mitigate ≠ RCA. Freeze deploys, open bridge, assign IC/comms. Pull p99, error rate, saturation, last deploy marker. If safe, shed or rollback while evidence streams.',followUps:['What if no deploy?','Who owns status page?']},
  {id:'s2',topic:'Senior',question:'Golden signals?',answer30s:'Latency, traffic, errors, saturation.',answer2m:'Baselines are service-specific. Saturation includes CPU, threads, pools, queue depth, disk, FD. Interviewers want you to name the signal that predicts collapse before errors spike.',followUps:['Saturation examples?','Which signal for Kafka?']},
  {id:'s3',topic:'Senior',question:'504 vs 502 vs 503?',answer30s:'504 timeout; 502 bad target response; 503 no healthy capacity.',answer2m:'Map to ALB/GW metrics: idle timeout vs target reset vs healthy host count. Do not treat all 5xx the same — next command differs.',followUps:['Idle timeout?','How can 503 look like deploy?']},
  {id:'s4',topic:'Senior',question:'How do you use a thread dump?',answer30s:'Find dominant WAITING/BLOCKED stacks pointing at DB/HTTP/locks.',answer2m:'jcmd Thread.print; correlate with traces. Same stack × N threads = the dependency to fix. Deadlock section if present. One dump is a snapshot — take 2–3 if flapping.',followUps:['Deadlock section?','When is dump harmful?']},
  {id:'s5',topic:'Senior',question:'Why not raise Tomcat threads first?',answer30s:'Amplifies load on slow DB/pools; fix the wait.',answer2m:'More threads on a slow dependency fills Hikari and worsens cascading timeouts. Bulkhead and shed ingress; raise threads only after wait root is fixed.',followUps:['Bulkhead?','When is raising OK?']},
  {id:'s6',topic:'Senior',question:'ChunkLoadError after deploy?',answer30s:'HTML/JS version skew on CDN — invalidate/rollback FE.',answer2m:'DevTools Network: HTML references chunk hash that CDN still serves old or missing. Immutable hashed assets + canary FE prevent recurrence.',followUps:['Cache policy?','Service worker?']},
  {id:'s7',topic:'Senior',question:'Symptom vs root cause?',answer30s:'CPU/pool exhaustion are symptoms; missing index may be root.',answer2m:'5 Whys with evidence. Staff answer names the causal chain: bad query → lock → pool full → thread wait → 504. Fix the earliest actionable root, not the loudest symptom.',followUps:['Multiple causes?','When stop digging?']},
  {id:'s8',topic:'Senior',question:'Safe rollback criteria?',answer30s:'Prior artifact compatible with current DB/config; tested path.',answer2m:'Unsafe across irreversible migration or contract-too-early schema. Feature flag OFF is often safer than binary rollback. Document compat matrix.',followUps:['Fix forward?','Config-only rollback?']},
  {id:'s9',topic:'Senior',question:'Retry storm?',answer30s:'Retries multiply load on failing dep — bound, jitter, CB.',answer2m:'100×3=300. Nested services with each layer retrying explode traffic. One retry owner; others fail fast. Retries can make an incident worse — disable nested retries first.',followUps:['Nested services?','When retries help?']},
  {id:'s10',topic:'Senior',question:'How to escalate to DBA?',answer30s:'Evidence pack: service, region, impact, p99, pool, query, traces, tried, ask.',answer2m:'Show template. Never "DB is down" without pid, query text, EXPLAIN, and whether you already killed a blocker.',followUps:['Vendor AWS?'],trick:'Just say DB is down.'},
  {id:'s11',topic:'Senior',question:'Immediate mitigation vs permanent fix?',answer30s:'Stabilize customers first; permanent fix follows with RCA owners.',answer2m:'Immediate: shed, rollback, flag OFF, kill query, abort canary. Permanent: index, timeout budgets, expand-contract, alerts. Interviewers fail candidates who refuse to mitigate until RCA is perfect.',followUps:['When mitigation becomes the new normal?']},
  {id:'s12',topic:'Senior',question:'Horizontal scale not helping — why?',answer30s:'Bottleneck is single partition, lock, hot key, or external quota.',answer2m:'More pods cannot fix one Kafka partition, a global DB lock, or a rate-limited vendor. Prove with lag-by-partition, lock graphs, or vendor 429s before buying capacity.',followUps:['What metric proves it?','When does scale help?']},
  {id:'s13',topic:'Senior',question:'How do retries make things worse?',answer30s:'They amplify load and hide true error rates while deps are overloaded.',answer2m:'Disable client retries, open CB, shed. Keep one idempotent retry with jitter for transient network only. Measure retry-amplified RPS vs origin RPS.',followUps:['Idempotency requirement?']},
  {id:'s14',topic:'Senior',question:'Multi-layer reasoning for p99 spike?',answer30s:'Walk FE→edge→app→pool→data; stop at first slow span with evidence.',answer2m:'Trace waterfall first. If app waits on DB, do not tune JVM. If DB waits on lock, do not add index yet. Each layer has different next command — name it.',followUps:['What if traces missing?']},
  {id:'s15',topic:'Senior',question:'CDC / Debezium lag interview answer?',answer30s:'Check connector status, task errors, replication slot lag, WAL disk.',answer2m:'Lag is a rate problem: source produce vs connector consume. Stuck snapshot, schema break, or stopped consumer grows slots and risks primary disk. Mitigate: pause sink, catch up, or drop unused slot carefully.',followUps:['Slot vs WAL?','Schema change during CDC?']},
];

export const ARCHITECT: InterviewQ[] = [
  {id:'a1',topic:'Architect',question:'Payment p95 8s after deploy — full walkthrough?',answer30s:'Radius→deploy marker→signals→trace waterfall→dump/pool→mitigate→RCA.',answer2m:'Whiteboard entire stack. Decide rollback vs flag using DB compat. Assign IC roles. Close with Prevent/Detect/Mitigate/Recover actions.',followUps:['Rollback decision?','Comms cadence?']},
  {id:'a2',topic:'Architect',question:'Design anti-cascade for payments?',answer30s:'Timeouts, CB, bulkhead, admit control, one retry owner, load shed.',answer2m:'Resilience4j + GW. Never fake SUCCESS on money paths — PENDING/UNKNOWN with reconcile. Explicit fallback contracts.',followUps:['Fake SUCCESS fallback?','Admit control where?']},
  {id:'a3',topic:'Architect',question:'Expand/contract migrations?',answer30s:'Compatible DDL first, dual-write/read, then remove old — enables safe rollback windows.',answer2m:'Flyway example. Contracting while old pods still read the column is a classic outage. Gate contract on fleet version.',followUps:['Contract too early?','Dual-write failure?']},
  {id:'a4',topic:'Architect',question:'Blue/green shows Green bad — action?',answer30s:'Shift traffic to Blue 100%, keep Green for forensics if needed.',answer2m:'Canary metrics compare before full cut. Sticky sessions can mask Green failure — check per-target health.',followUps:['Sticky sessions?','When keep Green up?']},
  {id:'a5',topic:'Architect',question:'Redis flush causes outage — explain?',answer30s:'Hit ratio collapse → DB storm → pools/threads → 504s.',answer2m:'Never flush as first step. Stampede controls: singleflight, soft TTL, request coalescing. Treat cache as soft dependency.',followUps:['Stampede controls?','When is flush OK?']},
  {id:'a6',topic:'Architect',question:'Region failure runbook?',answer30s:'DNS/failover, promote DR, validate RPO/RTO, Spring reconnect, idempotent payments.',answer2m:'Link DR hub thinking. Failback is a second incident — rehearse. Multi-AZ is not multi-region.',followUps:['Failback?','RPO vs RTO?']},
  {id:'a7',topic:'Architect',question:'Shard failure vs partition failure?',answer30s:'Shard=independent DB unit — promote its replica; partition often same instance.',answer2m:'Blast radius 1/N users. Router metadata must not strand traffic on dead shard.',followUps:['Router metadata?','Cross-shard tx?']},
  {id:'a8',topic:'Architect',question:'P1 communication cadence?',answer30s:'IC owns timed updates: impact, status, ETA, next update — status page.',answer2m:'Sample message every 15–30 min. Freeze deploys. Separate war-room from exec bridge. Escalate with evidence pack.',followUps:['Freeze deploys?','When page executives?']},
  {id:'a9',topic:'Architect',question:'How do you prevent recurrence?',answer30s:'RCA actions across Prevent/Detect/Mitigate/Recover with owners.',answer2m:'Example missing index + alert + canary. Measure effectiveness: did the alert fire earlier next time?',followUps:['Measure effectiveness?','When close RCA?']},
  {id:'a10',topic:'Architect',question:'K8s readiness vs liveness in incidents?',answer30s:'Readiness removes traffic; liveness restarts — mis-tuned liveness causes flapping.',answer2m:'GC pause story: liveness kill during long GC worsens OOM loops. Prefer readiness for overload; startupProbe for slow boot.',followUps:['StartupProbe?','When extend liveness?']},
  {id:'a11',topic:'Architect',question:'Incident Commander process end-to-end?',answer30s:'Declare P1, assign roles, mitigate, communicate, evidence, escalate, resolve, RCA.',answer2m:'Roles: IC, ops lead, comms, scribe. Timed updates. Decision log. Do not let everyone debug the same pod. Close with customer impact statement and action owners.',followUps:['IC vs subject expert?','When hand off IC?']},
  {id:'a12',topic:'Architect',question:'Outbox vs dual-write — staff answer?',answer30s:'Outbox keeps DB commit and event publish atomic at app level; dual-write can diverge.',answer2m:'Publisher lag is an incident class. Saga compensations must be idempotent. Never claim exactly-once without naming the mechanism (tx outbox / EOS).',followUps:['Poison outbox row?','Saga vs choreography?']},
  {id:'a13',topic:'Architect',question:'Idempotency gap: commit before offset?',answer30s:'DB side effect committed then crash before Kafka offset → redelivery → duplicate risk.',answer2m:'Prefer transactional outbox or idempotent handlers with dedupe keys. Opposite bug (offset before commit) causes data loss scare — at-least-once + idempotency is the staff default.',followUps:['How prove no double charge?','EOS when justified?']},
  {id:'a14',topic:'Architect',question:'Multi-AZ failure that looks regional?',answer30s:'Per-AZ metrics: NAT, subnet, ASG capacity, AZ-local dependencies.',answer2m:'Single NAT or AZ-pinned resource makes one AZ look like total outage. Fix: multi-NAT, cross-AZ LB, per-AZ dashboards.',followUps:['When fail over region anyway?']},
  {id:'a15',topic:'Architect',question:'Canary vs feature flag for risk?',answer30s:'Canary = traffic % on new binary; flag = code path toggle without redeploy.',answer2m:'Staff uses both: canary for binary risk, flag for behavior. Abort canary on SLO breach; kill-switch flag for runtime. Config canary for timeout/pool changes.',followUps:['When only one?','Flag cache stale?']},
];

export const STAFF: InterviewQ[] = [
  {id:'st1',topic:'Staff',question:'Walk a CDC lag P1 that threatens primary disk.',answer30s:'Slot lag → WAL growth → disk alarm; catch up or drop unused slot; protect primary first.',answer2m:'IC: freeze schema changes, page CDC owner, check pg_replication_slots + connector status. If consumer dead, restart or drop slot with data-loss awareness. Permanent: slot age alerts, expand storage auto, runbook.',followUps:['Who approves drop slot?','How avoid recurrence?']},
  {id:'st2',topic:'Staff',question:'Poison message making retries worse — staff playbook?',answer30s:'Park poison to DLQ, stop infinite retry, fix schema/handler, replay controlled.',answer2m:'Retries on poison amplify lag and CPU. Identify key, isolate partition if needed, disable consumer retry storm, publish fix, replay from DLQ with rate limit.',followUps:['When delete vs DLQ?','Schema registry role?']},
  {id:'st3',topic:'Staff',question:'Why did adding pods not fix Kafka lag?',answer30s:'Consumer parallelism capped by partitions; hot key skew; slow per-message work.',answer2m:'Show lag-by-partition. If one partition owns lag, scale is theater. Fix key design, processing cost, or increase partitions with migration plan.',followUps:['Repartition risks?']},
  {id:'st4',topic:'Staff',question:'Data loss scare — how do you prove safety?',answer30s:'Prove with offsets, retention, producer acks, DLQ, and idempotent keys — not vibes.',answer2m:'Sequence gaps can be filtered/compacted/skipped. Reconstruct expected vs actual. If real loss, quantify RPO impact and reconcile from source of truth.',followUps:['Customer comms?','When declare real loss?']},
  {id:'st5',topic:'Staff',question:'JWT/OAuth outage across fleet — layered debug?',answer30s:'Clock skew, JWKS fetch, issuer/audience, secret rotation mismatch.',answer2m:'Multi-layer: IdP health → JWKS cache → gateway authorizer → app validators. Dual-secret rotation windows. Never roll keys without overlap.',followUps:['mTLS vs JWT?','Canary for auth?']},
];

export const RAPID_QS = [
  'jcmd vs jstack?',
  'Hikari pending meaning?',
  'EXPLAIN Seq Scan meaning?',
  'WAF 403 vs IAM 403?',
  'Consumer lag unit?',
  'Feature flag vs rollback?',
  'Correlation ID propagation?',
  'OOMKilled exit code?',
  'Idle timeout vs read timeout?',
  'What is blast radius?',
  'When to capture heap dump?',
  'Status page vs bridge?',
  'P3 example?',
  'CloudFront HIT vs MISS?',
  'pg_stat_activity use?',
  'idle in transaction risk?',
  'ISR shrink meaning?',
  'Replication slot danger?',
  'Metaspace vs heap OOM?',
  'N+1 detection in prod?',
  'Canary abort signal?',
  'NAT port allocation errors?',
  'Offset commit order?',
  'Debezium FAILED state?',
  'Expand vs contract phase?',
];

export const RAPID: InterviewQ[] = RAPID_QS.map((q, i) => ({
  id: `r${i + 1}`,
  topic: 'Rapid',
  question: q,
  answer30s: 'See playbook cheat / layer topic.',
  answer2m: 'Tie to payment incident evidence.',
  followUps: ['Next command?'],
}));

export const ALL = [...SENIOR, ...ARCHITECT, ...STAFF, ...RAPID];
