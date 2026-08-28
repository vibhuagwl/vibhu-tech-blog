import type {AwsTopic} from './types';

export const TOPICS_FUNDAMENTALS: AwsTopic[] = [
  {
    id: 'aws-fundamentals',
    title: 'AWS Global Infrastructure · Account · Org · CLI · SDK · IaC',
    badge: 'Fundamentals',
    category: 'Fundamentals',
    what:
      'AWS global infrastructure spans Regions (geographic), Availability Zones (isolated data centers within a Region), Local Zones, and edge locations (CloudFront, Route 53). An AWS account is the billing and security boundary. Organizations consolidate billing and apply SCPs across member accounts. CLI and SDK are programmatic interfaces; CloudFormation and CDK express infrastructure as code.',
    mermaid: `flowchart TB
  subgraph Global [Global Services]
    IAM[IAM]
    R53[Route 53]
    CF[CloudFront]
    Org[Organizations]
  end

  subgraph Region [Region us-east-1]
    subgraph AZa [AZ us-east-1a]
      EC2A[EC2 Payment API]
      RDSA[(RDS Primary)]
    end
    subgraph AZb [AZ us-east-1b]
      EC2B[EC2 Payment API]
      RDSB[(RDS Standby)]
    end
  end

  subgraph Edge [Edge Locations]
    POP[CloudFront POP]
  end

  Client[Mobile / Web Client] --> POP
  POP --> CF
  CF --> EC2A
  EC2A --> RDSA
  RDSA -.->|sync replication| RDSB
  Org -->|SCP + billing| Region
  IAM --> EC2A`,
    code: `# ═══════════════════════════════════════════════════════════════
# Region / AZ / Edge — FinTech placement decisions
# ═══════════════════════════════════════════════════════════════
# Region     — choose for data residency (PCI, GDPR, RBI), latency to users
# AZ         — min 2 for HA (RDS Multi-AZ, ASG across AZs)
# Edge (POP) — CloudFront caches static assets; WAF at edge for DDoS
# Local Zone — ultra-low latency for trading UI (optional)

# FinTech example: payment platform in us-east-1 (primary) + eu-west-1 (DR)
# AZ-a: ALB + ECS tasks + RDS primary
# AZ-b: ECS tasks + RDS standby (automatic failover ~60s)

# ═══════════════════════════════════════════════════════════════
# AWS CLI — profile, region, MFA session
# ═══════════════════════════════════════════════════════════════
export AWS_PROFILE=fintech-prod
export AWS_REGION=us-east-1
export AWS_DEFAULT_OUTPUT=json

# Verify identity (which account/role am I?)
aws sts get-caller-identity
# {"Account": "123456789012", "Arn": "arn:aws:iam::123456789012:role/PaymentOps"}

# MFA-protected session for prod changes
aws sts get-session-token \\
  --serial-number arn:aws:iam::123456789012:mfa/vibhu.payment-ops \\
  --token-code 847291 \\
  --duration-seconds 3600

# List AZs in region (plan subnet layout)
aws ec2 describe-availability-zones \\
  --region us-east-1 \\
  --query 'AvailabilityZones[*].{Name:ZoneName,Id:ZoneId,State:State}'

# ═══════════════════════════════════════════════════════════════
# AWS SDK v2 (Java) — S3 presigned URL for KYC upload
# ═══════════════════════════════════════════════════════════════
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

Region region = Region.US_EAST_1;
S3Presigner presigner = S3Presigner.builder().region(region).build();

PutObjectRequest putReq = PutObjectRequest.builder()
    .bucket("acme-kyc-prod")
    .key("tenant/" + tenantId + "/passport-" + docId + ".pdf")
    .contentType("application/pdf")
    .serverSideEncryption("aws:kms")
    .ssekmsKeyId("alias/acme-kyc-key")
    .build();

PresignedPutObjectRequest signed = presigner.presignPutObject(
    PutObjectPresignRequest.builder()
        .signatureDuration(Duration.ofMinutes(15))
        .putObjectRequest(putReq)
        .build());

// Return signed.url() to mobile app — no long-lived creds in client

# ═══════════════════════════════════════════════════════════════
# AWS Organizations — multi-account FinTech landing zone
# ═══════════════════════════════════════════════════════════════
# Root (management account)
# ├── Security OU
# │   ├── Log Archive (CloudTrail, Config aggregator)
# │   └── Audit (read-only cross-account)
# ├── Workloads OU
# │   ├── prod-payments (123456789012)
# │   ├── prod-ledger   (234567890123)
# │   └── nonprod       (345678901234)
# └── Sandbox OU

# Service Control Policy — deny root user, restrict regions
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyRootUser",
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {"StringLike": {"aws:PrincipalArn": "arn:aws:iam::*:root"}}
    },
    {
      "Sid": "AllowOnlyApprovedRegions",
      "Effect": "Deny",
      "NotAction": [
        "iam:*", "organizations:*", "route53:*", "cloudfront:*",
        "support:*", "budgets:*", "ce:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {"aws:RequestedRegion": ["us-east-1", "eu-west-1"]}
      }
    }
  ]
}

aws organizations create-policy \\
  --name DenyUnapprovedRegions \\
  --type SERVICE_CONTROL_POLICY \\
  --content file://scp-regions.json

# ═══════════════════════════════════════════════════════════════
# CloudFormation — payment VPC stack (declarative)
# ═══════════════════════════════════════════════════════════════
# template.yaml excerpt
Resources:
  PaymentVpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.20.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '\${AWS::StackName}-vpc'
        - Key: CostCenter
          Value: payments

  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref PaymentVpc
      CidrBlock: 10.20.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']

aws cloudformation deploy \\
  --template-file template.yaml \\
  --stack-name payment-vpc-prod \\
  --parameter-overrides Environment=prod \\
  --capabilities CAPABILITY_NAMED_IAM \\
  --tags CostCenter=payments Team=platform

# Drift detection — did someone change SG rules manually?
aws cloudformation detect-stack-drift --stack-name payment-vpc-prod
aws cloudformation describe-stack-resource-drifts \\
  --stack-name payment-vpc-prod \\
  --stack-resource-drift-status-filters MODIFIED DELETED

# ═══════════════════════════════════════════════════════════════
# AWS CDK (TypeScript) — same VPC, higher-level constructs
# ═══════════════════════════════════════════════════════════════
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class PaymentVpcStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'PaymentVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.20.0.0/16'),
      maxAzs: 2,
      natGateways: 2,           // one per AZ — FinTech HA
      subnetConfiguration: [
        { name: 'Public',  subnetType: ec2.SubnetType.PUBLIC,  cidrMask: 24 },
        { name: 'Private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: 'Isolated', subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    cdk.Tags.of(vpc).add('CostCenter', 'payments');
  }
}

# CDK deploy pipeline
cdk synth PaymentVpcStack > cloudformation.out.yaml   # review before apply
cdk deploy PaymentVpcStack --require-approval never   # CI/CD only

# CloudFormation vs CDK interview framing:
# CFN/YAML — explicit, audit-friendly, vendor-neutral artifacts in git
# CDK       — reuse (L3 constructs), unit tests in TS/Java, synths to CFN`,
    verify: `# Confirm region + account context
aws configure list
aws sts get-caller-identity

# List org accounts (management account only)
aws organizations list-accounts \\
  --query 'Accounts[?Status==\`ACTIVE\`].{Name:Name,Id:Id,Email:Email}'

# CloudFormation stack status
aws cloudformation describe-stacks \\
  --stack-name payment-vpc-prod \\
  --query 'Stacks[0].{Status:StackStatus,Drift:DriftInformation.StackDriftStatus}'`,
    pitfalls:
      'Single-AZ RDS/EC2 for "cost savings" — AZ outage = payment outage. Picking wrong Region for compliance (data must stay in EU). Hardcoding access keys in SDK instead of instance/task role. Manual console changes causing CloudFormation drift. Using root account for daily ops. Confusing global services (IAM, CloudFront) with regional ones (EC2, RDS).',
    production:
      'FinTech landing zone: Organizations with SCPs, separate prod/nonprod accounts, CloudTrail centralized in log-archive. Deploy VPC/networking via CDK or CFN with drift detection in CI. SDK/CLI use IAM roles + SSO — never long-lived keys in Spring Boot. Multi-AZ minimum for payment path; DR Region for RPO/RTO SLA.',
    interview30s:
      'Region = geographic; AZ = isolated DCs within Region (min 2 for HA). Edge = CloudFront POPs. Account = billing/security boundary; Organizations + SCPs govern many accounts. CLI/SDK for automation; CloudFormation/CDK for IaC with drift detection.',
    interview2m:
      'Walk FinTech placement: us-east-1 with 2 AZs — ECS in private subnets, RDS Multi-AZ, CloudFront at edge for mobile API static assets. Organizations: prod-payments account isolated from sandbox via SCP (deny unapproved regions, deny root). Show CLI `sts get-caller-identity` and MFA session for break-glass. Compare CFN (YAML in git, explicit) vs CDK (constructs, tests, synths to CFN). Mention global vs regional: IAM is global; S3 bucket lives in a region.',
    traps:
      '"CloudFront is a Region" — it uses edge locations globally. "More AZs always better" — cross-AZ data transfer costs add up; 2–3 AZs is typical. "CDK replaces CloudFormation" — CDK synthesizes CloudFormation templates.',
  },
  {
    id: 'iam',
    title: 'IAM — Users · Groups · Roles · Policies · STS AssumeRole',
    badge: 'IAM',
    category: 'Fundamentals',
    askLevel: '⭐ MOST ASKED',
    what:
      'IAM controls who (identity) can do what (action) on which resource. Users = long-lived humans (prefer SSO). Groups = permission collections for users. Roles = temporary credentials via STS — used by EC2, Lambda, cross-account. Policies = JSON allow/deny. Trust policy on role defines who can assume it. Identity policy attaches to user/role/group; resource policy attaches to S3/SQS/KMS. Permission boundary caps maximum permissions a role can receive.',
    mermaid: `flowchart LR
  EC2[EC2 Payment Service]
  Role[IAM Role<br/>payment-api-ec2-role]
  STS[AWS STS]
  Creds[Temp Creds<br/>AccessKey + Secret + Token]
  S3[(S3 KYC Bucket)]

  EC2 -->|instance metadata| Role
  Role -->|AssumeRole| STS
  STS -->|15min session| Creds
  Creds -->|s3:PutObject SSE-KMS| S3`,
    code: `# ═══════════════════════════════════════════════════════════════
# IAM building blocks — FinTech payment platform
# ═══════════════════════════════════════════════════════════════
# User    — human (prefer IAM Identity Center / SSO, not IAM users)
# Group   — DevelopersReadOnly, PaymentOpsAdmin
# Role    — EC2/Lambda/ECS task/cross-account (NO long-lived keys)
# Policy  — JSON document: Effect, Action, Resource, Condition

# ── Trust policy (WHO can assume the role) ──
# payment-api-ec2-role — only EC2 service can assume
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}

# cross-account audit role — prod account trusts audit account
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::999888777666:root"},
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": {"sts:ExternalId": "acme-audit-2024"},
      "Bool": {"aws:MultiFactorAuthPresent": "true"}
    }
  }]
}

# ── Identity policy (WHAT the role can do) ──
# Least privilege for payment-api EC2 role
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "KycUploadOnly",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::acme-kyc-prod/tenant/*",
      "Condition": {
        "StringEquals": {"s3:x-amz-server-side-encryption": "aws:kms"},
        "StringLike": {"s3:x-amz-server-side-encryption-aws-kms-key-id": "arn:aws:kms:us-east-1:123456789012:key/*"}
      }
    },
    {
      "Sid": "DecryptKycKey",
      "Effect": "Allow",
      "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
      "Resource": "arn:aws:kms:us-east-1:123456789012:key/abcd-1234-5678"
    },
    {
      "Sid": "ReadDbSecret",
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/payment-db-*"
    }
  ]
}

# ── Resource policy (on S3 bucket — WHO can access THIS bucket) ──
# Cross-account KYC vendor read-only
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "VendorReadKyc",
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::555444333222:role/kyc-vendor-reader"},
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::acme-kyc-prod/vendor-review/*",
    "Condition": {
      "IpAddress": {"aws:SourceIp": ["203.0.113.0/24"]}
    }
  }]
}

# Identity vs Resource policy — interview answer:
# • Identity policy: attached to IAM principal (user/role/group)
# • Resource policy: attached to resource (S3, SQS, KMS, Lambda)
# • S3: either can grant access; BOTH must allow (implicit deny)
# • Cross-account S3: need identity policy on caller AND resource policy on bucket

# ── Permission boundary (MAX permissions cap) ──
# Developer role can never exceed this — even if admin attaches AdminAccess
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:*", "dynamodb:*", "sqs:*", "sns:*",
      "logs:*", "cloudwatch:*", "ecs:*", "ecr:*"
    ],
    "Resource": "*"
  }, {
    "Effect": "Deny",
    "Action": ["iam:*", "organizations:*", "account:*"],
    "Resource": "*"
  }]
}

aws iam put-role-permissions-boundary \\
  --role-name payment-dev-role \\
  --permissions-boundary arn:aws:iam::123456789012:policy/DeveloperBoundary

# ═══════════════════════════════════════════════════════════════
# STS AssumeRole — EC2 instance profile flow (NO keys on disk)
# ═══════════════════════════════════════════════════════════════
# 1) Launch EC2 with instance profile = payment-api-ec2-role
# 2) SDK calls IMDS for temp creds (auto-rotated)
# 3) Cred chain: env vars → profile → IMDS → SSO

# CLI cross-account assume (audit team)
aws sts assume-role \\
  --role-arn arn:aws:iam::123456789012:role/CrossAccountAuditReadOnly \\
  --role-session-name audit-session-vibhu \\
  --external-id acme-audit-2024 \\
  --duration-seconds 3600 \\
  --query 'Credentials.{AccessKey:AccessKeyId,Secret:SecretAccessKey,Token:SessionToken}'

export AWS_ACCESS_KEY_ID=<AccessKey>
export AWS_SECRET_ACCESS_KEY=<Secret>
export AWS_SESSION_TOKEN=<Token>

# Java SDK v2 — default credential chain on EC2
S3Client s3 = S3Client.builder()
    .region(Region.US_EAST_1)
    .credentialsProvider(DefaultCredentialsProvider.create())
    .build();

s3.putObject(PutObjectRequest.builder()
    .bucket("acme-kyc-prod")
    .key("tenant/" + tenantId + "/receipt-" + paymentId + ".pdf")
    .serverSideEncryption(ServerSideEncryption.AWS_KMS)
    .ssekmsKeyId("alias/acme-kyc-key")
    .build(),
    RequestBody.fromBytes(receiptPdf));

# IMDSv2 — required for FinTech (SSRF protection)
# Launch template: MetadataOptions.HttpTokens=required

# ═══════════════════════════════════════════════════════════════
# IAM policy evaluation order (interview diagram)
# ═══════════════════════════════════════════════════════════════
# 1) Explicit DENY anywhere → DENY (always wins)
# 2) Organization SCP → must allow
# 3) Permission boundary → must allow
# 4) Session policy (AssumeRole) → must allow
# 5) Identity policy + Resource policy → at least one must allow
# 6) Default → implicit DENY`,
    verify: `# Who am I?
aws sts get-caller-identity

# Simulate policy before deploy (no actual API call)
aws iam simulate-principal-policy \\
  --policy-source-arn arn:aws:iam::123456789012:role/payment-api-ec2-role \\
  --action-names s3:PutObject kms:Decrypt \\
  --resource-arns arn:aws:s3:::acme-kyc-prod/tenant/test/doc.pdf \\
  --query 'EvaluationResults[*].{Action:EvalActionName,Decision:EvalDecision}'

# EC2 instance — confirm role via IMDSv2
TOKEN=$(curl -sX PUT "http://169.254.169.254/latest/api/token" \\
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
curl -sH "X-aws-ec2-metadata-token: \${TOKEN}" \\
  http://169.254.169.254/latest/meta-data/iam/security-credentials/payment-api-ec2-role \\
  | jq '{AccessKeyId, Expiration}'

# List attached policies on role
aws iam list-attached-role-policies --role-name payment-api-ec2-role
aws iam get-role --role-name payment-api-ec2-role \\
  --query 'Role.{Trust:AssumeRolePolicyDocument,Boundary:PermissionsBoundary}'`,
    pitfalls:
      'Long-lived IAM user access keys in Spring Boot properties — rotate nightmare, audit fail. `*` in Action or Resource without Condition. Missing resource policy on cross-account S3. No permission boundary on developer roles — privilege escalation via `iam:CreateRole`. Trust policy with `"Principal": "*"` (even with Condition, risky). Forgetting session token when using AssumeRole creds (works for 15 min then fails).',
    production:
      'Zero IAM users in prod — SSO (Identity Center) for humans, roles for workloads. EC2/ECS/Lambda use instance/task roles; SDK default credential chain. Least-privilege policies with Condition keys (aws:SourceVpc, s3:x-amz-server-side-encryption). Permission boundaries on all human-assumable roles. ExternalId on cross-account trust. IMDSv2 required. Regular Access Analyzer + policy simulation in CI.',
    interview30s:
      'Users/groups for humans (prefer SSO); roles for services via STS temp creds. Identity policy on principal; resource policy on S3/KMS. Trust policy defines who can AssumeRole. Permission boundary caps max permissions. Explicit deny always wins.',
    interview2m:
      'Draw EC2 → instance profile → STS → 15-min creds → S3 PutObject. Explain why no keys on disk: IMDSv2 + auto-rotation. Cross-account: trust policy on role + identity policy on caller + resource policy on bucket — all three for S3. Permission boundary prevents dev from granting themselves iam:* even if misconfigured. Walk evaluation order: SCP → boundary → session → identity/resource → implicit deny. FinTech: Condition on SSE-KMS for KYC uploads.',
    traps:
      '"Resource policy alone is enough" — caller identity policy also needed for most cross-account calls. "Role and instance profile are the same" — profile is container that attaches role to EC2. "AdminAccess overrides boundary" — boundary limits effective permissions even for admin-attached policies.',
  },
];
