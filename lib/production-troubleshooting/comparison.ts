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
  {s:'CDC lag',f:'connector lag',n:'slot/WAL',r:'stuck CDC'},
  {s:'DLQ flood',f:'DLQ depth',n:'error payload',r:'poison/schema'},
  {s:'Idle-in-tx',f:'pg_stat_activity',n:'app tx scope',r:'held connection'},
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
  {p:'CDC lag',m:'Pause sink / catch up',i:'Slot + connector'},
  {p:'Poison DLQ',m:'Park message / fix schema',i:'Deserializer + payload'},
  {p:'Canary bad',m:'Abort canary',i:'Canary vs baseline'},
];

/**
 * Command toolbox rows: Command → tells me → abnormal → next.
 * `g` is the layer/group for filtering display.
 */
export type CmdRow = {
  g: string;
  c: string;
  t: string;
  a: string;
  n: string;
};

export const COMMANDS: CmdRow[] = [
  {g:'Linux',c:'top / free -m / df -h',t:'Host CPU/mem/disk',a:'CPU~100%, mem low, disk>85%',n:'pidstat / iostat → isolate process'},
  {g:'Linux',c:'iostat -xz 1 / vmstat 1',t:'IO wait + run queue',a:'%iowait high, b>0',n:'Find disk hogs; check DB/logs'},
  {g:'Linux',c:'ss -s / ss -tanp',t:'Socket + conn counts',a:'TIME_WAIT storm / ESTAB↑',n:'Check FD limits + client churn'},
  {g:'Linux',c:'lsof -p <pid> | wc -l',t:'Open FD count',a:'Near ulimit -n',n:'Leak hunt; restart; raise carefully'},
  {g:'JVM',c:'jcmd <pid> Thread.print',t:'Thread stacks',a:'Many WAITING same stack',n:'Fix that dep; shed load'},
  {g:'JVM',c:'jstat -gcutil <pid> 1s',t:'GC pressure',a:'FGC↑ / Old~100%',n:'Heap dump once; reduce alloc'},
  {g:'JVM',c:'jcmd <pid> GC.heap_info',t:'Heap regions',a:'Old gen full',n:'Dump + leak analysis'},
  {g:'Network',c:'curl -v -o /dev/null -w "%{http_code} %{time_total}"',t:'HTTP code + latency',a:'5xx or >timeout budget',n:'Trace hop; check LB/target'},
  {g:'Network',c:'dig +short <host>',t:'DNS resolution',a:'NXDOMAIN / stale A',n:'Route53 / CoreDNS / TTL'},
  {g:'Network',c:'openssl s_client -connect host:443 -servername host',t:'TLS chain',a:'Expired / verify error',n:'Rotate cert; fix SAN/chain'},
  {g:'K8s',c:'kubectl describe pod <p> -n <ns>',t:'Events + limits',a:'OOMKilled / FailedMount',n:'logs --previous; fix limit/secret'},
  {g:'K8s',c:'kubectl logs <p> -n <ns> --previous',t:'CrashLoop prior log',a:'Boot exception / OOM',n:'Rollback image or fix env'},
  {g:'K8s',c:'kubectl get pods -o wide -n <ns>',t:'Ready/restarts/node',a:'CrashLoop / ImagePull',n:'describe + events'},
  {g:'K8s',c:'kubectl top pod -n <ns>',t:'CPU/mem usage',a:'Near limit / throttled',n:'Right-size or fix leak'},
  {g:'K8s',c:'kubectl rollout undo deploy/<d> -n <ns>',t:'Instant prior revision',a:'Errors after deploy',n:'Confirm DB-compat first'},
  {g:'K8s',c:'kubectl get events -n <ns> --sort-by=.lastTimestamp',t:'Cluster timeline',a:'FailedScheduling / OOM',n:'Node capacity / probes'},
  {g:'Kafka',c:'kafka-consumer-groups.sh --bootstrap-server $B --describe --group $G',t:'Lag by partition',a:'Lag↑ or one partition hot',n:'Consumer CPU; key skew'},
  {g:'Kafka',c:'kafka-console-consumer.sh --bootstrap-server $B --topic $T --from-beginning --max-messages 5',t:'Sample payload',a:'Bad schema / poison',n:'Fix deserializer; park DLQ'},
  {g:'Kafka',c:'kafka-topics.sh --bootstrap-server $B --describe --topic $T',t:'Partitions / ISR',a:'ISR < RF / under-replicated',n:'Broker disk/network'},
  {g:'DB',c:'EXPLAIN (ANALYZE, BUFFERS) <sql>',t:'Plan + actual time',a:'Seq Scan / rows≪est',n:'Index / rewrite / stats'},
  {g:'DB',c:"SELECT pid,state,wait_event,query FROM pg_stat_activity WHERE state<>'idle'",t:'Live sessions',a:'idle in transaction / blocked',n:'Terminate blocker carefully'},
  {g:'DB',c:'SELECT * FROM pg_locks WHERE NOT granted',t:'Lock waits',a:'Many ungranted',n:'Find blocking pid; kill/tune'},
  {g:'DB',c:'SELECT slot_name,active,restart_lsn FROM pg_replication_slots',t:'Slot health',a:'Inactive + LSN lag',n:'Catch up CDC or drop slot'},
  {g:'DB',c:'SELECT relname,n_dead_tup,last_autovacuum FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 10',t:'Bloat candidates',a:'Dead≪live / vacuum old',n:'VACUUM / tune autovacuum'},
  {g:'Mongo',c:'mongosh --eval "db.currentOp(true)"',t:'In-flight ops',a:'Long query / lock',n:'killOp; add index'},
  {g:'Mongo',c:'db.coll.find(q).explain("executionStats")',t:'Query plan',a:'COLLSCAN / docsExamined≫n',n:'Create index'},
  {g:'Mongo',c:'rs.status()',t:'Replica set health',a:'PRIMARY missing / lag',n:'Wait election; check network'},
  {g:'Redis',c:'INFO memory / INFO stats',t:'Mem + hits',a:'evicted_keys↑ / hit ratio↓',n:'Stampede controls; size'},
  {g:'Redis',c:'SLOWLOG GET 10',t:'Slow commands',a:'KEYS / big O(N)',n:'Rewrite; SCAN; limit payload'},
  {g:'AWS',c:'aws elbv2 describe-target-health --target-group-arn $TG',t:'Target health',a:'unhealthy / draining',n:'Target logs; probes'},
  {g:'AWS',c:'aws logs filter-log-events --log-group-name $G --filter-pattern "ERROR"',t:'App errors',a:'Spike after deploy',n:'Correlate version marker'},
  {g:'AWS',c:'aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=AccessDenied',t:'IAM denies',a:'AccessDenied surge',n:'Fix policy least-priv'},
  {g:'AWS',c:'aws ec2 describe-nat-gateways --filter Name=state,Values=available',t:'NAT inventory',a:'Single NAT / AZ gap',n:'Check BytesOut + port errors'},
  {g:'AWS',c:'aws kafka describe-cluster --cluster-arn $ARN',t:'MSK state',a:'ACTIVE but under-replicated',n:'Broker disk/CPU metrics'},
  {g:'CDC',c:'curl $CONNECT/connectors/$C/status',t:'Debezium task state',a:'FAILED / UNASSIGNED',n:'Task logs; schema; restart'},
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
  ['CDC', 'Lag · slot · WAL — never ignore stuck slots'],
  ['KAFKA', 'Lag by partition · ISR · poison → DLQ'],
];

