import type {TocItem} from './types';

/** Full page TOC — every id is always present in the DOM (no gated mounts). */
export const MSC_TOC: TocItem[] = [
  {id: 'overview', label: '00. Start here · interview spine'},
  {id: 'why-comm', label: '01. Why services talk · sync vs async'},
  {id: 'stories', label: '02. Story theater'},
  {id: 'production-decisions', label: '03. REST · Kafka · hybrid · failures'},
  {id: 'payment-case', label: '04. Payment platform case study'},
  {id: 'taxonomy', label: '05. Complete taxonomy'},
  {id: 'options', label: '06. All options compared'},
  {id: 'extras', label: '07. RSocket · webhooks · SSE · CDC'},
  {id: 'rest-clients', label: '08. RestClient · WebClient · Feign'},
  {id: 'discovery-lb', label: '09. Discovery · K8s · LB'},
  {id: 'grpc', label: '10. gRPC'},
  {id: 'async', label: '11. Kafka · brokers · events'},
  {id: 'gateway-mesh', label: '12. Gateway · mesh (infra)'},
  {id: 'resilience', label: '13. Timeout · retry · CB · bulkhead'},
  {id: 'idempotency', label: '14. Idempotency · saga'},
  {id: 'security-obs', label: '15. Security · tracing · perf'},
  {id: 'capacity', label: '16. Capacity · Little’s Law'},
  {id: 'architectures', label: '17. Payment · ecommerce · banking'},
  {id: 'antipatterns', label: '18. Anti-patterns · bad vs good'},
  {id: 'choose', label: '19. Which would you choose?'},
  {id: 'incidents', label: '20. Production incidents'},
  {id: 'failure-matrix', label: '21. Failure matrix'},
  {id: 'spoken', label: '22. 30s / 2m / 5m answers'},
  {id: 'tricks', label: '23. Trick questions'},
  {id: 'interview', label: '24. Interview mode'},
  {id: 'cheatsheet', label: '25. Cheat sheet · tech revision'},
  {id: 'checklist', label: '26. Coverage checklist'},
];

/** Shorter TOC when focusing on story / spoken interview path. */
export const MSC_STORY_TOC_IDS = new Set([
  'overview',
  'why-comm',
  'stories',
  'production-decisions',
  'payment-case',
  'choose',
  'incidents',
  'failure-matrix',
  'spoken',
  'tricks',
  'interview',
  'cheatsheet',
  'checklist',
]);

export const MEMORY_SENTENCE =
  'Problem → sync or async? → REST/gRPC now or Kafka after commit? → timeout · idempotent retry · CB · bulkhead · outbox · DLQ · trace. Hybrid platforms. Never claim broker exactly-once = business exactly-once.';

export const VERSION_NOTE =
  'Java 21 · Spring Boot 3. Production/interview rewrite: FinTech flows, decision matrices, failure playbooks. Related: /resilience4j · /api-gateway · /kafka-interview · /microservices-patterns · /oauth-jwt-demo.';
