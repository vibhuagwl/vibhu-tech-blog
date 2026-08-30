import {MEMORY_DIAGRAMS_EXTENDED} from './memory-diagrams-extended';
export type {MemoryDiagram} from './memory-diagram-types';
export {AWS_MEMORY_GROUPS} from './memory-diagram-types';

import type {MemoryDiagram} from './memory-diagram-types';

/** Core overview diagrams + extended set — draw these from memory in interviews. */
export const MEMORY_DIAGRAMS: MemoryDiagram[] = [
  {
    id: 'aws-master-map',
    group: 'Overview',
    title: 'AWS FinTech master map (memorize first)',
    hook: 'Route53 → WAF/ALB → ECS/EKS → Aurora/DynamoDB/Redis → MSK → KMS → CloudWatch/Trail',
    mermaid: `flowchart TB
  R53[Route 53 DNS]
  WAF[AWS WAF]
  ALB[ALB TLS ACM]
  subgraph VPC [Private VPC multi-AZ]
    COMP[ECS/EKS Spring Boot]
    RDS[(Aurora Multi-AZ)]
    DDB[(DynamoDB)]
    REDIS[(ElastiCache Redis)]
    MSK[MSK Kafka]
  end
  R53 --> WAF --> ALB --> COMP
  COMP --> RDS
  COMP --> DDB
  COMP --> REDIS
  COMP --> MSK
  COMP --> KMS[AWS KMS]
  COMP --> SM[Secrets Manager]
  COMP --> CW[CloudWatch / X-Ray]
  COMP --> CT[CloudTrail audit]`,
    anchors: [
      {id: 'fintech-architecture', label: 'FinTech arch'},
      {id: 'system-design', label: 'System design'},
    ],
  },
  {
    id: 'global-infra',
    group: 'Overview',
    title: 'Region · AZ · Edge · Account',
    hook: 'Region = geography · AZ = isolated DC · deploy multi-AZ before multi-Region',
    mermaid: `flowchart TB
  subgraph REG[Region us-east-1]
    AZ1[AZ-1a]
    AZ2[AZ-1b]
    AZ3[AZ-1c]
  end
  EDGE[CloudFront Edge Locations global]
  ORG[AWS Organizations SCPs]
  REG --> HA[High Availability design]
  EDGE --> LAT[Low latency static/API cache]`,
    anchors: [{id: 'aws-fundamentals', label: 'Fundamentals'}],
  },
  {
    id: 'iam-sts-flow',
    group: 'Foundations',
    title: 'IAM Role → STS → temporary credentials',
    hook: 'EC2/ECS/Lambda use ROLE not access keys · STS AssumeRole → temp creds → S3',
    mermaid: `sequenceDiagram
  participant APP as Spring Boot on ECS
  participant STS as AWS STS
  participant S3 as S3
  APP->>STS: AssumeRole TaskRole
  STS-->>APP: temp AccessKey + Secret + Token
  APP->>S3: GetObject with session creds
  Note over APP,S3: Never embed long-lived IAM User keys`,
    anchors: [{id: 'iam', label: 'IAM deep dive'}],
  },
  {
    id: 'iam-policy-types',
    group: 'Foundations',
    title: 'Identity policy vs Resource policy vs Trust policy',
    hook: 'Identity = attached to role/user · Resource = S3 bucket policy · Trust = who can AssumeRole',
    mermaid: `flowchart LR
  ID[Identity Policy on Role] --> ALLOW[Allow s3:GetObject]
  RES[Resource Policy on Bucket] --> ALLOW2[Allow principal role]
  TRUST[Trust Policy on Role] --> WHO[ecs-tasks.amazonaws.com can assume]
  ID --> AUTHZ[Authorization decision AND both if cross-account]`,
    anchors: [{id: 'iam', label: 'IAM'}],
  },
  {
    id: 'compute-picker',
    group: 'Compute',
    title: 'Pick compute: EC2 vs ECS vs EKS vs Lambda',
    hook: 'VM control=EC2 · containers simple=ECS · K8s=EKS · event/short=Lambda',
    mermaid: `flowchart TD
  Q{Workload?}
  Q -->|Full OS / legacy| EC2[EC2 + ASG]
  Q -->|Spring Boot container| ECS[ECS Fargate]
  Q -->|Kubernetes / Helm| EKS[EKS + IRSA]
  Q -->|Spiky async short| LAM[Lambda + API GW]`,
    anchors: [
      {id: 'ec2', label: 'EC2'},
      {id: 'ecs', label: 'ECS'},
      {id: 'eks', label: 'EKS'},
      {id: 'lambda', label: 'Lambda'},
    ],
  },
  ...MEMORY_DIAGRAMS_EXTENDED,
];
