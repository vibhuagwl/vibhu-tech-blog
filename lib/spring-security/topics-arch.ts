import type {SecTopic} from './types';

export const TOPICS_ARCH: SecTopic[] = [
  {
    id: 'zero-trust',
    title: 'Zero Trust Architecture',
    badge: 'Arch',
    category: 'Architecture',
    what: 'Never trust network location — verify identity (JWT/mTLS) on every request, least privilege, micro-segmentation.',
    mermaid: `flowchart TB
  subgraph untrusted [Untrusted network]
    C[Client]
  end
  subgraph verify [Always verify]
    WAF[WAF]
    GW[Gateway JWT]
    MTLS[mTLS east-west]
    AUTHZ[Service authz]
  end
  C --> WAF --> GW --> MTLS --> AUTHZ`,
    code: `# Zero-trust Spring stack — every hop authenticated
# 1) Edge — OAuth2 JWT (oauth-jwt-demo :8080/:8081)
spring.security.oauth2.resourceserver.jwt.issuer-uri: http://localhost:9000

# 2) East-west — mTLS between services
server.ssl.client-auth: need

# 3) Service — scope + tenant ABAC
@PreAuthorize("hasAuthority('SCOPE_payments:write') and @tenantGuard.sameTenant(#req)")

# 4) Data — RLS + field encryption
# 5) Audit — every authn/authz denial logged with corrId

# Network policy (K8s) — payment-svc egress only to payment-db:5432, kafka:9093
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: payment-svc-egress
spec:
  podSelector:
    matchLabels:
      app: payment-svc
  policyTypes: [Egress]
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: payment-db
      ports:
        - protocol: TCP
          port: 5432`,
    verify: `# Without JWT — 401 at gateway
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/payments
# Without client cert on internal endpoint — TLS handshake fail
curl -vk https://payment.internal:8443/internal/health`,
    pitfalls: 'Flat VPC "trusted internal network" with no mTLS. Shared service account for all pods. VPN = trusted forever mindset.',
    production: 'Identity-aware proxy; SPIFFE IDs; continuous validation; assume breach; blast-radius isolation per tenant.',
    interview30s: 'Zero trust = verify explicitly every time — user JWT, service mTLS, least-privilege ACLs, no "inside firewall = safe".',
    interview2m: 'Contrast traditional perimeter DMZ vs zero trust for microservices. How oauth-jwt + mTLS + ABAC stack together.',
    traps: '"We have a firewall so internal APIs need no auth."',
  },
  {
    id: 'observability',
    title: 'Security Observability',
    badge: 'Ops',
    category: 'Architecture',
    what: 'Audit auth failures, cert expiry, anomalous geo/IP, SIEM alerts — security metrics alongside SLO metrics.',
    mermaid: `flowchart LR
  APP[Spring Boot] --> LOG[Structured logs]
  APP --> MET[Micrometer metrics]
  LOG --> SIEM[SIEM / CloudWatch]
  MET --> ALERT[Alertmanager]
  SIEM --> SOC[SOC playbook]`,
    code: `@Component
public class SecurityAuditListener {
  private static final Logger audit = LoggerFactory.getLogger("SECURITY_AUDIT");

  @EventListener
  public void onFailure(AbstractAuthenticationFailureEvent e) {
    audit.warn("auth_failure type={} user={} ip={} corr={}",
        e.getException().getClass().getSimpleName(),
        e.getAuthentication().getName(),
        MDC.get("clientIp"),
        MDC.get("corrId"));
  }
}

@Bean
MeterRegistryCustomizer<MeterRegistry> securityMetrics() {
  return registry -> Counter.builder("security.auth.failure")
      .tag("reason", "invalid_token")
      .register(registry);
}

# logback-spring.xml — never log Authorization header
# Micrometer + Prometheus: security_auth_failure_total

# Alerts:
# - auth_failure rate > 5x baseline
# - cert expires_in_days < 14
# - kms_decrypt spike
# - 403 rate per tenant`,
    verify: `curl -s http://localhost:8092/actuator/prometheus | grep security
curl -s http://localhost:8092/actuator/health
# Trigger failed login — grep SECURITY_AUDIT in logs`,
    pitfalls: 'Logging JWT/subject/PAN in same line. No alert on JWKS fetch failure. Metrics cardinality explosion on userId tag.',
    production: 'Separate audit log stream; PII tokenization in logs; runbooks for auth outage; dashboard: 401/403/429 rates.',
    interview30s: 'Security observability: audit authn/authz denials, cert/KMS expiry, anomaly detection — not just 500 errors.',
    interview2m: 'IdP outage signals vs attack spray. Correlation ID from gateway through services for forensics.',
    traps: 'Logging bearer tokens for debugging in prod.',
  },
  {
    id: 'payment-e2e',
    title: 'Secure Payment System E2E',
    badge: 'E2E',
    category: 'Architecture',
    what: 'End-to-end: HTTPS → JWT → idempotency → Kafka TLS → encrypted fields → audit — full fintech security path.',
    mermaid: `sequenceDiagram
  participant U as User
  participant GW as Gateway :8080
  participant PAY as Payment :8081
  participant K as Kafka SASL_SSL
  participant SET as Settlement :8092
  U->>GW: POST /payments + Bearer + Idempotency-Key
  GW->>GW: JWT scope payment.write
  GW->>PAY: forward + corrId
  PAY->>PAY: validate + idempotent capture
  PAY->>K: PaymentEvent encrypted fields
  K->>SET: consume + settle
  SET-->>U: status via polling/webhook HMAC`,
    code: `# E2E security checklist — code anchors from repo labs

# 1) User auth — oauth-jwt-demo AS :9000 issues JWT with scope payment.write
curl -X POST http://localhost:9000/oauth2/token -u "payment-service:payment-secret" \\
  -d "grant_type=client_credentials&scope=payment.write"

# 2) Gateway validates JWT (8080) → resource server (8081)
spring.security.oauth2.resourceserver.jwt.issuer-uri: http://localhost:9000

# 3) Idempotency-Key on POST — spring-kafka-payments-demo :8091
curl -X POST http://localhost:8091/api/payments \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -H "Content-Type: application/json" \\
  -d '{"amount":100.00,"currency":"USD","merchantId":"M-1"}'

# 4) Kafka SASL_SSL + ACL — producer acks=all, enable.idempotence=true

# 5) Field encryption for PAN — spring-encryption-lab :8093 envelope

# 6) Settlement worker :8092 — consumer ACL READ only

# 7) Webhook callback HMAC-SHA256 signature with timestamp anti-replay
Mac mac = Mac.getInstance("HmacSHA256");
mac.init(new SecretKeySpec(webhookSecret, "HmacSHA256"));
mac.update((timestamp + "." + body).getBytes(UTF_8));
String sig = HexFormat.of().formatHex(mac.doFinal());`,
    verify: `# Full path smoke test
TOKEN=$(curl -s -X POST http://localhost:9000/oauth2/token \\
  -u "payment-service:payment-secret" \\
  -d "grant_type=client_credentials&scope=payment.write" | jq -r .access_token)
KEY=$(uuidgen)
curl -s -X POST http://localhost:8091/api/payments \\
  -H "Authorization: Bearer $TOKEN" -H "Idempotency-Key: $KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"amount":50,"currency":"USD"}' | jq
curl -s http://localhost:8092/api/ops/processed | jq`,
    pitfalls: 'Skipping idempotency on money POST. Logging full card numbers. Retry storm without CB on bank gateway.',
    production: 'PCI scope minimization (tokenize PAN); mTLS to acquirer; dual control for admin; reconciliation + DLQ audit trail.',
    interview30s: 'Secure payment path: OAuth JWT at edge, idempotent POST, TLS everywhere, Kafka ACLs, field encryption, HMAC webhooks, audit.',
    interview2m: 'Whiteboard oauth-jwt-demo + kafka payments demo ports. Where WAF, gateway RL, Resilience4j CB, and KMS fit.',
    traps: 'Fake SUCCESS fallback on payment timeout — return PENDING and reconcile.',
    labHref: '/oauth-jwt-demo',
  },
];
