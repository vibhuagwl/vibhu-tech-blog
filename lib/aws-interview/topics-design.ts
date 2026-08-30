import type {AwsTopic} from './types';

export const TOPICS_DESIGN: AwsTopic[] = [
  {
    id: 'system-design',
    title: 'AWS System Design — Payment, Orders & Notifications',
    badge: 'Design',
    category: 'Architecture',
    askLevel: '🏆 STAFF',
    what:
      'Three staff-level system designs on AWS: payment processing (PCI-aware, idempotent, multi-rail), high-volume order processing (peak flash sales, inventory consistency), and a multi-channel notification system (push, email, SMS, in-app). Each walks requirements → capacity → API → architecture → DB → cache → messaging → security → scaling → failure → monitoring → cost.',
    mermaid: `flowchart TB
  subgraph design1 [Design 1 — Payment Processing]
    PG[Payment Gateway API] --> ALB[ALB + WAF]
    ALB --> PS[Payment Service ECS]
    PS --> AUR[(Aurora PostgreSQL)]
    PS --> DDB[(DynamoDB Idempotency)]
    PS --> SQS[SQS Settlement Queue]
    SQS --> SW[Settlement Worker]
    SW --> MSK[MSK payment.events]
  end
  subgraph design2 [Design 2 — Order Processing]
    OAPI[Order API] --> APIGW[API Gateway]
    APIGW --> LBD[Lambda Authorizer]
    APIGW --> OS[Order Service EKS]
    OS --> REDIS[(ElastiCache Redis)]
    OS --> AUR2[(Aurora Orders)]
    OS --> EB[EventBridge order.placed]
  end
  subgraph design3 [Design 3 — Notifications]
    EB2[EventBridge] --> SQS2[SQS per channel]
    SQS2 --> NP[Notification Processor]
    NP --> SNS[SNS SMS/Email]
    NP --> PIN[Pinpoint Push]
    NP --> DDB2[(DynamoDB prefs)]
  end`,
    code: `# ═══════════════════════════════════════════════════════════════════
# DESIGN 1 — PAYMENT PROCESSING ON AWS
# ═══════════════════════════════════════════════════════════════════

# ── REQUIREMENTS ──
# Functional: authorize/capture/refund, multi-rail (card, ACH, wallet), idempotent POST
# Non-functional: 99.99% availability, p99 authorize < 300ms, PCI DSS scope reduction
# Compliance: no PAN in logs, tokenization via PSP, audit trail 7 years, SOX controls
# Scale: 2K TPS peak authorize, 500 TPS settlement batch, $50M/day volume

# ── CAPACITY ──
# Authorize path: 2K RPS × 50ms CPU = 100 vCPU → 25× m6i.large (4 vCPU) with 2× headroom
# Aurora: 2K writes/s + 5K reads/s → db.r6g.2xlarge writer + 2× db.r6g.xlarge readers
# DynamoDB idempotency: 2K WCU + 4K RCU (on-demand OK); item ~500B
# SQS settlement: 500 msg/s × 2KB = 1 MB/s ingress; 14-day retention for replay
# MSK: 3× kafka.m5.large, 12 partitions payment.events, RF=3

# ── API ──
# POST /v1/payments          — create payment (Idempotency-Key header required)
# GET  /v1/payments/{id}     — status + ledger entries
# POST /v1/payments/{id}/capture
# POST /v1/payments/{id}/refund
# POST /v1/webhooks/psp      — PSP callback (SigV4 or HMAC verified)

# Request (authorize):
{
  "merchantId": "m_abc123",
  "amount": {"currency": "USD", "value": 4999},
  "paymentMethod": {"type": "card", "token": "tok_visa_****4242"},
  "metadata": {"orderId": "ord_xyz"}
}
# Response 201:
{
  "paymentId": "pay_01HXYZ",
  "status": "AUTHORIZED",
  "pspReference": "ch_3Nabc",
  "createdAt": "2026-08-28T19:00:00Z"
}

# ── ARCHITECTURE ──
# Internet → CloudFront (static) + WAF → ALB (TLS 1.3, mTLS for B2B)
# ECS Fargate payment-api (private subnets, 3 AZ)
#   → Aurora PostgreSQL (Multi-AZ writer, sync standby)
#   → DynamoDB (idempotency + payment state machine)
#   → ElastiCache Redis (rate limit + PSP token cache, 60s TTL)
#   → SQS payment-settlement.fifo (per-merchant ordering)
#   → MSK payment.events (downstream analytics, fraud, ledger projection)
# Outbound: NAT Gateway → PSP API (Stripe/Adyen) via VPC endpoints where available
# Secrets Manager: PSP API keys, DB creds; rotation 30 days

# ── DB ──
# Aurora PostgreSQL — source of truth for payment records + ledger double-entry
CREATE TABLE payments (
  payment_id     UUID PRIMARY KEY,
  merchant_id    VARCHAR(32) NOT NULL,
  amount_cents   BIGINT NOT NULL CHECK (amount_cents > 0),
  currency       CHAR(3) NOT NULL,
  status         VARCHAR(20) NOT NULL,  -- PENDING|AUTHORIZED|CAPTURED|FAILED|REFUNDED
  psp_reference  VARCHAR(64),
  idempotency_key VARCHAR(64) NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (merchant_id, idempotency_key)
);
CREATE INDEX idx_payments_merchant_status ON payments(merchant_id, status, created_at DESC);

CREATE TABLE ledger_entries (
  entry_id    UUID PRIMARY KEY,
  payment_id  UUID REFERENCES payments(payment_id),
  account     VARCHAR(32) NOT NULL,  -- MERCHANT_PAYABLE, PSP_CLEARING, FEE_REVENUE
  debit_cents BIGINT DEFAULT 0,
  credit_cents BIGINT DEFAULT 0,
  posted_at   TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_balanced CHECK (debit_cents >= 0 AND credit_cents >= 0)
);

# DynamoDB — fast idempotency + state machine (avoid Aurora hot row on retries)
# Table: payment-idempotency
# PK: merchantId#idempotencyKey  SK: METADATA
# Attributes: paymentId, status, responseBody (compressed), ttl (24h)
{
  "TableName": "payment-idempotency",
  "BillingMode": "PAY_PER_REQUEST",
  "AttributeDefinitions": [{"AttributeName": "pk", "AttributeType": "S"}],
  "KeySchema": [{"AttributeName": "pk", "KeyType": "HASH"}],
  "TimeToLiveSpecification": {"AttributeName": "ttl", "Enabled": true}
}

# ── CACHE ──
# Redis cluster mode disabled, 2 shards, r6g.large
# Keys:
#   ratelimit:\${merchantId}:\${window}     — sliding window counter (INCR + EXPIRE)
#   psp:token:\${tokenId}                   — PSP token metadata, TTL 300s
#   config:merchant:\${merchantId}           — fee rules, TTL 600s, cache-aside
# Eviction: volatile-lru; no payment state in cache (Aurora + DDB authoritative)

# ── MESSAGING ──
# SQS FIFO payment-settlement.fifo — MessageGroupId=merchantId (per-merchant order)
# DLQ: payment-settlement-dlq.fifo, maxReceiveCount=5, alarm on depth > 0
# MSK topic payment.events — schema Avro via Glue Schema Registry
# EventBridge rule: payment.captured → trigger invoice Lambda + notify order service

# PaymentCaptured event (Avro):
{
  "eventId": "evt_01HXYZ",
  "paymentId": "pay_01HXYZ",
  "merchantId": "m_abc123",
  "amountCents": 4999,
  "currency": "USD",
  "capturedAt": "2026-08-28T19:00:05Z"
}

# ── SECURITY ──
# PCI: no PAN storage — PSP tokenization; scope = SAQ A-EP (redirect/hosted fields)
# KMS CMK alias/payment-data — encrypt Aurora, DynamoDB, S3 audit exports
# IAM task role: least privilege per service (no s3:*, no kms:ScheduleKeyDeletion)
# WAF: rate limit 2K/5min/IP, geo block, AWSManagedRulesKnownBadInputs
# VPC: private subnets only; SG payment-api → aurora:5432, redis:6379, no 0.0.0.0/0 ingress
# CloudTrail + VPC Flow Logs + GuardDuty; Macie on S3 audit bucket

# ── SCALING ──
# ECS: target tracking CPU 60% + ALB request count 800/target; min 6 max 40 tasks
# Aurora: auto-scaling read replicas 2→5 on CPU > 70%; writer vertical scale window
# DynamoDB: on-demand handles burst; switch to provisioned if baseline predictable
# MSK: auto-scaling storage; add partitions when consumer lag > 60s sustained

# ── FAILURE ──
# PSP timeout (5s): circuit breaker (Resilience4j) → return 503, client retries with same Idempotency-Key
# Aurora failover (~60s): RDS Proxy absorbs connection churn; app retry with backoff
# Duplicate webhook: idempotency table conditional write — return cached 201
# SQS poison message → DLQ → manual replay after root-cause fix
# Regional outage: Route 53 health check failover to warm standby region (Aurora Global Database)

# ── MONITORING ──
# CloudWatch dashboards: authorize p99, error rate by PSP, settlement lag, DLQ depth
# Alarms: 5xx > 0.1%, authorize p99 > 300ms, Aurora replica lag > 5s, DLQ > 0
# X-Ray: trace authorize → PSP → Aurora write path
# Custom metrics: payments.authorized.count, payments.declined.count, settlement.lag.seconds
# Logs Insights: filter ERROR where merchantId=X; no PII in log fields

# ── COST (monthly estimate, us-east-1) ──
# ECS Fargate 25 tasks avg:     ~$1,800
# Aurora db.r6g.2xlarge + 2 RR:  ~$2,400
# DynamoDB on-demand 2K WCU:    ~$350
# ElastiCache r6g.large × 2:     ~$280
# MSK 3× m5.large:              ~$450
# NAT Gateway (2 AZ):           ~$180 + data
# Total baseline:               ~$5,500/mo (+ PSP fees external)


# ═══════════════════════════════════════════════════════════════════
# DESIGN 2 — HIGH-VOLUME ORDER PROCESSING
# ═══════════════════════════════════════════════════════════════════

# ── REQUIREMENTS ──
# Functional: create order, reserve inventory, payment handoff, order tracking
# Non-functional: 10K orders/min peak (flash sale), inventory oversell = 0, p99 < 200ms read
# Consistency: strong inventory reservation; eventual order search index OK (5s lag)

# ── CAPACITY ──
# 10K orders/min = 167 OPS create; burst 3× for 5 min = 500 OPS
# API Gateway: 10K RPS default limit — request increase to 15K
# EKS order-service: 500 OPS × 80ms = 40 vCPU → 20 pods (2 vCPU each) + HPA headroom
# Aurora: 500 writes/s + 2K reads/s → Aurora PostgreSQL Limitless or sharded by merchantId
# Redis: 10K INCR/s inventory counters → cluster mode, 3 shards r6g.xlarge

# ── API ──
# POST /v1/orders              — create (Idempotency-Key + If-Match inventory version)
# GET  /v1/orders/{id}         — order detail (cache-first)
# GET  /v1/orders?userId=&cursor=
# POST /v1/orders/{id}/cancel  — release inventory

# ── ARCHITECTURE ──
# CloudFront → API Gateway (REST) → Lambda authorizer (JWT) → EKS order-service (ALB Ingress)
# order-service:
#   → Redis (inventory reservation counters + distributed lock per SKU)
#   → Aurora (orders, order_lines, inventory_ledger)
#   → DynamoDB (hot SKU inventory partition for flash-sale SKUs)
#   → EventBridge (order.placed, order.cancelled)
#   → SQS order-fulfillment → warehouse workers
# Read path: ElastiCache → Aurora read replica; OpenSearch for search (CDC from Aurora)

# ── DB ──
# Aurora PostgreSQL — orders (OLTP)
CREATE TABLE orders (
  order_id      UUID PRIMARY KEY,
  user_id       UUID NOT NULL,
  merchant_id   VARCHAR(32) NOT NULL,
  status        VARCHAR(20) NOT NULL,
  total_cents   BIGINT NOT NULL,
  idempotency_key VARCHAR(64),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
) PARTITION BY HASH (merchant_id);  -- 16 partitions

CREATE TABLE inventory_reservations (
  sku           VARCHAR(32) NOT NULL,
  order_id      UUID NOT NULL,
  qty           INT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,  -- 15 min hold
  PRIMARY KEY (sku, order_id)
);

# DynamoDB — flash-sale hot SKUs (single-digit ms conditional updates)
# PK: SKU#skuId  Attributes: availableQty, version
# UpdateExpression: SET availableQty = availableQty - :qty, version = version + :inc
# ConditionExpression: availableQty >= :qty

# ── CACHE ──
# Redis:
#   inv:\${sku}:qty          — cached available (eventually consistent, refreshed on miss)
#   lock:\${sku}             — Redlock for reservation (TTL 5s)
#   order:\${orderId}        — order detail JSON, TTL 300s, invalidate on update
# Flash sale: write-through to DynamoDB for top-100 SKUs; Redis for everything else

# ── MESSAGING ──
# EventBridge custom bus order-bus
# Rules: order.placed → SQS fulfillment, order.placed → Lambda fraud-scorer
# SQS order-fulfillment (standard, high throughput) → ECS warehouse workers
# MSK order.events — analytics, OpenSearch indexer (Kafka Connect)

# ── SECURITY ──
# Cognito user pool + API Gateway JWT authorizer
# IAM: IRSA for EKS pods — scoped to DynamoDB table, SQS queue ARNs
# Encryption: Aurora KMS, DynamoDB SSE, Redis in-transit TLS
# Rate limiting: API Gateway usage plan 100 req/s per API key; Redis per-user limit

# ── SCALING ──
# EKS HPA: CPU 65% + custom metric SQS depth; cluster autoscaler for nodes
# Pre-warm before flash sale: scale pods 20→80, Redis cluster add shard, DynamoDB WCU bump
# API Gateway caching on GET /products (separate catalog service)

# ── FAILURE ──
# Inventory race: optimistic locking (version column) + Redis Lua atomic decrement
# Reservation expiry: EventBridge Scheduler → Lambda releases expired holds every 1 min
# Partial failure (payment fails): saga — compensate inventory release via order.cancelled event
# Aurora throttling: exponential backoff + shed load (429) with Retry-After header

# ── MONITORING ──
# Metrics: orders.created.rate, inventory.oversell.attempts (must be 0), reservation.expired.count
# Alarms: create p99 > 200ms, Redis memory > 80%, DynamoDB throttling > 0
# Dashboard: flash-sale war room — OPS, error rate, inventory by top SKU

# ── COST ──
# EKS (5× m6i.xlarge nodes avg):  ~$1,500
# Aurora Limitless/sharded:        ~$3,000
# DynamoDB provisioned hot SKUs:   ~$400
# Redis cluster 3× r6g.xlarge:     ~$900
# API Gateway 10K RPS:             ~$350
# Total peak-ready:                ~$6,200/mo


# ═══════════════════════════════════════════════════════════════════
# DESIGN 3 — MULTI-CHANNEL NOTIFICATION SYSTEM
# ═══════════════════════════════════════════════════════════════════

# ── REQUIREMENTS ──
# Functional: send push, email, SMS, in-app; user preferences; template rendering; delivery tracking
# Non-functional: 50K notifications/min burst, at-least-once delivery, p99 enqueue < 50ms
# Compliance: TCPA opt-out SMS, CAN-SPAM unsubscribe, GDPR consent, no PII in topic names

# ── CAPACITY ──
# 50K/min = 833/s ingress; fan-out 3 channels avg → 2.5K outbound/s peak
# API: 833 RPS → API Gateway + Lambda (lightweight enqueue) or ECS
# SQS: 4 queues (push, email, sms, inapp) × 833 msg/s
# SNS SMS: account limit — request 10K/s; Pinpoint for push at scale
# DynamoDB: user preferences 10M users, 100 RCU/WCU baseline + on-demand burst

# ── API ──
# POST /v1/notifications              — enqueue multi-channel notification
# GET  /v1/notifications/{id}/status  — delivery status per channel
# PUT  /v1/users/{id}/preferences     — channel opt-in/out

# Request:
{
  "userId": "usr_abc",
  "templateId": "order_shipped",
  "channels": ["push", "email"],
  "data": {"orderId": "ord_xyz", "trackingUrl": "https://..."},
  "priority": "HIGH"
}

# ── ARCHITECTURE ──
# Producers (order, payment, marketing) → EventBridge notification-bus
# Rule → Lambda router (reads DynamoDB preferences, renders template from S3)
# Router → SQS per channel (push-queue, email-queue, sms-queue, inapp-queue)
# Workers:
#   push-worker (ECS) → Pinpoint / FCM / APNs
#   email-worker (ECS) → SES (dedicated IP pool for marketing, shared for transactional)
#   sms-worker (Lambda) → SNS SMS / Pinpoint SMS
#   inapp-worker (ECS) → DynamoDB notification-inbox + WebSocket API Gateway
# Status: DynamoDB delivery-log; MSK notification.events for analytics

# ── DB ──
# DynamoDB notification-preferences
# PK: USER#userId  SK: PREFS#  Attributes: email, push, sms booleans + quiet hours
# DynamoDB notification-inbox (in-app)
# PK: USER#userId  SK: NOTIF#timestamp#id  GSI1: unread by user
# DynamoDB delivery-log
# PK: NOTIF#notificationId  SK: CHANNEL#push  Attributes: status, providerId, sentAt

# Aurora optional: template metadata + audit if relational reporting needed

# ── CACHE ──
# Redis: template:\${templateId} — rendered Handlebars partials, TTL 3600s
# Redis: prefs:\${userId} — preference cache-aside, TTL 300s, invalidate on PUT

# ── MESSAGING ──
# EventBridge: source=com.acme.orders detail-type=OrderShipped → router Lambda
# SQS per channel with DLQ; visibility timeout = 6× p99 processing time
# SNS: SMS only for low-volume fallback; prefer Pinpoint for throttling control
# MSK notification.events — delivery analytics, bounce/complaint handling

# ── SECURITY ──
# SES: DKIM + SPF + DMARC; dedicated config set for bounce tracking
# KMS encrypt PII fields in DynamoDB (email, phone) with envelope encryption
# IAM: workers scoped to ses:SendEmail, pinpoint:SendMessages, sns:Publish
# No phone/email in CloudWatch logs — structured logging with hashed userId

# ── SCALING ──
# Lambda router: reserved concurrency 500; SQS batch size 10
# ECS workers: autoscale on ApproximateNumberOfMessagesVisible per queue
# SES: request production access + daily quota increase before launch
# Pinpoint: project per env; campaign vs transactional segment separation

# ── FAILURE ──
# Provider bounce: SES SNS topic → Lambda marks email invalid in preferences
# SMS failure (invalid number): DLQ + suppress list in DynamoDB
# At-least-once: idempotent send keyed by notificationId+channel (DynamoDB conditional)
# Template render error: fallback plain-text; alert on template.error metric

# ── MONITORING ──
# CloudWatch: queue depth per channel, delivery rate, bounce rate, SMS spend alarm
# Pinpoint/SES dashboards: delivery, complaint, open rate (email)
# Custom: notification.enqueued, notification.delivered, notification.failed by channel
# X-Ray through router → queue → worker → provider

# ── COST ──
# SQS 4 queues 50K/min:          ~$120
# SES 5M emails/mo:              ~$500
# SNS SMS 500K/mo (@ $0.00645):  ~$3,200
# Pinpoint push 10M/mo:          ~$50
# DynamoDB on-demand:            ~$200
# ECS workers 10 tasks avg:      ~$600
# Total:                         ~$4,700/mo (SMS dominates — prefer push/email)`,
    verify: `# Payment idempotency smoke test
curl -X POST https://api.acme.com/v1/payments \\
  -H "Authorization: Bearer \${TOKEN}" \\
  -H "Idempotency-Key: test-key-001" \\
  -H "Content-Type: application/json" \\
  -d '{"merchantId":"m_test","amount":{"currency":"USD","value":100},"paymentMethod":{"type":"card","token":"tok_test"}}'

# Repeat same Idempotency-Key — expect identical 201 response body
# Order flash-sale load test (k6 outline)
# k6 run --vus 500 --duration 5m order-create.js

# Notification enqueue
aws sqs get-queue-attributes \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/push-queue \\
  --attribute-names ApproximateNumberOfMessages,ApproximateAgeOfOldestMessage`,
    pitfalls:
      'Payment design without Idempotency-Key — double charge on retry. Order flash sale with only Aurora row lock — DB becomes bottleneck; need Redis/DynamoDB for hot SKUs. Notification system fan-out synchronously in API request — timeout and no backpressure. Storing PAN or full card numbers anywhere in AWS. Ignoring SQS FIFO throughput limit (300 msg/s per queue without batching).',
    production:
      'Payment: always Idempotency-Key + DynamoDB conditional write; RDS Proxy; settlement async via SQS FIFO. Orders: pre-scale before known events; inventory reservation with TTL + saga compensation. Notifications: async enqueue only; per-channel queues; suppress lists; SMS cost caps via CloudWatch billing alarm.',
    interview30s:
      'Three designs: (1) Payment — ALB/ECS, Aurora ledger, DynamoDB idempotency, SQS settlement, MSK events, PCI tokenization. (2) Orders — API GW/EKS, Redis+DynamoDB inventory, EventBridge saga, zero oversell. (3) Notifications — EventBridge router, SQS per channel, SES/Pinpoint/SNS workers, DynamoDB prefs.',
    interview2m:
      'Pick payment: walk authorize happy path (Idempotency-Key → DDB check → PSP call → Aurora write + ledger entries → MSK event). Deep dive idempotency and webhook dedup. Capacity: 2K TPS → ECS task count + Aurora sizing. Failure: PSP timeout with circuit breaker, Aurora failover via RDS Proxy. Cost trade-off: MSK vs EventBridge for event fan-out. For orders, explain flash-sale hot path (DynamoDB conditional update vs Aurora). For notifications, why per-channel SQS (independent scaling, DLQ isolation).',
    traps:
      '"Strong consistency everywhere" — order search can be eventual. "SNS for all notification delivery" — SMS/email need SES/Pinpoint, not raw SNS fan-out. "Single Aurora handles 10K order writes" — need sharding or DynamoDB for hot keys. Forgetting FIFO throughput limits.',
  },
  {
    id: 'architecture-patterns',
    title: 'Architecture Patterns Mapped to AWS Services',
    badge: 'Patterns',
    category: 'Architecture',
    askLevel: '🏆 STAFF',
    what:
      'Classic architecture patterns — three-tier, event-driven, serverless, microservices, CQRS, saga, transactional outbox, and CDC — mapped to concrete AWS services with config snippets and FinTech trade-offs.',
    mermaid: `flowchart TB
  subgraph three [Three-Tier]
    CF[CloudFront] --> ALB[ALB]
    ALB --> EC2[EC2/ECS App Tier]
    EC2 --> RDS[(RDS/Aurora Data Tier)]
  end
  subgraph event [Event-Driven]
    SVC[Microservice] --> EB[EventBridge]
    EB --> SQS[SQS]
    SQS --> WRK[Lambda/ECS Worker]
    EB --> MSK[MSK Kafka]
  end
  subgraph cqrs [CQRS + Outbox]
    CMD[Command API] --> WDB[(Aurora Write)]
    WDB --> OUT[Outbox Table]
    OUT --> DMS[DMS CDC]
    DMS --> OS[(OpenSearch Read Model)]
  end`,
    code: `# ═══════════════════════════════════════════════════════════════════
# PATTERN 1 — THREE-TIER (Presentation / Application / Data)
# ═══════════════════════════════════════════════════════════════════
# AWS mapping:
#   Presentation: CloudFront + S3 static, ALB TLS termination, WAF
#   Application:  ECS/EKS/EC2 Auto Scaling in private subnets
#   Data:         Aurora PostgreSQL Multi-AZ, ElastiCache Redis session cache

# Typical FinTech payment portal stack
Resources:
  CloudFrontDistribution:
    Origins:
      - S3Origin (React SPA)
      - ALBOrigin (Spring Boot API /api/*)
    WAFWebACL: aws-managed + rate-based rule 2000/5min

  ALB:
    Scheme: internet-facing
    TargetGroup: ecs-payment-api:8080
    HealthCheck: /actuator/health/readiness

  ECS Service:
    DesiredCount: 4
    LaunchType: FARGATE
    Network: private subnets + NAT egress

  Aurora:
    Engine: aurora-postgresql
    MultiAZ: true
    RDSProxy: enabled  # connection pooling through failover

# When to use: traditional OLTP, team knows Spring Boot, predictable load
# When to avoid: extreme burst (flash sale) without cache/async layer on top


# ═══════════════════════════════════════════════════════════════════
# PATTERN 2 — EVENT-DRIVEN ARCHITECTURE
# ═══════════════════════════════════════════════════════════════════
# AWS mapping:
#   Event bus:     Amazon EventBridge (custom bus per domain)
#   Streaming:     Amazon MSK (Kafka) for high-throughput ordered logs
#   Queue:         Amazon SQS (buffer, retry, DLQ)
#   Pub/Sub:       Amazon SNS (fan-out to SQS/Lambda/email)
#   Routing:       EventBridge rules (content-based filtering)
#   Schema:        Glue Schema Registry (Avro/JSON Schema on MSK)

# EventBridge rule — route payment.captured to fulfillment + analytics
{
  "EventBusName": "acme-payments",
  "EventPattern": {
    "source": ["com.acme.payment"],
    "detail-type": ["PaymentCaptured"],
    "detail": {"amountCents": [{"numeric": [">", 100000]}]}
  },
  "Targets": [
    {"Arn": "arn:aws:sqs:us-east-1:123:fulfillment-queue", "Id": "fulfillment"},
    {"Arn": "arn:aws:lambda:us-east-1:123:function:high-value-alert", "Id": "fraud"}
  ]
}

# MSK vs EventBridge decision matrix
| Need                        | EventBridge          | MSK (Kafka)                |
|-----------------------------|----------------------|----------------------------|
| Throughput                  | ~10K events/s/bus    | 100K+ events/s             |
| Ordering                    | No per-entity order  | Partition key ordering     |
| Replay                      | Archive + replay     | Native offset replay       |
| Ops burden                  | Serverless           | Cluster management         |
| FinTech audit log           | 90-day archive OK    | 7-year retention + tiered  |
| Cross-account               | Native event buses   | Cluster policy + IAM       |

# SQS buffer pattern (decouple burst from slow consumer)
# Producer → SQS → ECS worker (batch 10, partial failure report)
# VisibilityTimeout = 6 × p99 process time
# RedrivePolicy: maxReceiveCount=5 → DLQ


# ═══════════════════════════════════════════════════════════════════
# PATTERN 3 — SERVERLESS
# ═══════════════════════════════════════════════════════════════════
# AWS mapping:
#   API:       API Gateway HTTP API + Lambda
#   Compute:   Lambda (event handlers), Step Functions (orchestration)
#   Data:      DynamoDB (single-table), Aurora Serverless v2 (spiky SQL)
#   Events:    EventBridge, SQS, S3 triggers
#   Auth:      Cognito + Lambda authorizer

# serverless.yml excerpt — webhook processor
functions:
  pspWebhook:
    handler: com.acme.PspWebhookHandler::handle
    timeout: 29
    reservedConcurrency: 100
    events:
      - httpApi:
          path: /webhooks/psp
          method: post
    environment:
      TABLE_NAME: payment-webhooks
      EVENT_BUS: acme-payments
    iamRoleStatements:
      - Effect: Allow
        Action: [dynamodb:PutItem, events:PutEvents]
        Resource: ["arn:aws:dynamodb:*:*:table/payment-webhooks", "arn:aws:events:*:*:event-bus/acme-payments"]

# Step Functions — refund saga (Lambda task tokens for human approval)
{
  "StartAt": "ValidateRefund",
  "States": {
    "ValidateRefund": {"Type": "Task", "Resource": "arn:aws:lambda:...:validate", "Next": "CheckAmount"},
    "CheckAmount": {"Type": "Choice", "Choices": [{"Variable": "$.amountCents", "NumericGreaterThan": 100000, "Next": "ManualApproval"}], "Default": "ProcessRefund"},
    "ManualApproval": {"Type": "Task", "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken", "Next": "ProcessRefund"},
    "ProcessRefund": {"Type": "Task", "Resource": "arn:aws:lambda:...:refund", "End": true}
  }
}

# When to use: spiky/unpredictable traffic, webhooks, cron, low ops team
# Pitfall: Lambda cold start on latency-sensitive authorize — use provisioned concurrency or ECS


# ═══════════════════════════════════════════════════════════════════
# PATTERN 4 — MICROSERVICES
# ═══════════════════════════════════════════════════════════════════
# AWS mapping:
#   Compute:      EKS (Kubernetes) or ECS (simpler ops)
#   Service mesh: AWS App Mesh or Istio on EKS (mTLS, retries, circuit break)
#   Discovery:    AWS Cloud Map (ECS) or CoreDNS (EKS)
#   API edge:     ALB ingress + API Gateway (external) or internal ALB
#   Config:       AWS AppConfig + Parameter Store
#   Secrets:      Secrets Manager
#   Observability: CloudWatch Container Insights + X-Ray + ADOT

# EKS microservice layout (FinTech)
# Namespace per domain: payments, orders, ledger, notifications
# IRSA per service — no node-wide IAM credentials
apiVersion: v1
kind: ServiceAccount
metadata:
  name: payment-service
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/payment-service-role

# payment-service-role trust + policy (scoped)
{
  "Statement": [{
    "Effect": "Allow",
    "Action": ["dynamodb:*", "sqs:SendMessage", "kms:Decrypt"],
    "Resource": [
      "arn:aws:dynamodb:us-east-1:123:table/payment-*",
      "arn:aws:sqs:us-east-1:123:payment-settlement.fifo",
      "arn:aws:kms:us-east-1:123:key/abcd-*"
    ]
  }]
}

# Inter-service: async preferred (EventBridge/MSK); sync via internal ALB with timeout + retry budget
# Data per service: no shared Aurora schema — each service owns its DB (database-per-service)


# ═══════════════════════════════════════════════════════════════════
# PATTERN 5 — CQRS (Command Query Responsibility Segregation)
# ═══════════════════════════════════════════════════════════════════
# AWS mapping:
#   Write model:  Aurora PostgreSQL (normalized OLTP)
#   Read model:   OpenSearch / DynamoDB / ElastiCache (denormalized projections)
#   Sync:         DMS CDC, MSK Connect, or Lambda projection consumer
#   Command API:  ECS/EKS write service (strong consistency)
#   Query API:    API Gateway → Lambda/ECS read service (eventually consistent)

# Write side — create payment command
POST /commands/payments
→ Aurora INSERT payments + ledger_entries (transaction)
→ Outbox INSERT payment_created event (same transaction)
→ Debezium/CDC publishes event

# Read side — payment dashboard query
GET /queries/merchants/{id}/payments?status=CAPTURED&from=2026-08-01
→ OpenSearch index payments-read (denormalized: payment + merchant + customer)
→ No joins at query time; rebuilt from CDC stream

# OpenSearch index mapping (read model)
{
  "mappings": {
    "properties": {
      "paymentId": {"type": "keyword"},
      "merchantId": {"type": "keyword"},
      "status": {"type": "keyword"},
      "amountCents": {"type": "long"},
      "customerEmail": {"type": "keyword"},
      "createdAt": {"type": "date"}
    }
  }
}

# Consistency note: read model lag 1-5s typical; UI shows "processing" state until caught up


# ═══════════════════════════════════════════════════════════════════
# PATTERN 6 — SAGA (Distributed Transactions)
# ═══════════════════════════════════════════════════════════════════
# AWS mapping:
#   Orchestration: Step Functions (visual, audit trail, built-in retry)
#   Choreography:  EventBridge + MSK (loose coupling, harder to debug)
#   Compensation:  SQS retry + compensating Lambda/ECS handlers
#   State:         DynamoDB saga-instance table or Aurora saga_log

# Choreography saga — place order (EventBridge)
# 1. order.placed       → inventory-service reserves stock
# 2. inventory.reserved → payment-service captures payment
# 3. payment.captured   → fulfillment-service ships
# Failure: payment.failed → inventory-service listens → inventory.released (compensate)

# Orchestration saga — Step Functions (explicit control)
# PlaceOrder → ReserveInventory → CapturePayment → CreateShipment
# Catch States.ALL → CompensatePayment → ReleaseInventory → FailOrder

# Saga state table (DynamoDB)
# PK: SAGA#sagaId  SK: STEP#stepName  status: PENDING|DONE|COMPENSATING|FAILED
# Conditional writes prevent double compensation

# Idempotency at every step — saga step handler checks step status before executing


# ═══════════════════════════════════════════════════════════════════
# PATTERN 7 — TRANSACTIONAL OUTBOX
# ═══════════════════════════════════════════════════════════════════
# AWS mapping:
#   Outbox table:  Aurora PostgreSQL (same TX as business write)
#   Relay:         DMS CDC → MSK, or Debezium on ECS, or polling Lambda
#   Publish:       MSK / EventBridge PutEvents
#   Idempotent:    consumer dedup via eventId in DynamoDB

# Outbox schema (Aurora)
CREATE TABLE outbox_events (
  event_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type VARCHAR(64) NOT NULL,
  aggregate_id VARCHAR(64) NOT NULL,
  event_type   VARCHAR(64) NOT NULL,
  payload      JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);
CREATE INDEX idx_outbox_unpublished ON outbox_events(created_at) WHERE published_at IS NULL;

# Spring @Transactional — business write + outbox insert atomically
@Transactional
public Payment capture(CaptureCommand cmd) {
  Payment p = paymentRepo.capture(cmd);
  outboxRepo.save(new OutboxEvent("Payment", p.getId(), "PaymentCaptured", toJson(p)));
  return p;
}

# Relay (Debezium connector config excerpt)
{
  "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
  "database.hostname": "payment.cluster-abc.us-east-1.rds.amazonaws.com",
  "table.include.list": "public.outbox_events",
  "transforms": "outbox",
  "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
  "topic.prefix": "acme.payment"
}

# Why outbox beats dual-write (DB + Kafka directly): atomicity guaranteed


# ═══════════════════════════════════════════════════════════════════
# PATTERN 8 — CDC (Change Data Capture)
# ═══════════════════════════════════════════════════════════════════
# AWS mapping:
#   Managed CDC:  AWS DMS (Database Migration Service) — Aurora → Kinesis/MSK/S3
#   Streaming:    Amazon Kinesis Data Streams → Lambda/Flink consumers
#   Connect:      MSK Connect with Debezium source connector
#   Sink:         OpenSearch, S3 data lake (Parquet), Redshift, DynamoDB

# DMS — Aurora PostgreSQL → MSK (ongoing replication)
{
  "ReplicationInstanceIdentifier": "payment-cdc-replication",
  "ReplicationInstanceClass": "dms.r6i.large",
  "AllocatedStorage": 100,
  "SourceEndpoint": "aurora-payment-source",
  "TargetEndpoint": "msk-payment-target",
  "MigrationType": "cdc",
  "TableMappings": {
    "rules": [{
      "rule-type": "selection",
      "rule-id": "1",
      "rule-name": "payments-tables",
      "object-locator": {"schema-name": "public", "table-name": "payments"},
      "rule-action": "include"
    }]
  }
}

# MSK Connect Debezium → multiple sinks
# Source: Aurora WAL → Topic: acme.payment.public.payments
# Sinks:
#   S3 Sink Connector → s3://acme-data-lake/payments/ (Parquet, partition by date)
#   OpenSearch Sink → payments-read index
#   Lambda consumer → invalidate Redis cache keys payment:\${paymentId}

# CDC pitfalls: schema changes need registry compatibility (BACKWARD); monitor replication lag
# FinTech: CDC feed for audit/reconciliation — immutable S3 with Object Lock`,
    verify: `# EventBridge test event
aws events put-events --entries '[{
  "Source": "com.acme.payment",
  "DetailType": "PaymentCaptured",
  "Detail": "{\\"paymentId\\":\\"pay_test\\",\\"amountCents\\":4999}",
  "EventBusName": "acme-payments"
}]'

# DMS replication task status
aws dms describe-replication-tasks \\
  --filters Name=replication-task-id,Values=payment-cdc-task \\
  --query 'ReplicationTasks[0].{Status:Status,Progress:ReplicationTaskStats}'

# MSK consumer lag
aws kafka list-clusters --query 'ClusterInfoList[0].ClusterArn'`,
    pitfalls:
      'Dual-write (DB + queue) instead of outbox — events lost on partial failure. Saga choreography without idempotent consumers — double compensation. CQRS without explaining eventual consistency lag to product. Serverless for all paths including 2K TPS synchronous authorize. DMS CDC without monitoring replication lag — stale read models.',
    production:
      'Default to async boundaries (EventBridge/SQS) between domains. Use outbox + Debezium for reliable event publish. Step Functions for regulated sagas needing audit. MSK when >10K events/s or strict ordering per entity. DMS CDC to S3 data lake for 7-year audit; OpenSearch for operational queries.',
    interview30s:
      'Three-tier = CloudFront/ALB/ECS/Aurora. Event-driven = EventBridge + SQS + MSK. Serverless = API GW + Lambda + DynamoDB. Microservices = EKS + IRSA + database-per-service. CQRS = Aurora write + OpenSearch read via CDC. Saga = Step Functions orchestration or EventBridge choreography. Outbox = same-TX event row + Debezium relay.',
    interview2m:
      'Compare saga orchestration (Step Functions — visible state, easy compensate) vs choreography (EventBridge — loose coupling, harder debug). Outbox vs dual-write with concrete failure scenario (DB commit succeeds, Kafka publish fails). When MSK beats EventBridge (ordering, replay, throughput). CDC pipeline: Aurora → DMS/Debezium → MSK → S3 audit + OpenSearch dashboard. FinTech example: payment capture writes Aurora + outbox; CDC projects to ledger read model and fraud scorer within 2s.',
    traps:
      '"Microservices share one Aurora database" — violates bounded context. "CQRS means two databases day one" — start with read replicas, evolve to projections. "EventBridge replaces Kafka always" — wrong at high throughput/ordering. Confusing SNS with event bus (SNS is fan-out, not content routing).',
  },
  {
    id: 'fintech-architecture',
    title: 'FinTech Platform Architecture on AWS',
    badge: 'FinTech',
    category: 'Architecture',
    askLevel: '🏆 STAFF',
    what:
      'End-to-end FinTech platform: payment capture, settlement, reconciliation, fraud scoring, and double-entry ledger — wired through MSK, Aurora, DynamoDB, Redis, SQS, EventBridge, KMS, and immutable audit on S3.',
    mermaid: `flowchart TB
  subgraph ingress [Payment Ingress]
    API[Payment API ALB] --> PAY[Payment Service]
    PAY --> AUR[(Aurora payments)]
    PAY --> DDB[(DynamoDB idempotency)]
    PAY --> REDIS[(Redis rate limit)]
  end
  subgraph events [Event Backbone]
    PAY --> OUT[Transactional Outbox]
    OUT --> MSK[MSK acme.fintech]
    MSK --> FRAUD[Fraud Scorer]
    MSK --> LED[Ledger Projector]
    MSK --> REC[Reconciliation Worker]
  end
  subgraph settlement [Settlement]
    EB[EventBridge Scheduler] --> SQS[SQS settlement-batch]
    SQS --> SET[Settlement Service]
    SET --> AUR
    SET --> S3[(S3 settlement files)]
  end
  subgraph audit [Audit]
    MSK --> FIRE[Firehose]
    FIRE --> S3AUD[(S3 Object Lock audit)]
    KMS[KMS CMK] --> AUR & DDB & S3AUD
  end`,
    code: `# ═══════════════════════════════════════════════════════════════════
# FINTECH DOMAIN SERVICES — AWS SERVICE MAP
# ═══════════════════════════════════════════════════════════════════
# | Domain          | Primary Store      | Async Bus        | Cache         |
# |-----------------|--------------------|------------------|---------------|
# | Payment capture | Aurora + DynamoDB  | MSK payment.*    | Redis         |
# | Settlement      | Aurora + S3        | SQS batch queue  | —             |
# | Reconciliation  | Aurora + S3        | MSK + EventBridge| Redis locks   |
# | Fraud           | DynamoDB scores    | MSK (consume)    | Redis features|
# | Ledger          | Aurora (append)    | MSK (project)    | Redis balance |
# | Audit           | S3 Object Lock     | Firehose ← MSK   | —             |


# ═══════════════════════════════════════════════════════════════════
# 1. PAYMENT CAPTURE
# ═══════════════════════════════════════════════════════════════════
# Flow: API → validate → idempotency check (DynamoDB) → PSP authorize → Aurora TX → outbox → MSK

# Aurora — payments (OLTP source of truth)
CREATE TABLE payments (
  payment_id      UUID PRIMARY KEY,
  merchant_id     VARCHAR(32) NOT NULL,
  amount_cents    BIGINT NOT NULL,
  currency        CHAR(3) NOT NULL,
  status          VARCHAR(20) NOT NULL,
  psp_reference   VARCHAR(64),
  risk_score      SMALLINT,
  idempotency_key VARCHAR(64) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (merchant_id, idempotency_key)
);

# DynamoDB — idempotency + payment state machine (hot path)
# Table: fintech-idempotency  PK: MERCHANT#mId#KEY#hash  TTL: 86400
{
  "pk": "MERCHANT#m_abc#KEY#idk_001",
  "paymentId": "pay_01HXYZ",
  "status": "AUTHORIZED",
  "response": "{...}",
  "ttl": 1735401600
}

# Redis — rate limiting + merchant config cache
# ratelimit:m_abc:minute → INCR + EXPIRE 60
# merchant:m_abc:config  → JSON fee rules, TTL 600

# MSK publish (via outbox relay) — topic: acme.fintech.payment.authorized
{
  "eventId": "evt_uuid",
  "paymentId": "pay_01HXYZ",
  "merchantId": "m_abc",
  "amountCents": 4999,
  "currency": "USD",
  "pspReference": "ch_3Nabc",
  "occurredAt": "2026-08-28T19:00:00Z"
}


# ═══════════════════════════════════════════════════════════════════
# 2. SETTLEMENT
# ═══════════════════════════════════════════════════════════════════
# Batch settlement: aggregate captured payments → net per merchant → ACH file to bank
# Trigger: EventBridge Scheduler cron(0 2 * * ? *) → SQS settlement-batch

# SQS settlement-batch (standard queue, large batches)
# Message: {"settlementDate": "2026-08-28", "merchantId": "m_abc", "paymentIds": ["pay_1","pay_2"]}

# Aurora — settlement batches
CREATE TABLE settlement_batches (
  batch_id       UUID PRIMARY KEY,
  merchant_id    VARCHAR(32) NOT NULL,
  settlement_date DATE NOT NULL,
  gross_cents    BIGINT NOT NULL,
  fee_cents      BIGINT NOT NULL,
  net_cents      BIGINT NOT NULL,
  status         VARCHAR(20) NOT NULL,  -- PENDING|SENT|CONFIRMED|FAILED
  bank_reference VARCHAR(64),
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (merchant_id, settlement_date)
);

# S3 — NACHA/ACH files + confirmation artifacts
# s3://acme-settlements-prod/outbound/2026/08/28/m_abc.nach
# SSE-KMS alias/settlement-key, Object Lock COMPLIANCE 7 years

# Settlement worker (ECS) — idempotent per batch_id
# 1. SELECT captured payments FOR merchant/date FOR UPDATE
# 2. INSERT settlement_batches + UPDATE payments.settlement_batch_id
# 3. Generate NACHA file → S3 PutObject
# 4. Publish settlement.batch.created to MSK


# ═══════════════════════════════════════════════════════════════════
# 3. RECONCILIATION
# ═══════════════════════════════════════════════════════════════════
# Match PSP settlement report (S3 CSV) against internal Aurora ledger
# Trigger: S3 ObjectCreated on s3://acme-psp-reports/inbound/ → EventBridge → SQS reconcile

# EventBridge rule
{
  "source": ["aws.s3"],
  "detail-type": ["Object Created"],
  "detail": {"bucket": {"name": ["acme-psp-reports"]}, "object": {"key": [{"prefix": "inbound/"}]}}
}

# Reconciliation worker
# 1. Parse PSP CSV from S3 (streaming, no full load in memory)
# 2. For each row: lookup payment by psp_reference in Aurora
# 3. Mismatch → INSERT reconciliation_exceptions + SNS alert to ops
# 4. Match → UPDATE reconciliation_status = MATCHED

CREATE TABLE reconciliation_exceptions (
  exception_id   UUID PRIMARY KEY,
  psp_reference  VARCHAR(64),
  internal_payment_id UUID,
  psp_amount_cents BIGINT,
  internal_amount_cents BIGINT,
  reason         VARCHAR(64),  -- AMOUNT_MISMATCH|MISSING_INTERNAL|MISSING_PSP|DUPLICATE
  status         VARCHAR(20) DEFAULT 'OPEN',
  created_at     TIMESTAMPTZ DEFAULT now()
);

# Redis distributed lock — one reconciliation run per PSP file
# SET reconcile:file:\${s3Key} NX EX 3600


# ═══════════════════════════════════════════════════════════════════
# 4. FRAUD SCORING
# ═══════════════════════════════════════════════════════════════════
# Real-time scorer consumes MSK payment.authorized — returns score before capture (if sync) or flags post-auth

# MSK consumer group: fraud-scorer (12 partitions, scale consumers with lag)
# Feature store: Redis — velocity:\${cardFingerprint}:1h → INCR (TTL 3600)
# DynamoDB — fraud-decisions PK: PAYMENT#payId  score, rules, action: ALLOW|REVIEW|BLOCK

# EventBridge rule — high-risk alert
{
  "detail-type": ["FraudDecisionMade"],
  "detail": {"action": ["BLOCK"], "score": [{"numeric": [">=", 900]}]}
}
# Target: SNS ops-fraud-alerts + SQS manual-review-queue

# Fraud decision event → MSK acme.fintech.fraud.decided
{
  "paymentId": "pay_01HXYZ",
  "score": 850,
  "action": "REVIEW",
  "rulesTriggered": ["velocity_1h", "geo_mismatch"],
  "modelVersion": "v2.3.1"
}


# ═══════════════════════════════════════════════════════════════════
# 5. DOUBLE-ENTRY LEDGER
# ═══════════════════════════════════════════════════════════════════
# Append-only ledger projected from payment/settlement events — never UPDATE balances in place

# Aurora — chart of accounts + journal entries (append-only)
CREATE TABLE accounts (
  account_id   VARCHAR(32) PRIMARY KEY,
  account_type VARCHAR(32) NOT NULL,  -- ASSET|LIABILITY|EQUITY|REVENUE|EXPENSE
  merchant_id  VARCHAR(32),
  currency     CHAR(3) NOT NULL
);

CREATE TABLE journal_entries (
  entry_id     UUID PRIMARY KEY,
  transaction_id UUID NOT NULL,  -- groups balanced debits/credits
  account_id   VARCHAR(32) REFERENCES accounts(account_id),
  debit_cents  BIGINT DEFAULT 0,
  credit_cents BIGINT DEFAULT 0,
  payment_id   UUID,
  settlement_batch_id UUID,
  posted_at    TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_single_side CHECK (
    (debit_cents > 0 AND credit_cents = 0) OR (credit_cents > 0 AND debit_cents = 0)
  )
);
CREATE INDEX idx_journal_account_posted ON journal_entries(account_id, posted_at DESC);

# Ledger projector (MSK consumer) — idempotent by transaction_id
# PaymentCaptured →
#   DR MERCHANT_RECEIVABLE 4999
#   CR PSP_CLEARING         4999
# SettlementConfirmed →
#   DR PSP_CLEARING         4999
#   CR MERCHANT_PAYABLE     4850  (net after fees)
#   CR FEE_REVENUE           149

# Redis — cached account balances (derived, rebuild from journal on cache miss)
# balance:\${accountId} → SUM query result, TTL 60s, invalidate on journal post event


# ═══════════════════════════════════════════════════════════════════
# KMS — ENCRYPTION & KEY HIERARCHY
# ═══════════════════════════════════════════════════════════════════
# CMK hierarchy (single-region, multi-region for DR):
#   alias/fintech-master     — org root, key policy admin only
#   alias/payment-data       — Aurora, DynamoDB, Redis at-rest
#   alias/settlement-files   — S3 settlement + PSP reports
#   alias/audit-log          — S3 Object Lock audit bucket

# Key policy — payment-service role
{
  "Sid": "AllowPaymentService",
  "Effect": "Allow",
  "Principal": {"AWS": "arn:aws:iam::123456789012:role/payment-service-role"},
  "Action": ["kms:Decrypt", "kms:GenerateDataKey", "kms:DescribeKey"],
  "Resource": "*",
  "Condition": {
    "StringEquals": {"kms:ViaService": ["rds.us-east-1.amazonaws.com", "dynamodb.us-east-1.amazonaws.com"]}
  }
}

# Envelope encryption for PII columns (email, phone) in DynamoDB
# Store: encryptedDek (KMS) + iv + ciphertext — never plaintext PII in MSK events


# ═══════════════════════════════════════════════════════════════════
# AUDIT — IMMUTABLE TRAIL
# ═══════════════════════════════════════════════════════════════════
# All MSK topics → MSK Connect S3 Sink → s3://acme-audit-prod/events/
# Format: Parquet, partitioned by year/month/day/hour
# S3 Object Lock: COMPLIANCE mode, 2555 days retention
# Separate CloudTrail organization trail → S3 + CloudWatch Logs Insights

# Kinesis Data Firehose (alternative path for selected high-value events)
# MSK → Lambda filter → Firehose → S3 audit + OpenSearch for ops search
# Firehose dynamic partitioning: partitionKeyFromQuery: merchantId

# Audit record schema (Parquet)
# eventId, eventType, aggregateId, merchantId, actorId, ipAddress, payloadHash, occurredAt, kmsKeyId

# Query pattern: Athena over S3 audit
# SELECT event_type, count(*) FROM acme_audit.events
# WHERE year=2026 AND month=08 AND merchant_id='m_abc'
# GROUP BY event_type;


# ═══════════════════════════════════════════════════════════════════
# EVENT BACKBONE — MSK + EventBridge HYBRID
# ═══════════════════════════════════════════════════════════════════
# MSK (Kafka): high-volume domain events, ordering per paymentId, replay for new consumers
#   Topics: acme.fintech.payment.*, acme.fintech.settlement.*, acme.fintech.ledger.*
#   Retention: 30 days hot + S3 tiered storage 7 years
# EventBridge: scheduling, cross-account fan-out, SaaS integrations, ops alerts
#   Custom bus: acme-fintech-ops
# SQS: worker buffers (settlement, reconciliation, fraud review) with DLQ

# MSK cluster config
{
  "BrokerInstanceType": "kafka.m5.large",
  "NumberOfBrokerNodes": 6,
  "EncryptionInfo": {
    "EncryptionInTransit": {"ClientBroker": "TLS", "InCluster": true},
    "EncryptionAtRest": {"DataVolumeKMSKeyId": "alias/payment-data"}
  },
  "LoggingInfo": {
    "BrokerLogs": {"CloudWatchLogs": {"Enabled": true, "LogGroup": "/aws/msk/acme-fintech"}}
  }
}

# Glue Schema Registry — BACKWARD compatibility for payment events
# Schema: acme.fintech.payment.authorized-value (Avro)


# ═══════════════════════════════════════════════════════════════════
# SECURITY & COMPLIANCE CHECKLIST
# ═══════════════════════════════════════════════════════════════════
# [ ] No PAN — PSP tokenization only; SAQ A-EP scope
# [ ] All data at rest: KMS CMK (Aurora, DDB, S3, MSK, Redis)
# [ ] All data in transit: TLS 1.2+ (ALB, MSK, Redis)
# [ ] IAM: IRSA/task roles per service; no long-lived access keys
# [ ] VPC: private subnets; SG least privilege; VPC endpoints for S3/DynamoDB/Secrets Manager
# [ ] CloudTrail org trail + data events on S3 audit bucket
# [ ] GuardDuty + Security Hub CIS benchmark
# [ ] SOX: segregation of duties — settlement approval via Step Functions task token
# [ ] 7-year audit retention: S3 Object Lock + MSK tiered storage → S3


# ═══════════════════════════════════════════════════════════════════
# MONITORING & ALERTS
# ═══════════════════════════════════════════════════════════════════
# CloudWatch dashboards: payment TPS, settlement batch status, recon exception count, MSK lag
# Alarms:
#   MSK consumer lag > 1000 for 5 min → P1
#   reconciliation_exceptions OPEN > 10 → P2
#   settlement batch FAILED → P1
#   fraud BLOCK rate spike 3σ → P2
# X-Ray service map: payment-api → aurora → msk
# Custom metrics namespace: Acme/FinTech`,
    verify: `# MSK topic list
aws kafka get-bootstrap-brokers --cluster-arn \${MSK_CLUSTER_ARN}

# Settlement batch status
aws sqs get-queue-attributes \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/settlement-batch \\
  --attribute-names ApproximateNumberOfMessages

# Reconciliation exception query (Aurora via psql)
# SELECT reason, count(*) FROM reconciliation_exceptions WHERE status='OPEN' GROUP BY reason;

# Audit bucket Object Lock
aws s3api get-object-lock-configuration --bucket acme-audit-prod

# KMS key rotation status
aws kms get-key-rotation-status --key-id alias/payment-data`,
    pitfalls:
      'Mutable ledger (UPDATE balance column) — audit failure; must append journal entries. Settlement without idempotent batch_id — double payout. Reconciliation loaded entirely into memory — OOM on large PSP files. Fraud scorer as synchronous blocking call to PSP — blows latency SLA. MSK events containing PII — compliance violation; publish hashed/tokenized identifiers only.',
    production:
      'Payment + outbox in single Aurora TX; MSK for domain events; EventBridge for schedules/alerts. Settlement via SQS batch workers with FOR UPDATE locks. Reconciliation triggered by S3 EventBridge rule with Redis file lock. Ledger as append-only projection — never mutate. KMS per data class; S3 Object Lock audit 7 years. Hybrid MSK + EventBridge: Kafka for volume/ordering, EventBridge for ops integration.',
    interview30s:
      'FinTech platform: payment capture (Aurora + DynamoDB idempotency + Redis rate limit) → outbox → MSK event backbone → fraud scorer, ledger projector, reconciliation. Settlement batch via EventBridge Scheduler + SQS. KMS everywhere; S3 Object Lock audit trail 7 years.',
    interview2m:
      'Walk payment capture to settlement: authorize writes Aurora + outbox; Debezium publishes to MSK; fraud consumer scores in <100ms async; ledger projector writes double-entry journal; nightly EventBridge cron enqueues settlement batches; worker generates NACHA to S3; PSP report lands in S3 → EventBridge triggers reconciliation with exception queue. Deep dive ledger: why append-only (SOX audit). KMS key hierarchy and envelope encryption for PII. MSK vs EventBridge boundary: MSK for payment event stream, EventBridge for settlement schedule and ops SNS alerts.',
    traps:
      '"Update account balance on payment" — interviewer wants append-only ledger. "Reconcile in the payment API synchronously" — async batch. "One KMS key for everything" — separation of duties on key policies. "Audit = CloudTrail only" — need immutable domain event archive on S3 too.',
  },
];
