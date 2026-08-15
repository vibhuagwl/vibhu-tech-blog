import type {TocItem} from './types';

/** Maps the Microservices Design Patterns master curriculum (Parts 1–27). */
export const MSP_TOC: TocItem[] = [
  {id: 'overview', label: '00. Overview · how to use'},
  {id: 'decompose', label: '01. Decomposition patterns'},
  {id: 'gateway', label: '02. API Gateway · BFF · aggregation'},
  {id: 'discovery', label: '03. Service discovery'},
  {id: 'loadbalance', label: '04. Load balancing algorithms'},
  {id: 'resilience', label: '05. Resilience patterns'},
  {id: 'transactions', label: '06. Distributed transactions'},
  {id: 'data', label: '07. Data management · CQRS · ES'},
  {id: 'messaging', label: '08. Outbox · Inbox · idempotency'},
  {id: 'kafka', label: '09. Kafka patterns'},
  {id: 'caching', label: '10. Caching · stampede · hot key'},
  {id: 'locking', label: '11. Distributed locking'},
  {id: 'consistency', label: '12. Consistency models'},
  {id: 'mesh', label: '13. Service mesh'},
  {id: 'security', label: '14. Security patterns'},
  {id: 'observability', label: '15. Observability'},
  {id: 'deploy', label: '16. Deployment patterns'},
  {id: 'versioning', label: '17. API versioning'},
  {id: 'gof', label: '18. GoF patterns (microservice lens)'},
  {id: 'eip', label: '19. Enterprise integration patterns'},
  {id: 'distributed', label: '20. Distributed system primitives'},
  {id: 'antipatterns', label: '21. Anti-patterns → refactors'},
  {id: 'project', label: '22. Production project · lab'},
  {id: 'testing', label: '23. Testing strategy'},
  {id: 'performance', label: '24. Performance at scale'},
  {id: 'interview', label: '25. Interview master bank'},
  {id: 'decisions', label: '26. Decision trees'},
  {id: 'cheatsheet', label: '27. Cheat sheet · matrix'},
];

export const MEMORY_SENTENCE =
  'Decompose by capability → own your data → communicate async with outbox/inbox → isolate failures with timeout/retry/CB/bulkhead → prove correctness with idempotency + tests.';

export const VERSION_NOTE =
  'Baseline: Java 21 · Spring Boot 3.x · Spring Cloud Gateway · Spring Kafka · Resilience4j · Redis · PostgreSQL · Testcontainers · WireMock · OpenTelemetry. Pattern lab (no Docker) + spring-msp-platform (Docker Compose e2e). Deep labs linked where the site already has full modules.';
