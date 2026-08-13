import type {GwTopic} from './types';

export const TOPICS_A: GwTopic[] = [
  {
    id: 'responsibilities',
    title: 'API Gateway Responsibilities',
    badge: 'Map',
    problem: 'Clients reinvent auth, CORS, rate limit, TLS on every microservice.',
    whenToUse: 'Cross-cutting north-south API concerns at the edge.',
    whenAvoid: 'Putting business rules that belong in domain services into the gateway.',
    mermaid: `flowchart TB
  GW[API GATEWAY]
  GW --> R[Routing]
  GW --> S[Security]
  GW --> T[Traffic]
  GW --> X[Transform]
  GW --> O[Observability]
  R --> Path
  S --> JWT
  T --> RateLimit
  X --> Headers
  O --> Logs`,
    code: `Problem → Gateway → Solution → Example
Many URLs → routing → /api/payments/** → payment-service
Dup auth → JWT/OAuth authorizer → validate once at edge
Abuse → rate limit/throttle → 429 + Retry-After
CORS dup → gateway CORS → OPTIONS policy
Opaque topology → hide internals → single public hostname
No corrId → propagate X-Trace-Id / W3C traceparent
Mixed versions → /v1 /v2 routes → canary weights

Also: TLS term, API keys, validation, WAF, aggregation/BFF,
timeouts, optional retry/CB, IP allowlists, protocol translate`,
    failure: 'Gateway becomes a mini-ESB with brittle transforms.',
    production: 'Keep policies declarative; business logic in services.',
    interview30s: 'Gateway = controlled client entry for routing, security, traffic, transform, observability.',
    followUp: 'Which concerns stay in services too?',
    tradeoff: 'Central control vs gateway complexity/latency.',
    memoryTrick: 'Gateway = CONTROL plane for APIs.',
  },
  {
    id: 'types',
    title: 'Gateway Types',
    badge: 'Types',
    problem: 'Pick managed vs Spring Cloud vs enterprise APIM.',
    whenToUse: 'Match ops model: cloud-managed, K8s self-managed, or full APIM.',
    whenAvoid: 'Assuming all products share identical CB/retry semantics.',
    mermaid: `flowchart TB
  T[API GATEWAY TYPES]
  T --> M[Managed: AWS APIGW Azure APIM]
  T --> O[Open: Spring Cloud Gateway Kong APISIX Envoy]
  T --> E[Enterprise: Apigee MuleSoft]
  T --> C[Custom]`,
    code: `| Type | Examples | Strength |
| Managed | AWS API Gateway | AuthZ, stages, serverless |
| Self-managed | Spring Cloud Gateway | Java team ownership, K8s |
| Enterprise APIM | Apigee | Product catalog, monetization |

Interview pick:
  AWS-heavy shop → HTTP/REST API Gateway + ALB/Lambda
  Spring mesh → SCG on EKS behind ALB + Cognito/JWT`,
    failure: 'Lock-in without exit strategy / multi-cloud fantasy.',
    production: 'Document product limits (timeouts, payload, WebSocket).',
    interview30s: 'Managed vs self-managed vs APIM — choose by ops + features, not hype.',
    followUp: 'HTTP API vs REST API on AWS?',
    tradeoff: 'Speed of managed vs control of SCG.',
    memoryTrick: 'Buy edge · build only if you must.',
  },
  {
    id: 'spring',
    title: 'Spring Cloud Gateway — Routes & Filters',
    badge: 'Spring',
    problem: 'Route /api/payments/** to payment-service with corrId filter.',
    whenToUse: 'Java teams running reactive gateway on K8s/ECS.',
    whenAvoid: 'Blocking work on Netty event loop inside filters.',
    mermaid: `flowchart TD
  C[Client] --> SCG[Spring Cloud Gateway]
  SCG --> PRE[Pre: auth log rateId]
  PRE --> RT[Route]
  RT --> BE[Payment]
  BE --> POST[Post: metrics headers]
  POST --> C`,
    code: `// dependency: spring-cloud-starter-gateway

spring.cloud.gateway.routes:
  - id: payment-service
    uri: lb://payment-service   # or http://payment-service
    predicates:
      - Path=/api/payments/**
      - Method=GET,POST
      - Header=X-Tenant-Id, .+
    filters:
      - RewritePath=/api/payments/(?<seg>.*), /$\\{seg}
      - name: RequestRateLimiter
        args:
          redis-rate-limiter.replenishRate: 100
          redis-rate-limiter.burstCapacity: 200

@Component
class CorrelationIdFilter implements GlobalFilter, Ordered {
  public Mono<Void> filter(ServerWebExchange ex, GatewayFilterChain chain) {
    String incoming = ex.getRequest().getHeaders().getFirst("traceparent");
    String id = incoming != null ? incoming : UUID.randomUUID().toString();
    ServerHttpRequest req = ex.getRequest().mutate().header("X-Trace-Id", id).build();
    ex.getResponse().getHeaders().add("X-Trace-Id", id);
    return chain.filter(ex.mutate().request(req).build());
  }
  public int getOrder() { return -1; }
}

// Prefer propagate existing W3C/B3 IDs — do not mint unrelated IDs every hop`,
    failure: 'Self-invocation style mistakes N/A; blocking JDBC in filter stalls all routes.',
    production: 'Actuator health readiness; Redis rate limiter; route config in Git.',
    interview30s: 'Predicates select route; filters pre/post; GlobalFilter for cross-cutting.',
    followUp: 'Path vs Header vs Host predicates?',
    tradeoff: 'YAML routes vs dynamic RouteLocator code.',
    memoryTrick: 'Predicate = match · Filter = mutate.',
  },
  {
    id: 'auth',
    title: 'Authentication · Authorization · JWT',
    badge: 'Security',
    problem: 'Where does JWT validation live — gateway, service, or both?',
    whenToUse: 'Public APIs and multi-service north-south auth boundary.',
    whenAvoid: 'Gateway-only auth for highly sensitive money operations without defense-in-depth.',
    mermaid: `flowchart TD
  CL[Client] --> AS[Auth Server]
  AS --> JWT
  JWT --> GW[API Gateway]
  GW --> V[Validate iss aud exp sig]
  V --> SVC[Microservice]
  SVC --> D[Defense in depth]`,
    code: `Authentication = Who are you?
Authorization  = What may you do?

Gateway: first security boundary (JWT/OAuth authorizer, API keys, IAM)
Service: re-check roles/scopes for sensitive ops (payments)

Spring Security OAuth2 Resource Server on SCG or AWS JWT authorizer.

IdP outage:
  fail CLOSED for new unauthenticated traffic
  cached JWKS may allow existing valid tokens until expiry
  NEVER bypass auth "to keep payments up"`,
    failure: 'Trusting gateway headers without signature verification at service.',
    production: 'Short-lived tokens, audience per API, rotate keys, audit denials.',
    interview30s: 'Gateway validates identity at edge; services still authorize sensitive actions.',
    followUp: 'API keys vs JWT?',
    tradeoff: 'Latency of double-check vs blast radius of forged headers.',
    memoryTrick: 'Edge says who · Domain says what.',
  },
  {
    id: 'ratelimit',
    title: 'Rate Limiting · Throttling · Token Bucket',
    badge: 'Traffic',
    problem: '10k rps burst — protect backends and be fair to tenants.',
    whenToUse: 'Abuse control, tenant quotas, spike smoothing.',
    whenAvoid: 'Per-instance counters as if they were global cluster limits.',
    mermaid: `flowchart TD
  REQ[Request] --> B[Bucket tokens]
  B -->|YES| OK[Allow]
  B -->|NO| R429[429]
  ALG[Token Bucket / Leaky / Fixed / Sliding]
  TEN[Tenant A 1000/min · B 100/min]`,
    code: `Rate limiting = control rate
Throttling    = slow/restrict when over limit

Token bucket: refill r tokens/sec, burst capacity b
Fixed window: easy, boundary burst
Sliding window: smoother, more state

// Simple in-process (lab) — production uses Redis/GCRA/API GW usage plans
class TokenBucket {
  final long capacity; final double refillPerSec;
  double tokens; long lastNanos;
  synchronized boolean tryConsume() {
    long now = System.nanoTime();
    tokens = Math.min(capacity, tokens + (now-lastNanos)/1e9 * refillPerSec);
    lastNanos = now;
    if (tokens < 1) return false;
    tokens -= 1; return true;
  }
}

N gateways × local 100/s ≈ N×100 cluster QPS — use Redis/AWS usage plans`,
    failure: 'Retry storm after 429 without Retry-After/backoff.',
    production: 'Tenant-aware keys; separate burst vs sustained; alert on 429 ratio.',
    interview30s: 'Token bucket for burst; distribute limit state; 429 with client backoff.',
    followUp: 'Leaky vs token bucket?',
    tradeoff: 'Fairness accuracy vs Redis latency.',
    memoryTrick: 'Local tickets ≠ stadium capacity.',
  },
];
