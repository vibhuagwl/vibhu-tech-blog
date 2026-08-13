import type {GwTopic} from './types';

export const TOPICS_B: GwTopic[] = [
  {
    id: 'compare',
    title: 'Gateway vs Load Balancer vs Proxy vs Mesh',
    badge: 'Core',
    problem: 'Whiteboard: where does each sit and what question does it answer?',
    whenToUse: 'Architecture interviews and production layering.',
    whenAvoid: 'Double-retrying at gateway and mesh and app.',
    mermaid: `flowchart TB
  CL[Client] --> GW[API Gateway]
  GW --> LB[Load Balancer]
  LB --> MS[Microservices]
  MS --> MESH[Service Mesh sidecars]
  GW -.->|North-South| NS
  MESH -.->|East-West| EW`,
    code: `| Feature | LB | API Gateway |
| Distribute connections | Core | Sometimes |
| API auth / JWT | Limited | Strong |
| Rate limit / API keys | Limited | Core |
| Transform / versioning | Limited | Yes |
| Primary job | WHERE traffic goes | IS request allowed + HOW API handled |

Memory:
  LB = WHERE SHOULD TRAFFIC GO?
  GW = IS THIS REQUEST ALLOWED AND HOW HANDLED?
  Mesh = service-to-service (east-west)
  Reverse proxy = protect/route servers (Nginx)
  Gateway = API policy + security + traffic + obs

Default banking whiteboard:
  CloudFront → WAF → API Gateway → ALB → services
  (AWS layouts can vary by product)`,
    failure: 'Using ALB alone and reimplementing JWT/rate-limit in every service.',
    production: 'One retry owner; clear ADR for edge vs mesh policies.',
    interview30s: 'Gateway = API control; LB = distribute; Mesh = east-west.',
    followUp: 'When skip gateway?',
    tradeoff: 'Extra hop latency vs centralized policy.',
    memoryTrick: 'Control · Distribute · Business · Data · Mesh · WAF.',
  },
  {
    id: 'aws',
    title: 'AWS API Gateway — HTTP · REST · WebSocket',
    badge: 'AWS',
    problem: 'Choose API type and integrate Lambda vs ALB/Spring.',
    whenToUse: 'AWS-native edge with stages, authorizers, usage plans.',
    whenAvoid: 'Ignoring product timeouts/payload limits.',
    mermaid: `flowchart TD
  C[Client] --> APIGW[AWS API Gateway]
  APIGW --> L[Lambda]
  APIGW --> ALB
  APIGW --> ECS[ECS/EKS HTTP]
  APIGW --> WS[WebSocket APIs]`,
    code: `HTTP API  — cheaper/faster, JWT authorizers, good default for HTTP
REST API  — richer features, API keys, usage plans, more legacy tooling
WebSocket — stateful chat/notifications

Create flow: API → Route → Integration → Deploy → Stage → Test
Custom domain + ACM TLS + access logs → CloudWatch

# CLI sketch (no secrets/account hardcoding)
aws apigatewayv2 create-api --name payments --protocol-type HTTP
aws apigatewayv2 create-integration --api-id $API \\
  --integration-type HTTP_PROXY --integration-uri $ALB_URL
aws apigatewayv2 create-route --api-id $API \\
  --route-key 'GET /payments/{id}' --target integrations/$INT

Security: WAF → APIGW (JWT/IAM/API key) → throttle → private integration/VPC link
Cognito/OAuth: JWT authorizer on gateway; Spring still enforces scopes for money`,
    failure: 'REST/HTTP mix-up; oversized payloads; missing stage deploy.',
    production: 'Alarms on 4xx/5xx/latency; stage variables; canary deployments on REST.',
    interview30s: 'HTTP API for most HTTP; REST when you need APIM features; WS separate.',
    followUp: 'VPC link vs public HTTP integration?',
    tradeoff: 'Managed convenience vs cold-start/Lambda coupling.',
    memoryTrick: 'HTTP=simple · REST=features · WS=push.',
  },
  {
    id: 'cors',
    title: 'CORS · Versioning · Transform · BFF',
    badge: 'API Design',
    problem: 'Browser SPA + evolving payment APIs without breaking clients.',
    whenToUse: 'Browser clients, multi-version APIs, mobile BFF aggregation.',
    whenAvoid: 'Blind caching of authenticated payment responses; ESB-style transforms forever.',
    mermaid: `flowchart TD
  SPA[Angular/React] -->|OPTIONS| GW
  GW --> CORS
  GW --> V1[/api/v1/payments]
  GW --> V2[/api/v2/payments]
  MOB[Mobile] --> BFF[Gateway/BFF]
  BFF --> A & B & C`,
    code: `CORS: preflight OPTIONS · origins · methods · headers · credentials
Symptom "CORS error" may be a 500 without ACAO — check Network status first.

Versioning: URI /v1 /v2 · header · query — prefer URI for public clarity
Deprecate with sunset headers; keep backward compatibility window

Transform: customerId → customer_id — useful adapter, risky debt if endless

BFF aggregation:
  { customer, accounts, payments }
  Trade-off: fewer round trips vs fan-out latency + partial failure handling
  Do not hide money-side failures as empty success`,
    failure: 'Caching Authorization-varying responses at gateway.',
    production: 'Contract tests per version; BFF timeouts per dependency.',
    interview30s: 'CORS at edge; version in route; BFF aggregates carefully with partial failure.',
    followUp: 'Header vs URI versioning?',
    tradeoff: 'Client convenience vs gateway complexity.',
    memoryTrick: 'OPTIONS first · versions explicit · BFF ≠ fake OK.',
  },
  {
    id: 'resilience',
    title: 'Timeout · Retry · Circuit · Idempotency',
    badge: 'Safety',
    problem: 'Gateway 504s and duplicate payments from retries.',
    whenToUse: 'Bound waits; retry only safe ops; CB when product/layer supports.',
    whenAvoid: 'Unbounded gateway retries on POST /payments.',
    mermaid: `flowchart TD
  CL --> GW --> LB --> PAY --> DB
  GW -->|timeout| T504[504]
  GW -->|retry x3| STORM[Retry storm]
  PAY --> IDEM[Idempotency-Key]`,
    code: `Timeout hierarchy (illustrative ordering, tune to SLOs):
  Client > Gateway > LB idle > Service > DB

Retry: only idempotent/safe; bounded + backoff + jitter + CB
POST /payments + Idempotency-Key: PAY-123
  already processed → return stored result
  else process once

If gateway lacks native CB, implement Resilience4j on services
and fail-fast at edge with health/outlier detection where available.

Bulkhead idea: isolate reporting vs payment route pools so reporting meltdown
does not starve payment.`,
    failure: 'Gateway retry amplifies overloaded payment service.',
    production: 'Idempotency store (Redis/DB unique); disable nested retries.',
    interview30s: 'Timeouts nested; retries need idempotency; CB fail-fast; never fake paid.',
    followUp: '504 root cause usually?',
    tradeoff: 'Client retries vs gateway retries ownership.',
    memoryTrick: 'Money needs keys · Retries need brakes.',
  },
  {
    id: 'ha',
    title: 'HA · Instance Failure · Config Rollback',
    badge: 'Ops',
    problem: 'One gateway pod dies or bad route ships — users must not.',
    whenToUse: 'All production gateways.',
    whenAvoid: 'Sticky in-memory rate-limit/auth state on instances.',
    mermaid: `flowchart TD
  DNS --> LB
  LB --> G1 & G2 & G3
  G1 -.->|X crash| LB
  LB --> G2 & G3
  BAD[Bad config 404] --> RB[Rollback config] --> OK`,
    code: `Never one gateway SPOF.
Stateless instances + Redis/JWKS/config externalized.
Health: readiness removes traffic; liveness restarts process.
K8s:
  readinessProbe: /actuator/health/readiness
  lifecycle preStop + ALB deregistration delay = draining

Failure matrix samples:
  instance crash → LB health → other nodes → scale
  bad route deploy → detect 404 spike → rollback config/version
  IdP down → fail closed / cached JWKS only for valid tokens
  AZ/region → multi-AZ gateways; multi-region needs DNS+data plan

Scaling gateway alone to 50k RPS while backend is 10k worsens overload —
pair with rate limits + backend scale + shedding.`,
    failure: 'In-memory sessions on gateway → lost on crash / uneven.',
    production: 'GitOps routes; canary; automated route validation in CI.',
    interview30s: 'N≥2 stateless GWs behind LB; health; external state; config rollback.',
    followUp: 'What state must not live in GW pods?',
    tradeoff: 'More instances vs cold-start/config sync.',
    memoryTrick: 'Gateways die · traffic moves · state lives elsewhere.',
  },
];
