import type {CostTopic} from './types';

export const TOPICS_C: CostTopic[] = [
  {
    id: 'aws-opts',
    title: 'RI · Savings Plans · Spot · Graviton · HA/DR',
    badge: 'AWS levers',
    problem:
      'Commercial levers cut unit price; HA/DR raise spend by design. Match commitment to predictability.',
    whenToUse:
      'Stable baseline → Savings Plans/RI; fault-tolerant batch → Spot; ARM-compatible JVM → Graviton; DR model from RTO/RPO.',
    whenAvoid: 'Spot for single critical DB; cutting Multi-AZ to meet a cost KPI.',
    mermaid: `flowchart TD
  STABLE{Stable workload?} -->|Yes| SP[Savings Plan / RI]
  STABLE -->|No| OD[On-demand + ASG]
  BATCH[Stateless batch] --> SPOT[Spot]
  SPOT --> INT[Interruption OK?]
  X86[x86] --> ARM[Graviton?]
  ARM --> COMP[Native libs / images OK?]
  SLA[Availability SLA] --> ARCH[Architecture]
  ARCH --> COST[Cost]
  DR[Backup → Pilot → Warm → Active] --> $$[Cost ↑ as RTO ↓]`,
    code: `// On-demand = flexibility, higher unit cost
// Commitment = discount for predictable baseline (keep burst on-demand)
// Spot: CI, batch, stateless workers — never sole prod DB
// Graviton: verify JDK, native deps, agents, Docker multi-arch

// Downtime cost ≈ revenue/min × minutes + SLA + reputation
// Saving ₹20k infra that risks ₹30L outage is bad architecture

// S3 lifecycle: Standard → IA → Archive (retrieval trade-offs)
// Backups: retention × size × frequency × cross-region copy

// Illustrative ₹ figures only — verify AWS pricing`,
    failure: 'Moved critical stateful worker to Spot → interruption during settlement window.',
    production:
      'Commit baseline after 30–90 days of Cost Explorer; keep elasticity for peaks. Document RTO/RPO vs DR tier cost.',
    interview30s:
      'Commit for baseline, Spot for interruptible, Graviton after compatibility. Price HA/DR against downtime cost.',
    followUp: 'How do you explain Multi-AZ cost to CFO?',
    tradeoff: 'Invoice reduction vs resilience and lock-in of commitments.',
    memoryTrick: 'Cheapest SKU ≠ best business outcome.',
  },
  {
    id: 'finops',
    title: 'TCO · Attribution · Env Cost · Cost/Txn',
    badge: 'FinOps',
    problem:
      'AWS invoice ≠ TCO. Tag everything; kill idle non-prod; track cost per transaction.',
    whenToUse:
      'Architecture reviews, chargeback/showback, env scheduling, managed vs self-managed decisions.',
    whenAvoid: 'Optimizing only the invoice while engineering hours explode on self-managed stacks.',
    mermaid: `flowchart TD
  TCO[TCO] --> AWS[Infra]
  TCO --> ENG[Engineering]
  TCO --> OPS[Ops]
  TCO --> SEC[Security]
  TCO --> DR[DR]
  TCO --> DOWN[Downtime]
  TAG[Tags: service team env owner] --> ATTR[Attribution]
  PROD[Prod 100%] --> DEV[Dev 24×7 waste]
  DEV --> SCHED[Schedule off nights/weekends]
  COST[Monthly ₹20L] --> TXN[100M txns → ₹0.02/txn]`,
    code: `// Cost per request = monthly_infra / monthly_requests
// Cost per business txn = infra / payment_count
// Track at 1×, 2×, 10× traffic in capacity model

// Managed Kafka/Redis/EKS: higher AWS, lower eng hours
// Self-managed: lower AWS, patching/HA/backup eng cost

// Non-prod: schedule shutdown, smaller SKUs, ephemeral envs
// Showback = visibility; chargeback = budget accountability

// ROI = (Annual savings − Implementation) / Implementation
// Payback months = Implementation / Monthly savings`,
    failure:
      'Self-hosted Kafka “saved” ₹2L/month but needed 2 FTE — TCO worse than MSK.',
    production:
      'Mandatory tags on create; Budgets per account/team; CUR → Athena for service rollups.',
    interview30s:
      'TCO includes people and downtime. Attribute by tags. Optimize cost/txn, not vanity savings.',
    followUp: 'Design FinOps governance for 50 AWS accounts.',
    tradeoff: 'Chargeback politics vs waste reduction.',
    memoryTrick: 'No owner → no cost control.',
  },
  {
    id: 'tools',
    title: 'Production Cost Tools · Investigation',
    badge: 'Toolbox',
    problem:
      'Architects investigate cost with Cost Explorer → metrics → traces → code — not gut feel.',
    whenToUse:
      'Bill spike, rightsizing, PR cost review (Infracost), EKS waste (Kubecost), SQL hotspots.',
    whenAvoid: 'Blindly applying Compute Optimizer without peak/JVM/HA validation.',
    mermaid: `flowchart TD
  ALERT[Cost alert +35%] --> CE[Cost Explorer]
  CE --> SVC[Service ↑]
  SVC --> CW[CloudWatch]
  CW --> OTEL[OpenTelemetry fan-out]
  OTEL --> GIT[Recent deploy]
  GIT --> CODE[N+1 / retry / log]
  CODE --> FIX[Fix → load test → deploy]
  FIX --> SAVE[Verify monthly savings]
  TOOLS[Cost Explorer · Budgets · Anomaly · CUR · Optimizer · Trusted Advisor]
  JAVA[JFR · Actuator · Prometheus · Grafana]
  K8S[Kubecost] --> TF[Infracost on PR]`,
    code: `-- CUR / Athena sketch
SELECT service, SUM(cost) AS spend
FROM aws_cost_usage
GROUP BY service
ORDER BY spend DESC;

-- Log Insights: noisy errors / retries
fields @timestamp, @message
| filter @message like /retry|ERROR/
| stats count() by bin(5m)

-- Actuator / Micrometer: http.server.requests, jvm.gc, hikaricp, cache.gets
-- JFR: CPU hotspot → method → optimize → fewer instances
-- Infracost: Terraform PR shows +₹3L/month before merge
-- RDS Performance Insights + EXPLAIN before upsizing
-- NEVER auto-delete prod without owner + dependency check`,
    failure:
      'Deleted “idle” EBS that was delayed attachment for DR drill — outage during failover test.',
    production:
      'Workflow: Alert → Explorer → resource → metrics → code/DB/network → fix → measure → document ₹ savings.',
    interview30s:
      'Trace invoice to service to metric to deploy to code. Tools: Explorer, Anomaly, JFR, OTel, Kubecost, Infracost.',
    followUp: '40% overnight increase — step-by-step investigation.',
    tradeoff: 'FinOps platform cost vs multi-account chaos.',
    memoryTrick: 'Invoice → service → metric → commit.',
  },
  {
    id: 'incidents',
    title: 'Production Cost Incidents',
    badge: 'Scenarios',
    problem:
      'Cost spikes usually share DNA with reliability failures: deploy regressions, amplification, DB scans, log floods.',
    whenToUse: 'Bill anomaly, post-deploy cost, traffic surge, cascading scale-out.',
    whenAvoid: 'Immediately buying Reserved capacity during an unexplained spike.',
    mermaid: `flowchart TD
  SPIKE[Bill +40%] --> Q{Compute DB Network Logs?}
  DEP[Deploy] --> N1[N+1 / API loop]
  N1 --> AMP[Amplification]
  AMP --> ASG[Instances ↑]
  DBQ[Full scan] --> RDSS[RDS scale]
  DB_SLOW[DB slow] --> BLOCK[Threads block]
  BLOCK --> ASG2[ASG ↑]
  ASG2 --> RET[Retries ↑]
  RET --> WORSE[DB worse]
  WORSE --> BOOM[COST EXPLOSION]
  FIX[Rate limit · CB · queue · query fix · right-size]`,
    code: `// Incident A: deploy added nested external API calls
// Before 100 calls/req → After 1000; 10k req/min → external storm

// Incident B: new query without index → RDS CPU 95% → larger class
// Fix: EXPLAIN + index; downsize later

// Incident C: traffic spike → ASG 100 → DB overload → retries → more ASG
// Prevention: edge RL, queue, backpressure, CB, cache, sane ASG cooldowns

// Always measure savings after fix (before/after Cost Explorer + cost/txn)`,
    failure: 'Treated symptom (scale RDS) as fix; waste locked in for months.',
    production:
      'Cost and SRE share runbooks. Reliability fixes often are the largest cost wins.',
    interview30s:
      'Correlate spike with deploy and fan-out. Fix amplification/query; then right-size. Reliability ≡ cost control.',
    followUp: 'How prove ₹36L/year savings to CFO?',
    tradeoff: 'Fast mitigations (scale up) vs permanent waste.',
    memoryTrick: 'Cost explosion is often a retry/amplification loop.',
  },
];
