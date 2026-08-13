import type {CostTopic} from './types';

export const TOPICS_A: CostTopic[] = [
  {
    id: 'code',
    title: 'Code Creates Cloud Cost',
    badge: 'Java / Spring',
    problem:
      'Inefficient Java/Spring code amplifies CPU, DB, network, logs, and retries — which becomes AWS spend.',
    whenToUse:
      'Before scaling instances: profile N+1, payload size, allocation, logging, and downstream call fan-out.',
    whenAvoid: 'Buying bigger EC2/RDS first without proving the bottleneck is capacity, not waste.',
    mermaid: `flowchart TD
  BAD[Bad code] --> CPU[More CPU]
  BAD --> MEM[More memory]
  BAD --> DB[More DB calls]
  BAD --> NET[More network]
  BAD --> LOG[More logs]
  BAD --> RET[More retries]
  CPU --> COST[More AWS cost]
  MEM --> COST
  DB --> COST
  NET --> COST
  LOG --> COST
  RET --> COST`,
    code: `// BAD — N+1 (1000 orders → 1000 customer queries)
for (Order order : orders) {
  customerRepository.findById(order.getCustomerId());
}

// GOOD — batch
Set<Long> ids = orders.stream().map(Order::getCustomerId).collect(toSet());
Map<Long, Customer> byId = customerRepository.findAllById(ids).stream()
    .collect(toMap(Customer::getId, c -> c));

// BAD — allocation storm
String result = "";
for (String v : values) result += v; // many short-lived Strings → GC ↑ → CPU ↑

// GOOD
StringBuilder sb = new StringBuilder();
for (String v : values) sb.append(v);

// BAD — payload logging at INFO in prod
log.info("Full request {}", request); // 1M × 10KB = 10GB/day logs`,
    failure:
      'Team “fixed” latency by doubling instances while N+1 remained — bill +40%, latency barely improved.',
    production:
      'Payment list endpoint: 1k orders × customer lookup → RDS CPU 90% → ASG scale-out → NAT + CloudWatch also rose. Batching cut DB QPS 10× and instance count in half.',
    interview30s:
      'Cloud cost is often wasted work: N+1, fat payloads, allocation/GC, retries, and chatty microservices. Fix code before buying capacity.',
    followUp: 'Walk through cost cascade: code → DB → threads → autoscaling → bill.',
    tradeoff: 'Micro-optimizing every loop vs shipping; prioritize Impact × Confidence / Effort.',
    memoryTrick: 'More work → more cloud. Eliminate work first.',
  },
  {
    id: 'database',
    title: 'Database Cost · Index · SQL vs NoSQL',
    badge: 'RDS / DynamoDB',
    problem:
      'DB cost = compute + storage + I/O + replicas + backups. Bad queries and wrong technology choice dominate.',
    whenToUse:
      'EXPLAIN before scale-up; pick SQL vs NoSQL from access pattern; treat indexes as write/storage cost.',
    whenAvoid: 'Adding replicas or bigger RDS class to hide missing indexes / SELECT *.',
    mermaid: `flowchart TD
  DBC[DATABASE COST] --> COMP[Compute]
  DBC --> STOR[Storage]
  DBC --> IO[I/O / queries]
  Q[SELECT * wide rows] --> NET[Transfer ↑]
  NET --> MEM[Memory ↑]
  MEM --> CPU[CPU ↑]
  IDX[Too many indexes] --> INS[INSERT/UPDATE cost ↑]
  IDX --> ST2[Storage ↑]`,
    code: `-- BAD: pull entire row when UI needs three fields
SELECT * FROM transactions WHERE customer_id = ?;

-- GOOD: projection
SELECT id, amount, status FROM transactions WHERE customer_id = ?;

-- Index impact matrix
-- SELECT latency ↓  |  storage ↑  |  INSERT/UPDATE cost ↑  |  maintenance ↑

-- Spring Data: avoid N+1 with @EntityGraph / join fetch / batch IDs
-- DynamoDB: on-demand vs provisioned — predictable KV traffic vs relational joins

-- Connection pool trap
-- 100 app instances × 50 connections = 5000 theoretical connections
-- Cap pool (e.g. 10) and size for DB max_connections + headroom`,
    failure:
      'Scaled RDS to 4× after deploy; root cause was full table scan. Index + rewrite cut CPU to 25%; instance could downsize.',
    production:
      'EXPLAIN ANALYZE / Performance Insights first. Replicas help read scale but each replica is another bill — ROI must beat cost.',
    interview30s:
      'Optimize query and schema before instance class. Indexes trade write cost for read speed. Technology follows workload, not fashion.',
    followUp: 'When is DynamoDB cheaper TCO than Postgres for payments?',
    tradeoff: 'Denormalization / NoSQL speed vs consistency and engineering cost.',
    memoryTrick: 'Fix the SQL before the SKU.',
  },
  {
    id: 'compute',
    title: 'Compute · Capacity Planning · JVM · Threads',
    badge: 'EC2 / ECS / EKS / Lambda',
    problem:
      'Instance count and SKU should come from RPS, concurrency, latency, and measured capacity — not guesswork.',
    whenToUse:
      'Capacity formula + load tests for HA headroom; right-size JVM heap to instance memory; choose EC2/ECS/EKS/Lambda by traffic shape.',
    whenAvoid: 'Fixed 24×7 max fleet for diurnal traffic; Lambda for long blocking waits at high RPS.',
    mermaid: `flowchart TD
  RPS[5000 RPS] --> PT[100ms processing]
  PT --> CONC[500 concurrent]
  CONC --> CAP[100 concurrent/instance]
  CAP --> N[5 instances]
  N --> HEAD[×1.5 headroom → 8]
  ALB --> A1 & A2 & A3 & A4 & A5 & A6 & A7 & A8
  TRAF[Diurnal: 100→5000→100 RPS] --> ASG[Autoscale 2→20→2]
  FIXED[Fixed 10×24h] --> WASTE[Idle waste]`,
    code: `// Capacity sketch (planning only — verify with load tests)
// concurrency ≈ RPS × latency_sec
// instances ≈ ceil(concurrency / safe_per_instance × HA_factor)

// JVM memory waste
// Heap needs 1GB but box is 8GB → pay for unused RAM
// Size heap + metaspace + native + headroom to instance

// Thread / pool mismatch
// Tomcat maxThreads=1000 but DB pool=100 → 900 blocked waiters
// Align pools, timeouts, bulkheads (Resilience4j)

// Lambda cost trap: wait on slow DB 10s × high invocation rate
// Duration × memory × invocations — continuous services may win

// Illustrative pricing: verify current AWS rates before decisions`,
    failure:
      'Over-autoscaling on latency blip: +20 instances, then DB overload + retries → cost cascade.',
    production:
      'Measure CPU/mem/GC/RPS/latency. Compute Optimizer for rightsizing; validate peaks and failover capacity before downsizing.',
    interview30s:
      'concurrency = RPS × latency; divide by safe capacity; add HA. Autoscale diurnal load. Don’t over-thread past DB limits.',
    followUp: 'EC2 vs Fargate vs EKS vs Lambda for payment API at 10k RPS?',
    tradeoff: 'Reserved/Savings Plan discount vs flexibility; Spot savings vs interruption.',
    memoryTrick: 'Calculate instances; don’t invent them.',
  },
];
