import type {AwsTopic} from './types';

export const TOPICS_DATA: AwsTopic[] = [
  {
    id: 's3',
    title: 'Amazon S3 — Object Storage for FinTech',
    badge: 'Storage',
    category: 'Storage',
    what: 'S3 stores immutable objects in buckets (global namespace, regional). FinTech uses it for KYC documents, payment receipts, audit logs, and regulatory archives. Know storage classes, lifecycle, presigned URLs, encryption, replication, event notifications, multipart uploads, and consistency guarantees.',
    mermaid: `flowchart TB
  subgraph upload [Payment Receipt Upload]
    APP[Payment Service] -->|PutObject SSE-KMS| S3[(S3 Bucket)]
    APP -->|multipart 10GB| MPU[Multipart Upload]
    MPU --> S3
  end
  subgraph events [Event-Driven Processing]
    S3 -->|s3:ObjectCreated| EVT[Event Notification]
    EVT --> SQS[SQS Queue]
    EVT --> LBD[Lambda Thumbnail]
    SQS --> OCR[KYC OCR Worker]
  end
  subgraph dr [Cross-Region DR]
    S3 -->|CRR| S3DR[(DR Bucket eu-west-1)]
  end`,
    code: `# Bucket policy — block public access (FinTech default)
aws s3api put-public-access-block \\
  --bucket acme-payment-docs-prod \\
  --public-access-block-configuration \\
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Storage classes (pick by access pattern)
# STANDARD          — hot receipts, daily KYC review
# STANDARD_IA       — statements accessed monthly
# GLACIER_IR        — 7-year audit, occasional legal hold
# GLACIER / DEEP_ARCHIVE — regulatory cold storage

# Lifecycle — auto-tier after 90 days
{
  "Rules": [{
    "ID": "receipt-tiering",
    "Filter": {"Prefix": "receipts/"},
    "Status": "Enabled",
    "Transitions": [
      {"Days": 90, "StorageClass": "STANDARD_IA"},
      {"Days": 365, "StorageClass": "GLACIER_IR"}
    ],
    "Expiration": {"Days": 2555}
  }]
}

# Presigned URL — client uploads KYC doc directly (no creds in browser)
aws s3 presign s3://acme-kyc-prod/tenant/\${tenantId}/\${docId}.pdf \\
  --expires-in 900 \\
  --sse aws:kms \\
  --sse-kms-key-id alias/acme-kyc-key

# Java SDK v2 — presigned PUT for mobile app
S3Presigner presigner = S3Presigner.create();
PutObjectRequest req = PutObjectRequest.builder()
    .bucket("acme-kyc-prod")
    .key("tenant/" + tenantId + "/" + docId + ".pdf")
    .serverSideEncryption(ServerSideEncryption.AWS_KMS)
    .ssekmsKeyId("alias/acme-kyc-key")
    .build();
PresignedPutObjectRequest signed = presigner.presignPutObject(
    PutObjectPresignRequest.builder()
        .signatureDuration(Duration.ofMinutes(15))
        .putObjectRequest(req)
        .build());

# Encryption options
# SSE-S3 (AES-256, AWS-managed) — low-friction internal logs
# SSE-KMS (CMK, audit trail) — PCI/KYC docs, per-tenant keys
# SSE-C (customer-provided key) — rare; you manage rotation

# Event notification → SQS (async KYC pipeline)
# s3:ObjectCreated:* → arn:aws:sqs:us-east-1:123456789012:kyc-ingest
# Filter: prefix=kyc/inbound/, suffix=.pdf

# Multipart upload — 10 GB monthly statement archive
# Rule: part size ≥ 5 MB (except last), max 10,000 parts
# 10 GB / 100 MB parts = 100 parts — well under limit
aws s3 cp large-statement-10gb.csv s3://acme-archive/statements/ \\
  --storage-class STANDARD_IA \\
  --sse aws:kms \\
  --expected-size 10737418240

# Consistency (since Dec 2020)
# PUT/DELETE overwrite → read-after-write consistent (new objects)
# LIST/HEAD eventual for delete markers in rare edge cases
# Overwrite same key → latest version visible immediately`,
    verify: `# Upload test object with KMS
echo "payment-ref-12345" | aws s3 cp - s3://acme-payment-docs-prod/receipts/test.txt \\
  --sse aws:kms --sse-kms-key-id alias/acme-docs-key

# Confirm encryption + read-after-write
aws s3api head-object --bucket acme-payment-docs-prod --key receipts/test.txt \\
  | jq '{SSE, SSEKMSKeyId, LastModified}'`,
    pitfalls: 'Public bucket misconfiguration — #1 FinTech breach vector. Presigned URLs with excessive TTL or missing content-type allow abuse. Multipart uploads left incomplete → hidden storage cost. CRR without replication time control (RTC) misses RPO SLA. Using S3 as a database (listing + small object churn).',
    production: 'Block public access at account + bucket level. SSE-KMS with bucket key for cost. Lifecycle to IA/Glacier for audit retention. S3 Object Lock (COMPLIANCE mode) for immutable regulatory records. Event notifications to SQS (not direct Lambda fan-out at scale). Enable versioning + MFA delete on prod buckets. CloudTrail data events for sensitive prefixes.',
    interview30s: 'S3 is regional object storage: bucket + key + version. SSE-KMS for FinTech docs. Presigned URLs offload upload/download without embedding IAM creds. Multipart for >100 MB. Read-after-write consistency on new objects. Lifecycle tiers cost down; CRR for DR.',
    interview2m: 'Walk KYC upload: mobile gets 15-min presigned PUT with SSE-KMS and content-type constraint → S3 fires ObjectCreated → SQS → OCR worker validates passport. For 10 GB statement archive, multipart with 100 MB parts, STANDARD_IA + lifecycle to Glacier after 1 year. Compare SSE-S3 vs SSE-KMS (audit, key policy, per-tenant CMK). Mention replication (same-account CRR vs cross-account for vendor isolation) and that LIST is eventually consistent but GET on new key is strongly consistent.',
    traps: '"S3 is strongly consistent for everything" — LIST can lag. "Presigned URL grants IAM permissions" — it only allows that one operation on that key. Confusing storage class transition minimum days (e.g., IA 30-day minimum).',
  },
  {
    id: 'storage-compare',
    title: 'EBS vs EFS vs S3 — When to Use What',
    badge: 'Compare',
    category: 'Storage',
    what: 'Three AWS storage tiers serve different FinTech workloads. EBS = block storage for a single EC2 instance (database disks). EFS = shared NFS file system across AZs. S3 = object store for blobs and archives. Pick wrong tier → cost blow-up or architecture pain.',
    mermaid: `flowchart TB
  subgraph block [EBS — Block]
    EC2A[EC2 RDS Host] --> EBS[(EBS gp3 Volume)]
    EBS -->|single AZ attach| EC2A
  end
  subgraph nfs [EFS — Shared Files]
    EC2B[Report Generator] --> EFS[(EFS NFS)]
    EC2C[Risk Batch Job] --> EFS
    EFS -->|Multi-AZ| AZ1 & AZ2
  end
  subgraph object [S3 — Object]
    API[Payment API] --> S3[(S3 Bucket)]
    S3 -->|HTTP REST| GLACIER[Glacier Archive]
  end`,
    code: `# Comparison table — FinTech decision matrix
| Dimension       | EBS (gp3/io2)        | EFS (Standard/IA)     | S3                      |
|-----------------|----------------------|-----------------------|-------------------------|
| Model           | Block (disk)         | File (NFS v4.1)       | Object (key/value)      |
| Attach          | 1 EC2 per AZ*        | Many EC2, cross-AZ    | HTTP/API, anywhere      |
| Latency         | Sub-ms (local disk)  | Low-ms (network NFS)  | Low-ms (network HTTP)   |
| Throughput      | Up to 16K IOPS/vol   | Scales with mode      | 3,500 PUT/s prefix**    |
| Durability      | 99.8–99.999%         | 99.999999999% (11 9s) | 99.999999999% (11 9s)   |
| Sharing         | Single instance      | Shared mount          | Presigned URL / IAM     |
| Cost driver     | GB + IOPS provisioned| GB stored + throughput| GB + requests + tier    |
| Best FinTech use| RDS data files, EC2  | Shared config, reports| KYC PDFs, audit logs    |
| Backup          | Snapshots → S3       | AWS Backup / DataSync | Versioning, replication |
| Multi-AZ        | Snapshot restore     | Built-in              | Cross-region replication|

* io2 multi-attach exists for clustered DB; not general sharing
** prefix scaling — partition key design matters at extreme scale

# FinTech examples
# EBS gp3 — PostgreSQL on EC2 (legacy), 3000 IOPS baseline for OLTP
# EFS Standard — nightly risk reports written by 4 batch pods in EKS
# S3 STANDARD_IA — 7-year payment receipt archive, legal hold via Object Lock

# Anti-patterns
# ❌ S3 FUSE mount for database files — wrong tool
# ❌ EBS shared across 10 microservices — use EFS or S3
# ❌ EFS for hot OLTP random 4K writes — latency + cost`,
    verify: `# Check EBS volume type on RDS instance (if self-managed)
aws ec2 describe-volumes --filters Name=attachment.instance-id,Values=i-0abc123 \\
  | jq '.Volumes[] | {Type: .VolumeType, IOPS: .Iops, Size: .Size}'

# EFS mount test (from EC2 in same VPC)
sudo mount -t nfs4 -o nfsvers=4.1 fs-abc123.efs.us-east-1.amazonaws.com:/ /mnt/reports
echo "risk-run-$(date +%s)" >> /mnt/reports/daily.log`,
    pitfalls: 'Using EBS snapshots as backup without testing restore RTO. EFS IA for frequently accessed files — retrieval charges add up. S3 for POSIX file semantics (locking, partial writes). Provisioning io2 for dev environments — gp3 usually enough.',
    production: 'RDS/Aurora manages EBS underneath — don\'t roll your own unless required. EFS with lifecycle to IA for report dirs >30 days idle. S3 Intelligent-Tiering for unpredictable access (vendor invoice blobs). Encrypt all three: EBS default KMS, EFS encryption at rest, S3 SSE-KMS.',
    interview30s: 'EBS = disk for one instance (RDS, EC2 DB). EFS = shared NFS across AZs for batch/report pods. S3 = cheap durable objects for docs and archives. FinTech: transactional data on RDS/Aurora (EBS-backed), shared files on EFS, compliance blobs on S3.',
    interview2m: 'Payment platform: PostgreSQL on Aurora (EBS layer abstracted), EKS risk batch jobs mount EFS for shared CSV staging, KYC PDFs land in S3 with lifecycle to Glacier. Compare durability (all high, but EBS depends on snapshot strategy), cost (EBS IOPS provisioning vs S3 request pricing), and access pattern (random I/O → block; shared read/write → EFS; immutable blobs → S3).',
    traps: 'Saying EBS is "not durable" — it is, but AZ-bound; snapshot/restore is your DR story. Confusing EFS throughput modes (Bursting vs Provisioned).',
  },
  {
    id: 'rds',
    title: 'Amazon RDS — Multi-AZ, Replicas & Connection Pooling',
    badge: 'Database',
    category: 'Database',
    askLevel: '⭐ MOST ASKED',
    what: 'RDS runs managed relational engines (PostgreSQL, MySQL, etc.) for FinTech OLTP. Interview focus: Multi-AZ synchronous standby for HA vs Read Replicas for scale, automated backups/PITR, failover behavior, and connection pooling to survive failover without exhausting max_connections.',
    mermaid: `sequenceDiagram
  participant APP as Payment Service
  participant POOL as RDS Proxy / PgBouncer
  participant PRI as RDS Primary (AZ-a)
  participant STBY as Multi-AZ Standby (AZ-b)
  participant RR as Read Replica
  APP->>POOL: JDBC getConnection()
  POOL->>PRI: write / strong read
  APP->>RR: reporting read (async replica lag)
  PRI-->>STBY: sync replication
  Note over PRI,STBY: Failover ~60-120s DNS flip
  STBY->>PRI: promoted on AZ failure`,
    code: `# Multi-AZ vs Read Replica — know the difference
# Multi-AZ (HA):
#   - Synchronous standby in another AZ (NOT for read scaling)
#   - Automatic failover on primary failure (~60-120 sec)
#   - Same endpoint DNS — apps reconnect after TTL
#   - 2x storage cost (standby is hot spare)

# Read Replica (scale):
#   - Asynchronous — eventual consistency (seconds lag typical)
#   - Separate endpoint — route analytics/reporting here
#   - Can promote to standalone primary (DR drill)
#   - Up to 15 replicas (engine-dependent)

# Automated backups
#   - Daily snapshot + transaction logs → PITR window (1-35 days)
#   - Stored in S3 (managed) — no direct access
#   - Retention ≠ replica lag protection

# Failover checklist (FinTech payment DB)
# 1. Multi-AZ enabled on prod
# 2. Connection pool with retry + exponential backoff
# 3. Avoid pinning to IP — use RDS endpoint hostname
# 4. RDS Proxy or PgBouncer for connection multiplexing
# 5. Set TCP keepalive; JDBC socketTimeout > failover window

# RDS Proxy — Spring Boot (PostgreSQL)
spring:
  datasource:
    url: jdbc:postgresql://payment-proxy.proxy-abc123.us-east-1.rds.amazonaws.com:5432/payments
    hikari:
      maximum-pool-size: 20        # per task — Proxy multiplexes to DB
      connection-timeout: 30000
      max-lifetime: 1800000        # recycle before proxy idle timeout

# PgBouncer (transaction pooling) — alternative on EC2/EKS
# pool_mode = transaction  # safe for Spring @Transactional per request
# max_client_conn = 500
# default_pool_size = 25   # actual PG connections

# Read/write split (Spring)
@Transactional(readOnly = true)
public List<Payment> searchPayments(SearchCriteria c) {
  // Route to read replica via separate @Qualifier DataSource
  return readRepo.findByCriteria(c);
}`,
    verify: `# Confirm Multi-AZ
aws rds describe-db-instances --db-instance-identifier payment-prod \\
  | jq '.DBInstances[0] | {MultiAZ, Endpoint, ReadReplicaDBInstanceIdentifiers}'

# Check replica lag (CloudWatch)
aws cloudwatch get-metric-statistics \\
  --namespace AWS/RDS --metric-name ReplicaLag \\
  --dimensions Name=DBInstanceIdentifier,Value=payment-replica-1 \\
  --start-time $(date -u -d '15 min ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 60 --statistics Maximum`,
    pitfalls: 'Using Read Replica endpoint for payment writes — async lag causes stale reads or lost updates. No connection pool → failover exhausts PostgreSQL max_connections (every pod opens 50). Long-lived idle connections block failover cleanup. Assuming Multi-AZ = zero downtime — brief disconnect still happens.',
    production: 'Multi-AZ on all prod payment/ledger DBs. RDS Proxy with IAM auth where possible. Route reporting to replicas with lag-aware routing (abort if lag > 5s for near-real-time dashboards). PITR 35 days + cross-region snapshot copy for regulatory DR. Parameter group: log_connections=on, statement_timeout for runaway queries.',
    interview30s: 'Multi-AZ = synchronous standby for HA failover, not read scale. Read Replicas = async read scaling + DR promotion. Automated backups enable PITR. Failover flips DNS — apps need pooling + retry. RDS Proxy multiplexes thousands of app connections to fewer DB connections.',
    interview2m: 'Payment service writes to primary via RDS Proxy (20 Hikari conns × 10 pods → ~100 actual PG connections). Nightly settlement reports hit read replica; monitor ReplicaLag metric. On AZ failure, Multi-AZ promotes standby in ~90s — JDBC pools must retry TransientConnectionException. Contrast with Aurora (storage-layer HA, faster failover) but RDS PostgreSQL is still common for simpler workloads.',
    traps: '"Read Replica is HA" — it is not automatic failover. "Multi-AZ doubles read capacity" — standby is not readable (except SQL Server). Forgetting that failover changes underlying IP behind same DNS.',
  },
  {
    id: 'aurora',
    title: 'Amazon Aurora — Storage Layer & Global Database',
    badge: 'Database',
    category: 'Database',
    what: 'Aurora decouples compute from a distributed storage layer (6 copies across 3 AZs). Writer + up to 15 reader instances share the same storage volume. Aurora Global Database replicates to secondary region for DR. Compare vs RDS PostgreSQL for FinTech payment workloads.',
    mermaid: `flowchart TB
  subgraph storage [Aurora Storage Layer]
    S1[Segment 1] & S2[Segment 2] & S3seg[Segment N]
    S1 --> AZa[AZ-a copy]
    S1 --> AZb[AZ-b copy]
    S1 --> AZc[AZ-c copy]
  end
  WRITER[Writer Instance] --> storage
  R1[Reader 1] --> storage
  R2[Reader 2] --> storage
  subgraph global [Global Database]
    WRITER -->|storage-level replication <1s| GWRITER[Secondary Region Writer]
  end`,
    code: `# Aurora vs RDS PostgreSQL — FinTech payment platform
| Dimension          | RDS PostgreSQL       | Aurora PostgreSQL         |
|--------------------|----------------------|---------------------------|
| Storage            | EBS volumes per node | Shared distributed storage|
| Replication        | Streaming to replica | Storage-layer, 6-way copy |
| Failover           | 60-120s (Multi-AZ)   | ~30s (reader promotion)     |
| Read scaling       | Read Replicas (async)| Up to 15 readers, low lag |
| Max size           | 64 TiB (engine dep.) | 128 TiB auto-growth       |
| Backtrack          | No (PITR only)       | Backtrack (undo mistakes) |
| Global DR          | Snapshot cross-region| Global Database <1s lag   |
| Cost               | Lower at small scale | Premium ~20% compute      |
| When to pick RDS   | Dev, small OLTP      | —                         |
| When to pick Aurora| High RPS, fast failover, global | Production payments |

# Cluster endpoints (Spring Boot)
# Writer: payment-cluster.cluster-abc123.us-east-1.rds.amazonaws.com
# Reader: payment-cluster.cluster-ro-abc123.us-east-1.rds.amazonaws.com

spring:
  datasource:
    writer:
      url: jdbc:postgresql://\${AURORA_WRITER}:5432/payments
    reader:
      url: jdbc:postgresql://\${AURORA_READER}:5432/payments

# Aurora Serverless v2 — variable FinTech load (market hours spike)
# Min ACU 0.5, Max ACU 16 — scales in seconds, not minutes

# Global Database — cross-region DR (US primary, EU DR)
# Primary: us-east-1 cluster (writer + 2 readers)
# Secondary: eu-west-1 (1 writer, read-only until failover)
# RPO ~1s (storage replication), RTO ~1 min (managed failover)

# Backtrack — undo fat-finger DELETE (not replacement for backups)
# ALTER DATABASE payments SET aurora_backtrack_window = 86400; -- 24h

# Storage auto-scaling — no pre-provision disk size
# 10 GB → 128 TiB grows in 10 GB increments as you write`,
    verify: `# Cluster members and roles
aws rds describe-db-clusters --db-cluster-identifier payment-aurora \\
  | jq '.DBClusters[0] | {Endpoint, ReaderEndpoint, MultiAZ, GlobalWriteForwardingStatus}'

# Reader instance count
aws rds describe-db-clusters --db-cluster-identifier payment-aurora \\
  | jq '.DBClusters[0].DBClusterMembers[] | {Id: .DBInstanceIdentifier, IsWriter: .IsClusterWriter}'`,
    pitfalls: 'Routing writes to cluster-ro endpoint — fails or read-only error. Too many readers without connection pool — each reader still shares storage but adds compute cost. Global Database failover is manual (planned) vs unplanned — know RTO/RPO SLAs. Aurora Backtrack not enabled until set — default off.',
    production: 'Aurora PostgreSQL for prod payment ledger: 1 writer + 2 readers, RDS Proxy on both endpoints. Enable Performance Insights + Enhanced Monitoring. Global Database for cross-region DR with quarterly failover drill. Use reader endpoint for idempotent read APIs; strong consistency reads go to writer. Graviton (r6g) for price/perf.',
    interview30s: 'Aurora separates compute from replicated storage (6 copies, 3 AZs). One writer, many readers on same volume. Failover ~30s by promoting reader. Global Database for cross-region with ~1s RPO. Premium over RDS but faster failover and better read scale.',
    interview2m: 'Draw payment cluster: Spring services write via writer endpoint through RDS Proxy; balance inquiries hit reader endpoint (typically <100ms replica lag on Aurora vs seconds on RDS). Storage layer handles replication — adding reader does not copy full dataset. Global Database: US writer replicates to EU; on region failure, promote secondary (~1 min). Compare RDS PG when team is small and RPS < few thousand — Aurora wins at scale and strict RTO.',
    traps: '"Aurora is serverless by default" — provisioned clusters are default; Serverless v2 is a mode. "Readers are eventually consistent like RDS replicas" — Aurora readers lag much less but still not for read-your-writes unless on writer.',
  },
  {
    id: 'dynamodb',
    title: 'DynamoDB — Keys, GSI & 10M RPS Design',
    badge: 'NoSQL',
    category: 'Database',
    askLevel: '🔥 SENIOR',
    what: 'DynamoDB is AWS managed key-value/document store for high-throughput FinTech workloads: idempotency keys, ledger entries, session tokens, fraud event streams. Master partition key + sort key design, GSIs for alternate access patterns, hot partition mitigation, capacity modes, and scaling to 10M requests/sec.',
    mermaid: `flowchart TB
  subgraph table [PaymentEvents Table]
    PK[PK: tenantId#date]
    SK[SK: eventId]
    PK --> SK
  end
  subgraph gsi [GSI — Query by paymentId]
    GPK[GSI1PK: paymentId]
    GSK[GSI1SK: timestamp]
  end
  table --> gsi
  APP[Payment API] -->|GetItem / Query| DDB[(DynamoDB)]
  DDB -->|on-demand auto-scale| SHARD[Partition Sharding]
  SHARD --> P1[Partition 1] & P2[Partition 2] & PN[Partition N]`,
    code: `# Table design — payment event log (FinTech)
# Access patterns:
#   1. Get events for tenant on a date     → Query PK=tenant#2026-08-28
#   2. Lookup all events for a paymentId   → GSI1 PK=paymentId
#   3. Idempotency check by client key     → GetItem PK=tenant SK=idempotency#key

{
  "TableName": "PaymentEvents",
  "KeySchema": [
    {"AttributeName": "PK", "KeyType": "HASH"},
    {"AttributeName": "SK", "KeyType": "RANGE"}
  ],
  "AttributeDefinitions": [
    {"AttributeName": "PK", "AttributeType": "S"},
    {"AttributeName": "SK", "AttributeType": "S"},
    {"AttributeName": "GSI1PK", "AttributeType": "S"},
    {"AttributeName": "GSI1SK", "AttributeType": "S"}
  ],
  "GlobalSecondaryIndexes": [{
    "IndexName": "PaymentIdIndex",
    "KeySchema": [
      {"AttributeName": "GSI1PK", "KeyType": "HASH"},
      {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
    ],
    "Projection": {"ProjectionType": "ALL"}
  }],
  "BillingMode": "PAY_PER_REQUEST"
}

# Item example
{
  "PK": "tenant-acme#2026-08-28",
  "SK": "evt#01J5X...",
  "GSI1PK": "pay_9f3a2b1c",
  "GSI1SK": "2026-08-28T14:32:01Z",
  "amount": 15000,
  "currency": "USD",
  "status": "SETTLED"
}

# Idempotency — conditional write (prevent double charge)
PutItemRequest req = PutItemRequest.builder()
    .tableName("IdempotencyKeys")
    .item(Map.of(
        "PK", AttributeValue.builder().s("tenant-acme").build(),
        "SK", AttributeValue.builder().s("idem#" + clientKey).build(),
        "paymentId", AttributeValue.builder().s(paymentId).build(),
        "ttl", AttributeValue.builder().n(String.valueOf(expiryEpoch)).build()
    ))
    .conditionExpression("attribute_not_exists(PK)")
    .build();

# Hot partition — BAD vs GOOD
# BAD:  PK = "PAYMENTS" (all traffic one partition, 1000 WCU max)
# GOOD: PK = tenantId#shard(N) where shard = hash(paymentId) % 16
#       spreads 10M RPS across partitions

# On-Demand vs Provisioned
# On-Demand (PAY_PER_REQUEST):
#   - Auto scales instantly, pay per request
#   - Best for spiky/unpredictable (fraud burst, market open)
#   - ~2.5x cost vs well-tuned provisioned at steady load
# Provisioned + Auto Scaling:
#   - Set RCU/WCU, auto-scale on utilization
#   - Best for steady 10M RPS with known pattern
#   - Use reserved capacity for baseline

# 10M RPS design checklist
# 1. High-cardinality partition keys (tenant + shard + time bucket)
# 2. Avoid hot keys — monitor ThrottledRequests, HotKey metrics
# 3. DAX for microsecond read cache on hot GetItem paths
# 4. On-demand or provisioned with 3x headroom + auto-scale
# 5. Parallel scan only for batch — never in API path
# 6. DynamoDB Streams → Lambda/Kinesis for async fan-out
# 7. Multi-table vs single-table — single-table reduces cross-table joins`,
    verify: `# Check throttling on table
aws cloudwatch get-metric-statistics \\
  --namespace AWS/DynamoDB --metric-name ThrottledRequests \\
  --dimensions Name=TableName,Value=PaymentEvents \\
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 300 --statistics Sum

# On-demand mode confirmation
aws dynamodb describe-table --table-name PaymentEvents \\
  | jq '.Table | {BillingMode, ItemCount, TableSizeBytes}'`,
    pitfalls: 'Low-cardinality partition key (single PK for all tenants) → hot partition throttling at 1000 WCU/partition. GSI with ALL projection doubles write cost. Scan in API path at scale → account throttle. Ignoring TTL for idempotency keys → unbounded storage. Treating DynamoDB as relational — no joins, design for access patterns upfront.',
    production: 'Single-table design per domain with overloaded GSIs. On-demand for fraud pipeline spikes; provisioned + auto-scale for steady payment writes. Enable PITR (35-day). DAX in front of hot read paths (account balance cache). CloudWatch alarms on UserErrors, SystemErrors, ThrottledRequests. Client-side exponential backoff with jitter on 429.',
    interview30s: 'DynamoDB scales by partition key cardinality. Composite PK+SK for hierarchical data; GSI for alternate queries. Hot partition = one key >1000 WCU. On-demand auto-scales; provisioned cheaper at steady load. Design access patterns first, then keys.',
    interview2m: 'Design 10M RPS payment event ingest: PK=tenantId#date#shard(0-63) spreads writes; SK=eventId (ULID for sort). GSI on paymentId for support lookups. Idempotency table with conditional PutItem + TTL 24h. On-demand for launch; switch to provisioned when traffic predictable. Mention DAX for balance reads, Streams for downstream analytics, and that each partition caps at ~1000 WCU/3000 RCU — sharding math is the senior answer.',
    traps: '"DynamoDB has no limits" — per-partition throughput caps exist. "GSI is free" — GSI consumes separate WCU/RCU on every base write. Confusing eventually consistent (default) vs strongly consistent reads (2x RCU).',
  },
  {
    id: 'elasticache',
    title: 'ElastiCache Redis — Cluster Mode & Cache Patterns',
    badge: 'Caching',
    category: 'Caching',
    what: 'ElastiCache for Redis caches hot FinTech reads: account balances, FX rates, feature flags, session state. Know cluster mode enabled (sharded) vs disabled, cache-aside vs read-through, and the Application → Redis → DB flow with TTL, stampede protection, and failure modes.',
    mermaid: `sequenceDiagram
  participant APP as Payment Service
  participant R as ElastiCache Redis Cluster
  participant DB as Aurora PostgreSQL
  APP->>R: GET balance:acct-123
  alt cache HIT
    R-->>APP: cached balance
  else cache MISS (cache-aside)
    R-->>APP: null
    APP->>DB: SELECT balance
    DB-->>APP: row
    APP->>R: SETEX balance:acct-123 300
    APP-->>APP: return balance
  end
  Note over APP,R: Read-through: Redis loader fetches DB on miss`,
    code: `# Redis Cluster Mode Enabled — sharding for large datasets
# 3 shards × 2 replicas = 6 nodes
# Key routing: CRC16 slot → shard (16,384 slots total)
# Multi-key ops require same hash tag: {tenant-acme}:balance:123

# Cluster topology (FinTech prod)
# cache.r7g.large × 3 shards, 1 replica each
# maxmemory-policy: volatile-lru (TTL keys evicted first)

# Cache-Aside (lazy load) — most common in Spring
@Service
public class BalanceService {
  private final StringRedisTemplate redis;
  private final BalanceRepository repo;

  public Money getBalance(String accountId) {
    String key = "balance:" + accountId;
    String cached = redis.opsForValue().get(key);
    if (cached != null) return Money.parse(cached);

    // Stampede lock — only one thread loads DB
    Boolean locked = redis.opsForValue()
        .setIfAbsent(key + ":lock", "1", Duration.ofSeconds(5));
    if (Boolean.FALSE.equals(locked)) {
      Thread.sleep(50);
      return getBalance(accountId); // retry or fallback
    }
    try {
      Money balance = repo.findBalance(accountId);
      redis.opsForValue().set(key, balance.toString(),
          Duration.ofSeconds(300 + ThreadLocalRandom.current().nextInt(30)));
      return balance;
    } finally {
      redis.delete(key + ":lock");
    }
  }

  @Transactional
  public void debit(String accountId, Money amount) {
    repo.debit(accountId, amount);
    redis.delete("balance:" + accountId); // invalidate on write
  }
}

# Read-Through — cache owns load (Redis Gears / custom loader / Spring Cache)
@Cacheable(cacheNames = "fx-rates", key = "#pair")
public BigDecimal getFxRate(String pair) {
  return fxRepo.findLatest(pair); // called only on MISS by cache provider
}

# Application → Redis → DB — decision tree
# READ path:
#   1. App checks Redis
#   2. HIT → return (sub-ms)
#   3. MISS → query DB → populate Redis with TTL → return
# WRITE path (cache-aside):
#   1. Write DB first (source of truth)
#   2. Delete/evict cache key (not update — avoids race)
# READ-THROUGH variant:
#   App only talks to cache; cache library loads DB on miss

# ElastiCache config (terraform sketch)
# engine               = "redis"
# engine_version       = "7.1"
# node_type            = "cache.r7g.large"
# num_node_groups      = 3        # shards
# replicas_per_node_group = 1
# automatic_failover_enabled = true
# at_rest_encryption_enabled = true
# transit_encryption_enabled = true  # TLS in-transit`,
    verify: `# Connect via redis-cli (cluster mode)
redis-cli -c -h payment-cache.abc123.clustercfg.use1.cache.amazonaws.com -p 6379 --tls

# Cluster info
redis-cli -c -h payment-cache.abc123.clustercfg.use1.cache.amazonaws.com --tls CLUSTER INFO
redis-cli -c -h payment-cache.abc123.clustercfg.use1.cache.amazonaws.com --tls CLUSTER SLOTS`,
    pitfalls: 'Cache-aside update instead of delete on write → stale balance after concurrent debit. No TTL → memory full, evicts random keys. Cluster mode disabled but dataset > memory → OOM. Multi-key transaction without hash tags → CROSSSLOT error. Treating Redis as durable store — always fail open to DB.',
    production: 'Cluster mode enabled when >1 node or > few GB data. TLS + AUTH token + VPC security groups. TTL with jitter on all keys. Fail open: if Redis down, route to DB with circuit breaker. ElastiCache Multi-AZ with automatic failover. Monitor EngineCPUUtilization, CurrConnections, Evictions. Never cache PCI data (PAN/CVV) — tokenized IDs only.',
    interview30s: 'Cache-aside: app reads Redis, on miss loads DB and sets TTL. Write path deletes cache key after DB commit. Read-through: cache layer loads DB. Redis Cluster Mode shards keys across nodes; use hash tags for multi-key ops. Fail open to DB when Redis unavailable.',
    interview2m: 'Payment balance API: cache-aside with 5-min TTL + jitter, stampede lock on miss, evict on debit/credit. FX rates: read-through via @Cacheable (lower write frequency). Cluster mode 3 shards for 50 GB working set. On Redis failover (~30s), apps retry with backoff; circuit breaker bypasses cache after N failures. Contrast with DAX (DynamoDB-only) and why Redis fits arbitrary object caching.',
    traps: '"Redis is the source of truth" — DB always wins; cache is disposable. "Read-through and cache-aside are the same" — who triggers the DB load differs. Forgetting cluster mode requires -c flag and hash tags for MULTI/EXEC.',
  },
];
