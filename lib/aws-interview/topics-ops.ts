import type {AwsTopic} from './types';

export const TOPICS_OPS: AwsTopic[] = [
  {
    id: 'cloudwatch',
    title: 'CloudWatch — Metrics, Logs, Alarms & Dashboards',
    badge: 'Observability',
    category: 'Operations',
    what:
      'CloudWatch collects metrics, logs, and alarms for AWS resources and custom application telemetry. Know built-in AWS metrics, custom metrics with dimensions, log groups/insights, composite alarms, and Spring Boot monitoring for latency, error rate, Kafka consumer lag, and DB connection pool.',
    mermaid: `flowchart LR
  subgraph apps [Spring Boot Fleet]
    APP1[payment-api-1]
    APP2[payment-api-2]
  end

  subgraph cw [CloudWatch]
    MET[Metrics Namespace Acme/Payment]
    LOGS[Log Groups /payment-api]
    ALM[Alarms p99-latency errors]
    DASH[Dashboard Payment Health]
  end

  subgraph actions [Actions]
    SNS[SNS on-call]
    ASG[ASG scale-out]
  end

  APP1 -->|Micrometer| MET
  APP2 -->|Micrometer| MET
  APP1 -->|awslogs agent| LOGS
  MET --> ALM
  ALM --> SNS
  ALM --> ASG
  MET --> DASH
  LOGS --> DASH`,
    code: `# ═══════════════════════════════════════════════════════════════
# Custom metrics — Spring Boot Micrometer → CloudWatch
# ═══════════════════════════════════════════════════════════════
# build.gradle: implementation 'io.micrometer:micrometer-registry-cloudwatch2'

management.metrics.export.cloudwatch.namespace=Acme/Payment
management.metrics.export.cloudwatch.step=1m
management.metrics.tags.application=payment-api
management.metrics.tags.env=prod

# Key metrics to emit
# - http.server.requests (p50/p95/p99 latency by uri)
# - payment.processed (counter by status=SUCCESS|FAILED)
# - kafka.consumer.lag (gauge by group, topic)
# - hikaricp.connections.active (gauge)
# - jvm.memory.used, jvm.gc.pause

# Custom business metric
@Service
public class PaymentMetrics {
  private final Counter processed;
  private final Timer latency;

  public PaymentMetrics(MeterRegistry registry) {
    this.processed = Counter.builder("payment.processed")
        .tag("status", "SUCCESS").register(registry);
    this.latency = Timer.builder("payment.latency").register(registry);
  }
}

# ═══════════════════════════════════════════════════════════════
# CloudWatch Alarms — latency, errors, Kafka lag, DB pool
# ═══════════════════════════════════════════════════════════════
# p99 latency > 500ms for 3 consecutive periods
aws cloudwatch put-metric-alarm \\
  --alarm-name payment-api-p99-latency \\
  --namespace Acme/Payment \\
  --metric-name http.server.requests \\
  --dimensions Name=application,Value=payment-api Name=statistic,Value=p99 \\
  --statistic Average --period 60 --evaluation-periods 3 \\
  --threshold 500 --comparison-operator GreaterThanThreshold \\
  --alarm-actions arn:aws:sns:us-east-1:123456789012:oncall-payment

# 5xx error rate > 1% (metric math)
aws cloudwatch put-metric-alarm \\
  --alarm-name payment-api-5xx-rate \\
  --metrics '[
    {"Id":"errors","MetricStat":{"Metric":{"Namespace":"Acme/Payment","MetricName":"http.server.requests","Dimensions":[{"Name":"status","Value":"500"}]},"Period":60,"Stat":"Sum"}},
    {"Id":"total","MetricStat":{"Metric":{"Namespace":"Acme/Payment","MetricName":"http.server.requests","Dimensions":[]},"Period":60,"Stat":"Sum"}},
    {"Id":"rate","Expression":"errors/total*100","Label":"5xx Rate %","ReturnData":true}
  ]' \\
  --threshold 1 --comparison-operator GreaterThanThreshold \\
  --evaluation-periods 2 --datapoints-to-alarm 2

# Kafka consumer lag (MSK built-in or custom)
aws cloudwatch put-metric-alarm \\
  --alarm-name fraud-consumer-lag \\
  --namespace AWS/Kafka \\
  --metric-name MaxOffsetLag \\
  --dimensions Name=Cluster Name,Value=payment-events-prod Name=Consumer Group,Value=fraud-detectors \\
  --statistic Maximum --period 300 --evaluation-periods 2 \\
  --threshold 10000 --comparison-operator GreaterThanThreshold \\
  --alarm-actions arn:aws:sns:us-east-1:123456789012:oncall-data

# HikariCP connections near exhaustion
# Custom metric: hikaricp.connections.active / hikaricp.connections.max > 0.85

# ═══════════════════════════════════════════════════════════════
# Logs + Insights — structured JSON from Spring Boot
# ═══════════════════════════════════════════════════════════════
# Logback JSON appender → /aws/ecs/payment-api log group
# CloudWatch Logs Insights query:
fields @timestamp, level, traceId, paymentId, latencyMs
| filter level = "ERROR" or latencyMs > 1000
| sort @timestamp desc
| limit 50

# Dashboard widgets: latency heatmap, error count, lag, DB connections`,
    verify: `# List active alarms in ALARM state
aws cloudwatch describe-alarms --state-value ALARM \\
  --query 'MetricAlarms[?contains(AlarmName, \`payment\`)].{Name:AlarmName,Reason:StateReason}'

# Recent custom metrics
aws cloudwatch list-metrics --namespace Acme/Payment

# Logs Insights — run saved query
aws logs start-query \\
  --log-group-name /aws/ecs/payment-api \\
  --start-time $(date -d '1 hour ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | limit 20'`,
    pitfalls:
      'Default 5-minute metric period — miss sub-minute spikes. Too many custom metrics without dimensions → cost explosion. Alarm on average latency hides tail outliers — use p99. No composite alarm → alert fatigue from correlated failures. Logging PII (PAN, full card number) to CloudWatch.',
    production:
      'Golden signals dashboard: latency (p50/p95/p99), traffic, errors, saturation (CPU, DB pool, Kafka lag). Alarms → SNS → PagerDuty with runbook links. Structured JSON logs with traceId for correlation. Log retention 30 days hot, export to S3 for compliance. Anomaly detection on payment volume for fraud.',
    interview30s:
      'CloudWatch = metrics + logs + alarms. Emit custom metrics from Spring via Micrometer. Alarm on p99 latency, 5xx rate, Kafka lag, and DB pool saturation — not just CPU. Logs Insights for ad-hoc queries; dashboards for on-call triage.',
    interview2m:
      'Payment API monitoring: Micrometer exports http.server.requests percentiles, payment.processed counter, and HikariCP gauges to namespace Acme/Payment. Alarms: p99 > 500ms, 5xx rate > 1%, fraud consumer lag > 10k, DB connections > 85%. Composite alarm fires when latency AND errors spike together. Structured logs with traceId tie to X-Ray traces.',
    traps:
      '"CPU is fine so no alert needed" — app blocked on DB while CPU idles. Using default EC2 memory metric (not available — install agent). Alarm threshold set from dev traffic, never revisited for prod scale.',
  },
  {
    id: 'cloudtrail',
    title: 'CloudTrail — Audit & Forensics',
    badge: 'Audit',
    category: 'Operations',
    what:
      'CloudTrail records API calls across your AWS account — who did what, when, from where. Essential for compliance, security investigations, and answering "who deleted the S3 bucket?" Enable organization trail, log file validation, and integrate with CloudWatch Logs for real-time alerting on destructive actions.',
    mermaid: `flowchart LR
  subgraph actors [API Callers]
    IAMU[IAM User alice@acme.com]
    ROLE[Assumed Role CI/CD]
    ROOT[Root Account]
  end

  subgraph trail [CloudTrail]
    MGMT[Management Events]
    DATA[Data Events S3 objects]
    INSIGHTS[CloudTrail Insights]
  end

  subgraph storage [Storage & Alert]
    S3LOG[(S3 audit-logs bucket)]
    CW[CloudWatch Logs]
    ALM[Alarm DeleteBucket]
    ATH[Athena Forensics]
  end

  IAMU --> MGMT
  ROLE --> MGMT
  ROOT --> MGMT
  MGMT --> S3LOG
  MGMT --> CW
  DATA --> S3LOG
  CW --> ALM
  S3LOG --> ATH`,
    code: `# ═══════════════════════════════════════════════════════════════
# Organization trail — all regions, log validation
# ═══════════════════════════════════════════════════════════════
aws cloudtrail create-trail \\
  --name org-audit-trail \\
  --s3-bucket-name acme-cloudtrail-logs-prod \\
  --is-organization-trail \\
  --is-multi-region-trail \\
  --enable-log-file-validation \\
  --kms-key-id alias/cloudtrail-logs

aws cloudtrail put-event-selectors \\
  --trail-name org-audit-trail \\
  --event-selectors '[
    {"ReadWriteType": "All", "IncludeManagementEvents": true},
    {"ReadWriteType": "All", "IncludeManagementEvents": false,
     "DataResources": [{"Type": "AWS::S3::Object", "Values": ["arn:aws:s3:::acme-payment-docs-prod/"]}]}
  ]'

# CloudWatch Logs integration — real-time DeleteBucket alert
aws cloudtrail update-trail \\
  --name org-audit-trail \\
  --cloud-watch-logs-log-group-arn arn:aws:logs:us-east-1:123456789012:log-group:CloudTrail/Security:*
  --cloud-watch-logs-role-arn arn:aws:iam::123456789012:role/CloudTrailToCloudWatch

# Metric filter — detect S3 bucket deletion
aws logs put-metric-filter \\
  --log-group-name CloudTrail/Security \\
  --filter-name S3BucketDeleted \\
  --filter-pattern '{ ($.eventName = DeleteBucket) }' \\
  --metric-transformations metricName=S3BucketDeleted,metricNamespace=Security/Audit,metricValue=1

# ═══════════════════════════════════════════════════════════════
# Investigation: "Who deleted S3 bucket acme-payment-docs-prod?"
# ═══════════════════════════════════════════════════════════════
# Step 1 — CloudTrail Lake or Athena query on S3 log files
SELECT
  eventtime,
  useridentity.arn AS principal,
  useridentity.sessioncontext.sessionissuer.username AS assumed_role,
  sourceipaddress,
  useragent,
  requestparameters,
  errorcode
FROM cloudtrail_logs
WHERE eventname = 'DeleteBucket'
  AND requestparameters LIKE '%acme-payment-docs-prod%'
  AND eventtime BETWEEN '2026-08-27T00:00:00Z' AND '2026-08-28T00:00:00Z'
ORDER BY eventtime DESC
LIMIT 10;

# Step 2 — If assumed role, trace back to who assumed it
SELECT eventtime, useridentity.principalid, useridentity.arn, sourceipaddress
FROM cloudtrail_logs
WHERE eventname = 'AssumeRole'
  AND requestparameters LIKE '%DeployRole%'
  AND eventtime BETWEEN '2026-08-27T23:00:00Z' AND '2026-08-28T01:00:00Z';

# Step 3 — Check if MFA was present (root / sensitive IAM)
# userIdentity.sessionContext.attributes.mfaAuthenticated = "true"

# Step 4 — Correlate with Config — bucket existed? Versioning?
aws configservice get-resource-config-history \\
  --resource-type AWS::S3::Bucket \\
  --resource-id acme-payment-docs-prod \\
  --later-time 2026-08-28T00:00:00Z

# Step 5 — Remediation
# - Revoke compromised credentials
# - Restore bucket if versioning + MFA delete was enabled (unlikely after delete)
# - Re-create from cross-region replication DR bucket
# - Open incident ticket with full audit trail`,
    verify: `# Trail status and last delivery
aws cloudtrail get-trail-status --name org-audit-trail

# Recent management events (CLI lookup — prefer Athena for history)
aws cloudtrail lookup-events \\
  --lookup-attributes AttributeKey=EventName,AttributeValue=DeleteBucket \\
  --max-results 10 \\
  --query 'Events[].{Time:EventTime,User:Username,CloudTrailEvent:CloudTrailEvent}'`,
    pitfalls:
      'CloudTrail disabled in one region — attacker pivots there. No log file validation — logs tampered without detection. S3 log bucket without MFA delete and versioning — attacker deletes evidence. Data events not enabled — miss object-level GetObject exfiltration. Relying on CloudTrail alone without Config for resource state history.',
    production:
      'Organization multi-region trail with KMS encryption and log file validation. S3 log bucket: versioning + MFA delete + deny s3:DeleteBucket policy. Real-time metric filters for DeleteBucket, CreateUser, AttachUserPolicy, ConsoleLogin without MFA. Athena workgroup for forensic queries. Retain logs 7 years for SOX/PCI.',
    interview30s:
      'CloudTrail logs every AWS API call — who, what, when, source IP. For "who deleted the bucket": query DeleteBucket events in Athena/CloudTrail Lake, trace assumed-role chain, check MFA. Enable org trail, log validation, and real-time alerts on destructive actions.',
    interview2m:
      'Incident response flow: Athena query filters eventName=DeleteBucket and bucket name. Result shows assumed-role DeployRole from IP 203.0.113.50. Second query finds alice@acme.com called AssumeRole 2 minutes prior. Check MFA attribute. Config history confirms bucket had no MFA delete. Remediate: revoke Alice session, rotate role trust, restore from CRR DR bucket. Prevent: SCP denying s3:DeleteBucket without break-glass role.',
    traps:
      '"CloudTrail shows object downloads" — only with S3 data events enabled (costly). "We have CloudTrail so we are secure" — detection ≠ prevention. Looking only at IAM user, missing STS assumed-role session.',
  },
  {
    id: 'observability',
    title: 'Observability — CloudWatch + X-Ray + OpenTelemetry',
    badge: 'Tracing',
    category: 'Operations',
    what:
      'Full-stack observability combines metrics (CloudWatch), distributed traces (X-Ray or OpenTelemetry), and structured logs. Trace a payment request across API Gateway → Lambda/ECS → RDS → Kafka → downstream fraud service. Know trace context propagation, sampling, and service map.',
    mermaid: `sequenceDiagram
  participant Client as Mobile App
  participant ALB as ALB
  participant API as Payment API
  participant DB as Aurora RDS
  participant KFK as MSK Kafka
  participant Fraud as Fraud Service

  Client->>ALB: POST /payments (traceparent)
  ALB->>API: forward + X-Amzn-Trace-Id
  API->>DB: INSERT payment (subsegment)
  API->>KFK: publish PaymentEvent (subsegment)
  KFK->>Fraud: consume event (linked trace)
  Fraud-->>API: async risk score
  API-->>Client: 201 Created

  Note over API,Fraud: OTel traceId links all spans in X-Ray/CW`,
    code: `# ═══════════════════════════════════════════════════════════════
# OpenTelemetry — Spring Boot payment service
# ═══════════════════════════════════════════════════════════════
# dependencies: opentelemetry-javaagent + aws-opentelemetry-agent

# ECS task definition env
OTEL_SERVICE_NAME=payment-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=none
OTEL_PROPAGATORS=tracecontext,baggage,xray

# Or X-Ray SDK directly
# build.gradle: implementation 'com.amazonaws:aws-xray-recorder-sdk-spring'

# application.yml — Spring Boot 3 + Micrometer tracing
management.tracing.sampling.probability=0.1
management.otlp.tracing.endpoint=http://adot-collector:4318/v1/traces

# Auto-instrumented spans:
# - POST /api/v1/payments (server span)
# - jdbc:postgresql://aurora/payments INSERT (client span)
# - payment-events publish (messaging span)
# - fraud-service POST /score (client span if sync)

# Manual subsegment for business logic
@NewSpan("validate-payment-limits")
public void validateLimits(PaymentRequest req) {
  Span.current().setAttribute("payment.amount", req.getAmount());
  Span.current().setAttribute("tenant.id", req.getTenantId());
  limitsService.check(req);
}

# ═══════════════════════════════════════════════════════════════
# ADOT Collector sidecar → X-Ray + CloudWatch
# ═══════════════════════════════════════════════════════════════
# receivers: otlp
# exporters: awsxray, awscloudwatchlogs
# service.pipelines.traces: [otlp] → [awsxray]

# ═══════════════════════════════════════════════════════════════
# Payment flow trace — what to look for in X-Ray console
# ═══════════════════════════════════════════════════════════════
# 1. Service map: ALB → payment-api → aurora, msk, fraud-service
# 2. Trace detail: total 847ms — DB 120ms, Kafka 45ms, fraud 600ms (bottleneck!)
# 3. Error trace: 500 on payment-api — SQLException in subsegment
# 4. Annotations: paymentId, tenantId for search
# 5. Filter: service(payment-api) AND annotation.tenantId = "acme"

# Correlate logs with trace
# log pattern: {"traceId":"1-abc-123","spanId":"def456","paymentId":"pay-789"}
# CloudWatch Logs Insights:
fields @timestamp, traceId, paymentId, message
| filter traceId = "1-abc-123-def"
| sort @timestamp asc`,
    verify: `# X-Ray trace summaries (last hour)
aws xray get-trace-summaries \\
  --start-time $(date -u -d '1 hour ago +%s') \\
  --end-time $(date -u +%s) \\
  --filter-expression 'service(id(name: "payment-api", type: "AWS::ECS::Container")) { fault = true }'

# Service map nodes
aws xray get-service-graph \\
  --start-time $(date -u -d '1 hour ago +%s') \\
  --end-time $(date -u +%s)`,
    pitfalls:
      'No trace context propagation across Kafka — broken traces. 100% sampling in prod → cost and performance hit. X-Ray and OTel double-instrumented → duplicate spans. Missing baggage/attributes — cannot filter by tenantId. Logs without traceId — cannot correlate.',
    production:
      'ADOT collector sidecar on ECS/EKS. 10% head-based sampling + tail-based sampling for errors (via collector processor). Propagate W3C traceparent through ALB, Kafka headers, and HTTP clients. Service map SLO: p99 < 500ms end-to-end. Dashboard: trace latency breakdown by downstream.',
    interview30s:
      'Observability = metrics + logs + traces. OTel instruments Spring Boot; ADOT exports to X-Ray. Propagate trace context across HTTP and Kafka. Payment trace shows DB vs Kafka vs fraud latency. Correlate logs via traceId.',
    interview2m:
      'Payment POST creates root span. Subsegments for JDBC insert (120ms), Kafka publish (45ms), and async fraud consumer (linked via trace header in record). X-Ray service map reveals fraud-service as bottleneck at 600ms. 10% sampling with always-sample on errors. Logs include traceId — single query reconstructs full request timeline.',
    traps:
      '"We use CloudWatch so we have tracing" — metrics/logs ≠ distributed traces. "X-Ray only works with Lambda" — works with ECS, EC2, any OTel-instrumented app. Forgetting to propagate context through thread pools (@Async).',
  },
  {
    id: 'autoscaling-ha',
    title: 'Auto Scaling & High Availability — Multi-AZ Architecture',
    badge: 'HA',
    category: 'Operations',
    what:
      'High availability spans multiple AZs with no single point of failure. ALB distributes traffic across AZs; CloudWatch metrics trigger ASG scale policies; RDS Multi-AZ fails over automatically. Know horizontal scaling patterns, health checks, and graceful degradation.',
    mermaid: `flowchart TB
  subgraph region [us-east-1 Region]
    subgraph azA [AZ-a]
      ALBA[ALB Node]
      EC2A[EC2 / ECS Task]
      RDSA[(RDS Primary)]
    end
    subgraph azB [AZ-b]
      ALBB[ALB Node]
      EC2B[EC2 / ECS Task]
      RDSB[(RDS Standby)]
    end
    subgraph azC [AZ-c]
      EC2C[EC2 / ECS Task]
    end
  end

  Users[Clients] --> ALBA
  Users --> ALBB
  ALBA --> EC2A
  ALBA --> EC2B
  ALBB --> EC2B
  ALBB --> EC2C
  CW[CloudWatch ALB RequestCount] --> ASG[Auto Scaling Group]
  ASG --> EC2A
  ASG --> EC2B
  ASG --> EC2C
  EC2A --> RDSA
  EC2B --> RDSA
  RDSA -.->|sync replication| RDSB`,
    code: `# ═══════════════════════════════════════════════════════════════
# Multi-AZ HA — payment API stack
# ═══════════════════════════════════════════════════════════════
# ALB: cross-zone load balancing, health check /actuator/health
# ASG: min 3 across 3 AZs (survive 1 AZ loss + 1 instance)
# RDS: Multi-AZ PostgreSQL, automatic failover ~60s
# ElastiCache: Multi-AZ with automatic failover
# MSK: 3 brokers across 3 AZs

# ALB → CloudWatch → ASG scaling chain
# 1) ALB emits RequestCountPerTarget per target group
# 2) CloudWatch alarm or target-tracking policy reads metric
# 3) ASG adds/removes instances

aws autoscaling put-scaling-policy \\
  --auto-scaling-group-name payment-api-asg \\
  --policy-name alb-requests-scale \\
  --policy-type TargetTrackingScaling \\
  --target-tracking-configuration '{
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ALBRequestCountPerTarget",
      "ResourceLabel": "app/payment-alb/abc123/targetgroup/payment-tg/def456"
    },
    "TargetValue": 1000.0,
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }'

# Health check — Spring Boot actuator
# ALB target group: path=/actuator/health, interval=15s, healthy=2, unhealthy=3
# Deregistration delay: 30s (drain in-flight requests)

# ═══════════════════════════════════════════════════════════════
# Horizontal scaling decision tree
# ═══════════════════════════════════════════════════════════════
# CPU-bound API       → scale EC2/ECS on CPU or ALB request count
# Kafka lag growing   → scale consumer tasks (not brokers first)
# DB connection limit → scale RDS read replicas OR pool tuning (not more writers)
# Memory leak         → scale OUT temporarily, fix root cause
# AZ failure          → ASG launches in surviving AZs; ALB routes away

# Multi-AZ failure scenario
# AZ-a down: ALB health checks fail on EC2A → traffic to AZ-b/c
# RDS Multi-AZ: automatic DNS failover to standby in AZ-b (~60s)
# App retry: spring.datasource.hikari.connection-timeout + retry logic`,
    verify: `# ASG instance distribution across AZs
aws autoscaling describe-auto-scaling-groups \\
  --auto-scaling-group-names payment-api-asg \\
  --query 'AutoScalingGroups[0].Instances[].{AZ:AvailabilityZone,State:LifecycleState}'

# ALB target health per AZ
aws elbv2 describe-target-health \\
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/payment-tg/def456

# RDS Multi-AZ status
aws rds describe-db-instances --db-instance-identifier payment-prod \\
  --query 'DBInstances[0].{MultiAZ:MultiAZ,AZ:AvailabilityZone,Status:DBInstanceStatus}'`,
    pitfalls:
      'ASG in single AZ — AZ outage takes entire service down. Scale on CPU while bottleneck is RDS connections. ALB health check too aggressive — kills instances still starting. No connection pool retry after RDS Multi-AZ failover DNS change. Scaling in too fast — terminates instance with active payment.',
    production:
      'Min 3 instances across 3 AZs. ALB cross-zone enabled. Target-tracking on ALBRequestCountPerTarget. RDS Multi-AZ + 2 read replicas. Graceful shutdown: deregister from TG, wait 30s, then terminate. Chaos test: terminate AZ-a instances monthly.',
    interview30s:
      'HA = multi-AZ everything: ALB, ASG, RDS Multi-AZ, MSK 3 brokers. ALB health checks gate traffic. CloudWatch ALB metrics drive ASG target-tracking. Survive AZ loss with min capacity spread across 3 AZs.',
    interview2m:
      'Payment API: ALB in 2+ AZs, ASG min=3 across 3 AZs. Target-tracking scales on 1000 req/target. RDS Multi-AZ auto-failover; apps retry on connection refused. ElastiCache failover < 30s. On AZ-a outage: ALB drains unhealthy targets, ASG launches replacements in AZ-b/c. Mention connection pool sizing — scaling app tier without DB capacity just moves bottleneck.',
    traps:
      '"Auto Scaling fixes all performance issues" — only if not DB/network bound. "Multi-AZ RDS = read scaling" — standby is not readable (use replicas). Single NAT Gateway in one AZ — private subnet loses internet when that AZ fails.',
  },
  {
    id: 'disaster-recovery',
    title: 'Disaster Recovery — RPO/RTO & Recovery Strategies',
    badge: 'DR',
    category: 'Operations',
    askLevel: '🏆 STAFF',
    what:
      'Disaster recovery defines how fast you recover (RTO) and how much data you can lose (RPO). Compare backup-restore, pilot light, warm standby, and active-active. Map each strategy to FinTech payment platform components: RDS, S3, MSK, and Route 53 failover.',
    mermaid: `flowchart TB
  subgraph primary [Primary us-east-1]
    ALB1[ALB]
    APP1[Payment API ASG]
    RDS1[(RDS Multi-AZ)]
    S31[(S3 + CRR)]
    MSK1[MSK Cluster]
  end

  subgraph dr [DR us-west-2]
  subgraph pilot [Pilot Light]
    AMIL[AMI / LT ready]
    RDSsnap[(RDS Snapshot / Replica)]
    S32[(S3 Replica)]
  end
  subgraph warm [Warm Standby]
    ALB2[ALB min capacity]
    APP2[ASG min=1]
    RDSrep[(Read Replica promoted)]
  end
  subgraph active [Active-Active]
    ALB3[Global Accelerator]
    APP3[ASG full capacity both regions]
    RDSglob[(Aurora Global DB)]
  end
  end

  RDS1 -.->|async replication| RDSsnap
  S31 -->|CRR| S32
  MSK1 -.->|MirrorMaker 2| MSK2[MSK DR Cluster]
  end`,
    code: `# ═══════════════════════════════════════════════════════════════
# DR strategy comparison — FinTech payment platform
# ═══════════════════════════════════════════════════════════════
# | Strategy       | RPO        | RTO       | Cost    | Use case                    |
# |----------------|------------|-----------|---------|------------------------------|
# | Backup-Restore | Hours      | 4–24 hrs  | $       | Dev/staging, non-critical    |
# | Pilot Light    | Minutes    | 1–4 hrs   | $$      | Core DB ready, app scaled 0  |
# | Warm Standby   | Seconds–min| 15–60 min | $$$     | Prod DR, quarterly drill     |
# | Active-Active  | ~0         | ~0        | $$$$    | Global payments, 99.99% SLA  |

# ═══════════════════════════════════════════════════════════════
# Backup-Restore — RDS automated snapshots + S3 versioning
# ═══════════════════════════════════════════════════════════════
aws rds create-db-snapshot \\
  --db-instance-identifier payment-prod \\
  --db-snapshot-identifier payment-dr-manual-$(date +%Y%m%d)

# Restore to DR region (RTO = snapshot restore time, often 1–4 hrs)
aws rds restore-db-instance-from-db-snapshot \\
  --db-instance-identifier payment-dr-restored \\
  --db-snapshot-identifier arn:aws:rds:us-west-2:123456789012:snapshot:payment-dr-manual \\
  --db-instance-class db.r6g.xlarge \\
  --availability-zone us-west-2a

# ═══════════════════════════════════════════════════════════════
# Pilot Light — VPC + RDS snapshot + AMIs ready, ASG desired=0
# ═══════════════════════════════════════════════════════════════
# DR region has: VPC, subnets, security groups, launch template (latest AMI)
# RDS: automated cross-region snapshot copy (daily)
# ASG: desired-capacity=0, max=20 — scale on failover runbook
# Route 53: failover record weighted 0 for DR ALB

# ═══════════════════════════════════════════════════════════════
# Warm Standby — min capacity running in DR region
# ═══════════════════════════════════════════════════════════════
# DR ASG: desired=2 (vs prod desired=10)
# RDS cross-region read replica → promote on failover
aws rds promote-read-replica \\
  --db-instance-identifier payment-dr-replica

# Route 53 health check on primary ALB → failover to DR
aws route53 change-resource-record-sets \\
  --hosted-zone-id Z123456 \\
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.acme.com",
        "Type": "A",
        "SetIdentifier": "primary",
        "Failover": "PRIMARY",
        "AliasTarget": {"HostedZoneId": "Z35SXDOTRQ7X7K", "DNSName": "payment-alb-us-east-1.elb.amazonaws.com", "EvaluateTargetHealth": true}
      }
    }]
  }'

# ═══════════════════════════════════════════════════════════════
# Active-Active — Aurora Global Database + Global Accelerator
# ═══════════════════════════════════════════════════════════════
# Aurora Global: < 1s replication lag, promote secondary ~1 min
# Global Accelerator: anycast IP, health-based routing
# Conflict resolution: tenant-sharded writes per region OR CRDT/idempotency
# MSK: MirrorMaker 2 bidirectional replication
# S3 CRR with RTC for compliance docs`,
    verify: `# Cross-region RDS snapshot copies
aws rds describe-db-snapshot-attributes \\
  --db-snapshot-identifier payment-dr-manual

# Route 53 health check status
aws route53 get-health-check-status --health-check-id abc-123

# DR drill checklist
# [ ] Promote replica / restore snapshot in us-west-2
# [ ] Scale ASG desired to prod levels
# [ ] Update Route 53 failover
# [ ] Verify payment end-to-end in DR
# [ ] Measure actual RTO/RPO vs SLA`,
    pitfalls:
      'DR never tested — RTO estimate is fiction. Cross-region snapshot copy lag exceeds RPO SLA. Promoted read replica without recreating replicas in new topology. Active-active without idempotency — duplicate charges on failover. MSK not replicated — event log gap after DR.',
    production:
      'Warm standby for payment API: DR region ASG min=2, cross-region RDS replica, S3 CRR with RTC. Quarterly DR drill with measured RTO/RPO. Runbook in Confluence; Route 53 failover automated via health check. Active-active only for read-heavy global endpoints with conflict-free data model.',
    interview30s:
      'RPO = max data loss; RTO = max downtime. Backup-restore cheapest, slowest. Pilot light = infra ready, app off. Warm standby = reduced capacity running. Active-active = both regions live. Pick based on SLA and budget.',
    interview2m:
      'FinTech payment platform at 99.95%: warm standby in us-west-2. RDS cross-region replica (RPO ~5 min), ASG min=2 (RTO ~30 min with Route 53 failover). S3 CRR for KYC docs. Quarterly drill: promote replica, scale ASG, flip DNS, run synthetic payments. Active-active with Aurora Global only if business requires < 1 min RTO and justifies 2× cost. Always mention idempotency for payment writes during failover.',
    traps:
      '"Multi-AZ equals DR" — Multi-AZ is same-region AZ failure, not region disaster. "Snapshots are instant restore" — large DB restore takes hours. Forgetting to replicate secrets (Secrets Manager cross-region).',
  },
  {
    id: 'cost-optimization',
    title: 'Cost Optimization — Right-Sizing, RI/Spot & NAT',
    badge: 'Cost',
    category: 'Operations',
    what:
      'AWS costs compound silently — NAT Gateway data processing, over-provisioned RDS, idle EBS, and missing Savings Plans. Apply the FinOps mindset: measure, right-size, reserve steady state, spot for fault-tolerant workloads. See the full Cost Optimization hub for deep dives.',
    mermaid: `flowchart LR
  subgraph waste [Common Waste]
    NAT[NAT Gateway $0.045/GB]
    IDLE[Idle EC2/RDS]
    EBS[Unattached EBS]
    LOGS[CloudWatch Logs retention]
  end

  subgraph optimize [Optimization Levers]
    VPCE[VPC Endpoints S3/DynamoDB]
    RS[Right-size instances]
    RI[Compute Savings Plans]
    SPOT[Spot for batch workers]
  end

  waste --> optimize
  CE[Cost Explorer] --> RS
  CE --> RI`,
    code: `# ═══════════════════════════════════════════════════════════════
# Cost optimization mindset — see full guide at /cost-optimization
# ═══════════════════════════════════════════════════════════════
# 1. MEASURE  — Cost Explorer, tags (Env, Team, Service)
# 2. RIGHT-SIZE — CPU < 20% for 2 weeks → downsize
# 3. RESERVE   — Savings Plans / RI for 24×7 baseline
# 4. SPOT      — fault-tolerant batch, CI, Kafka consumers
# 5. ARCHITECT — VPC endpoints, S3 lifecycle, log retention

# ═══════════════════════════════════════════════════════════════
# NAT Gateway — often #1 surprise bill
# ═══════════════════════════════════════════════════════════════
# Cost: $0.045/GB processed + $0.045/hr per NAT (~$32/mo base)
# 3 AZs × 1 NAT = ~$100/mo base + data charges
# 10 TB/mo through NAT = $450 data + $100 base = $550/mo

# Fix: Gateway endpoints (FREE) for S3 and DynamoDB
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.\${var.region}.s3"
  route_table_ids = [aws_route_table.private.id]
}
# Saves all S3 traffic from flowing through NAT

# Interface endpoints for ECR, Secrets Manager, CloudWatch Logs
# ($0.01/hr/AZ — cheaper than NAT at scale for AWS API calls)

# ═══════════════════════════════════════════════════════════════
# Right-sizing — Cost Explorer recommendations
# ═══════════════════════════════════════════════════════════════
aws ce get-rightsizing-recommendation \\
  --service EC2-Instance \\
  --configuration '{"BenefitsConsidered": true, "RecommendationTarget": "SAME_INSTANCE_FAMILY"}'

# Example: m6i.2xlarge at 12% CPU avg → m6i.large saves ~75%

# ═══════════════════════════════════════════════════════════════
# Reserved / Savings Plans vs Spot
# ═══════════════════════════════════════════════════════════════
# Savings Plan (Compute): 1yr no-upfront ~30% off, covers EC2/Fargate/Lambda
# EC2 RI: instance-specific, trade flexibility for deeper discount
# Spot: ~60-70% off, 2-min interruption notice — use for:
#   - Kafka consumers (rebalance handles restart)
#   - Batch settlement jobs
#   - CI/CD runners
# NOT for: stateful payment writer without checkpoint

# ASG mixed instances policy
"InstancesDistribution": {
  "OnDemandBaseCapacity": 2,
  "OnDemandPercentageAboveBaseCapacity": 25,
  "SpotAllocationStrategy": "capacity-optimized"
}

# ═══════════════════════════════════════════════════════════════
# Quick wins checklist
# ═══════════════════════════════════════════════════════════════
# [ ] S3 lifecycle → IA/Glacier for audit logs
# [ ] CloudWatch log retention 30d (not "never expire")
# [ ] Delete unattached EBS volumes and old snapshots
# [ ] RDS stop dev instances nights/weekends (or Aurora Serverless v2)
# [ ] Graviton (m7g/r7g) — 20% cheaper, verify app compatibility`,
    verify: `# Top services by cost (last 30 days)
aws ce get-cost-and-usage \\
  --time-period Start=$(date -d '30 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \\
  --granularity MONTHLY \\
  --metrics BlendedCost \\
  --group-by Type=DIMENSION,Key=SERVICE \\
  --query 'ResultsByTime[0].Groups | sort_by(@, &Metrics.BlendedCost.Amount) | reverse(@) | [0:10]'

# NAT Gateway bytes processed
aws cloudwatch get-metric-statistics \\
  --namespace AWS/NATGateway --metric-name BytesOutToDestination \\
  --dimensions Name=NatGatewayId,Value=nat-abc123 \\
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 86400 --statistics Sum`,
    labHref: '/cost-optimization',
    pitfalls:
      'One NAT per AZ without measuring — $300+/mo for modest traffic. Savings Plan purchased without utilization tracking — wasted commit. Spot for payment API without interruption handling. Graviton migration without testing (JNI/crypto libs). Ignoring S3 INT retrieval fees after lifecycle transition.',
    production:
      'Tag all resources (Env, Service, Owner). Monthly Cost Explorer review with engineering. Compute SP for baseline EC2/Fargate. S3 gateway endpoint in every VPC. Spot for Kafka consumers and batch. CloudWatch log retention 30d with S3 export for compliance.',
    interview30s:
      'Measure with Cost Explorer, right-size idle resources, Savings Plans for steady baseline, Spot for fault-tolerant workloads. NAT Gateway is a common hidden cost — use VPC endpoints for S3/DynamoDB. Full playbook at /cost-optimization.',
    interview2m:
      'FinTech platform $50k/mo: NAT data charges $4k — add S3 gateway endpoint, saves 80%. RDS m6i.2xlarge at 15% CPU — right-size to m6i.large, save $1.2k/mo. Compute SP covers 60% of EC2/Fargate baseline. Spot for settlement batch workers (60% savings, checkpoint on interrupt). Mention tagging, weekly anomaly alerts, and quarterly RI/SP review.',
    traps:
      '"Spot is always cheaper so use everywhere" — payment API needs On-Demand base. "Reserved Instances are deprecated" — Savings Plans replaced RI flexibility, but RI still valid. Deleting NAT without adding endpoints — breaks private subnet AWS API access.',
  },
  {
    id: 'troubleshooting',
    title: 'Production Troubleshooting — 8 Common AWS Scenarios',
    badge: 'Troubleshoot',
    category: 'Operations',
    what:
      'On-call engineers face recurring failure patterns. Know systematic investigation for latency spikes, EC2 CPU saturation, Kafka consumer lag, RDS CPU, S3 access denied, ECS restart loops, ALB 503s, and private EC2 without internet. Each scenario has a structured debug path.',
    mermaid: `flowchart TD
  ALERT[CloudWatch Alarm] --> TRIAGE{Triage}
  TRIAGE -->|Latency| S1[Check ALB p99 + DB + downstream]
  TRIAGE -->|CPU 95%| S2[top + thread dump + scale]
  TRIAGE -->|Kafka lag| S3[Consumer health + partitions]
  TRIAGE -->|RDS 90%| S4[Slow query log + EXPLAIN]
  TRIAGE -->|S3 403| S5[IAM policy + bucket policy + SCP]
  TRIAGE -->|ECS restart| S6[Stopped reason + logs]
  TRIAGE -->|ALB 503| S7[Target health + capacity]
  TRIAGE -->|No internet| S8[NAT route + SG + NACL]`,
    code: `# ═══════════════════════════════════════════════════════════════
# SCENARIO 1: Latency spike — payment API p99 200ms → 3s
# ═══════════════════════════════════════════════════════════════
# 1. ALB target response time: aws cloudwatch → TargetResponseTime p99
# 2. X-Ray service map: which downstream? DB? fraud-service?
# 3. RDS Performance Insights: wait events (IO:DataFileRead? Lock?)
# 4. Recent deploy? Rollback candidate
# 5. Kafka lag? Consumer backlog causing stale fraud scores
# 6. Check connection pool: hikaricp.connections.pending > 0
# Fix: scale read replica, kill slow query, rollback deploy, scale fraud consumers

# ═══════════════════════════════════════════════════════════════
# SCENARIO 2: EC2 CPU 95% sustained
# ═══════════════════════════════════════════════════════════════
# 1. SSH/SSM: top -H -p $(pgrep -f payment-api) — which thread?
# 2. thread dump: jcmd <pid> Thread.print > /tmp/threaddump.txt
# 3. GC logs: long Full GC pauses? → heap too small or leak
# 4. Traffic spike or DDoS? → check ALB request count
# 5. Crypto operation loop? → batch vs per-request
# Fix: scale ASG, increase heap, fix infinite loop, add WAF rate limit

# ═══════════════════════════════════════════════════════════════
# SCENARIO 3: Kafka consumer lag growing (fraud-detectors)
# ═══════════════════════════════════════════════════════════════
# 1. CloudWatch MaxOffsetLag for consumer group
# 2. Consumer logs: rebalance storm? processing exception?
# 3. Processing time per message increased? (downstream DB slow)
# 4. Partition count vs consumer count — consumers < partitions?
# 5. Broker disk full? → Check KafkaDataLogsDiskUsed
# Fix: scale consumer tasks to match partitions, fix slow handler,
#      increase partitions (plan carefully), expand broker storage

# ═══════════════════════════════════════════════════════════════
# SCENARIO 4: RDS CPU 90% — Aurora PostgreSQL
# ═══════════════════════════════════════════════════════════════
# 1. Performance Insights → top SQL by load
# 2. pg_stat_statements: SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10
# 3. EXPLAIN ANALYZE on top query — missing index? seq scan?
# 4. Connection count: SELECT count(*) FROM pg_stat_activity;
# 5. Lock contention: SELECT * FROM pg_locks WHERE NOT granted;
# Fix: add index, kill idle connections, add read replica, upgrade instance

# ═══════════════════════════════════════════════════════════════
# SCENARIO 5: S3 Access Denied on PutObject
# ═══════════════════════════════════════════════════════════════
# 1. Error message: 403 AccessDenied — note RequestId
# 2. IAM policy on role: s3:PutObject on arn:aws:s3:::bucket/prefix/*?
# 3. Bucket policy: explicit Deny? VPC endpoint condition?
# 4. SCP at OU level blocking s3:PutObject?
# 5. KMS key policy: s3:PutObject with SSE-KMS needs kms:Encrypt
# 6. IAM Policy Simulator: simulate principal + action + resource
aws iam simulate-principal-policy \\
  --policy-source-arn arn:aws:iam::123456789012:role/payment-api \\
  --action-names s3:PutObject \\
  --resource-arns arn:aws:s3:::acme-payment-docs-prod/receipts/test.pdf
# Fix: add IAM permission, fix bucket policy Condition, update KMS key policy

# ═══════════════════════════════════════════════════════════════
# SCENARIO 6: ECS task restart loop (Fargate)
# ═══════════════════════════════════════════════════════════════
# 1. aws ecs describe-tasks → stoppedReason, exitCode
# 2. CloudWatch Logs: /ecs/payment-api → OOM? Exception on startup?
# 3. Health check failing? → curl localhost:8080/actuator/health
# 4. Secrets Manager access? → task role missing secretsmanager:GetSecretValue
# 5. Image pull error? → ECR permissions or wrong tag
# 6. CPU/memory limits too low? → OOMKilled (exit 137)
# Fix: increase memory, fix startup exception, fix IAM role, correct health check path

# ═══════════════════════════════════════════════════════════════
# SCENARIO 7: ALB returning 503 Service Unavailable
# ═══════════════════════════════════════════════════════════════
# 1. Target health: aws elbv2 describe-target-health → any healthy?
# 2. All targets unhealthy → app not listening on registered port
# 3. ASG at 0 instances? → scaling policy or manual change
# 4. Security group: ALB SG → app SG on target port?
# 5. Deployment in progress? → deregistration delay draining all
# 6. AZ outage: targets in failed AZ only?
# Fix: fix health check, scale ASG min, fix SG rule, wait for deploy

# ═══════════════════════════════════════════════════════════════
# SCENARIO 8: Private EC2 cannot reach internet
# ═══════════════════════════════════════════════════════════════
# 1. Route table: 0.0.0.0/0 → nat-xxxxx (not igw-xxxxx for private subnet)
# 2. NAT Gateway in public subnet with EIP? State = available?
# 3. NAT in same AZ as EC2? (cross-AZ NAT works but costs more)
# 4. Security group: outbound allowed on 443?
# 5. NACL: outbound ephemeral ports 1024-65535 allowed?
# 6. DNS resolution: VPC enableDnsSupport + enableDnsHostnames?
# Test: curl -v https://ec2.\${AWS_REGION}.amazonaws.com (should get 401, not timeout)
# Fix: add NAT route, fix NACL, enable DNS, replace failed NAT Gateway`,
    verify: `# Quick health snapshot script (run during incident)
echo "=== ALB Target Health ==="
aws elbv2 describe-target-health --target-group-arn \${TG_ARN} \\
  --query 'TargetHealthDescriptions[].{Target:Target.Id,State:TargetHealth.State,Reason:TargetHealth.Reason}'

echo "=== ASG Capacity ==="
aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names \${ASG_NAME} \\
  --query 'AutoScalingGroups[0].{Desired:DesiredCapacity,InService:Instances[?LifecycleState==\`InService\`] | length(@)}'

echo "=== RDS CPU ==="
aws cloudwatch get-metric-statistics --namespace AWS/RDS --metric-name CPUUtilization \\
  --dimensions Name=DBInstanceIdentifier,Value=\${DB_ID} \\
  --start-time $(date -u -d '15 min ago' +%Y-%m-%dT%H:%M:%S) --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 60 --statistics Average`,
    pitfalls:
      'Restarting without collecting logs/thread dump — lose evidence. Scaling out before identifying bottleneck — wastes money. Fixing S3 IAM without checking SCP. Assuming ALB 503 means app bug — often zero healthy targets. NAT troubleshooting without checking route table association.',
    production:
      'Runbook per scenario in on-call wiki. Automated health dashboard: ALB targets, ASG capacity, RDS CPU, Kafka lag, ECS running count. Incident template: timeline, impact, root cause, action items. Post-mortem within 48 hours for SEV-1.',
    interview30s:
      'Structured triage: metric → logs → traces → recent changes. Latency: X-Ray + RDS Insights. 503: target health. S3 403: IAM + bucket policy + SCP + KMS. Private EC2 no internet: route table → NAT → NACL → DNS.',
    interview2m:
      'Walk latency spike: ALB p99 up → X-Ray shows fraud-service slow → fraud consumer Kafka lag 50k → scale consumers from 3 to 12, lag drains in 10 min. Root cause: deploy increased per-message DB query. Long-term: add index, add consumer auto-scaling on lag metric. Demonstrate systematic approach, not guessing.',
    traps:
      '"Restart fixed it" without root cause — will recur. Checking app logs before ALB target health on 503. Adding 0.0.0.0/0 IGW route to private subnet as "fix" for internet access.',
  },
];
