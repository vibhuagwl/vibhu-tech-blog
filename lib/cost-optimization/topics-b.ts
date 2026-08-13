import type {CostTopic} from './types';

export const TOPICS_B: CostTopic[] = [
  {
    id: 'network',
    title: 'Network · NAT · Data Transfer · AZ/Region',
    badge: 'AWS trap',
    problem:
      'NAT Gateway, cross-AZ, cross-region, and egress often surprise architects more than EC2 hours.',
    whenToUse:
      'Map every byte path: private subnet → internet, AZ-A ↔ AZ-B, region A → B. Prefer VPC endpoints for S3/DynamoDB where justified.',
    whenAvoid: 'Removing Multi-AZ HA solely to save transfer pennies when SLA requires redundancy.',
    mermaid: `flowchart TD
  EC2[Private EC2] --> NAT[NAT Gateway]
  NAT --> INET[Internet]
  NAT --> $$[Per-GB processing cost]
  A[Service A Region A] --> XFER[Cross-region]
  XFER --> B[Service B Region B]
  AZA[AZ-A] --> CROSS[Cross-AZ traffic]
  CROSS --> AZB[AZ-B]
  S3EP[S3 Gateway Endpoint] --> SAVE[Avoid NAT for S3]`,
    code: `// Cost dimensions (illustrative — verify AWS pricing)
// NAT: hourly + GB processed
// ALB: LCU (new/active connections, processed bytes, rules)
// API Gateway: requests + data + optional cache/WAF/logging
// CloudFront: often cheaper egress + caching vs origin egress

// RPS → monthly requests
// 10_000 RPS × 60 × 60 × 24 × 30 ≈ 25.9B requests/month
// Use for APIGW / ALB / Lambda order-of-magnitude only

// Reduce NAT: VPC endpoints, regional affinity, avoid chatty cross-AZ chat
// Multi-region: 2× compute + replication + transfer + dual observability`,
    failure:
      'Microservice mesh chatting across AZs + pulling S3 via NAT → NAT line item larger than compute.',
    production:
      'Cost Explorer → Usage Type NATGateway-Bytes. Fix with Gateway Endpoint + co-locate chatty pairs. Keep Multi-AZ for HA; optimize chatter, not redundancy.',
    interview30s:
      'NAT and transfer are classic traps. Endpoints for AWS APIs, minimize cross-region, treat Multi-AZ as SLA cost not optional fluff.',
    followUp: 'Active-active vs active-passive multi-region TCO?',
    tradeoff: 'HA/DR spend vs downtime cost (revenue/min × minutes).',
    memoryTrick: 'Follow the bytes — they become invoices.',
  },
  {
    id: 'amplify',
    title: 'Traffic Amplification · Retries · Polling',
    badge: 'Critical',
    problem:
      '1 user request can become dozens of internal ops. Retries and polling multiply spend and can cause cost cascading failures.',
    whenToUse:
      'Design APIs and service graphs with fan-out budgets; bound retries; prefer events over aggressive polling.',
    whenAvoid: 'Unbounded retries + long timeouts during partial outages.',
    mermaid: `flowchart TD
  U[1000 user RPS] --> A[Service A]
  A --> B[Service B]
  A --> C[Service C]
  A --> D[Service D]
  U2[3000 internal RPS] --> DB[×3 DB calls → 9000 ops/s]
  FAIL[20% fail] --> R[×3 retries]
  R --> STORM[Retry storm]
  STORM --> ASG[Scale out]
  ASG --> COST[Cost explosion]
  POLL[1000 clients × 12/min] --> WASTE[12k req/min polling]`,
    code: `// Amplification
// 1 client request → 5 backend calls + 10 DB + 3 Redis + 5 Kafka = 23 ops
// 1M clients/day → ~23M internal ops/day

// Effective traffic ≈ original × (1 + retries) on failure paths
// Must: timeout, exponential backoff + jitter, max attempts, circuit breaker, bulkhead

// Bad deploy: loop calling externalApi 10× more
// 10k req/min × 1000 calls = 10M external calls/min → network + vendor + CPU

// Polling → events (Kafka/SNS/SQS) or SSE/WebSocket when appropriate
// Cascading: DB slow → threads blocked → ASG → more load → cost explosion`,
    failure:
      'Partial outage + aggressive retries filled ASG and DynamoDB — bill spiked while success rate fell.',
    production:
      'Trace fan-out with OpenTelemetry. Cap concurrency. Rate-limit at edge. Queue + backpressure for spikes.',
    interview30s:
      'Model fan-out and retries as multipliers on every cost center. Bound retries; prefer events to polling.',
    followUp: 'How do you prevent cost cascading failure when DB slows?',
    tradeoff: 'Aggressive retry UX vs infrastructure blast radius.',
    memoryTrick: 'Retries are unpaid traffic.',
  },
  {
    id: 'cache-kafka',
    title: 'Cache · Kafka · Logging · Observability',
    badge: 'Data plane',
    problem:
      'Cache and Kafka save backend cost only if designed well; logs/traces are first-class cost centers.',
    whenToUse:
      'Cache when savings > cache TCO; tune Kafka retention/RF; sample traces; tier log retention.',
    whenAvoid: '100% tracing forever; INFO payload dumps; RF/retention without storage math.',
    mermaid: `flowchart TD
  HIT[90% hit → 100k DB] --> OK[DB load low]
  MISS[50% hit → 500k DB] --> SCALE[DB scale ↑ cost]
  STAMP[TTL expire] --> THU[10k stampede] --> DB2[DB overload]
  K[1TB logical × RF3] --> STOR[~3TB brokers]
  LOG[1M × 10KB/day] --> M[300GB/month]
  TRACE[1M × 20 spans] --> SP[20M spans]`,
    code: `// Cache ROI: CACHE_COST < SAVED_BACKEND_COST
// Stampede: TTL jitter, singleflight/lock, refresh-ahead, SWR

// Kafka: RF=3 → ~3× storage before overhead; retention 1d vs 30d
// Archive long history to S3; don’t keep hot brokers as cold archive

// Logs: levels, sampling, retention tiers (7 hot / 30 warm / 1y archive)
// Mask PII; never log full payment payloads at INFO

// Traces: sample 1–10% with head-based or adaptive policies
// Metrics always; traces for diagnosis`,
    failure:
      'Cache stampede after deploy TTL change → RDS autoscaled + read replicas — temporary 3× DB bill.',
    production:
      'Track hit ratio, Kafka lag/storage, CloudWatch ingestion GB. Tie Grafana RPS/CPU to monthly cost widgets.',
    interview30s:
      'Cache is a cost trade. Kafka storage ≈ data × RF × retention. Observability volume is a deliberate spend.',
    followUp: 'Self-managed Kafka vs MSK TCO?',
    tradeoff: 'Managed ops savings vs higher unit price / lock-in.',
    memoryTrick: 'Retention and RF are storage multipliers.',
  },
];
