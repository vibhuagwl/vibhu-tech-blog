import type {PatternCard} from './types';
import {enrichPatterns} from './enrich';
import {DECOMPOSE_PATTERNS, GATEWAY_PATTERNS, DECOMPOSE_ASCII, GATEWAY_ASCII} from './parts-decompose-gateway';
import {DISCOVERY_PATTERNS, LOAD_BALANCE_PATTERNS, RESILIENCE_PATTERNS} from './parts-discovery-lb-resilience';
import {
  TRANSACTION_PATTERNS,
  DATA_PATTERNS,
  MESSAGING_PATTERNS,
  KAFKA_PATTERNS,
} from './parts-tx-data-messaging-kafka';
import {
  CACHING_PATTERNS,
  LOCKING_PATTERNS,
  CONSISTENCY_PATTERNS,
  MESH_PATTERNS,
} from './parts-cache-lock-consistency-mesh';
import {
  SECURITY_PATTERNS,
  OBSERVABILITY_PATTERNS,
  DEPLOY_PATTERNS,
  VERSIONING_PATTERNS,
  GOF_PATTERNS,
  EIP_PATTERNS,
} from './parts-security-obs-deploy-gof-eip';
import {DISTRIBUTED_PATTERNS, ANTI_PATTERN_CARDS} from './parts-distributed-antipatterns';

export {
  DECOMPOSE_ASCII,
  GATEWAY_ASCII,
  DECOMPOSE_PATTERNS,
  GATEWAY_PATTERNS,
  DISCOVERY_PATTERNS,
  LOAD_BALANCE_PATTERNS,
  RESILIENCE_PATTERNS,
  TRANSACTION_PATTERNS,
  DATA_PATTERNS,
  MESSAGING_PATTERNS,
  KAFKA_PATTERNS,
  CACHING_PATTERNS,
  LOCKING_PATTERNS,
  CONSISTENCY_PATTERNS,
  MESH_PATTERNS,
  SECURITY_PATTERNS,
  OBSERVABILITY_PATTERNS,
  DEPLOY_PATTERNS,
  VERSIONING_PATTERNS,
  GOF_PATTERNS,
  EIP_PATTERNS,
  DISTRIBUTED_PATTERNS,
  ANTI_PATTERN_CARDS,
};

export type PatternGroup = {
  id: string;
  part: number;
  title: string;
  lead: string;
  patterns: PatternCard[];
};

const RAW_PATTERN_GROUPS: PatternGroup[] = [
  {
    id: 'decompose',
    part: 1,
    title: 'Decomposition',
    lead: 'Business capability · subdomain · strangler · ACL · branch by abstraction.',
    patterns: DECOMPOSE_PATTERNS,
  },
  {
    id: 'gateway',
    part: 2,
    title: 'API Gateway · BFF · Aggregation',
    lead: 'Edge routing, client-specific APIs, parallel composition with failure isolation.',
    patterns: GATEWAY_PATTERNS,
  },
  {
    id: 'discovery',
    part: 3,
    title: 'Service Discovery',
    lead: 'Client-side (Eureka) vs server-side (Kubernetes DNS/Service).',
    patterns: DISCOVERY_PATTERNS,
  },
  {
    id: 'loadbalance',
    part: 4,
    title: 'Load Balancing',
    lead: 'Round robin · weighted · random · least connection · consistent hashing.',
    patterns: LOAD_BALANCE_PATTERNS,
  },
  {
    id: 'resilience',
    part: 5,
    title: 'Resilience',
    lead: 'Timeout · retry · circuit breaker · bulkhead · rate limit · backpressure · shedding · fallback · hedges.',
    patterns: RESILIENCE_PATTERNS,
  },
  {
    id: 'transactions',
    part: 6,
    title: 'Distributed Transactions',
    lead: 'Saga choreography/orchestration · 2PC · TCC.',
    patterns: TRANSACTION_PATTERNS,
  },
  {
    id: 'data',
    part: 7,
    title: 'Data Management',
    lead: 'DB per service · composition · CQRS · event sourcing · materialized views.',
    patterns: DATA_PATTERNS,
  },
  {
    id: 'messaging',
    part: 8,
    title: 'Transactional Messaging',
    lead: 'Outbox · inbox · idempotent consumers.',
    patterns: MESSAGING_PATTERNS,
  },
  {
    id: 'kafka',
    part: 9,
    title: 'Kafka Patterns',
    lead: 'Notification · ECST · competing consumers · retry/DLQ · ordering · lag.',
    patterns: KAFKA_PATTERNS,
  },
  {
    id: 'caching',
    part: 10,
    title: 'Caching & Cache Failures',
    lead: 'Aside/through/behind/ahead · stampede · penetration · avalanche · hot key.',
    patterns: CACHING_PATTERNS,
  },
  {
    id: 'locking',
    part: 11,
    title: 'Distributed Locking',
    lead: 'DB · Redis · Redisson · lease · fencing token.',
    patterns: LOCKING_PATTERNS,
  },
  {
    id: 'consistency',
    part: 12,
    title: 'Consistency Models',
    lead: 'Strong · eventual · RYW · monotonic · optimistic/pessimistic locking.',
    patterns: CONSISTENCY_PATTERNS,
  },
  {
    id: 'mesh',
    part: 13,
    title: 'Service Mesh',
    lead: 'Sidecar · Envoy · Istio · mTLS · traffic split · canary.',
    patterns: MESH_PATTERNS,
  },
  {
    id: 'security',
    part: 14,
    title: 'Security',
    lead: 'OAuth2 · OIDC · JWT · mTLS · RBAC/ABAC · token exchange · secrets.',
    patterns: SECURITY_PATTERNS,
  },
  {
    id: 'observability',
    part: 15,
    title: 'Observability',
    lead: 'Structured logs · RED metrics · OpenTelemetry traces.',
    patterns: OBSERVABILITY_PATTERNS,
  },
  {
    id: 'deploy',
    part: 16,
    title: 'Deployment',
    lead: 'Blue-green · canary · rolling · shadow · feature flags · dark launch.',
    patterns: DEPLOY_PATTERNS,
  },
  {
    id: 'versioning',
    part: 17,
    title: 'API Versioning',
    lead: 'URI · header · media-type · compatibility contracts.',
    patterns: VERSIONING_PATTERNS,
  },
  {
    id: 'gof',
    part: 18,
    title: 'GoF (microservice lens)',
    lead: 'All 23 classic patterns with Spring/production framing.',
    patterns: GOF_PATTERNS,
  },
  {
    id: 'eip',
    part: 19,
    title: 'Enterprise Integration',
    lead: 'Router · filter · translator · enricher · aggregator · splitter · resequencer · claim check · DLQ.',
    patterns: EIP_PATTERNS,
  },
  {
    id: 'distributed',
    part: 20,
    title: 'Distributed Primitives',
    lead: 'Leader election · quorum · gossip · clocks · Snowflake · fencing.',
    patterns: DISTRIBUTED_PATTERNS,
  },
  {
    id: 'antipatterns',
    part: 21,
    title: 'Anti-patterns → Refactors',
    lead: 'Distributed monolith · chatty · nano · god · retry storm · missing timeout/idempotency.',
    patterns: ANTI_PATTERN_CARDS,
  },
];

export const PATTERN_GROUPS: PatternGroup[] = RAW_PATTERN_GROUPS.map((group) => ({
  ...group,
  patterns: enrichPatterns(group.patterns),
}));

export const ALL_PATTERNS: PatternCard[] = PATTERN_GROUPS.flatMap((g) => g.patterns);
