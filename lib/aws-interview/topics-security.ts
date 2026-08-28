import type {AwsTopic} from './types';

export const TOPICS_SECURITY: AwsTopic[] = [
  {
    id: 'aws-security-stack',
    title: 'AWS Security Stack — WAF · Shield · GuardDuty · Hub · Trail · Config · Macie',
    badge: 'Security',
    category: 'Security',
    what:
      'AWS defense-in-depth layers: WAF filters HTTP at edge/app. Shield Standard (free) and Advanced (DDoS response team) protect L3/L4/L7. GuardDuty detects threats via VPC Flow Logs, DNS, CloudTrail. Security Hub aggregates findings (CIS, PCI-DSS). CloudTrail audits API calls. Config tracks resource compliance drift. Macie discovers and classifies sensitive data (PII) in S3.',
    mermaid: `flowchart TB
  subgraph Detect [Detect & Audit]
    GD[GuardDuty]
    CT[CloudTrail]
    CFG[AWS Config]
    MAC[Macie]
    SH[Security Hub]
  end

  subgraph Protect [Protect]
    WAF[AWS WAF]
    SHD[Shield Standard/Advanced]
    CF[CloudFront]
  end

  subgraph Workload [Payment API]
    APIGW[API Gateway]
    ALB[ALB]
    ECS[ECS Tasks]
    S3[(S3 PII Bucket)]
  end

  Client[Internet Client] --> CF
  CF --> WAF
  WAF --> SHD
  SHD --> APIGW
  APIGW --> ECS
  ECS --> S3

  APIGW --> CT
  ECS --> CT
  CT --> GD
  CFG --> SH
  GD --> SH
  MAC --> SH
  CT --> SH`,
    code: `# ═══════════════════════════════════════════════════════════════
# Layered security — FinTech payment platform
# ═══════════════════════════════════════════════════════════════
# WAF          — block SQLi, rate-limit /payments/*, geo-block sanctioned countries
# Shield Std   — auto on CloudFront/ALB/Route53 (free L3/L4)
# Shield Adv   — 24/7 DDoS Response Team + cost protection ($3K/mo)
# GuardDuty    — detect crypto-mining, IAM anomaly, DNS exfil
# Security Hub — single pane: CIS + PCI-DSS + custom checks
# CloudTrail   — who called what API when (immutable in log-archive)
# Config       — is prod S3 bucket encrypted? public? drift alert
# Macie        — scan S3 for credit cards, SSN, passport numbers

# ── AWS WAF — rate limit + SQLi on payment API ──
aws wafv2 create-web-acl \\
  --name payment-api-waf \\
  --scope REGIONAL \\
  --default-action Allow={} \\
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=paymentWaf \\
  --rules '[
    {
      "Name": "RateLimitPayments",
      "Priority": 1,
      "Statement": {
        "RateBasedStatement": {
          "Limit": 2000,
          "AggregateKeyType": "IP",
          "ScopeDownStatement": {
            "ByteMatchStatement": {
              "FieldToMatch": {"UriPath": {}},
              "SearchString": "/v1/payments",
              "TextTransformations": [{"Priority": 0, "Type": "LOWERCASE"}],
              "PositionalConstraint": "STARTS_WITH"
            }
          }
        }
      },
      "Action": {"Block": {}},
      "VisibilityConfig": {"SampledRequestsEnabled": true, "CloudWatchMetricsEnabled": true, "MetricName": "RateLimitPayments"}
    },
    {
      "Name": "AWSManagedRulesSQLi",
      "Priority": 2,
      "Statement": {"ManagedRuleGroupStatement": {"VendorName": "AWS", "Name": "AWSManagedRulesSQLiRuleSet"}},
      "OverrideAction": {"None": {}},
      "VisibilityConfig": {"SampledRequestsEnabled": true, "CloudWatchMetricsEnabled": true, "MetricName": "SQLi"}
    }
  ]'

# Associate WAF with API Gateway stage or ALB
aws wafv2 associate-web-acl \\
  --web-acl-arn arn:aws:wafv2:us-east-1:123456789012:regional/webacl/payment-api-waf/abc123 \\
  --resource-arn arn:aws:apigateway:us-east-1::/restapis/xyz/stages/prod

# ── GuardDuty — enable org-wide ──
aws guardduty create-detector --enable
aws guardduty create-members \\
  --detector-id abc123 \\
  --account-details AccountId=234567890123,Email=prod-ledger@acme.com

# Sample finding: UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration
# EC2 role creds used from unusual IP → investigate SSRF or compromised instance

# ── Security Hub — enable standards ──
aws securityhub enable-security-hub \\
  --enable-default-standards
# Enables CIS AWS Foundations + AWS Foundational Security Best Practices

# Custom insight: failed API calls from root
aws securityhub create-insight \\
  --name RootAccountActivity \\
  --filters '{"ProductName":[{"Value":"CloudTrail","Comparison":"EQUALS"}],
    "ResourceType":[{"Value":"AwsAccount","Comparison":"EQUALS"}]}' \\
  --group-by-attribute ResourceId

# ── CloudTrail — org trail to log-archive account ──
{
  "Name": "org-cloudtrail",
  "S3BucketName": "acme-org-cloudtrail-logs",
  "IsMultiRegionTrail": true,
  "IncludeGlobalServiceEvents": true,
  "EnableLogFileValidation": true,
  "IsOrganizationTrail": true,
  "KMSKeyId": "arn:aws:kms:us-east-1:123456789012:key/trail-key-id"
}

# CloudTrail Lake — SQL query: who deleted prod RDS?
# SELECT eventTime, userIdentity.arn, eventName, requestParameters
# FROM 123456789012_cloudtrail_mgmt
# WHERE eventName = 'DeleteDBInstance'
#   AND eventTime > '2024-06-01T00:00:00Z'

# ── AWS Config — S3 bucket must block public access ──
resource "aws_config_config_rule" "s3_public_read_prohibited" {
  name = "s3-bucket-public-read-prohibited"
  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }
  scope {
    compliance_resource_types = ["AWS::S3::Bucket"]
  }
}

# Non-compliant → SNS → PagerDuty → auto-remediate via SSM Automation

# ── Macie — discover PII in KYC bucket ──
aws macie2 create-classification-job \\
  --job-type ONE_TIME \\
  --name kyc-pii-scan \\
  --s3-job-definition '{
    "bucketDefinitions": [{
      "accountId": "123456789012",
      "buckets": ["arn:aws:s3:::acme-kyc-prod"]
    }]
  }' \\
  --schedule-frequency {}

# Findings: HIGH severity credit card numbers in s3://acme-kyc-prod/legacy/export.csv`,
    verify: `# WAF blocked requests (last hour)
aws wafv2 get-sampled-requests \\
  --web-acl-arn arn:aws:wafv2:us-east-1:123456789012:regional/webacl/payment-api-waf/abc123 \\
  --rule-metric-name RateLimitPayments \\
  --scope REGIONAL \\
  --time-window StartTime=$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ),EndTime=$(date -u +%Y-%m-%dT%H:%M:%SZ) \\
  --max-items 10

# GuardDuty findings
aws guardduty list-findings \\
  --detector-id abc123 \\
  --finding-criteria '{"Criterion":{"severity":{"Gte":7}}}'

# Security Hub compliance score
aws securityhub get-findings \\
  --filters '{"ComplianceStatus":[{"Value":"FAILED","Comparison":"EQUALS"}],
    "RecordState":[{"Value":"ACTIVE","Comparison":"EQUALS"}]}' \\
  --max-items 5

# Config compliance summary
aws configservice describe-compliance-by-config-rule \\
  --query 'ComplianceByConfigRules[?Compliance.ComplianceType!=\`COMPLIANT\`]'`,
    pitfalls:
      'WAF only on CloudFront but not on regional ALB/API GW — attackers bypass via direct ALB DNS. CloudTrail not org-wide or missing data events for S3/KMS. GuardDuty disabled in member accounts. Security Hub findings ignored (alert fatigue without suppression rules). Config enabled but no remediation — compliance theater. Macie not scoped — cost explosion scanning all buckets.',
    production:
      'FinTech baseline: org CloudTrail → KMS-encrypted S3 in log-archive + MFA delete. GuardDuty + Security Hub org-wide with Slack/PagerDuty integration. WAF on CloudFront AND API Gateway with rate limits on /payments. Config rules for encryption, public access, SG open ports; auto-remediate where safe. Macie on KYC/PCI buckets only. Shield Advanced if revenue > DDoS risk threshold.',
    interview30s:
      'WAF = L7 filter (SQLi, rate limit). Shield = DDoS (Standard free, Advanced = DRT). GuardDuty = ML threat detection. Security Hub = aggregated compliance dashboard. CloudTrail = API audit log. Config = resource compliance over time. Macie = S3 PII discovery.',
    interview2m:
      'Walk payment request: CloudFront → WAF (rate limit /payments, SQLi ruleset) → Shield → API GW. Parallel: every API call logged to CloudTrail in log-archive. GuardDuty flags if EC2 role creds used from Tor exit node. Config detects S3 bucket policy change to public → Security Hub FAILED finding → auto-remediate. Macie weekly scan finds unencrypted export.csv with PAN numbers. Tie to PCI: CloudTrail immutability, WAF OWASP Top 10, Config continuous compliance.',
    traps:
      '"Shield Advanced replaces WAF" — Shield is DDoS; WAF is application filter (complementary). "GuardDuty blocks attacks" — it detects; you respond via EventBridge/Lambda. "CloudTrail is real-time SIEM" — near-real-time; use CloudTrail Lake or forward to OpenSearch for search.',
  },
  {
    id: 'kms',
    title: 'AWS KMS — CMK · Envelope Encryption · Key Policies · Rotation',
    badge: 'KMS',
    category: 'Security',
    askLevel: '🔥 SENIOR',
    what:
      'KMS manages Customer Master Keys (CMKs) for encryption at rest and signing. Envelope encryption: CMK encrypts a data key; data key encrypts payload (S3, RDS, EBS). Key policy is the primary access control on CMK (like resource policy). Automatic annual rotation for AWS-managed and customer-managed symmetric keys. Grants and IAM policies also control access.',
    mermaid: `flowchart LR
  App[Payment Service]
  KMS[KMS CMK<br/>alias/acme-payment-key]
  DK[Data Key<br/>plaintext + encrypted]
  S3[(S3 Encrypted Object)]

  App -->|GenerateDataKey| KMS
  KMS -->|encrypted data key| App
  KMS -->|plaintext data key| App
  App -->|AES-256 encrypt payload| S3
  App -->|store encrypted data key with object| S3`,
    code: `# ═══════════════════════════════════════════════════════════════
# KMS CMK types — FinTech decision matrix
# ═══════════════════════════════════════════════════════════════
# AWS managed (aws/s3, aws/rds)  — AWS owns key, free, no key policy edit
# Customer managed (CMK)         — you own key policy, rotation, audit, cross-account
# AWS owned                      — shared across accounts, least visibility

# Create customer-managed CMK for payment data
aws kms create-key \\
  --description "Acme payment platform — PCI scope" \\
  --key-usage ENCRYPT_DECRYPT \\
  --origin AWS_KMS \\
  --multi-region false \\
  --tags TagKey=CostCenter,TagValue=payments

aws kms create-alias \\
  --alias-name alias/acme-payment-key \\
  --target-key-id \${KEY_ID}

# ── Key policy (PRIMARY access control — even root needs explicit Allow) ──
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnableRootAdmin",
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::123456789012:root"},
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "AllowPaymentServiceRole",
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::123456789012:role/payment-api-ec2-role"},
      "Action": [
        "kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey",
        "kms:DescribeKey", "kms:CreateGrant"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {"kms:ViaService": "s3.us-east-1.amazonaws.com"}
      }
    },
    {
      "Sid": "AllowAuditReadOnly",
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::999888777666:role/audit-readonly"},
      "Action": ["kms:DescribeKey", "kms:GetKeyPolicy", "kms:ListGrants"],
      "Resource": "*"
    },
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "kms:*",
      "Resource": "*",
      "Condition": {"Bool": {"aws:SecureTransport": "false"}}
    }
  ]
}

aws kms put-key-policy \\
  --key-id alias/acme-payment-key \\
  --policy-name default \\
  --policy file://key-policy.json

# ── Automatic key rotation (customer-managed symmetric CMK) ──
aws kms enable-key-rotation --key-id alias/acme-payment-key
# Rotates backing material annually; same CMK ID/ARN — apps unchanged
# Previous key versions still decrypt old ciphertext

# ── Envelope encryption flow ──
# 1) App calls kms:GenerateDataKey → plaintext DEK + encrypted DEK
# 2) App encrypts payload with plaintext DEK (AES-256-GCM locally)
# 3) App stores ciphertext + encrypted DEK (discard plaintext DEK from memory)
# 4) Decrypt: kms:Decrypt(encrypted DEK) → plaintext DEK → decrypt payload

# CLI envelope encrypt (small payload demo)
PLAINTEXT=$(echo -n "payment-ref-98765" | base64)
aws kms encrypt \\
  --key-id alias/acme-payment-key \\
  --plaintext fileb://<(echo -n "payment-ref-98765") \\
  --encryption-context tenantId=tenant-42,env=prod \\
  --output text --query CiphertextBlob | base64 -d > encrypted.bin

aws kms decrypt \\
  --ciphertext-blob fileb://encrypted.bin \\
  --encryption-context tenantId=tenant-42,env=prod \\
  --query Plaintext --output text | base64 -d

# ── S3 SSE-KMS with bucket key (cost optimization) ──
# Bucket key: S3 uses KMS less frequently → ~99% KMS API cost reduction
aws s3api put-bucket-encryption \\
  --bucket acme-payment-docs-prod \\
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "alias/acme-payment-key"
      },
      "BucketKeyEnabled": true
    }]
  }'

# ── Java SDK v2 — envelope encryption for large statement file ──
KmsClient kms = KmsClient.create();
GenerateDataKeyResponse dataKey = kms.generateDataKey(GenerateDataKeyRequest.builder()
    .keyId("alias/acme-payment-key")
    .keySpec(DataKeySpec.AES_256)
    .encryptionContext(Map.of("tenantId", tenantId, "purpose", "monthly-statement"))
    .build());

SecretKey aesKey = SecretKeySpec(dataKey.plaintext().asByteArray(), "AES");
Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
cipher.init(Cipher.ENCRYPT_MODE, aesKey);
byte[] ciphertext = cipher.doFinal(statementBytes);

// Store: ciphertext + dataKey.ciphertextBlob() in S3 metadata
// NEVER persist dataKey.plaintext() — zero from memory after use

# ── Cross-account KMS (DR / vendor) ──
# Key policy in account A grants account B role kms:Decrypt
# Account B role identity policy also needs kms:Decrypt on key ARN
# Both must allow (like S3 cross-account)`,
    verify: `# Key rotation status
aws kms get-key-rotation-status --key-id alias/acme-payment-key

# Who can use this key? (policy + IAM simulation)
aws kms get-key-policy --key-id alias/acme-payment-key --policy-name default

aws iam simulate-principal-policy \\
  --policy-source-arn arn:aws:iam::123456789012:role/payment-api-ec2-role \\
  --action-names kms:Decrypt kms:GenerateDataKey \\
  --resource-arns arn:aws:kms:us-east-1:123456789012:key/abcd-1234

# CloudTrail KMS events (audit every Decrypt)
aws cloudtrail lookup-events \\
  --lookup-attributes AttributeKey=EventName,AttributeValue=Decrypt \\
  --max-items 5 \\
  --query 'Events[*].{Time:EventTime,User:Username,Key:CloudTrailEvent}'`,
    pitfalls:
      'Key policy missing → only root can use CMK (default deny for everyone else). IAM policy alone insufficient without key policy Allow. Forgetting encryption context on Decrypt → AuthorizationError. No rotation on customer CMK — compliance gap. SSE-KMS without bucket key → KMS API cost at scale. Scheduling CMK deletion (7–30 day window) without understanding all encrypted data becomes unreadable.',
    production:
      'Separate CMKs per data class: acme-kyc-key, acme-payment-key, acme-audit-key. Enable rotation + CloudTrail data events on Decrypt for PCI keys. S3 bucket key enabled. Encryption context (tenantId, env) for audit trail. Cross-account DR: multi-Region key replica in eu-west-1. Break-glass: second key policy statement with MFA condition for emergency admin.',
    interview30s:
      'CMK wraps data keys (envelope encryption). Key policy is primary ACL on CMK. Auto-rotation rotates backing key material annually, same key ID. SSE-KMS for audit trail; bucket key cuts KMS API costs. Encryption context adds authenticated metadata to ciphertext.',
    interview2m:
      'Draw envelope: GenerateDataKey → encrypt 10 GB statement locally with DEK → store encrypted DEK alongside object → discard plaintext DEK. Explain key policy vs IAM: both must allow for CMK access. Walk S3 SSE-KMS with bucket key for receipt storage. Mention rotation: old ciphertext still decrypts with previous key versions. FinTech: separate CMK per tenant tier for blast-radius isolation; CloudTrail logs every kms:Decrypt for auditor.',
    traps:
      '"IAM Administrator can always decrypt" — key policy must explicitly allow (unless key policy grants admin). "Deleting CMK is instant" — 7–30 day pending window, then all data encrypted with it is lost. "Envelope encryption sends plaintext to KMS" — only the small data key goes to KMS; bulk data encrypted locally.',
  },
  {
    id: 'secrets-manager',
    title: 'Secrets Manager — Rotation · Spring Boot Integration',
    badge: 'Secrets',
    category: 'Security',
    what:
      'Secrets Manager stores and rotates secrets (DB passwords, API keys, JWT signing keys). Automatic rotation via Lambda for RDS, Redshift, DocumentDB. Spring Boot 2.4+ loads secrets via `spring.config.import=aws-secretsmanager:`. Prefer over Parameter Store when rotation and cross-account sharing matter.',
    mermaid: `flowchart LR
  SM[Secrets Manager<br/>prod/payment-db]
  Lambda[Rotation Lambda]
  RDS[(RDS PostgreSQL)]
  ECS[ECS Spring Boot Task]
  SM -->|auto rotate 30d| Lambda
  Lambda -->|ModifyDBPassword| RDS
  ECS -->|GetSecretValue| SM
  ECS -->|JDBC connect| RDS`,
    code: `# ═══════════════════════════════════════════════════════════════
# Create secret — RDS payment database credentials
# ═══════════════════════════════════════════════════════════════
aws secretsmanager create-secret \\
  --name prod/payment-db \\
  --description "Payment API PostgreSQL credentials" \\
  --secret-string '{
    "username": "payment_app",
    "password": "GENERATE_STRONG_PASSWORD_HERE",
    "engine": "postgres",
    "host": "payment-db.cluster-abc123.us-east-1.rds.amazonaws.com",
    "port": 5432,
    "dbname": "payments",
    "dbInstanceIdentifier": "payment-db"
  }' \\
  --kms-key-id alias/acme-payment-key \\
  --tags Key=Env,Value=prod Key=App,Value=payment-api

# ── Enable automatic rotation (30 days) ──
aws secretsmanager rotate-secret \\
  --secret-id prod/payment-db \\
  --rotation-lambda-arn arn:aws:lambda:us-east-1:123456789012:function:SecretsManagerRDSRotation \\
  --rotation-rules AutomaticallyAfterDays=30

# Rotation Lambda steps (AWS-managed template):
# 1) createSecret  — generate new password, store as AWSPENDING
# 2) setSecret     — apply new password to RDS
# 3) testSecret    — verify connection with pending creds
# 4) finishSecret  — promote AWSPENDING → AWSCURRENT

# ── IAM — ECS task execution role (pull secret at startup) ──
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue"],
    "Resource": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/payment-*"
  }, {
    "Effect": "Allow",
    "Action": ["kms:Decrypt"],
    "Resource": "arn:aws:kms:us-east-1:123456789012:key/abcd-1234"
  }]
}

# ═══════════════════════════════════════════════════════════════
# Spring Boot — spring.config.import aws-secretsmanager
# ═══════════════════════════════════════════════════════════════
# pom.xml / build.gradle
# implementation 'io.awspring.cloud:spring-cloud-aws-starter-secrets-manager:3.1.1'

# application.yml (NO secrets here — only import path)
spring:
  application:
    name: payment-api
  config:
    import: aws-secretsmanager:prod/payment-db
  datasource:
    url: jdbc:postgresql://\${host}:\${port}/\${dbname}?sslmode=require
    username: \${username}
    password: \${password}
    hikari:
      maximum-pool-size: 20
      connection-timeout: 5000

# Multiple secrets (JSON keys merged into Environment)
spring:
  config:
    import:
      - aws-secretsmanager:prod/payment-db
      - aws-secretsmanager:prod/jwt-signing-key
      - optional:aws-secretsmanager:prod/feature-flags

# JWT signing key secret JSON: {"signingKey": "base64..."}
# Access in code: @Value("\${signingKey}") or @ConfigurationProperties

# ── ECS task definition — secrets injection (alternative to Spring import) ──
{
  "containerDefinitions": [{
    "name": "payment-api",
    "secrets": [
      {
        "name": "SPRING_DATASOURCE_PASSWORD",
        "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/payment-db-AbCdEf:password::"
      },
      {
        "name": "JWT_SIGNING_KEY",
        "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/jwt-key-XyZ:signingKey::"
      }
    ],
    "environment": [
      {"name": "SPRING_CONFIG_IMPORT", "value": "aws-secretsmanager:prod/payment-db"}
    ]
  }]
}

# ── Local dev — profile without AWS (never commit secrets) ──
# application-local.yml + spring.profiles.active=local
# Or: spring.config.import=optional:aws-secretsmanager:local/payment-db

# ── Cross-account secret access (vendor integration) ──
# Resource policy on secret + kms:Decrypt in vendor account role
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::555444333222:role/vendor-webhook-reader"},
    "Action": "secretsmanager:GetSecretValue",
    "Resource": "*",
    "Condition": {
      "StringEquals": {"secretsmanager:ResourceTag/vendor": "stripe-webhook"}
    }
  }]
}`,
    verify: `# Secret metadata + rotation status
aws secretsmanager describe-secret \\
  --secret-id prod/payment-db \\
  --query '{Name:Name,Rotation:RotationEnabled,LastRotated:LastRotatedDate,NextRotation:NextRotationDate}'

# Force rotation (test pipeline)
aws secretsmanager rotate-secret --secret-id prod/payment-db

# Spring Boot startup log should show:
# "Located property source: [SecretsManagerPropertySource@... name='prod/payment-db']"

# ECS task — confirm secret injected (not in task definition plaintext)
aws ecs describe-task-definition --task-definition payment-api \\
  --query 'taskDefinition.containerDefinitions[0].secrets'`,
    pitfalls:
      'Secrets in application.yml committed to git. Spring import without kms:Decrypt on execution role. Rotation enabled but app caches password forever — need HikariCP refresh or restart on rotation event. Using same secret for dev and prod. Missing `optional:` prefix — local boot fails without AWS creds. ECS secrets vs spring.config.import double-fetch confusion.',
    production:
      'One secret per service/environment. 30-day rotation with RDS integration. Spring `spring.config.import=aws-secretsmanager:` + ECS task role (no execution role over-permission). KMS CMK per secret class. EventBridge on rotation failure → PagerDuty. Never log datasource password; mask in actuator/env endpoint. CI uses OIDC role, not stored secrets.',
    interview30s:
      'Secrets Manager stores and auto-rotates secrets via Lambda. Spring Boot loads with `spring.config.import=aws-secretsmanager:secret-name`. ECS can inject as env vars via task definition `secrets` block. Requires GetSecretValue + kms:Decrypt on task/execution role.',
    interview2m:
      'Walk RDS rotation: Lambda creates AWSPENDING password → updates RDS → tests → promotes to AWSCURRENT. Spring Boot reads JSON keys (username, password, host) into Environment at startup. For zero-downtime rotation, use HikariCP maxLifetime < rotation interval or listen to rotation EventBridge and refresh pool. Compare Secrets Manager vs SSM Parameter Store: SM has rotation + cross-account resource policy; SSM SecureString is cheaper for static config.',
    traps:
      '"Rotation is instant for running apps" — apps must handle password change or restart. "spring.config.import replaces application.yml" — it merges; import path still needed. "Secrets Manager is free" — per-secret monthly cost + API calls.',
  },
  {
    id: 'api-gateway',
    title: 'API Gateway — REST vs HTTP · Auth · Throttling · Usage Plans · WAF',
    badge: 'API GW',
    category: 'Security',
    askLevel: '🔥 SENIOR',
    what:
      'API Gateway fronts microservices with auth, throttling, and monitoring. REST API (v1) is feature-rich (API keys, usage plans, request validation, WAF). HTTP API (v2) is cheaper and lower latency but fewer features. Auth options: IAM, Cognito, Lambda authorizer, JWT. Usage plans + API keys throttle partner access. WAF attaches to stage for OWASP protection.',
    mermaid: `flowchart LR
  Partner[FinTech Partner]
  WAF[AWS WAF]
  APIGW[API Gateway REST]
  Auth[Lambda Authorizer<br/>JWT + mTLS]
  Lambda[Payment Lambda]
  ECS[ECS Spring Boot]

  Partner -->|x-api-key + JWT| WAF
  WAF --> APIGW
  APIGW --> Auth
  Auth -->|Allow tenant-42| Lambda
  APIGW -->|/legacy/*| ECS`,
    code: `# ═══════════════════════════════════════════════════════════════
# REST API vs HTTP API — FinTech partner integration
# ═══════════════════════════════════════════════════════════════
# REST API (v1)  — API keys, usage plans, request validation, WAF, caching
#                 — $3.50/million + higher latency; use for external partners
# HTTP API (v2)  — JWT authorizer, lower cost ($1/million), lower latency
#                 — use for internal/mobile when no usage plans needed

# ── REST API — create + deploy ──
aws apigateway create-rest-api \\
  --name acme-payment-partner-api \\
  --endpoint-configuration types=REGIONAL \\
  --minimum-compression-size 1024

# Resource: POST /v1/payments
aws apigateway put-method \\
  --rest-api-id abc123 \\
  --resource-id def456 \\
  --http-method POST \\
  --authorization-type CUSTOM \\
  --authorizer-id auth789 \\
  --api-key-required true

# Request validation (block malformed payment payloads at edge)
aws apigateway put-method \\
  --rest-api-id abc123 \\
  --resource-id def456 \\
  --http-method POST \\
  --request-validator-id validator-body-only \\
  --request-models '{"application/json": "PaymentRequest"}'

# ── Lambda authorizer — JWT + tenant claim ──
# authorizer.py
import json, jwt, os

def handler(event, context):
    token = event['authorizationToken'].replace('Bearer ', '')
    try:
        claims = jwt.decode(token, os.environ['JWT_PUBLIC_KEY'], algorithms=['RS256'],
                            audience='acme-payment-api')
        tenant_id = claims['tenant_id']
        # Return IAM policy scoped to tenant path
        return {
            'principalId': tenant_id,
            'policyDocument': {
                'Version': '2012-10-17',
                'Statement': [{
                    'Action': 'execute-api:Invoke',
                    'Effect': 'Allow',
                    'Resource': event['methodArn'].replace('/POST/', f'/POST/{tenant_id}/')
                }]
            },
            'context': {'tenantId': tenant_id, 'scope': claims.get('scope', '')}
        }
    except jwt.InvalidTokenError:
        raise Exception('Unauthorized')

# ── Throttling — account, stage, and method levels ──
# Account limit: 10,000 RPS (soft, request increase)
# Stage/default: burst 5000, rate 2000/sec
aws apigateway update-stage \\
  --rest-api-id abc123 \\
  --stage-name prod \\
  --patch-operations \\
    op=replace,path=/\*/\*/throttling/burstLimit,value=5000 \\
    op=replace,path=/\*/\*/throttling/rateLimit,value=2000

# Method-level override — expensive /reports endpoint
aws apigateway update-stage \\
  --rest-api-id abc123 \\
  --stage-name prod \\
  --patch-operations \\
    op=replace,path=/~1v1~1reports/GET/throttling/rateLimit,value=10

# ── Usage plan + API key (partner tier billing) ──
aws apigateway create-usage-plan \\
  --name partner-gold \\
  --description "Gold tier: 1000 req/sec, 10M/month" \\
  --throttle burstLimit=2000,rateLimit=1000 \\
  --quota limit=10000000,period=MONTH \\
  --api-stages apiId=abc123,stage=prod

aws apigateway create-api-key \\
  --name partner-acme-corp \\
  --enabled \\
  --stage-keys restApiId=abc123,stageName=prod

aws apigateway create-usage-plan-key \\
  --usage-plan-id plan-gold \\
  --key-id key-acme-corp \\
  --key-type API_KEY

# Partner request headers:
# x-api-key: <api-key>
# Authorization: Bearer <jwt>

# ── HTTP API — internal mobile (JWT, lower cost) ──
aws apigatewayv2 create-api \\
  --name payment-mobile-http \\
  --protocol-type HTTP \\
  --target arn:aws:lambda:us-east-1:123456789012:function:payment-handler

aws apigatewayv2 create-authorizer \\
  --api-id xyz789 \\
  --authorizer-type JWT \\
  --identity-source '\$request.header.Authorization' \\
  --jwt-configuration Audience=mobile-app,Issuer=https://auth.acme.com

# ── WAF integration on REST API stage ──
aws wafv2 associate-web-acl \\
  --web-acl-arn arn:aws:wafv2:us-east-1:123456789012:regional/webacl/payment-api-waf/abc \\
  --resource-arn arn:aws:apigateway:us-east-1::/restapis/abc123/stages/prod

# WAF rules: rate limit per IP, AWSManagedRulesCommonRuleSet, geo-block

# ── Integration with ECS (private VPC Link) ──
# NLB in private subnet → VPC Link → API GW integration (no public ALB)
aws apigateway create-vpc-link \\
  --name payment-vpc-link \\
  --target-arns arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/net/payment-nlb/abc123

# CloudWatch metrics: 4XXError, 5XXError, Count, Latency, CacheHitCount
# X-Ray tracing enabled on stage for payment latency debugging`,
    verify: `# Test partner call with API key + JWT
curl -s -X POST https://abc123.execute-api.us-east-1.amazonaws.com/prod/v1/payments \\
  -H "x-api-key: \${PARTNER_API_KEY}" \\
  -H "Authorization: Bearer \${JWT_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 100.00, "currency": "USD", "tenantId": "tenant-42"}'

# Throttle test — expect 429 Too Many Requests
for i in $(seq 1 3000); do
  curl -s -o /dev/null -w "%{http_code}\\n" \\
    -H "x-api-key: \${PARTNER_API_KEY}" \\
    https://abc123.execute-api.us-east-1.amazonaws.com/prod/v1/health &
done | sort | uniq -c

# Usage plan quota remaining
aws apigateway get-usage \\
  --usage-plan-id plan-gold \\
  --start-date 2024-06-01 \\
  --end-date 2024-06-30 \\
  --query 'items.*[0].[0]'`,
    pitfalls:
      'HTTP API when you need usage plans/API keys — not supported. No WAF on API GW without REST API or CloudFront in front. Lambda authorizer caching with tenant-specific policy — stale permissions. 29-second API GW timeout vs long payment batch. Missing `api-key-required` on partner endpoints. Throttling only at stage level while one noisy partner affects all — use usage plans per key.',
    production:
      'REST API for external partners: API key + JWT authorizer + usage plan per tier + WAF rate limit. HTTP API for internal/mobile with Cognito/JWT. VPC Link to private NLB (no public ALB). Enable access logging to S3 (PII redaction), X-Ray, CloudWatch alarms on 5XX and Latency p99. Request validation blocks malformed payloads before Lambda/ECS.',
    interview30s:
      'REST API = full features (API keys, usage plans, WAF, validation). HTTP API = cheaper, faster, JWT auth. Throttling at account/stage/method/usage-plan levels. Lambda or JWT authorizer for auth. WAF attaches to stage for L7 protection.',
    interview2m:
      'Partner flow: x-api-key identifies usage plan (Gold = 1000 RPS, 10M/month quota) → Lambda authorizer validates JWT tenant claim → WAF blocks SQLi → Lambda processes payment. Compare REST vs HTTP: REST for partners needing API keys and WAF; HTTP for mobile app with Cognito JWT at 1/3 cost. Explain 429 vs 403: 429 = throttled, 403 = auth/WAF deny. VPC Link pattern keeps ECS private — API GW is only public entry.',
    traps:
      '"API Gateway handles auth for ECS" — authorizer returns policy; backend must still validate business logic. "Usage plan replaces WAF rate limit" — usage plan is per API key; WAF is per IP/headers (layer both). "HTTP API supports caching" — REST only for caching.',
  },
];
