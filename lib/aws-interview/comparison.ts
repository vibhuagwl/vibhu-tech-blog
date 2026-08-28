export type ComparisonTable = {title: string; headers: string[]; rows: string[][]};

/** Final interview cheat sheet — Section 35 comparisons. */
export const COMPARISON_TABLES: ComparisonTable[] = [
  {
    title: 'EC2 vs ECS vs EKS vs Lambda',
    headers: ['', 'EC2', 'ECS', 'EKS', 'Lambda'],
    rows: [
      ['What', 'Virtual machines you manage', 'Container orchestration AWS-native', 'Managed Kubernetes', 'Event-driven functions'],
      ['When', 'Legacy, full OS control, custom agents', 'Spring Boot containers, simpler than K8s', 'Multi-team K8s, Helm, service mesh', 'Spiky/async, short tasks, low ops'],
      ['Pros', 'Flexible, any software', 'Fargate = no servers, fast deploy', 'Portable K8s ecosystem', 'Scale to zero, pay per invoke'],
      ['Cons', 'Patch AMIs, ASG ops', 'Less portable than K8s', 'Control plane + node ops', 'Cold start, 15min limit, vendor lock'],
      ['Interview', 'ASG + ALB + IAM instance profile', 'Task role + service + target group', 'IRSA + Ingress + HPA', 'API GW + IAM role + DLQ'],
    ],
  },
  {
    title: 'ALB vs NLB',
    headers: ['', 'ALB (L7)', 'NLB (L4)'],
    rows: [
      ['What', 'HTTP/HTTPS routing by path/host/header', 'TCP/UDP ultra-low latency'],
      ['When', 'Microservices REST, WebSocket, TLS terminate', 'Millions RPS, static IP, TLS pass-through'],
      ['Pros', 'Path routing, WAF integration, sticky sessions', 'Extreme performance, preserves source IP'],
      ['Cons', 'Higher latency vs NLB at scale', 'No URL-based routing'],
      ['Interview', 'Spring Boot behind ALB target group', 'Kafka brokers, gaming, financial FIX'],
    ],
  },
  {
    title: 'SQS vs SNS vs EventBridge vs Kafka',
    headers: ['', 'SQS', 'SNS', 'EventBridge', 'Kafka/MSK'],
    rows: [
      ['Pattern', 'Queue (pull)', 'Pub/sub push fan-out', 'Event bus rules', 'Log-based stream'],
      ['Ordering', 'FIFO optional per group', 'No ordering guarantee', 'No ordering', 'Per-partition order'],
      ['Replay', 'Retention 14d max', 'No replay', 'Archive/replay limited', 'Full replay by offset'],
      ['When', 'Task queues, decouple, DLQ', 'Fan-out notifications', 'SaaS events, cron, routing', 'High throughput, event sourcing'],
      ['Interview', 'Visibility timeout + DLQ', 'SQS subscription filter', 'Event pattern rules', 'Consumer groups + lag'],
    ],
  },
  {
    title: 'RDS vs Aurora vs DynamoDB',
    headers: ['', 'RDS', 'Aurora', 'DynamoDB'],
    rows: [
      ['Model', 'Managed SQL single instance/cluster', 'Distributed SQL storage layer', 'NoSQL key-value/document'],
      ['Scale', 'Vertical + read replicas', '15+ readers, storage auto-grow', 'Horizontal partitions'],
      ['When', 'OLTP SQL, joins, migrations', 'High SQL throughput, MySQL/PG compat', 'Massive scale, predictable keys'],
      ['Failover', 'Multi-AZ ~60-120s promote', 'Aurora ~30s reader promote', 'Multi-AZ tables automatic'],
      ['Interview', 'Multi-AZ vs Read Replica', 'Aurora vs RDS cost at scale', 'Hot partition + GSI design'],
    ],
  },
  {
    title: 'EBS vs EFS vs S3',
    headers: ['', 'EBS', 'EFS', 'S3'],
    rows: [
      ['Type', 'Block storage attached to EC2', 'NFS file system', 'Object storage'],
      ['Use', 'Boot volumes, databases on EC2', 'Shared files across AZ', 'Documents, backups, data lake'],
      ['Scale', 'Single AZ volume (multi-attach io2)', 'Elastic throughput', 'Unlimited objects'],
      ['Interview', 'gp3 vs io2 for DB', 'ECS shared config', 'Lifecycle Glacier + events'],
    ],
  },
  {
    title: 'Multi-AZ vs Read Replica',
    headers: ['', 'Multi-AZ', 'Read Replica'],
    rows: [
      ['Purpose', 'High availability failover', 'Read scaling + DR'],
      ['Sync', 'Synchronous standby', 'Asynchronous copy'],
      ['Failover', 'Automatic DNS flip to standby', 'Manual promote for DR'],
      ['Interview', 'Same-region HA — not for read scale', 'Cross-region DR + analytics reads'],
    ],
  },
  {
    title: 'Security Group vs NACL',
    headers: ['', 'Security Group', 'NACL'],
    rows: [
      ['Level', 'Instance/ENI (stateful)', 'Subnet (stateless)'],
      ['Rules', 'Allow only, evaluated all', 'Allow + deny, order matters'],
      ['When', 'Primary firewall — default deny', 'Subnet boundary deny rules'],
      ['Interview', 'SG: return traffic auto-allowed', 'NACL: explicit ephemeral ports'],
    ],
  },
  {
    title: 'IAM User vs IAM Role',
    headers: ['', 'IAM User', 'IAM Role'],
    rows: [
      ['What', 'Long-lived identity for humans', 'Temporary creds via STS'],
      ['When', 'Console login (prefer SSO)', 'EC2/ECS/Lambda/Cross-account'],
      ['Interview', 'Never embed user keys in app', 'Task role + AssumeRole + session token'],
    ],
  },
  {
    title: 'KMS vs Secrets Manager vs Parameter Store',
    headers: ['', 'KMS', 'Secrets Manager', 'Parameter Store'],
    rows: [
      ['What', 'Encryption keys + envelope', 'Secret storage + rotation', 'Config parameters (SecureString)'],
      ['When', 'Encrypt data at rest', 'DB password rotation', 'Non-rotating config, cheaper'],
      ['Interview', 'GenerateDataKey envelope', 'spring.config.import SM', 'SSM for feature flags'],
    ],
  },
  {
    title: 'API Gateway vs ALB',
    headers: ['', 'API Gateway', 'ALB'],
    rows: [
      ['What', 'Managed API front door + auth/throttle', 'L7 load balancer to targets'],
      ['When', 'Public API, usage plans, Lambda', 'Internal microservices, WebSocket'],
      ['Interview', 'Rate limit + API keys + WAF', 'ECS/EKS target groups + mTLS optional'],
    ],
  },
  {
    title: 'CloudWatch vs CloudTrail',
    headers: ['', 'CloudWatch', 'CloudTrail'],
    rows: [
      ['What', 'Metrics, logs, alarms', 'API audit who-did-what'],
      ['When', 'Latency, CPU, error rate alerts', 'Compliance, security investigation'],
      ['Interview', 'Custom metric + alarm → SNS', 'Who deleted S3 bucket? → CloudTrail'],
    ],
  },
  {
    title: 'DR strategies (RPO / RTO)',
    headers: ['Strategy', 'RPO', 'RTO', 'Cost'],
    rows: [
      ['Backup & Restore', 'Hours', 'Hours–days', '$'],
      ['Pilot Light', 'Minutes–hours', 'Hours', '$$'],
      ['Warm Standby', 'Minutes', 'Minutes–hours', '$$$'],
      ['Active/Active', 'Near zero', 'Near zero', '$$$$'],
      ['Interview', 'Aurora Global + S3 CRR for warm standby RPO < 5m', 'Define RPO/RTO before picking'],
    ],
  },
];

export const CHEAT_SHEET: string[][] = [
  ['Region vs AZ', 'Region = geographic · AZ = isolated DC within region — design multi-AZ first'],
  ['Private subnet + NAT', 'Private has no IGW route — NAT Gateway in public subnet for outbound internet'],
  ['RDS public', 'Never — app in VPC connects privately; public = attack surface'],
  ['IAM role on EC2', 'Instance profile → temp creds — no access keys on disk'],
  ['S3 consistency', 'Read-after-write for new objects; overwrite eventual in rare cases — use versioning for critical'],
  ['SQS visibility', 'Message hidden during processing — extend if work > timeout or duplicate processing'],
  ['DynamoDB hot key', 'Split partition key suffix {userId}#{shard} — or write sharding'],
  ['ALB 503', 'No healthy targets — check health path, security group, container port mapping'],
  ['NAT Gateway cost', 'Per-hour + per-GB — VPC endpoints for S3/DynamoDB avoid NAT data charges'],
  ['MSK vs self-managed', 'MSK = AWS patches brokers, integrates IAM — pay for broker hours'],
];