export const REMEMBER: [string, string][] = [
  ['SYMPTOM', 'CPU / pool full / 504'],
  ['ROOT', 'Missing index / bad release / SG'],
  ['FE', 'Console → Network → CDN'],
  ['EDGE', '429 gate · 502 target · 504 slow'],
  ['DATA', 'EXPLAIN · lag · hit ratio'],
  ['CHANGE', 'Flag / canary / expand-contract'],
  ['AUTH', 'Clock · JWKS · secrets dual-read'],
  ['IDEMPOTENCY', 'Side effect before offset commit'],
];

export const DECISION = [
  {q:'Recent deploy + metrics worse?',yes:'Consider safe rollback / flag OFF',no:'Infra/dep/traffic hunt'},
  {q:'Trace shows DB 4s?',yes:'EXPLAIN + locks + pool',no:'Check next slow span'},
  {q:'Many threads WAITING same stack?',yes:'Fix that dependency',no:'Look CPU/GC/deadlock'},
  {q:'Rollback crosses migration?',yes:'Fix forward',no:'Rollback OK if tested'},
  {q:'Retrying overloaded dep?',yes:'Stop — open CB / shed',no:'Bounded idempotent retry OK'},
  {q:'Horizontal scale not helping?',yes:'Find single-partition / hot key / DB lock',no:'Capacity may still help'},
  {q:'CDC lag + WAL disk↑?',yes:'Check replication slots first',no:'Normal growth / retention'},
  {q:'Canary worse than baseline?',yes:'Abort canary immediately',no:'Continue soak carefully'},
];

export const SIXTY =
  'Confirm impact and blast radius, check deploy markers and golden signals, pull traces and a thread dump if saturated, mitigate first (rollback/flag/shed), then prove root cause with evidence and prevent with detect+mitigate controls.';

export const FIVE_MIN =
  'Walk the stack FE→CDN→GW→ALB→Spring→pools→Redis/Kafka/DB→AWS. Correlate time with change. Distinguish symptom (CPU, pool) from root (missing index, bad canary). Choose rollback vs fix-forward using DB compatibility. Run P1 bridge with timed comms and an evidence-based escalation pack. Close with RCA actions: Prevent, Detect, Mitigate, Recover.';
