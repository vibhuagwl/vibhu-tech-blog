import type {AwsTopic} from './types';

export const TOPICS_MESSAGING: AwsTopic[] = [
  {
    id: 'sqs-sns-eventbridge',
    title: 'SQS · SNS · EventBridge — Messaging & Event Routing',
    badge: 'Messaging',
    category: 'Messaging',
    askLevel: '⭐ MOST ASKED',
    what:
      'SQS is a durable queue (pull, at-least-once). SNS is pub/sub fan-out (push to many subscribers). EventBridge is an event bus with content-based routing rules and SaaS integrations. Know standard vs FIFO queues, visibility timeout, DLQ redrive, SNS→SQS fan-out, and when to pick each vs Kafka.',
    mermaid: `flowchart TB
  subgraph producer [Payment Service]
    API[Spring Boot API]
  end

  subgraph fanout [SNS Fan-Out]
    SNS[SNS Topic payment-events]
    SQS1[SQS fraud-queue]
    SQS2[SQS ledger-queue]
    SQS3[SQS email-queue]
    SNS --> SQS1
    SNS --> SQS2
    SNS --> SQS3
  end

  subgraph eventbridge [EventBridge Rules]
    EB[Event Bus default]
    RULE1[Rule: source=payment status=FAILED]
    RULE2[Rule: detail-type=Chargeback]
    LBD[Lambda retry-handler]
    EB --> RULE1 --> LBD
    EB --> RULE2 --> SQS1
  end

  API -->|Publish| SNS
  API -->|PutEvents| EB
  SQS1 -->|DLQ after 3 receives| DLQ[(DLQ fraud-dlq)]
  SQS1 --> Worker1[Fraud Worker]
  SQS2 --> Worker2[Ledger Worker]`,
    code: `# ═══════════════════════════════════════════════════════════════
# SQS Standard vs FIFO
# ═══════════════════════════════════════════════════════════════
# Standard: best-effort ordering, at-least-once, unlimited TPS
# FIFO: strict order per MessageGroupId, exactly-once processing (dedup ID)
# Use FIFO when: payment settlement per account must be sequential

aws sqs create-queue \\
  --queue-name payment-settlement.fifo \\
  --attributes '{
    "FifoQueue": "true",
    "ContentBasedDeduplication": "true",
    "VisibilityTimeout": "60",
    "MessageRetentionPeriod": "1209600",
    "RedrivePolicy": "{\\"deadLetterTargetArn\\":\\"arn:aws:sqs:us-east-1:123456789012:payment-settlement-dlq.fifo\\",\\"maxReceiveCount\\":\\"3\\"}"
  }'

# Visibility timeout — worker crashed mid-process?
# Message hidden for N seconds → reappears if not deleted
# Rule: visibilityTimeout ≥ (p99 processing time × 2)
# Extend with ChangeMessageVisibility while processing long jobs

# DLQ + redrive — inspect poison messages, fix code, replay
aws sqs start-message-move-task \\
  --source-arn arn:aws:sqs:us-east-1:123456789012:payment-settlement-dlq.fifo \\
  --destination-arn arn:aws:sqs:us-east-1:123456789012:payment-settlement.fifo \\
  --max-number-of-messages-per-second 10

# ═══════════════════════════════════════════════════════════════
# SNS fan-out → multiple SQS queues (filter policies optional)
# ═══════════════════════════════════════════════════════════════
aws sns subscribe \\
  --topic-arn arn:aws:sns:us-east-1:123456789012:payment-events \\
  --protocol sqs \\
  --notification-endpoint arn:aws:sqs:us-east-1:123456789012:fraud-queue \\
  --attributes '{
    "FilterPolicy": "{\\"eventType\\":[\\"PAYMENT_FAILED\\",\\"CHARGEBACK\\"]}",
    "RawMessageDelivery": "true"
  }'

# SQS queue policy — allow SNS to send
{
  "Effect": "Allow",
  "Principal": {"Service": "sns.amazonaws.com"},
  "Action": "sqs:SendMessage",
  "Resource": "arn:aws:sqs:us-east-1:123456789012:fraud-queue",
  "Condition": {
    "ArnEquals": {"aws:SourceArn": "arn:aws:sns:us-east-1:123456789012:payment-events"}
  }
}

# ═══════════════════════════════════════════════════════════════
# EventBridge — content-based routing, schedules, SaaS partners
# ═══════════════════════════════════════════════════════════════
aws events put-rule \\
  --name payment-failed-retry \\
  --event-pattern '{
    "source": ["com.acme.payment"],
    "detail-type": ["PaymentFailed"],
    "detail": {"retryable": [true], "amount": [{"numeric": [">", 100]}]}
  }'

aws events put-targets \\
  --rule payment-failed-retry \\
  --targets '[{"Id":"retry-lambda","Arn":"arn:aws:lambda:us-east-1:123456789012:function:payment-retry"}]'

# Spring Boot — publish to EventBridge
PutEventsRequestEntry entry = PutEventsRequestEntry.builder()
    .source("com.acme.payment")
    .detailType("PaymentCompleted")
    .detail(objectMapper.writeValueAsString(Map.of(
        "paymentId", paymentId,
        "amount", amount,
        "tenantId", tenantId)))
    .eventBusName("default")
    .build();
eventBridgeClient.putEvents(PutEventsRequest.builder().entries(entry).build());

# Spring Boot — SQS listener with visibility extension
@SqsListener(value = "\${payment.queue}", acknowledgementMode = "MANUAL")
public void onPayment(PaymentEvent event, Acknowledgement ack) {
  try {
    ledgerService.post(event);
    ack.acknowledge();
  } catch (RetryableException e) {
  }
}

# ═══════════════════════════════════════════════════════════════
# SQS vs SNS vs EventBridge vs Kafka — when to pick what
# ═══════════════════════════════════════════════════════════════
# | Dimension          | SQS              | SNS              | EventBridge       | Kafka (MSK)        |
# |--------------------|------------------|------------------|-------------------|--------------------|
# | Pattern            | Queue (pull)     | Pub/sub (push)   | Event bus (route) | Log (pub/sub)      |
# | Consumers          | Competing workers| Many subscribers | Rule targets      | Consumer groups    |
# | Ordering           | FIFO per group   | No order         | No order          | Per-partition      |
# | Retention          | 1–14 days        | None (fan-out)   | 24h default       | Days to forever    |
# | Replay             | DLQ redrive only | No replay        | Archive + replay  | Offset reset       |
# | Throughput         | Standard: high   | Very high        | High              | Very high          |
# | Filtering          | None             | Filter policies  | Content rules     | Consumer-side      |
# | Best for           | Job queues, DLQ  | Fan-out notify   | Event routing     | Stream processing  |
# | FinTech example    | Settlement jobs  | Alert 3 teams    | Route by tenant   | Payment event log  |`,
    verify: `# Queue depth + DLQ message count
aws sqs get-queue-attributes \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/payment-settlement.fifo \\
  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible

aws sqs get-queue-attributes \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/payment-settlement-dlq.fifo \\
  --attribute-names ApproximateNumberOfMessages

# EventBridge rule targets
aws events list-targets-by-rule --rule payment-failed-retry

# SNS subscription filter delivery
aws sns list-subscriptions-by-topic \\
  --topic-arn arn:aws:sns:us-east-1:123456789012:payment-events`,
    pitfalls:
      'Visibility timeout shorter than processing time → duplicate processing. No DLQ → poison messages block queue forever. SNS→SQS without queue policy → silent delivery failure. FIFO without MessageGroupId sharding → single-partition bottleneck. Using SQS for event replay (use EventBridge archive or Kafka). EventBridge 256 KB event size limit for large payloads — store in S3, pass pointer.',
    production:
      'Payment pipeline: API publishes to SNS → filtered SQS queues per domain (fraud, ledger, notify). FIFO for per-account settlement with DLQ + CloudWatch alarm on DLQ depth > 0. EventBridge for cross-service routing and scheduled reconciliation jobs. Visibility timeout = 2× p99 handler time. Idempotent consumers with dedup keys in DynamoDB.',
    interview30s:
      'SQS = durable queue, pull-based, competing consumers. SNS = fan-out pub/sub. EventBridge = event bus with content-based rules. FIFO for ordering; DLQ for poison messages; visibility timeout prevents double-processing while worker runs. Pick Kafka when you need replay, retention, and stream processing.',
    interview2m:
      'Payment failed event: publish to SNS topic with filter policies — fraud queue gets CHARGEBACK, email queue gets all failures. Each SQS has DLQ with maxReceiveCount=3. Worker extends visibility on long jobs. EventBridge routes retryable failures to Lambda with exponential backoff. Contrast: SQS for job processing with backpressure, SNS for 1-to-many, EventBridge for decoupled routing across accounts/SaaS. Kafka when you need 7-day replay and exactly-once stream joins.',
    traps:
      '"SQS guarantees exactly-once" — only FIFO with dedup; standard is at-least-once. "SNS stores messages" — it pushes and forgets; durability is on SQS/Lambda target. Setting visibility timeout to 30s when payment handler takes 2 min.',
  },
  {
    id: 'msk-kafka',
    title: 'Amazon MSK — Managed Kafka for Event Streaming',
    badge: 'MSK',
    category: 'Messaging',
    askLevel: '🔥 SENIOR',
    what:
      'Amazon MSK is managed Apache Kafka — brokers, ZooKeeper/KRaft, and patching handled by AWS. Know TLS encryption in transit, SASL/SCRAM and IAM authentication, Kafka ACLs, topic design for FinTech payment events, and Spring Boot producer/consumer wiring to MSK.',
    mermaid: `flowchart TB
  subgraph vpc [VPC Private Subnets]
    subgraph msk [Amazon MSK Cluster]
      B1[Broker 1 AZ-a]
      B2[Broker 2 AZ-b]
      B3[Broker 3 AZ-c]
    end

    subgraph apps [Spring Boot Services]
      PAY[Payment Service Producer]
      FRAUD[Fraud Consumer Group]
      LEDGER[Ledger Consumer Group]
      ANALYTICS[Analytics Consumer Group]
    end

    PAY -->|TLS + IAM/SASL| B1
    PAY --> B2
    FRAUD -->|consumer group fraud-detectors| B1
    LEDGER -->|consumer group ledger-posters| B2
    ANALYTICS -->|consumer group analytics| B3
  end

  CW[CloudWatch MSK Metrics] -->|Kafka lag alarm| ASG[Scale Consumers]
  SEC[Secrets Manager SCRAM] -.-> FRAUD
  IAM[IAM Auth Policy] -.-> PAY`,
    code: `# ═══════════════════════════════════════════════════════════════
# MSK cluster — production baseline
# ═══════════════════════════════════════════════════════════════
# 3 brokers (min for prod), kafka.m5.large, 3 AZs
# Storage: 500 GB EBS per broker, auto-scaling enabled
# Encryption: TLS in-transit + at-rest (KMS)
# Client authentication: IAM + SASL/SCRAM (pick one per client)

aws kafka create-cluster \\
  --cluster-name payment-events-prod \\
  --kafka-version "3.6.0" \\
  --number-of-broker-nodes 3 \\
  --broker-node-group-info '{
    "InstanceType": "kafka.m5.large",
    "ClientSubnets": ["subnet-private-a", "subnet-private-b", "subnet-private-c"],
    "SecurityGroups": ["sg-msk-brokers"],
    "StorageInfo": {"EbsStorageInfo": {"VolumeSize": 500}}
  }' \\
  --encryption-info '{
    "EncryptionInTransit": {"ClientBroker": "TLS", "InCluster": true},
    "EncryptionAtRest": {"DataVolumeKMSKeyId": "alias/msk-payment"}
  }' \\
  --client-authentication '{
    "Sasl": {"Scram": {"Enabled": true}},
    "Tls": {"CertificateAuthorityArnList": ["arn:aws:acm-pca:..."]}
  }' \\
  --enhanced-monitoring PER_TOPIC_PER_BROKER

# ═══════════════════════════════════════════════════════════════
# IAM authentication (no username/password in app)
# ═══════════════════════════════════════════════════════════════
# MSK IAM policy on EC2/ECS task role:
{
  "Effect": "Allow",
  "Action": [
    "kafka-cluster:Connect",
    "kafka-cluster:DescribeTopic",
    "kafka-cluster:ReadData",
    "kafka-cluster:WriteData"
  ],
  "Resource": [
    "arn:aws:kafka:us-east-1:123456789012:cluster/payment-events-prod/*",
    "arn:aws:kafka:us-east-1:123456789012:topic/payment-events-prod/*/payment-events"
  ]
}

# ═══════════════════════════════════════════════════════════════
# SASL/SCRAM — credentials in Secrets Manager
# ═══════════════════════════════════════════════════════════════
aws secretsmanager create-secret \\
  --name AmazonMSK_payment-events-prod \\
  --secret-string '{"username":"payment-producer","password":"\${GENERATED}"}'

# Associate SCRAM secret with MSK cluster
aws kafka batch-associate-scram-secret \\
  --cluster-arn arn:aws:kafka:us-east-1:123456789012:cluster/payment-events-prod/abc-123 \\
  --secret-arn-list arn:aws:secretsmanager:us-east-1:123456789012:secret:AmazonMSK_payment-events-prod

# ═══════════════════════════════════════════════════════════════
# Kafka ACLs — least privilege per service principal
# ═══════════════════════════════════════════════════════════════
# Producer ACL (payment-service)
kafka-acls --bootstrap-server \${BOOTSTRAP} --command-config client.properties \\
  --add --allow-principal User:payment-producer \\
  --operation Write --operation Describe --topic payment-events

# Consumer ACL (fraud-service, group fraud-detectors)
kafka-acls --bootstrap-server \${BOOTSTRAP} --command-config client.properties \\
  --add --allow-principal User:fraud-consumer \\
  --operation Read --group fraud-detectors --topic payment-events

# ═══════════════════════════════════════════════════════════════
# Spring Boot → MSK (IAM auth)
# ═══════════════════════════════════════════════════════════════
# application.yml
spring.kafka.bootstrap-servers: \${MSK_BOOTSTRAP_BROKERS}
spring.kafka.properties.security.protocol: SASL_SSL
spring.kafka.properties.sasl.mechanism: AWS_MSK_IAM
spring.kafka.properties.sasl.jaas.config: software.amazon.msk.auth.iam.IAMLoginModule required;
spring.kafka.properties.sasl.client.callback.handler.class: software.amazon.msk.auth.iam.IAMClientCallbackHandler

spring.kafka.producer.key-serializer: org.apache.kafka.common.serialization.StringSerializer
spring.kafka.producer.value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
spring.kafka.producer.acks: all
spring.kafka.producer.enable-idempotence: true
spring.kafka.producer.retries: 5

spring.kafka.consumer.group-id: fraud-detectors
spring.kafka.consumer.auto-offset-reset: earliest
spring.kafka.consumer.enable-auto-commit: false
spring.kafka.listener.ack-mode: manual

# Producer — payment event
kafkaTemplate.send("payment-events", event.getAccountId(), event)
    .whenComplete((result, ex) -> {
      if (ex != null) log.error("Failed to publish paymentId={}", event.getPaymentId(), ex);
    });

# Consumer — manual commit after DB write
@KafkaListener(topics = "payment-events", groupId = "ledger-posters")
public void onPayment(ConsumerRecord<String, PaymentEvent> record, Acknowledgment ack) {
  ledgerService.post(record.value());
  ack.acknowledge();
}

# Topic design — payment-events
# partitions: 12 (scale consumers up to 12 per group)
# replication-factor: 3
# retention.ms: 604800000 (7 days for replay / audit)
# cleanup.policy: delete
# key: accountId (per-account ordering within partition)`,
    verify: `# MSK cluster state + bootstrap brokers
aws kafka describe-cluster \\
  --cluster-arn arn:aws:kafka:us-east-1:123456789012:cluster/payment-events-prod/abc-123 \\
  --query 'ClusterInfo.{State:State,Broker:BrokerNodeGroupInfo.BrokerAZDistribution}'

aws kafka get-bootstrap-brokers \\
  --cluster-arn arn:aws:kafka:us-east-1:123456789012:cluster/payment-events-prod/abc-123

# Consumer lag (CloudWatch or kafka-consumer-groups)
aws cloudwatch get-metric-statistics \\
  --namespace AWS/Kafka --metric-name MaxOffsetLag \\
  --dimensions Name=Cluster Name,Value=payment-events-prod Name=Consumer Group,Value=fraud-detectors \\
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 300 --statistics Maximum`,
    pitfalls:
      'MSK in public subnets — brokers must be private. Single broker in prod — no AZ fault tolerance. No ACLs with SASL/IAM enabled — any authenticated client can read all topics. Auto-commit with side effects → duplicate ledger posts on rebalance. Hot partition from low-cardinality key (all events keyed by "default"). SCRAM passwords in application.properties instead of Secrets Manager.',
    production:
      '3+ brokers across 3 AZs, TLS + IAM auth for Spring services, SCRAM for legacy clients. Topic payment-events: 12 partitions, RF=3, 7-day retention. CloudWatch alarm on MaxOffsetLag > 10,000 for fraud-detectors. MSK Connect or custom consumers for S3/Redshift sink. Security group: only app tier SG on port 9098 (IAM) / 9096 (SCRAM).',
    interview30s:
      'MSK = managed Kafka with AWS patching and CloudWatch integration. TLS in transit, IAM or SASL/SCRAM auth, ACLs per topic/group. Spring Boot uses aws-msk-iam-auth library. Design topics with partition count = max consumer parallelism; key by accountId for ordering.',
    interview2m:
      'Payment event stream: Payment Service produces to payment-events topic (key=accountId, acks=all, idempotent producer). Fraud and Ledger are separate consumer groups — independent scaling. IAM auth on ECS task role, no static creds. ACLs restrict fraud-consumer to Read on payment-events + fraud-detectors group. Monitor lag; scale consumers before adding partitions. Contrast MSK vs SQS: Kafka for replay, retention, stream joins; SQS for simple job queues.',
    traps:
      '"MSK Serverless replaces cluster sizing" — still need partition planning. "IAM auth means no ACLs needed" — ACLs still required for topic-level access. Increasing partitions without re-keying strategy — ordering guarantees change.',
  },
];
