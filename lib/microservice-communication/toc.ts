import type {TocItem} from './types';

export const MSC_TOC: TocItem[] = [
  {id: 'overview', label: '00. Start here'},
  {id: 'stories', label: '01. Story theater'},
  {id: 'options', label: '02. All options compared'},
  {id: 'rest-clients', label: '03. RestClient · WebClient · Feign'},
  {id: 'discovery-lb', label: '04. Discovery · K8s · LB'},
  {id: 'grpc', label: '05. gRPC'},
  {id: 'async', label: '06. Kafka · brokers · events'},
  {id: 'gateway-mesh', label: '07. Gateway · mesh'},
  {id: 'resilience', label: '08. Timeout · retry · CB · bulkhead'},
  {id: 'idempotency', label: '09. Idempotency · saga'},
  {id: 'security-obs', label: '10. Security · tracing'},
  {id: 'capacity', label: '11. Capacity · Little’s Law'},
  {id: 'architectures', label: '12. Payment · ecommerce · banking'},
  {id: 'antipatterns', label: '13. Anti-patterns'},
  {id: 'choose', label: '14. Which would you choose?'},
  {id: 'incidents', label: '15. Production incidents'},
  {id: 'failure-matrix', label: '16. Failure matrix'},
  {id: 'spoken', label: '17. 30s / 2m / 5m answers'},
  {id: 'tricks', label: '18. Trick questions'},
  {id: 'interview', label: '19. Interview mode'},
  {id: 'cheatsheet', label: '20. Cheat sheet · TRICKS-OLD'},
  {id: 'checklist', label: '21. Coverage checklist'},
];

export const MEMORY_SENTENCE =
  'Immediate response → REST/gRPC. High-throughput fan-out → Kafka. Every sync call needs T·R·I·C·K·S·O·F·L·D: Timeout, Retry carefully, Idempotency, Circuit breaker, Kafka/async when fit, Security, Observability, Failure handling, Load balancing, Discovery.';

export const VERSION_NOTE =
  'Java 21 · Spring Boot 3 / Framework 6+. RestClient modern sync; RestTemplate legacy. Related: /resilience4j · /api-gateway · /kafka-interview · /microservices-patterns · /oauth-jwt-demo.';
