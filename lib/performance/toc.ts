import type {TocItem} from './types';

export const PERF_TOC: TocItem[] = [
  {id: 'loop', label: '00. 10-step loop'},
  {id: 'fundamentals', label: '01. Fundamentals'},
  {id: 'pyramid', label: '02. Performance pyramid'},
  {id: 'api', label: '03. API · HTTP'},
  {id: 'java', label: '04. Java · collections · streams'},
  {id: 'concurrency', label: '05. Concurrency · pools'},
  {id: 'virtual-threads', label: '06. Virtual threads'},
  {id: 'jvm', label: '07. JVM'},
  {id: 'gc', label: '08. Garbage collection'},
  {id: 'spring', label: '09. Spring · Boot'},
  {id: 'mvc-webflux', label: '10. MVC · WebFlux'},
  {id: 'jpa', label: '11. JPA · Hibernate'},
  {id: 'database', label: '12. Database · SQL · indexes'},
  {id: 'pool', label: '13. Connection pools'},
  {id: 'cache', label: '14. Caching · Redis'},
  {id: 'microservices', label: '15. Microservices'},
  {id: 'kafka', label: '16. Kafka'},
  {id: 'serialization', label: '17. Serialization · logging'},
  {id: 'aws-compute', label: '18. AWS compute · LB · CDN'},
  {id: 'aws-data', label: '19. AWS data · network'},
  {id: 'observe', label: '20. Observability · profiling'},
  {id: 'testing', label: '21. Load test · capacity'},
  {id: 'playbook', label: '22. Troubleshooting playbook'},
  {id: 'antipatterns', label: '23. Anti-patterns'},
  {id: 'before-after', label: '24. Before vs after'},
  {id: 'cases', label: '25. Case studies'},
  {id: 'matrix', label: '26. Decision matrix'},
  {id: 'interview', label: '27. Interview mode'},
  {id: 'cheat', label: '28. Cheat sheet · formulas · rules'},
  {id: 'playbooks', label: '29. Deep playbooks'},
];

export const MEMORY_SENTENCE =
  'Measure → baseline → find the bottleneck → optimize that bottleneck → load-test → prove with P95/P99 → deploy safely → monitor. Never cargo-cult threads, pools, indexes, cache, or CPU.';

export const VERSION_NOTE =
  'Java 21 · Spring Boot 3 · HikariCP · PostgreSQL/MySQL · Redis · Kafka · AWS (ALB/ECS/RDS/Aurora/DynamoDB/ElastiCache). Related: /resilience4j · /api-gateway · /kafka-interview · /redis-interview · /load-balancing · /production-troubleshooting.';
