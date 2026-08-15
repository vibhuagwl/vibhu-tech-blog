import type {TocItem} from './types';

export const PERF_TOC: TocItem[] = [
  {id: 'master', label: '00. Investigation master framework'},
  {id: 'loop', label: '01. 10-step loop'},
  {id: 'fundamentals', label: '02. Fundamentals'},
  {id: 'pyramid', label: '03. Performance pyramid'},
  {id: 'math', label: '04. Perf math · Little / Amdahl / USL'},
  {id: 'api', label: '05. API · HTTP'},
  {id: 'networking', label: '06. Networking deep'},
  {id: 'dist-api', label: '07. Distributed API resilience'},
  {id: 'java', label: '08. Java · collections · streams'},
  {id: 'concurrency', label: '09. Concurrency · pools'},
  {id: 'virtual-threads', label: '10. Virtual threads · Java 21'},
  {id: 'jvm', label: '11. JVM'},
  {id: 'jvm-internals', label: '12. JVM internals · JIT'},
  {id: 'gc', label: '13. Garbage collection'},
  {id: 'gc-deep', label: '14. GC deep dive'},
  {id: 'spring', label: '15. Spring · Boot'},
  {id: 'mvc-webflux', label: '16. MVC · WebFlux'},
  {id: 'jpa', label: '17. JPA · Hibernate'},
  {id: 'database', label: '18. Database · SQL · indexes'},
  {id: 'db-internals', label: '19. DB internals · MVCC · WAL'},
  {id: 'pool', label: '20. Connection pools'},
  {id: 'cache', label: '21. Caching · Redis'},
  {id: 'cache-adv', label: '22. Advanced caching'},
  {id: 'microservices', label: '23. Microservices'},
  {id: 'distributed', label: '24. Distributed systems perf'},
  {id: 'kafka', label: '25. Kafka'},
  {id: 'kafka-deep', label: '26. Kafka deep'},
  {id: 'serialization', label: '27. Serialization · logging'},
  {id: 'aws-compute', label: '28. AWS compute · LB · CDN'},
  {id: 'aws-data', label: '29. AWS data · network'},
  {id: 'aws-cost', label: '30. AWS cost × performance'},
  {id: 'observe', label: '31. Observability · profiling'},
  {id: 'testing', label: '32. Load test · capacity'},
  {id: 'jmh', label: '33. JMH · methodology'},
  {id: 'playbook', label: '34. Troubleshooting playbook'},
  {id: 'antipatterns', label: '35. Anti-patterns'},
  {id: 'before-after', label: '36. Before vs after'},
  {id: 'cases', label: '37. Case studies'},
  {id: 'matrix', label: '38. Decision matrix'},
  {id: 'interview', label: '39. Interview mode'},
  {id: 'cheat', label: '40. Cheat sheet · formulas · rules'},
  {id: 'playbooks', label: '41. Deep playbooks'},
];

export const MEMORY_SENTENCE =
  'Measure → baseline → find the bottleneck → optimize ONE thing → load-test → prove with P95/P99 → deploy safely → monitor. Performance = latency + throughput + reliability + cost. Never cargo-cult threads, pools, indexes, cache, or CPU.';

export const VERSION_NOTE =
  'Java 21 · Spring Boot 3 · HikariCP · PostgreSQL/MySQL · Redis · Kafka · AWS (ALB/ECS/RDS/Aurora/DynamoDB/ElastiCache) · JIT/GC internals · JMH. Related: /resilience4j · /api-gateway · /kafka-interview · /redis-interview · /load-balancing · /cap-theorem · /distributed-locking · /production-troubleshooting.';
