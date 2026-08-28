import {TOPICS_COMPUTE} from './topics-compute';
import {TOPICS_DATA} from './topics-data';
import {TOPICS_DESIGN} from './topics-design';
import {TOPICS_FUNDAMENTALS} from './topics-fundamentals';
import {TOPICS_MESSAGING} from './topics-messaging';
import {TOPICS_NETWORK} from './topics-network';
import {TOPICS_OPS} from './topics-ops';
import {TOPICS_SECURITY} from './topics-security';
import {TOPICS_SPRING} from './topics-spring';
import type {AwsTopic} from './types';

export const TOPICS: AwsTopic[] = [
  ...TOPICS_FUNDAMENTALS,
  ...TOPICS_COMPUTE,
  ...TOPICS_NETWORK,
  ...TOPICS_DATA,
  ...TOPICS_MESSAGING,
  ...TOPICS_SECURITY,
  ...TOPICS_OPS,
  ...TOPICS_DESIGN,
  ...TOPICS_SPRING,
];

export const TOPIC_BY_ID: Record<string, AwsTopic> = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

export const VERSION_NOTE =
  'AWS 2025/2026 · Java 21 · Spring Boot 3.4 · ~70% CLI/config/code · ~30% theory. Senior/Staff/Architect interview revision. Sibling: /cost-optimization · /spring-security · /kafka-production';

export const INTERVIEW_SIXTY_SEC =
  'AWS Staff whiteboard: Route53 → ALB (TLS) → ECS/EKS → Aurora/DynamoDB · private subnets + NAT · IAM roles not keys · KMS envelope · SQS/MSK for async · CloudWatch + X-Ray · Multi-AZ + DR RPO/RTO · cost = NAT + data transfer + over-provision.';

export const INTERVIEW_FIVE_MIN =
  'FinTech payment on AWS: public ALB + WAF, ECS Fargate Spring Boot in private subnets, Aurora Multi-AZ writer + read replicas, DynamoDB idempotency table, ElastiCache balance cache, MSK payment events, Secrets Manager DB creds, KMS CMK, CloudTrail audit. Deep dive VPC (NAT for egress, RDS never public), IAM task role, Multi-AZ vs replica, SQS DLQ vs Kafka, DR warm standby RPO 5m.';
