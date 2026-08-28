import type {TocItem} from './types';

/** Maps the Microservices Design Patterns master curriculum. */
export const MSP_TOC: TocItem[] = [
  {id: 'overview', label: '00. Overview · how to use'},
  {id: 'decompose', label: '01. Decomposition patterns'},
  {id: 'gateway', label: '02. API Gateway · BFF · aggregation'},
  {id: 'communication', label: '03. Communication patterns'},
  {id: 'discovery', label: '04. Service discovery'},
  {id: 'loadbalance', label: '05. Load balancing algorithms'},
  {id: 'resilience', label: '06. Resilience patterns'},
  {id: 'transactions', label: '07. Distributed transactions'},
  {id: 'data', label: '08. Data management · CQRS · ES'},
  {id: 'messaging', label: '09. Outbox · Inbox · idempotency'},
  {id: 'kafka', label: '10. Kafka patterns'},
  {id: 'caching', label: '11. Caching · stampede · hot key'},
  {id: 'locking', label: '12. Distributed locking'},
  {id: 'consistency', label: '13. Consistency models'},
  {id: 'mesh', label: '14. Service mesh'},
  {id: 'security', label: '15. Security patterns'},
  {id: 'observability', label: '16. Observability'},
  {id: 'deploy', label: '17. Deployment patterns'},
  {id: 'versioning', label: '18. API versioning'},
  {id: 'gof', label: '19. GoF patterns (microservice lens)'},
  {id: 'eip', label: '20. Enterprise integration patterns'},
  {id: 'distributed', label: '21. Distributed system primitives'},
  {id: 'antipatterns', label: '22. Anti-patterns → refactors'},
  {id: 'project', label: '23. Production project · lab'},
  {id: 'testing', label: '24. Testing strategy'},
  {id: 'performance', label: '25. Performance at scale'},
  {id: 'interview', label: '26. Interview master bank'},
  {id: 'decisions', label: '27. Decision trees'},
  {id: 'cheatsheet', label: '28. Cheat sheet · matrix'},
  {id: 'fintech-e2e', label: '29. FinTech end-to-end example'},
  {id: 'resilience-master', label: '30. Resilience master pattern'},
  {id: 'decision-guide', label: '31. Patterns decision guide'},
];

export const MEMORY_SENTENCE =
  'Decompose by capability → own your data → communicate async with outbox/inbox → isolate failures with timeout/retry/CB/bulkhead → prove correctness with idempotency + tests.';

export const VERSION_NOTE =
  'Baseline: Java 21 · Spring Boot 3.x · Spring Cloud Gateway · Spring Kafka · Resilience4j · Redis · PostgreSQL · Testcontainers · WireMock · OpenTelemetry. Pattern lab (no Docker) + spring-msp-platform (Docker Compose e2e). Deep labs linked where the site already has full modules.';
