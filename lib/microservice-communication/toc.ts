import type {TocItem} from './types';

export const MSC_TOC: TocItem[] = [
  {id: 'overview', label: '00. Start here'},
  {id: 'taxonomy', label: '01. Complete taxonomy'},
  {id: 'stories', label: '02. Story theater'},
  {id: 'options', label: '03. All options compared'},
  {id: 'extras', label: '04. RSocket · webhooks · SSE · CDC'},
  {id: 'rest-clients', label: '05. RestClient · WebClient · Feign'},
  {id: 'discovery-lb', label: '06. Discovery · K8s · LB'},
  {id: 'grpc', label: '07. gRPC'},
  {id: 'async', label: '08. Kafka · brokers · events'},
  {id: 'gateway-mesh', label: '09. Gateway · mesh (infra)'},
  {id: 'resilience', label: '10. Timeout · retry · CB · bulkhead'},
  {id: 'idempotency', label: '11. Idempotency · saga'},
  {id: 'security-obs', label: '12. Security · tracing'},
  {id: 'capacity', label: '13. Capacity · Little’s Law'},
  {id: 'architectures', label: '14. Payment · ecommerce · banking'},
  {id: 'antipatterns', label: '15. Anti-patterns'},
  {id: 'choose', label: '16. Which would you choose?'},
  {id: 'incidents', label: '17. Production incidents'},
  {id: 'failure-matrix', label: '18. Failure matrix'},
  {id: 'spoken', label: '19. 30s / 2m / 5m answers'},
  {id: 'tricks', label: '20. Trick questions'},
  {id: 'interview', label: '21. Interview mode'},
  {id: 'cheatsheet', label: '22. Cheat sheet · TRICKS-OLD'},
  {id: 'checklist', label: '23. Coverage checklist'},
];

export const MEMORY_SENTENCE =
  'Taxonomy first (mechanism ≠ infra). Immediate answer → REST/gRPC/RSocket. Fan-out → Kafka. Callbacks → webhooks. Large/batch → S3/SFTP. CDC for brownfield. Every sync call: TRICKS-OLD.';

export const VERSION_NOTE =
  'Java 21 · Spring Boot 3 / Framework 6+. RestClient modern sync; RestTemplate legacy. Also: RSocket, SSE, long poll, webhooks, CDC/Debezium, SFTP. Related: /resilience4j · /api-gateway · /kafka-interview · /microservices-patterns · /oauth-jwt-demo.';
