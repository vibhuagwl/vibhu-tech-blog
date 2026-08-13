/** Illustrative ₹ figures — verify live AWS pricing before production decisions. */

export const OPTION_COMPARE = [
  {d: 'Compute', a: 'EC2 hours + EBS', b: 'Fargate vCPU/mem', c: 'Invocations × duration × mem'},
  {d: 'Database', a: 'RDS + Redis', b: 'RDS + Redis', c: 'DynamoDB + APIGW'},
  {d: 'Scaling', a: 'ASG manual care', b: 'Service autoscaling', c: 'Native concurrency'},
  {d: 'Ops', a: 'Patch/OS ownership', b: 'Less OS, more task defs', c: 'Minimal servers'},
  {d: 'Steady high RPS', a: 'Often strong', b: 'Strong', c: 'May be expensive'},
  {d: 'Spiky / idle', a: 'Waste if fixed', b: 'Better scale-to-zero-ish', c: 'Often best'},
  {d: 'Engineering', a: 'Familiar', b: 'Containers skill', c: 'Cold start / limits'},
  {d: 'TCO note', a: 'Baseline + RI', b: 'Ops vs Fargate premium', c: 'Watch duration waits'},
];

export const SCORECARD = [
  {name: 'Arch A — EC2+RDS', compute: 6, db: 7, net: 6, ops: 5, eng: 8, scale: 6, cost: 6},
  {name: 'Arch B — ECS+RDS', compute: 7, db: 7, net: 6, ops: 7, eng: 7, scale: 8, cost: 7},
  {name: 'Arch C — Lambda+DDB', compute: 8, db: 6, net: 5, ops: 9, eng: 6, scale: 9, cost: 5},
];

export const SAVINGS_BACKLOG = [
  ['EC2 rightsizing', '₹2L', 'Low', 'Low', 'P0'],
  ['Log retention', '₹1L', 'Low', 'Low', 'P0'],
  ['NAT / endpoints', '₹3L', 'Med', 'Med', 'P0'],
  ['DB query / index', '₹2L', 'Med', 'Low', 'P0'],
  ['Dev auto-shutdown', '₹50K', 'Low', 'Low', 'P1'],
  ['Graviton migrate', '₹2L', 'Med', 'Med', 'P1'],
  ['Arch redesign', '₹10L', 'High', 'High', 'P2'],
];

export const TOOLBOX = [
  ['AWS bill analysis', 'Cost Explorer'],
  ['Budget control', 'AWS Budgets'],
  ['Unexpected spike', 'Cost Anomaly Detection'],
  ['EC2 rightsizing', 'Compute Optimizer'],
  ['AWS recommendations', 'Trusted Advisor'],
  ['Detailed analytics', 'CUR + Athena'],
  ['Allocation', 'Cost Allocation Tags'],
  ['JVM CPU/GC', 'JFR / JMC / async-profiler'],
  ['Spring metrics', 'Actuator + Micrometer'],
  ['Dashboards', 'Prometheus + Grafana'],
  ['Tracing / fan-out', 'OpenTelemetry'],
  ['EKS cost', 'Kubecost'],
  ['Terraform PR cost', 'Infracost'],
  ['SQL hotspots', 'EXPLAIN ANALYZE / PI'],
  ['S3 growth', 'Storage Lens'],
  ['Network paths', 'VPC Flow Logs'],
  ['Multi-account FinOps', 'CloudHealth / Cloudability'],
];

export const REVIEW_CHECKLIST = [
  'Peak RPS + growth + payload size',
  'Concurrency + latency SLA + availability',
  'Instance math + ASG min/max + cooldown',
  'DB queries, indexes, connections, replicas',
  'Cache hit ratio + stampede controls',
  'Kafka throughput, RF, retention',
  'NAT / cross-AZ / cross-region paths',
  'Log/trace volume + retention',
  'Backup + DR tier vs RTO/RPO',
  'Cost/txn + TCO + 2×/10× sensitivity',
];

export const CODE_REVIEW_COST = [
  'Extra DB queries / N+1?',
  'Larger payloads / SELECT *?',
  'New external API fan-out?',
  'Unbounded retries?',
  'More Kafka messages?',
  'Log volume / PII dumps?',
  'Memory/CPU/allocation spikes?',
  'Cache miss storms?',
  'Cross-AZ chatty calls?',
  'Needs more instances at same RPS?',
];

export const GOLDEN = [
  'Measure before optimizing',
  'Cut waste, not required capacity',
  'Right-size before redesign',
  'Fix code before buying instances',
  'Fix queries before scaling DB',
  'Cache only if savings > cache TCO',
  'Control traffic amplification',
  'Minimize unnecessary cross-region',
  'Watch NAT Gateway GB',
  'Control log volume & retention',
  'Autoscale with cooldowns & limits',
  'Do not remove HA for small savings',
  'Do not sacrifice security',
  'Optimize TCO, not only invoice',
  'Track cost per transaction',
  'Treat retries as extra traffic',
  'Observability is a cost center',
  'Retention is a cost decision',
  'Revisit architecture on traffic shifts',
  'Cost optimization is continuous',
];

export const CHEAT: [string, string][] = [
  ['COMPUTE', 'Right-size · ASG · Spot · Savings Plans · Graviton'],
  ['DATABASE', 'Query · index · cache · pool · retention · PI'],
  ['NETWORK', 'NAT · endpoints · AZ · region · egress · CF'],
  ['STORAGE', 'Lifecycle · compression · archive · snapshots'],
  ['APPLICATION', 'N+1 · retries · payload · threads · GC · logs'],
  ['OBSERVABILITY', 'Levels · sampling · retention · cost dashboards'],
  ['ARCHITECTURE', 'Fan-out budget · HA/DR priced vs downtime'],
  ['FINOPS', 'Tags · budgets · CUR · showback · ROI'],
];

export const DECISION = [
  {q: 'Bill spiked?', yes: 'Cost Explorer → service → metric → deploy → code', no: 'Continue baseline hygiene'},
  {q: 'CPU high?', yes: 'JFR/profile before more instances', no: 'Check memory/GC/IO'},
  {q: 'DB CPU high?', yes: 'EXPLAIN / PI before larger class', no: 'Check connections/storage'},
  {q: 'NAT high?', yes: 'Endpoints + traffic map', no: 'Check cross-region'},
  {q: 'Need HA?', yes: 'Price Multi-AZ vs downtime', no: 'Do not fake HA'},
  {q: 'Idle non-prod?', yes: 'Schedule / shrink / ephemeral', no: 'Tag owners'},
];

export const SIXTY =
  'Cloud cost is waste × price. Trace business traffic through APIs, code, DB, cache, Kafka, network, and observability. Calculate instances from RPS×latency; fix N+1 and amplification before scaling; bound retries; watch NAT and logs; commit baseline capacity; measure TCO and cost/txn — not vanity SKU savings. Illustrative prices must be re-checked against live AWS rates.';

export const FIVE_MIN =
  'Whiteboard: users → edge → services → Redis/Kafka/DB → AWS bill. Capacity: concurrency=RPS×latency, headroom for HA. Show amplification and retry storms. Cost incident: Explorer→CloudWatch→OTel→git→fix→verify savings. Compare EC2/ECS/Lambda options on TCO. End with FinOps tags, budgets, and cost/txn for CFO.';
