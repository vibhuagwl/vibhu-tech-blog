import type {TocItem} from './types';

export const AWS_TOC: TocItem[] = [
  {id: 'master-map', label: 'AWS master map', group: 'Overview'},
  {id: 'memory-diagrams', label: 'Memory diagrams', group: 'Overview'},
  {id: 'cheat-sheet', label: 'Comparison cheat sheet', group: 'Overview'},
  {id: 'revision-path', label: '45-min revision path', group: 'Overview'},
  {id: 'question-bank', label: 'Interview question bank', group: 'Overview'},

  {id: 'aws-fundamentals', label: 'AWS fundamentals', group: 'Foundations'},
  {id: 'iam', label: 'IAM deep dive', group: 'Foundations'},

  {id: 'ec2', label: 'EC2 & Auto Scaling', group: 'Compute'},
  {id: 'ecs', label: 'ECS & Fargate', group: 'Compute'},
  {id: 'eks', label: 'EKS / Kubernetes', group: 'Compute'},
  {id: 'lambda', label: 'Lambda', group: 'Compute'},

  {id: 'vpc', label: 'VPC (deep dive)', group: 'Network'},
  {id: 'load-balancing', label: 'ALB / NLB / GWLB', group: 'Network'},
  {id: 'route53', label: 'Route 53', group: 'Network'},

  {id: 's3', label: 'S3', group: 'Storage & Data'},
  {id: 'storage-compare', label: 'EBS vs EFS vs S3', group: 'Storage & Data'},
  {id: 'rds', label: 'RDS', group: 'Storage & Data'},
  {id: 'aurora', label: 'Aurora', group: 'Storage & Data'},
  {id: 'dynamodb', label: 'DynamoDB', group: 'Storage & Data'},
  {id: 'elasticache', label: 'ElastiCache / Redis', group: 'Storage & Data'},

  {id: 'sqs-sns-eventbridge', label: 'SQS / SNS / EventBridge', group: 'Messaging'},
  {id: 'msk-kafka', label: 'MSK / Kafka on AWS', group: 'Messaging'},

  {id: 'aws-security-stack', label: 'AWS security stack', group: 'Security'},
  {id: 'kms', label: 'KMS', group: 'Security'},
  {id: 'secrets-manager', label: 'Secrets Manager', group: 'Security'},
  {id: 'api-gateway', label: 'API Gateway', group: 'Security'},

  {id: 'cloudwatch', label: 'CloudWatch', group: 'Ops & Reliability'},
  {id: 'cloudtrail', label: 'CloudTrail', group: 'Ops & Reliability'},
  {id: 'observability', label: 'Observability & X-Ray', group: 'Ops & Reliability'},
  {id: 'autoscaling-ha', label: 'Auto Scaling & HA', group: 'Ops & Reliability'},
  {id: 'disaster-recovery', label: 'Disaster recovery', group: 'Ops & Reliability'},
  {id: 'cost-optimization', label: 'Cost optimization', group: 'Ops & Reliability'},
  {id: 'troubleshooting', label: 'Production troubleshooting', group: 'Ops & Reliability'},

  {id: 'system-design', label: 'System design (Staff)', group: 'Design'},
  {id: 'architecture-patterns', label: 'Architecture patterns', group: 'Design'},
  {id: 'fintech-architecture', label: 'FinTech on AWS', group: 'Design'},
  {id: 'spring-aws', label: 'Spring Boot + AWS', group: 'Design'},
];
