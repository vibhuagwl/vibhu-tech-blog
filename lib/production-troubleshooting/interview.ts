import type {InterviewQ} from './types';

export const SENIOR: InterviewQ[] = [
  {id:'s1',topic:'Senior',question:'First 5 minutes of a payment latency P1?',answer30s:'Confirm impact, blast radius, recent change, golden signals, pick mitigation.',answer2m:'Who/what/when checklist; mitigate ≠ RCA.',followUps:['What if no deploy?']},
  {id:'s2',topic:'Senior',question:'Golden signals?',answer30s:'Latency, traffic, errors, saturation.',answer2m:'Baselines are service-specific.',followUps:['Saturation examples?']},
  {id:'s3',topic:'Senior',question:'504 vs 502 vs 503?',answer30s:'504 timeout; 502 bad target response; 503 no healthy capacity.',answer2m:'Map to ALB/GW metrics.',followUps:['Idle timeout?']},
  {id:'s4',topic:'Senior',question:'How do you use a thread dump?',answer30s:'Find dominant WAITING/BLOCKED stacks pointing at DB/HTTP/locks.',answer2m:'jcmd Thread.print; correlate with traces.',followUps:['Deadlock section?']},
  {id:'s5',topic:'Senior',question:'Why not raise Tomcat threads first?',answer30s:'Amplifies load on slow DB/pools; fix the wait.',answer2m:'Cascade diagram.',followUps:['Bulkhead?']},
  {id:'s6',topic:'Senior',question:'ChunkLoadError after deploy?',answer30s:'HTML/JS version skew on CDN — invalidate/rollback FE.',answer2m:'DevTools Network.',followUps:['Cache policy?']},
  {id:'s7',topic:'Senior',question:'Symptom vs root cause?',answer30s:'CPU/pool exhaustion are symptoms; missing index may be root.',answer2m:'5 Whys.',followUps:['Multiple causes?']},
  {id:'s8',topic:'Senior',question:'Safe rollback criteria?',answer30s:'Prior artifact compatible with current DB/config; tested path.',answer2m:'Unsafe across irreversible migration.',followUps:['Fix forward?']},
  {id:'s9',topic:'Senior',question:'Retry storm?',answer30s:'Retries multiply load on failing dep — bound, jitter, CB.',answer2m:'100×3=300.',followUps:['Nested services?']},
  {id:'s10',topic:'Senior',question:'How to escalate to DBA?',answer30s:'Evidence pack: service, region, impact, p99, pool, query, traces, tried, ask.',answer2m:'Show template.',followUps:['Vendor AWS?'],trick:'Just say DB is down.'},
];

export const ARCHITECT: InterviewQ[] = [
  {id:'a1',topic:'Architect',question:'Payment p95 8s after deploy — full walkthrough?',answer30s:'Radius→deploy marker→signals→trace waterfall→dump/pool→mitigate→RCA.',answer2m:'Whiteboard entire stack.',followUps:['Rollback decision?']},
  {id:'a2',topic:'Architect',question:'Design anti-cascade for payments?',answer30s:'Timeouts, CB, bulkhead, admit control, one retry owner, load shed.',answer2m:'Resilience4j + GW.',followUps:['Fake SUCCESS fallback?']},
  {id:'a3',topic:'Architect',question:'Expand/contract migrations?',answer30s:'Compatible DDL first, dual-write/read, then remove old — enables safe rollback windows.',answer2m:'Flyway example.',followUps:['Contract too early?']},
  {id:'a4',topic:'Architect',question:'Blue/green shows Green bad — action?',answer30s:'Shift traffic to Blue 100%, keep Green for forensics if needed.',answer2m:'Canary metrics compare.',followUps:['Sticky sessions?']},
  {id:'a5',topic:'Architect',question:'Redis flush causes outage — explain?',answer30s:'Hit ratio collapse → DB storm → pools/threads → 504s.',answer2m:'Never flush as first step.',followUps:['Stampede controls?']},
  {id:'a6',topic:'Architect',question:'Region failure runbook?',answer30s:'DNS/failover, promote DR, validate RPO/RTO, Spring reconnect, idempotent payments.',answer2m:'Link DR hub thinking.',followUps:['Failback?']},
  {id:'a7',topic:'Architect',question:'Shard failure vs partition failure?',answer30s:'Shard=independent DB unit — promote its replica; partition often same instance.',answer2m:'Blast radius 1/N users.',followUps:['Router metadata?']},
  {id:'a8',topic:'Architect',question:'P1 communication cadence?',answer30s:'IC owns timed updates: impact, status, ETA, next update — status page.',answer2m:'Sample message.',followUps:['Freeze deploys?']},
  {id:'a9',topic:'Architect',question:'How do you prevent recurrence?',answer30s:'RCA actions across Prevent/Detect/Mitigate/Recover with owners.',answer2m:'Example missing index + alert + canary.',followUps:['Measure effectiveness?']},
  {id:'a10',topic:'Architect',question:'K8s readiness vs liveness in incidents?',answer30s:'Readiness removes traffic; liveness restarts — mis-tuned liveness causes flapping.',answer2m:'GC pause story.',followUps:['StartupProbe?']},
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
];

export const RAPID: InterviewQ[] = RAPID_QS.map((q, i) => ({
  id: `r${i + 1}`,
  topic: 'Rapid',
  question: q,
  answer30s: 'See playbook cheat / layer topic.',
  answer2m: 'Tie to payment incident evidence.',
  followUps: ['Next command?'],
}));

export const ALL = [...SENIOR, ...ARCHITECT, ...RAPID];
