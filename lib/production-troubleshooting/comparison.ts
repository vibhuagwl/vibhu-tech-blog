export const SYMPTOM_TABLE = [
  {s:'API slow',f:'p95/p99',n:'traces',r:'DB/external/threads'},
  {s:'5xx spike',f:'logs',n:'deployment',r:'code/config/dep'},
  {s:'504',f:'LB/Gateway',n:'traces',r:'backend timeout'},
  {s:'Thread stuck',f:'thread dump',n:'dependencies',r:'DB/lock/API'},
  {s:'CPU high',f:'top/JVM',n:'profile',r:'code/GC/traffic'},
  {s:'OOM',f:'heap/GC',n:'heap dump',r:'leak/allocation'},
  {s:'DB slow',f:'DB metrics',n:'EXPLAIN',r:'query/index/locks'},
  {s:'DB pool full',f:'Hikari',n:'DB sessions',r:'slow/leak'},
  {s:'Kafka lag',f:'consumer lag',n:'consumer CPU',r:'slow consumer'},
  {s:'Redis hit↓',f:'cache metrics',n:'DB load',r:'miss storm'},
  {s:'FE blank',f:'console',n:'network',r:'JS/CDN/deploy'},
  {s:'401',f:'auth logs',n:'token',r:'auth config'},
  {s:'403',f:'GW/WAF',n:'IAM',r:'permission'},
  {s:'429',f:'GW metrics',n:'limits',r:'throttle'},
  {s:'502',f:'ALB',n:'target logs',r:'target connect'},
  {s:'503',f:'target health',n:'deploy',r:'no healthy'},
  {s:'DNS fail',f:'dig',n:'Route53',r:'record/TTL'},
  {s:'TLS fail',f:'openssl',n:'cert',r:'expiry/trust'},
  {s:'Disk full',f:'df',n:'logs/DB',r:'growth'},
  {s:'Deploy issue',f:'timeline',n:'metrics',r:'bad release'},
];

export const MITIGATION_MATRIX = [
  {p:'API latency',m:'Shed / rollback / isolate',i:'Trace + dump + DB'},
  {p:'5xx spike',m:'Rollback / unhealthy away',i:'Logs + traces'},
  {p:'DB CPU high',m:'Stop expensive work',i:'Query analysis'},
  {p:'Thread exhaustion',m:'Reduce ingress',i:'Thread dump'},
  {p:'DB pool full',m:'Reduce load',i:'Slow queries/leaks'},
  {p:'Kafka lag',m:'Scale carefully',i:'Consumer bottleneck'},
  {p:'Redis fail',m:'Degrade safely',i:'Redis health'},
  {p:'FE broken',m:'Rollback CDN asset',i:'Browser + deploy'},
  {p:'Region fail',m:'Failover',i:'DR validation'},
];

export const COMMANDS = [
  {g:'Linux',c:'top / free -m / df -h / iostat / vmstat / ss',w:'Host sat',l:'PID, disk%, iowait'},
  {g:'JVM',c:'jcmd / jstack / jstat / jmap (careful)',w:'Threads/GC/heap',l:'Wait stacks, pauses'},
  {g:'Network',c:'curl -v / dig / openssl s_client / nc',w:'DNS/TLS/connect',l:'Codes, cert, resolve'},
  {g:'K8s',c:'kubectl describe/logs/top/rollout undo',w:'Pod health',l:'OOMKilled, probes'},
  {g:'DB',c:'EXPLAIN ANALYZE / pg_stat_activity',w:'Slow/locks',l:'Plan, blockers'},
  {g:'Redis',c:'INFO / SLOWLOG',w:'Latency/memory',l:'evictions, hit ratio'},
  {g:'Kafka',c:'lag tools / broker metrics',w:'Consumer lag',l:'skew, rebalance'},
  {g:'AWS',c:'CloudWatch / ALB / CloudTrail / Flow Logs',w:'Infra/IAM',l:'5xx, denies'},
];

export const CHEAT: [string, string][] = [
  ['DON\'T GUESS', 'Metrics → Logs → Traces → Change'],
  ['FIRST 5 MIN', 'Confirm · Radius · Change · Signals · Mitigate'],
  ['GOLDEN', 'Latency · Traffic · Errors · Saturation'],
  ['MITIGATE', 'Stabilize customers before perfect RCA'],
  ['ROLLBACK', 'Only if DB-compatible'],
  ['CASCADE', 'Timeouts + CB + Bulkhead — not more retries'],
  ['DUMP', 'Threads point at the slow dependency'],
  ['ESCALATE', 'With evidence pack, not vibes'],
];

export const REMEMBER: [string, string][] = [
  ['SYMPTOM', 'CPU / pool full / 504'],
  ['ROOT', 'Missing index / bad release / SG'],
  ['FE', 'Console → Network → CDN'],
  ['EDGE', '429 gate · 502 target · 504 slow'],
  ['DATA', 'EXPLAIN · lag · hit ratio'],
  ['CHANGE', 'Flag / canary / expand-contract'],
];

export const DECISION = [
  {q:'Recent deploy + metrics worse?',yes:'Consider safe rollback / flag OFF',no:'Infra/dep/traffic hunt'},
  {q:'Trace shows DB 4s?',yes:'EXPLAIN + locks + pool',no:'Check next slow span'},
  {q:'Many threads WAITING same stack?',yes:'Fix that dependency',no:'Look CPU/GC/deadlock'},
  {q:'Rollback crosses migration?',yes:'Fix forward',no:'Rollback OK if tested'},
  {q:'Retrying overloaded dep?',yes:'Stop — open CB / shed',no:'Bounded idempotent retry OK'},
];

export const SIXTY =
  'Confirm impact and blast radius, check deploy markers and golden signals, pull traces and a thread dump if saturated, mitigate first (rollback/flag/shed), then prove root cause with evidence and prevent with detect+mitigate controls.';

export const FIVE_MIN =
  'Walk the stack FE→CDN→GW→ALB→Spring→pools→Redis/Kafka/DB→AWS. Correlate time with change. Distinguish symptom (CPU, pool) from root (missing index, bad canary). Choose rollback vs fix-forward using DB compatibility. Run P1 bridge with timed comms and an evidence-based escalation pack. Close with RCA actions: Prevent, Detect, Mitigate, Recover.';
