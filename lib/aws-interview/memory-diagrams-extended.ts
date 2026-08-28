import type {MemoryDiagram} from './memory-diagram-types';

/** Extended AWS interview memory diagrams — compute through troubleshooting. */
export const MEMORY_DIAGRAMS_EXTENDED: MemoryDiagram[] = [
  // ── Compute ──
  {
    id: 'ec2-asg',
    group: 'Compute',
    title: 'EC2 + ASG + Launch Template + ALB',
    hook: 'Launch Template versions instances · ASG scales on CPU/ALB · ALB health checks gate traffic',
    mermaid: `flowchart LR
  Client[Client] --> ALB[Application Load Balancer]
  ALB --> TG[Target Group]
  TG --> ASG[Auto Scaling Group]
  LT[Launch Template v3] --> ASG
  ASG --> EC2A[EC2 AZ-a]
  ASG --> EC2B[EC2 AZ-b]
  CW[CloudWatch CPU 60%] -->|scale out| ASG
  ASG -->|unhealthy| DRAIN[Drain + replace]`,
    anchors: [{id: 'ec2', label: 'EC2 & Auto Scaling'}],
  },
  {
    id: 'ecs-fargate',
    group: 'Compute',
    title: 'ECS Fargate — Task → Service → ALB',
    hook: 'No EC2 to patch · Task role for AWS APIs · Service keeps desired count across AZs',
    mermaid: `flowchart TB
  ALB[ALB Target Group] --> SVC[ECS Service desired=4]
  SVC --> T1[Task Fargate AZ-a]
  SVC --> T2[Task Fargate AZ-b]
  TD[Task Definition] --> SVC
  TR[Task Role IAM] --> T1
  TR --> T2
  ECR[ECR Image] --> TD
  CW[CPU/Memory alarm] -->|scale| SVC`,
    anchors: [{id: 'ecs', label: 'ECS & Fargate'}],
  },
  {
    id: 'eks-ingress',
    group: 'Compute',
    title: 'EKS — Ingress → Service → Pods + IRSA',
    hook: 'ALB Ingress Controller routes HTTP · IRSA maps K8s SA → IAM role · HPA scales pods',
    mermaid: `flowchart TB
  User[Internet] --> ALB[AWS LB Ingress Controller]
  ALB --> ING[Ingress payment.example.com]
  ING --> SVC[K8s Service ClusterIP]
  SVC --> P1[Pod Spring Boot]
  SVC --> P2[Pod Spring Boot]
  SA[ServiceAccount] -->|IRSA| IAM[IAM Role S3+Secrets]
  IAM --> P1
  HPA[HPA CPU 70%] --> P1
  HPA --> P2`,
    anchors: [{id: 'eks', label: 'EKS / Kubernetes'}],
  },
  {
    id: 'lambda-apigw',
    group: 'Compute',
    title: 'Lambda + API Gateway + DLQ',
    hook: 'API GW throttles · Lambda execution role · DLQ catches async failures · cold start trade-off',
    mermaid: `sequenceDiagram
  participant C as Client
  participant G as API Gateway
  participant L as Lambda
  participant D as DynamoDB
  participant Q as SQS DLQ
  C->>G: POST /payments
  G->>L: Invoke sync
  L->>D: PutItem idempotent
  L-->>G: 200 JSON
  Note over L,Q: Async invoke failure → DLQ
  G-->>C: Response`,
    anchors: [{id: 'lambda', label: 'Lambda'}],
  },

  // ── Network ──
  {
    id: 'vpc-full-architecture',
    group: 'Network',
    title: 'VPC 3-tier — Internet → IGW → Public ALB → NAT → Private EC2 → RDS',
    hook: '⭐ THE diagram: public subnet = IGW route · private = NAT outbound only · RDS no internet route',
    mermaid: `flowchart TB
  Internet[Internet Users] --> IGW[Internet Gateway]
  IGW --> PUB[Public Subnet 10.0.1.0/24]
  PUB --> ALB[ALB]
  PUB --> NAT[NAT Gateway + EIP]
  ALB -->|SG allow 8080| PRIV[Private Subnet 10.0.10.0/24]
  PRIV --> EC2[EC2 App Tier]
  EC2 -->|SG allow 5432| RDS[(RDS Multi-AZ)]
  EC2 -->|outbound 0.0.0.0/0| NAT
  NAT --> IGW
  RTpub[Public RT: 0.0.0.0/0 → IGW]
  RTpriv[Private RT: 0.0.0.0/0 → NAT]`,
    anchors: [{id: 'vpc', label: 'VPC deep dive'}],
  },
  {
    id: 'sg-vs-nacl',
    group: 'Network',
    title: 'Security Group vs NACL',
    hook: 'SG = stateful ENI firewall allow-only · NACL = stateless subnet gate with deny rules',
    mermaid: `flowchart LR
  subgraph SG["Security Group — stateful"]
    ENI[EC2 ENI] -->|inbound allow 8080| OK1[Return traffic auto-allowed]
  end
  subgraph NACL["NACL — stateless"]
    SUB[Subnet] -->|rule 100 allow 443| PASS[Explicit ephemeral return rules needed]
    SUB -->|rule 50 deny 0.0.0.0/0| BLOCK[Blocked before SG]
  end
  SG --> PRIMARY[Primary — default deny]
  NACL --> BOUNDARY[Subnet boundary deny]`,
    anchors: [{id: 'vpc', label: 'VPC security'}],
  },
  {
    id: 'nat-vs-igw',
    group: 'Network',
    title: 'NAT Gateway vs Internet Gateway',
    hook: 'IGW = bidirectional public internet · NAT = outbound-only SNAT for private subnets',
    mermaid: `flowchart TB
  subgraph IGWpath["Internet Gateway"]
    PUB[Public EC2 + public IP] <-->|in + out| IGW[IGW]
  end
  subgraph NATpath["NAT Gateway"]
    PRIV[Private EC2 no public IP] -->|outbound only| NAT[NAT GW in public subnet]
    NAT --> IGW2[IGW]
    IN[Inbound to private IP] -->|no route| FAIL[Packets dropped]
  end
  IGWpath --> PUBLIC[Public subnet route table]
  NATpath --> PRIVATE[Private subnet route table]`,
    anchors: [{id: 'vpc', label: 'NAT vs IGW'}],
  },
  {
    id: 'vpc-endpoint-vs-nat',
    group: 'Network',
    title: 'VPC Endpoint vs NAT Gateway',
    hook: 'Endpoint = free AWS traffic inside VPC · NAT = paid path for general internet egress',
    mermaid: `flowchart LR
  EC2[Private EC2]
  EC2 -->|S3 Gateway Endpoint| S3[(S3 — no NAT)]
  EC2 -->|Interface Endpoint| SM[Secrets Manager]
  EC2 -->|0.0.0.0/0 via NAT| EXT[External APIs Docker Hub]
  NAT[NAT Gateway] --> IGW[IGW]
  EXT --> NAT
  style S3 fill:#dcfce7
  style NAT fill:#fee2e2`,
    anchors: [{id: 'vpc', label: 'VPC endpoints'}],
  },
  {
    id: 'alb-nlb-compare',
    group: 'Network',
    title: 'ALB vs NLB — L7 routing vs L4 performance',
    hook: 'ALB = path/host routing + WAF · NLB = millions RPS TCP/UDP + static IP',
    mermaid: `flowchart TB
  subgraph ALB["ALB Layer 7"]
    REQ[HTTPS /api/payments] --> PATH[Path-based routing]
    PATH --> SVC1[Spring Boot TG]
    PATH --> SVC2[Lambda TG]
    WAF[WAF attach] --> ALBnode[ALB]
  end
  subgraph NLB["NLB Layer 4"]
    TCP[TCP :9092 Kafka] --> BROKER[MSK Broker]
    NLBnode[NLB static IP] --> TCP
  end
  ALB --> REST[REST microservices]
  NLB --> STREAM[High-throughput streams]`,
    anchors: [{id: 'load-balancing', label: 'ALB / NLB / GWLB'}],
  },
  {
    id: 'route53-policies',
    group: 'Network',
    title: 'Route 53 routing policies',
    hook: 'Simple · Weighted · Latency · Failover · Geolocation · Geoproximity · Multi-value',
    mermaid: `flowchart TB
  DNS[payment.example.com]
  DNS --> W[Weighted 70/30 blue-green]
  DNS --> L[Latency us-east-1 vs eu-west-1]
  DNS --> F[Failover Primary + Secondary]
  DNS --> G[Geolocation EU vs US]
  W --> ALB1[ALB us-east-1]
  L --> ALB2[Lowest RTT region]
  F -->|health check fail| DR[DR ALB]
  HC[Health Check /health] --> F`,
    anchors: [{id: 'route53', label: 'Route 53'}],
  },

  // ── Storage & Data ──
  {
    id: 's3-events',
    group: 'Storage & Data',
    title: 'S3 Event Notifications → Lambda / SQS / SNS',
    hook: 'ObjectCreated triggers pipeline · filter by prefix/suffix · at-least-once delivery',
    mermaid: `flowchart LR
  UP[Client PUT s3://bucket/incoming/file.csv] --> S3[(S3 Bucket)]
  S3 -->|ObjectCreated:*| SNS[SNS Topic]
  SNS --> L[Lambda processor]
  SNS --> Q[SQS queue]
  SNS --> EB[EventBridge]
  L --> OUT[s3://bucket/processed/]
  POL[Bucket policy + notification config] --> S3`,
    anchors: [{id: 's3', label: 'S3'}],
  },
  {
    id: 'storage-ebs-efs-s3',
    group: 'Storage & Data',
    title: 'EBS vs EFS vs S3 — block vs NFS vs object',
    hook: 'EBS = single EC2 disk · EFS = shared NFS across AZ · S3 = unlimited objects + lifecycle',
    mermaid: `flowchart TB
  subgraph EBS["EBS Block"]
    EC2[EC2] --> VOL[gp3/io2 volume single AZ]
  end
  subgraph EFS["EFS NFS"]
    T1[ECS Task A] --> FS[EFS mount /shared]
    T2[ECS Task B] --> FS
  end
  subgraph S3["S3 Object"]
    APP[App] --> BKT[(S3 bucket)]
    BKT --> GL[Glacier lifecycle tier]
  end
  EBS --> BOOT[Boot + DB on EC2]
  EFS --> SHARED[Shared config/logs]
  S3 --> LAKE[Data lake + backups]`,
    anchors: [{id: 'storage-compare', label: 'EBS vs EFS vs S3'}],
  },
  {
    id: 'rds-multi-az-vs-replica',
    group: 'Storage & Data',
    title: 'RDS Multi-AZ vs Read Replica',
    hook: 'Multi-AZ = sync HA failover · Read Replica = async read scale + cross-region DR',
    mermaid: `flowchart TB
  subgraph MAZ["Multi-AZ — HA"]
    PRI[(Primary AZ-a)] <-->|sync replication| STBY[(Standby AZ-b)]
    APP1[App writes] --> PRI
    FAIL[AZ failure] -->|auto DNS flip ~60s| STBY
  end
  subgraph RR["Read Replica — scale + DR"]
    WR[(Primary)] -->|async| RO1[(Replica AZ-b)]
    WR -->|cross-region| RO2[(Replica us-west-2)]
    APP2[Analytics reads] --> RO1
    PROMOTE[Manual promote] --> RO2
  end`,
    anchors: [{id: 'rds', label: 'RDS'}],
  },
  {
    id: 'aurora-storage',
    group: 'Storage & Data',
    title: 'Aurora shared storage layer',
    hook: '6 copies across 3 AZs · storage auto-grows · writer + 15 readers share volume',
    mermaid: `flowchart TB
  WR[Aurora Writer] --> CLUSTER[Aurora Cluster Volume]
  R1[Reader 1] --> CLUSTER
  R2[Reader 2] --> CLUSTER
  CLUSTER --> AZa[Copy AZ-a]
  CLUSTER --> AZb[Copy AZ-b]
  CLUSTER --> AZc[Copy AZ-c]
  FAIL[Writer fail] -->|~30s promote reader| R1
  CLUSTER -->|auto-grow 10GB steps| GROW[Storage scales to 128TB]`,
    anchors: [{id: 'aurora', label: 'Aurora'}],
  },
  {
    id: 'dynamodb-partition-hot-key',
    group: 'Storage & Data',
    title: 'DynamoDB partitions & hot key fix',
    hook: 'Partition key hash → physical partition · hot key = throttle · fix with composite key or write sharding',
    mermaid: `flowchart TB
  REQ[Write tenant-123] --> HASH[Hash partition key]
  HASH --> P1[Partition 1 — HOT]
  HASH2[Write tenant-123#shard-7] --> P2[Partition 2]
  HASH3[Write tenant-123#shard-3] --> P3[Partition 3]
  GSI[GSI alternate access pattern] --> QUERY[Query by status+date]
  P1 -->|WCU exceeded| THROTTLE[ProvisionedThroughputExceeded]
  P2 --> OK[Even load spread]`,
    anchors: [{id: 'dynamodb', label: 'DynamoDB'}],
  },
  {
    id: 'elasticache-cache-aside',
    group: 'Storage & Data',
    title: 'ElastiCache cache-aside pattern',
    hook: 'Read: cache miss → DB → populate · Write: update DB then invalidate cache',
    mermaid: `sequenceDiagram
  participant App as Spring Boot
  participant R as Redis ElastiCache
  participant DB as RDS
  App->>R: GET account:123
  alt cache hit
    R-->>App: cached JSON
  else cache miss
    R-->>App: null
    App->>DB: SELECT * FROM accounts
    DB-->>App: row
    App->>R: SET account:123 TTL=300
  end
  Note over App,R: Write path: UPDATE DB → DEL cache key`,
    anchors: [{id: 'elasticache', label: 'ElastiCache / Redis'}],
  },

  // ── Messaging ──
  {
    id: 'sqs-visibility-dlq',
    group: 'Messaging',
    title: 'SQS visibility timeout + DLQ redrive',
    hook: 'Message hidden while processing · timeout too short = duplicate · DLQ after maxReceiveCount',
    mermaid: `flowchart TB
  PROD[Producer] --> Q[SQS Queue]
  Q -->|receive| W1[Worker processing]
  W1 -->|success delete| DONE[Done]
  W1 -->|crash before delete| VIS[Visibility expires]
  VIS --> Q
  Q -->|maxReceiveCount=3| DLQ[Dead Letter Queue]
  DLQ -->|redrive policy| Q
  ALM[CloudWatch DLQ depth > 0] --> PAGE[PagerDuty]`,
    anchors: [{id: 'sqs-sns-eventbridge', label: 'SQS / SNS / EventBridge'}],
  },
  {
    id: 'sns-fanout',
    group: 'Messaging',
    title: 'SNS fan-out to SQS + Lambda + Email',
    hook: 'One publish → many subscribers · filter policies per queue · SQS durability after fan-out',
    mermaid: `flowchart LR
  API[Payment API] -->|Publish| SNS[SNS Topic payment-events]
  SNS -->|filter amount > 1000| FRAUD[SQS fraud-queue]
  SNS -->|filter all| EMAIL[SQS notify-queue]
  SNS --> L[Lambda audit-fn]
  SNS --> SMS[Email/SMS sub]
  FRAUD --> FW[Fraud Worker]
  EMAIL --> NW[Notify Worker]`,
    anchors: [{id: 'sqs-sns-eventbridge', label: 'SNS fan-out'}],
  },
  {
    id: 'eventbridge-rules',
    group: 'Messaging',
    title: 'EventBridge content-based routing',
    hook: 'Event pattern matches source/detail-type/detail → route to Lambda/SQS/Step Functions',
    mermaid: `flowchart TB
  SRC[com.acme.payment PaymentFailed] --> BUS[EventBridge Bus]
  BUS --> R1[Rule retryable=true]
  BUS --> R2[Rule tenantId=acme]
  BUS --> R3[Schedule cron 0 2 * * ?]
  R1 --> L[Lambda retry-fn]
  R2 --> Q[SQS tenant-queue]
  R3 --> SF[Step Functions reconcile]
  ARCH[Event archive 90d] --> REPLAY[Replay to bus]`,
    anchors: [{id: 'sqs-sns-eventbridge', label: 'EventBridge rules'}],
  },
  {
    id: 'msk-spring-architecture',
    group: 'Messaging',
    title: 'MSK + Spring Boot producer/consumer groups',
    hook: 'TLS + IAM auth · topic partitions · consumer groups with independent lag · MSK in private subnets',
    mermaid: `flowchart TB
  PAY[Payment Service Producer] -->|payment-events topic| MSK[MSK Cluster 3 brokers]
  MSK --> FRAUD[Fraud CG fraud-detectors]
  MSK --> LEDGER[Ledger CG ledger-posters]
  MSK --> ANALYTICS[Analytics CG]
  CW[CloudWatch ConsumerLag] --> ALM[Lag alarm]
  ALM --> SCALE[Scale consumer tasks]
  SG[Security Group 9092 TLS] --> MSK`,
    anchors: [{id: 'msk-kafka', label: 'MSK / Kafka on AWS'}],
  },
  {
    id: 'messaging-compare-table',
    group: 'Messaging',
    title: 'SQS vs SNS vs EventBridge vs Kafka — visual flow',
    hook: 'Queue pull · Pub/sub push · Event bus route · Log replay — pick by pattern not brand',
    mermaid: `flowchart TB
  subgraph SQS["SQS — pull queue"]
    P1[Producer] --> Q1[Queue] --> C1[Competing workers]
  end
  subgraph SNS["SNS — push fan-out"]
    P2[Publisher] --> T1[Topic] --> S1[Sub A]
    T1 --> S2[Sub B]
  end
  subgraph EB["EventBridge — route"]
    P3[Event] --> BUS[Bus rules] --> TGT[Targets]
  end
  subgraph KAFKA["Kafka — log replay"]
    P4[Producer] --> LOG[Partition log] --> CG[Consumer groups]
  end`,
    anchors: [{id: 'sqs-sns-eventbridge', label: 'Messaging compare'}, {id: 'msk-kafka', label: 'MSK / Kafka'}],
  },

  // ── Security ──
  {
    id: 'security-stack-layers',
    group: 'Security',
    title: 'AWS security stack — defense in depth',
    hook: 'WAF edge → Shield DDoS → GuardDuty detect → Security Hub aggregate → Trail audit',
    mermaid: `flowchart TB
  Client[Internet] --> CF[CloudFront]
  CF --> WAF[AWS WAF]
  WAF --> SHD[Shield Standard]
  SHD --> APIGW[API Gateway]
  APIGW --> ECS[ECS Tasks]
  ECS --> S3[(S3)]
  APIGW --> CT[CloudTrail]
  ECS --> CT
  CT --> GD[GuardDuty]
  GD --> HUB[Security Hub]
  CFG[AWS Config] --> HUB
  MAC[Macie S3 PII] --> HUB`,
    anchors: [{id: 'aws-security-stack', label: 'AWS security stack'}],
  },
  {
    id: 'kms-envelope',
    group: 'Security',
    title: 'KMS envelope encryption',
    hook: 'CMK wraps DEK · DEK encrypts data · never send plaintext key to KMS for bulk data',
    mermaid: `flowchart LR
  APP[App] -->|GenerateDataKey| KMS[AWS KMS CMK]
  KMS -->|plaintext DEK + encrypted DEK| APP
  APP -->|AES-GCM| DATA[Encrypt PAN payload]
  STORE[(Store ciphertext + encrypted DEK)]
  DATA --> STORE
  READ[Decrypt] -->|Decrypt encrypted DEK| KMS
  KMS -->|plaintext DEK| READ
  READ --> PLAIN[Plaintext in memory only]`,
    anchors: [{id: 'kms', label: 'KMS'}],
  },
  {
    id: 'secrets-rotation',
    group: 'Security',
    title: 'Secrets Manager rotation',
    hook: 'Lambda rotation function · dual-user DB swap · apps fetch latest via SDK/Spring import',
    mermaid: `sequenceDiagram
  participant SM as Secrets Manager
  participant L as Rotation Lambda
  participant DB as RDS
  participant App as Spring Boot
  SM->>L: Scheduled rotation trigger
  L->>DB: Create user_v2 + grants
  L->>SM: Set AWSPENDING version
  L->>DB: Swap master to user_v2
  L->>SM: Move AWSCURRENT to v2
  App->>SM: get-secret-value AWSCURRENT
  SM-->>App: new credentials`,
    anchors: [{id: 'secrets-manager', label: 'Secrets Manager'}],
  },
  {
    id: 'api-gateway-flow',
    group: 'Security',
    title: 'API Gateway request flow',
    hook: 'Route → authorizer JWT/Cognito/IAM → integration Lambda/HTTP → throttle + WAF',
    mermaid: `flowchart LR
  C[Client Bearer JWT] --> GW[API Gateway]
  GW --> AUTH[Lambda/Cognito Authorizer]
  AUTH -->|allow| INT[Integration]
  INT --> L[Lambda]
  INT --> HTTP[HTTP ALB backend]
  GW --> TH[Usage plan throttle]
  WAF[WAF Web ACL] --> GW
  GW --> CW[CloudWatch access logs]`,
    anchors: [{id: 'api-gateway', label: 'API Gateway'}],
  },

  // ── Ops & Reliability ──
  {
    id: 'cloudwatch-alarms',
    group: 'Ops & Reliability',
    title: 'CloudWatch alarms → SNS → action',
    hook: 'Metric + threshold + period → ALARM state → SNS → Lambda/AutoScaling/PagerDuty',
    mermaid: `flowchart LR
  MET[EC2 CPUUtilization] --> CW[CloudWatch Metric]
  CW --> ALM[Alarm CPU > 80% 5min]
  ALM -->|OK → ALARM| SNS[SNS ops-alerts]
  SNS --> PD[PagerDuty]
  SNS --> ASG[ASG scale-out policy]
  SNS --> L[Lambda auto-remediate]
  DASH[Dashboard + Logs Insights] --> CW`,
    anchors: [{id: 'cloudwatch', label: 'CloudWatch'}],
  },
  {
    id: 'cloudtrail-s3-delete',
    group: 'Ops & Reliability',
    title: 'CloudTrail audit — who deleted S3?',
    hook: 'Every API call logged · EventName DeleteObject · userIdentity → IAM user/role ARN',
    mermaid: `sequenceDiagram
  participant U as IAM User
  participant S3 as S3
  participant CT as CloudTrail
  participant LOG as S3 Log Archive
  U->>S3: DeleteObject payment-data.csv
  S3->>CT: Record event
  CT->>LOG: Immutable trail bucket
  Note over LOG: eventName DeleteObject<br/>userIdentity arn:aws:iam::role/admin<br/>sourceIPAddress 203.0.113.5
  GD[GuardDuty] ->> CT: Anomaly alert`,
    anchors: [{id: 'cloudtrail', label: 'CloudTrail'}],
  },
  {
    id: 'observability-xray-trace',
    group: 'Ops & Reliability',
    title: 'Distributed trace — X-Ray service map',
    hook: 'Trace ID propagates API GW → Lambda → DynamoDB · latency waterfall · error annotations',
    mermaid: `flowchart LR
  APIGW[API Gateway] -->|trace header| L[Lambda]
  L --> DDB[DynamoDB]
  L --> SQS[SQS publish]
  XRAY[X-Ray Daemon/SDK] --> MAP[Service Map]
  MAP --> APIGW
  MAP --> L
  MAP --> DDB
  MAP --> ANN[Annotations tenantId error=true]
  CW[CloudWatch Logs correlation] --> XRAY`,
    anchors: [{id: 'observability', label: 'Observability & X-Ray'}],
  },
  {
    id: 'ha-multi-az',
    group: 'Ops & Reliability',
    title: 'High availability — Multi-AZ everywhere',
    hook: '2+ AZs · ALB cross-AZ · ASG min across AZs · RDS Multi-AZ · NAT per AZ',
    mermaid: `flowchart TB
  subgraph AZa["AZ-a"]
    ALBa[ALB node]
    EC2a[EC2 x2]
    NATa[NAT GW]
    RDSa[RDS primary]
  end
  subgraph AZb["AZ-b"]
    ALBb[ALB node]
    EC2b[EC2 x2]
    NATb[NAT GW]
    RDSb[RDS standby]
  end
  ALB[ALB cross-zone] --> ALBa
  ALB --> ALBb
  ASG[ASG min=2 AZs] --> EC2a
  ASG --> EC2b
  RDSa <-->|sync| RDSb`,
    anchors: [{id: 'autoscaling-ha', label: 'Auto Scaling & HA'}],
  },
  {
    id: 'dr-rpo-rto-strategies',
    group: 'Ops & Reliability',
    title: 'DR strategies — RPO vs RTO ladder',
    hook: 'Backup/Restore slowest · Pilot Light · Warm Standby · Multi-site active/active',
    mermaid: `flowchart TB
  BACK[Backup/Restore RPO hrs RTO days] --> PILOT[Pilot Light RPO min RTO hrs]
  PILOT --> WARM[Warm Standby RPO min RTO min]
  WARM --> ACTIVE[Active/Active RPO ~0 RTO ~0]
  BACK --> S3[S3 cross-region replication]
  PILOT --> RDS[RDS snapshot restore]
  WARM --> ASG2[Reduced ASG in DR region]
  ACTIVE --> R53[Route 53 latency/failover]`,
    anchors: [{id: 'disaster-recovery', label: 'Disaster recovery'}],
  },
  {
    id: 'cost-nat-gateway-trap',
    group: 'Ops & Reliability',
    title: 'Cost trap — NAT Gateway vs VPC endpoints',
    hook: 'NAT charges per GB processed · S3/DynamoDB gateway endpoints free · interface endpoints per AZ hourly',
    mermaid: `flowchart LR
  EC2[100 EC2 tasks] -->|all S3 via NAT| NAT[NAT GW]
  NAT -->|0.045/GB + hourly| BILL[High egress bill]
  EC2 -->|S3 Gateway Endpoint| S3[(S3 free path)]
  EC2 -->|Interface Endpoint| SM[Secrets Manager]
  FIX[Fix: endpoint for AWS services] --> SAVE[Eliminate NAT GB for S3]
  style BILL fill:#fee2e2
  style SAVE fill:#dcfce7`,
    anchors: [{id: 'cost-optimization', label: 'Cost optimization'}],
  },

  // ── Design & Spring ──
  {
    id: 'fintech-aws-capstone',
    group: 'Design & Spring',
    title: 'FinTech capstone — payment platform on AWS',
    hook: 'API GW → ECS → RDS + DynamoDB idempotency · SNS events · KMS encryption · CloudTrail audit',
    mermaid: `flowchart TB
  MOB[Mobile App] --> CF[CloudFront WAF]
  CF --> APIGW[API Gateway JWT]
  APIGW --> ECS[ECS Payment Service]
  ECS --> RDS[(RDS ledger)]
  ECS --> DDB[(DynamoDB idempotency)]
  ECS --> SNS[SNS payment-events]
  SNS --> SQS1[Fraud SQS]
  SNS --> SQS2[Notify SQS]
  ECS --> KMS[KMS encrypt PAN]
  CT[CloudTrail] --> ARCH[Log archive S3]`,
    anchors: [{id: 'fintech-architecture', label: 'FinTech on AWS'}],
  },
  {
    id: 'payment-system-design',
    group: 'Design & Spring',
    title: 'Payment system design — Staff interview',
    hook: 'Idempotency key · saga/outbox · at-least-once consumers · PCI scope minimization',
    mermaid: `sequenceDiagram
  participant C as Client
  participant API as Payment API
  participant DB as RDS
  participant OUT as Outbox SQS
  participant LED as Ledger Consumer
  C->>API: POST /pay Idempotency-Key
  API->>DB: INSERT idempotency + payment
  API->>OUT: outbox event in same TX
  API-->>C: 202 accepted
  OUT->>LED: PaymentCompleted
  LED->>DB: post ledger entry idempotent`,
    anchors: [{id: 'system-design', label: 'System design (Staff)'}],
  },
  {
    id: 'event-driven-aws',
    group: 'Design & Spring',
    title: 'Event-driven architecture on AWS',
    hook: 'Commands sync via API · domain events async via SNS/EventBridge/Kafka · eventual consistency',
    mermaid: `flowchart LR
  CMD[Command POST /transfer] --> API[API Service]
  API --> DB[(RDS)]
  API --> EB[EventBridge]
  EB --> R1[Fraud rule]
  EB --> R2[Notify rule]
  EB --> R3[Analytics rule]
  R1 --> L1[Lambda]
  R2 --> Q[SQS]
  R3 --> MSK[MSK topic]
  MSK --> STREAM[Flink analytics]`,
    anchors: [{id: 'architecture-patterns', label: 'Architecture patterns'}],
  },
  {
    id: 'spring-aws-integration',
    group: 'Design & Spring',
    title: 'Spring Boot + AWS SDK integration map',
    hook: 'spring-cloud-aws · Secrets Manager import · SQS listener · S3 resource · IAM task role',
    mermaid: `flowchart TB
  SB[Spring Boot App]
  SB --> SM[spring.config.import secretsmanager:]
  SB --> SQS[@SqsListener manual ack]
  SB --> S3[AWS SDK v2 S3Client]
  SB --> DDB[DynamoDbClient enhanced]
  ROLE[ECS Task Role / EC2 Instance Profile] --> SB
  SB --> CW[Micrometer → CloudWatch]
  SB --> XRAY[AWS X-Ray SDK]`,
    anchors: [{id: 'spring-aws', label: 'Spring Boot + AWS'}],
  },

  // ── Comparisons ──
  {
    id: 'compare-ec2-ecs-eks-lambda',
    group: 'Comparisons',
    title: 'EC2 vs ECS vs EKS vs Lambda',
    hook: 'VM control · container no-servers · K8s portable · function event-driven — ops vs flexibility',
    mermaid: `flowchart TB
  EC2[EC2 + ASG full OS control patch AMIs]
  ECS[ECS Fargate containers no EC2 mgmt]
  EKS[EKS Kubernetes Helm IRSA portable]
  LAM[Lambda 15min limit scale to zero]
  EC2 -->|legacy custom agents| USE1[Steady workloads]
  ECS -->|Spring Boot containers| USE2[Fast deploy]
  EKS -->|multi-team K8s| USE3[Service mesh]
  LAM -->|spiky async| USE4[Event handlers]`,
    anchors: [{id: 'ec2', label: 'EC2'}, {id: 'ecs', label: 'ECS'}, {id: 'eks', label: 'EKS'}, {id: 'lambda', label: 'Lambda'}],
  },
  {
    id: 'compare-sqs-kafka',
    group: 'Comparisons',
    title: 'SQS vs Kafka (MSK)',
    hook: 'SQS = simple queue DLQ · Kafka = ordered log replay consumer groups — complexity trade-off',
    mermaid: `flowchart LR
  subgraph SQSside["SQS"]
    SQ[Queue] --> W[Workers pull]
    SQ --> DLQ[DLQ redrive]
  end
  subgraph Kside["Kafka MSK"]
    T[Topic partitions] --> CG1[Consumer Group A]
    T --> CG2[Consumer Group B]
    T --> RET[Retention replay by offset]
  end
  SQSside -->|job queue backpressure| PICK1[Pick SQS]
  Kside -->|event sourcing stream joins| PICK2[Pick Kafka]`,
    anchors: [{id: 'sqs-sns-eventbridge', label: 'SQS'}, {id: 'msk-kafka', label: 'MSK / Kafka'}],
  },
  {
    id: 'compare-rds-dynamodb',
    group: 'Comparisons',
    title: 'RDS vs DynamoDB',
    hook: 'SQL joins ACID transactions · NoSQL horizontal scale predictable keys — access pattern first',
    mermaid: `flowchart TB
  subgraph RDSside["RDS/Aurora SQL"]
    SQL[SELECT JOIN WHERE] --> TRANS[ACID transactions]
    SQL --> MAZ[Multi-AZ failover]
  end
  subgraph DDBside["DynamoDB NoSQL"]
    KEY[Partition + Sort key] --> SCALE[Auto-scale partitions]
    KEY --> GSI[GSI alternate queries]
  end
  RDSside -->|complex queries OLTP| SQLpick[Pick RDS]
  DDBside -->|massive scale key-value| NOSQLpick[Pick DynamoDB]`,
    anchors: [{id: 'rds', label: 'RDS'}, {id: 'dynamodb', label: 'DynamoDB'}],
  },

  // ── Troubleshooting ──
  {
    id: 'ts-alb-503',
    group: 'Troubleshooting',
    title: '503 from ALB — no healthy targets',
    hook: 'Check target health · security group · health check path · grace period · app listening port',
    mermaid: `flowchart TD
  ERR[503 Service Unavailable] --> HC{Targets healthy?}
  HC -->|no| SG[SG allows ALB → app port?]
  HC -->|no| PATH[Health check /actuator/health 200?]
  HC -->|no| GRACE[ASG grace period too short?]
  HC -->|no| PORT[App listening 0.0.0.0:8080?]
  SG --> FIX[Fix SG ingress from ALB SG]
  PATH --> FIX2[Fix health endpoint]
  FIX --> OK[Targets healthy → 200]`,
    anchors: [{id: 'troubleshooting', label: 'Production troubleshooting'}, {id: 'load-balancing', label: 'ALB'}],
  },
  {
    id: 'ts-ec2-no-internet',
    group: 'Troubleshooting',
    title: 'EC2 in private subnet — no internet',
    hook: 'Private subnet needs NAT route · not IGW · check route table · NAT in public subnet · SG egress',
    mermaid: `flowchart TD
  FAIL[curl timeout to internet] --> RT{Route 0.0.0.0/0?}
  RT -->|missing| ADD[Add NAT route to private RT]
  RT -->|points IGW| WRONG[Private cannot use IGW directly]
  RT -->|NAT| NATOK{NAT GW running?}
  NATOK -->|no| EIP[NAT has EIP in public subnet?]
  NATOK -->|yes| SG2[SG egress allow 443?]
  ADD --> OK[Outbound works via NAT SNAT]`,
    anchors: [{id: 'troubleshooting', label: 'Production troubleshooting'}, {id: 'vpc', label: 'VPC'}],
  },
  {
    id: 'ts-rds-cpu',
    group: 'Troubleshooting',
    title: 'RDS CPU spike — diagnose path',
    hook: 'Performance Insights top SQL · slow query log · missing index · connection storm · read replica offload',
    mermaid: `flowchart TD
  CPU[RDS CPU 95%] --> PI[Performance Insights top waits]
  PI --> SQL[Slow query log]
  SQL --> IDX{Missing index?}
  IDX -->|yes| ADDIDX[Add index EXPLAIN]
  IDX -->|no| CONN[Too many connections?]
  CONN --> POOL[App connection pool sizing]
  CPU --> RO[Offload reads to replica]
  ADDIDX --> OK[CPU normalizes]`,
    anchors: [{id: 'troubleshooting', label: 'Production troubleshooting'}, {id: 'rds', label: 'RDS'}],
  },
  {
    id: 'ts-kafka-lag',
    group: 'Troubleshooting',
    title: 'Kafka consumer lag growing',
    hook: 'Lag = end offset − committed · scale consumers ≤ partitions · check poison message · rebalance storm',
    mermaid: `flowchart TD
  LAG[ConsumerLag alarm] --> PART{consumers >= partitions?}
  PART -->|no| SCALE[Scale tasks to partition count]
  PART -->|yes| SLOW[Slow handler?]
  SLOW --> PROF[Profile processing time]
  SLOW --> POISON[Poison message blocking?]
  POISON --> DLQ[Skip to DLQ manual offset]
  LAG --> REB[Rebalance storm?]
  REB --> SESSION[Increase session.timeout.ms]`,
    anchors: [{id: 'troubleshooting', label: 'Production troubleshooting'}, {id: 'msk-kafka', label: 'MSK / Kafka'}],
  },
  {
    id: 'ts-s3-access-denied',
    group: 'Troubleshooting',
    title: 'S3 AccessDenied — IAM vs bucket policy',
    hook: 'Explicit Deny wins · check IAM policy + bucket policy + SCP · encryption KMS key policy',
    mermaid: `flowchart TD
  DENY[403 AccessDenied] --> WHO{Which principal?}
  WHO --> IAM[IAM role policy allows s3:GetObject?]
  WHO --> BP[Bucket policy allow?]
  WHO --> SCP[Org SCP blocking?]
  IAM --> ENC{SSE-KMS key policy?}
  ENC -->|deny| KMS[Fix KMS key policy for role]
  BP --> FIX[Add bucket policy or IAM]
  FIX --> OK[200 GetObject success]`,
    anchors: [{id: 'troubleshooting', label: 'Production troubleshooting'}, {id: 's3', label: 'S3'}],
  },
  {
    id: 'ts-ecs-restart',
    group: 'Troubleshooting',
    title: 'ECS task restart loop',
    hook: 'Exit code in stopped reason · OOM memory limit · health check fail · missing secret · image pull error',
    mermaid: `flowchart TD
  LOOP[Task keeps restarting] --> STOP[DescribeTasks stoppedReason]
  STOP --> OOM{OutOfMemoryError?}
  OOM -->|yes| MEM[Increase task memory in TD]
  STOP --> HC{Health check failing?}
  HC -->|yes| ALB[ALB target unhealthy path]
  STOP --> SEC{Secret fetch fail?}
  SEC -->|yes| SM[Task role secretsmanager:GetSecretValue]
  STOP --> IMG[ECR pull error? check execution role]`,
    anchors: [{id: 'troubleshooting', label: 'Production troubleshooting'}, {id: 'ecs', label: 'ECS'}],
  },
  {
    id: 'ts-latency-spike',
    group: 'Troubleshooting',
    title: 'End-to-end latency spike — trace the path',
    hook: 'X-Ray waterfall · NAT cross-AZ hairpin · RDS connection wait · cold Lambda · no cache hit',
    mermaid: `flowchart LR
  SPIKE[p99 latency 3x] --> XRAY[X-Ray trace waterfall]
  XRAY --> NAT[NAT cross-AZ hairpin?]
  XRAY --> DB[RDS connection pool wait?]
  XRAY --> CACHE[Redis cache miss storm?]
  XRAY --> COLD[Lambda cold start?]
  NAT --> FIX1[NAT per AZ + endpoint for S3]
  DB --> FIX2[Increase pool + read replica]
  CACHE --> FIX3[Cache warming TTL review]`,
    anchors: [{id: 'troubleshooting', label: 'Production troubleshooting'}, {id: 'observability', label: 'Observability'}],
  },
];
