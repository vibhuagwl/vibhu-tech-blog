import type {SecTopic} from './types';

export const TOPICS_CLOUD: SecTopic[] = [
  {
    id: 'aws-security',
    title: 'AWS Security Architecture',
    badge: 'AWS',
    category: 'Cloud',
    what: 'VPC segmentation, IAM least privilege, KMS encryption, WAF/Shield, Secrets Manager — defense in depth.',
    mermaid: `flowchart TB
  CF[CloudFront + WAF]
  ALB[ALB TLS ACM]
  subgraph vpc [Private VPC]
    ECS[ECS/EKS Spring Boot]
    RDS[(RDS encrypted)]
    SM[Secrets Manager]
    KMS[KMS CMK]
  end
  CF --> ALB --> ECS
  ECS --> RDS
  ECS --> SM
  ECS --> KMS`,
    code: `# IAM policy — Spring task role (least privilege)
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:us-east-1:123456789:secret:prod/payment-db-*"
    },
    {
      "Effect": "Allow",
      "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
      "Resource": "arn:aws:kms:us-east-1:123456789:key/abcd-1234"
    }
  ]
}

# application.yml — import secrets (Boot 3)
spring:
  config:
    import: aws-secretsmanager:prod/payment-db

# Security group — ALB → app only on 8080, app → RDS 5432 only
# NACL + private subnets — no public RDS

# CloudTrail + GuardDuty alerts on IAM anomalies`,
    verify: `aws sts get-caller-identity
aws secretsmanager get-secret-value --secret-id prod/payment-db --query ARN
aws kms describe-key --key-id alias/prod-payment`,
    pitfalls: 'Overly broad iam:PassRole. RDS publicly accessible. Long-lived access keys on EC2 instead of IRSA/task role.',
    production: 'IRSA for EKS / task role for ECS; SCPs at org level; separate accounts per env; no secrets in AMIs.',
    interview30s: 'AWS security: network (VPC/SG), identity (IAM roles not keys), encryption (KMS), edge (WAF), audit (CloudTrail).',
    interview2m: 'Walk payment API on ECS: ALB terminates TLS, task role pulls Secrets Manager, RDS encrypted with CMK, egress via NAT with domain allowlist.',
    traps: 'Storing AWS keys in spring.application.yml — use instance/task role.',
  },
  {
    id: 'aws-kms',
    title: 'AWS KMS Envelope Encryption',
    badge: 'KMS',
    category: 'Cloud',
    what: 'CMK wraps DEK; app encrypts data locally with DEK — KMS never sees plaintext bulk data.',
    mermaid: `sequenceDiagram
  participant App as Spring Boot
  participant KMS as AWS KMS
  participant S3 as S3 / RDS
  App->>KMS: GenerateDataKey
  KMS-->>App: plaintext DEK + encrypted DEK blob
  App->>App: AES-GCM encrypt record
  App->>S3: store ciphertext + encryptedDEK`,
    code: `@Service
public class KmsEnvelopeService {
  private final KmsClient kms;
  private final String keyId;

  public EncryptedRecord encrypt(byte[] plaintext) {
    GenerateDataKeyResponse dk = kms.generateDataKey(GenerateDataKeyRequest.builder()
        .keyId(keyId)
        .keySpec(DataKeySpec.AES_256)
        .build());
    byte[] iv = randomIv12();
    byte[] ciphertext = aesGcm(dk.plaintext().asByteArray(), iv, plaintext);
    zeroize(dk.plaintext().asByteArray());
    return new EncryptedRecord(
        Base64.getEncoder().encodeToString(dk.ciphertextBlob().asByteArray()),
        Base64.getEncoder().encodeToString(iv),
        Base64.getEncoder().encodeToString(ciphertext));
  }

  public byte[] decrypt(EncryptedRecord rec) {
    ByteBuffer plainDek = kms.decrypt(DecryptRequest.builder()
        .ciphertextBlob(SdkBytes.fromByteArray(b64(rec.encryptedDek())))
        .build()).plaintext().asByteArray();
    try {
      return aesGcmDecrypt(plainDek, b64(rec.iv()), b64(rec.ciphertext()));
    } finally {
      zeroize(plainDek);
    }
  }
}`,
    verify: `aws kms encrypt --key-id alias/demo --plaintext "hello" --query CiphertextBlob --output text
aws kms decrypt --ciphertext-blob fileb://blob.bin --query Plaintext --output text`,
    pitfalls: 'Caching plaintext DEK forever. CMK policy allowing kms:* for app role. Not zeroizing DEK bytes.',
    production: 'Automatic CMK rotation; per-tenant DEK context; CloudTrail on Decrypt; alarm on unusual Decrypt volume.',
    interview30s: 'KMS envelope: GenerateDataKey → encrypt locally with DEK → store encrypted DEK + ciphertext. CMK never leaves HSM boundary for bulk.',
    interview2m: 'Compare KMS vs Secrets Manager vs SSM Parameter Store SecureString. Multi-region keys for DR.',
    traps: '"We send all PII to KMS Encrypt API" — expensive and hits 4KB limit; use envelope.',
    labHref: '/encryption',
  },
  {
    id: 'aws-secrets',
    title: 'AWS Secrets Manager',
    badge: 'Secrets',
    category: 'Cloud',
    what: 'Rotating credentials store — JDBC passwords, API keys; Spring imports via spring.config.import.',
    mermaid: `flowchart LR
  SM[Secrets Manager]
  L[Lambda rotation]
  RDS[(RDS PostgreSQL)]
  APP[Spring Boot]
  L --> SM
  L --> RDS
  APP -->|GetSecretValue| SM`,
    code: `# Secret JSON structure
{
  "username": "payment_app",
  "password": "rotated-32-char",
  "engine": "postgres",
  "host": "payment.cluster-abc.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "dbname": "payments"
}

# application-prod.yml
spring:
  config:
    import: aws-secretsmanager:prod/payment-db
  datasource:
    url: jdbc:postgresql://\${host}:\${port}/\${dbname}?sslmode=verify-full
    username: \${username}
    password: \${password}

# Rotation Lambda (outline) — dual-user swap
public void rotate(SecretsManagerClient sm, RDsClient rds) {
  CurrentSecret current = read(sm);
  String pending = generatePassword();
  rds.modifyUserPassword(current.username(), pending);
  sm.updateSecret(newVersion(pending));
}`,
    verify: `aws secretsmanager describe-secret --secret-id prod/payment-db
aws secretsmanager get-secret-value --secret-id prod/payment-db --query SecretString`,
    pitfalls: 'Logging datasource URL with password on startup debug. No rotation — static creds for years.',
    production: '30-day rotation; IAM resource policy per secret; replica secrets for DR region; never echo secrets in actuator env.',
    interview30s: 'Secrets Manager stores and rotates credentials. Spring Boot 3 spring.config.import pulls JSON into properties. KMS encrypts secret at rest.',
    interview2m: 'Rotation without downtime: dual-user pattern or RDS master secret rotation template.',
    traps: 'Committing secrets to git "encrypted with base64".',
  },
  {
    id: 'aws-acm',
    title: 'ACM / ALB TLS',
    badge: 'TLS',
    category: 'Cloud',
    what: 'ACM manages public certs — attach to ALB/CloudFront; auto renewal; Spring sees HTTP behind proxy.',
    mermaid: `flowchart LR
  User --> CF[CloudFront ACM cert]
  CF --> ALB[ALB ACM cert]
  ALB -->|HTTP :8080| ECS[Spring Boot task]
  ECS -->|optional mTLS| Internal[Internal ALB]`,
    code: `# ALB listener — TLS 1.3 policy
# AWS Console / Terraform:
# aws_lb_listener.frontend:
#   port              = 443
#   protocol          = HTTPS
#   certificate_arn   = aws_acm_certificate.api.arn
#   ssl_policy        = ELBSecurityPolicy-TLS13-1-2-2021-06

# Spring behind ALB — trust forwarded headers
server:
  port: 8080
  forward-headers-strategy: native
  tomcat:
    remoteip:
      remote-ip-header: x-forwarded-for
      protocol-header: x-forwarded-proto

# Force redirect to HTTPS at ALB listener rule (HTTP:80 → 301 HTTPS)

# Internal mTLS between ALB and app (advanced) — re-encrypt target group HTTPS`,
    verify: `echo | openssl s_client -connect api.example.com:443 -servername api.example.com 2>/dev/null | openssl x509 -noout -issuer -dates
aws acm describe-certificate --certificate-arn arn:aws:acm:...`,
    pitfalls: 'Cert in us-east-1 missing for CloudFront. ALB health check HTTP while app requires HTTPS headers wrong.',
    production: 'DNS validation; monitor ACM expiry events (rare failure); TLS 1.2+ policy; WAF attached to ALB/CF.',
    interview30s: 'ACM = free managed certs for AWS services. Terminate TLS at ALB; Spring uses forward-headers-strategy for redirects/links.',
    interview2m: 'When to re-encrypt to backend vs HTTP in private VPC. Internal CA for east-west mTLS behind public ACM edge.',
    traps: 'Importing expired cert to ACM without renewal plan.',
  },
  {
    id: 'kafka-security',
    title: 'Kafka TLS / SASL / ACL',
    badge: 'Kafka',
    category: 'Cloud',
    what: 'Encrypt wire (SSL/SASL_SSL), authenticate producers/consumers (SCRAM/OAUTHBEARER), authorize with ACLs.',
    mermaid: `flowchart TB
  P[Payment Producer] -->|SASL_SSL SCRAM| B1[Broker]
  C[Settlement Consumer] -->|SASL_SSL SCRAM| B1
  B1 --> ACL[ACL: payment-svc WRITE payments-v1]
  C --> ACL2[ACL: settlement-svc READ payments-v1]`,
    code: `# application.yml — Spring Kafka producer
spring:
  kafka:
    bootstrap-servers: kafka1.internal:9093,kafka2.internal:9093
    properties:
      security.protocol: SASL_SSL
      sasl.mechanism: SCRAM-SHA-512
      sasl.jaas.config: org.apache.kafka.common.security.scram.ScramLoginModule required username="payment-producer" password="\${KAFKA_PASSWORD}";
      ssl.truststore.location: /etc/kafka/truststore.jks
      ssl.truststore.password: \${KAFKA_TRUSTSTORE_PASS}
    producer:
      acks: all
      properties:
        enable.idempotence: true

# Broker ACL (kafka-acls.sh)
kafka-acls --bootstrap-server kafka1:9093 \\
  --command-config admin.properties \\
  --add --allow-principal User:payment-producer \\
  --operation WRITE --topic payments-v1

kafka-acls --add --allow-principal User:settlement-worker \\
  --operation READ --group settlement-workers --topic payments-v1`,
    verify: `kafka-console-producer.sh --bootstrap-server localhost:9093 \\
  --producer.config client-ssl-scram.properties \\
  --topic payments-v1
# Wrong creds → SaslAuthenticationException`,
    pitfalls: 'PLAINTEXT in prod. One shared SCRAM user for all services. ACL wildcards on *.',
    production: 'Separate creds per service; ACL least privilege; TLS 1.2+; rotate SCRAM via Vault/Secrets Manager; audit ACL changes.',
    interview30s: 'Kafka security: TLS for wire encryption, SASL for auth, ACLs for authz per topic/group. enable.idempotence for exactly-once producer.',
    interview2m: 'Contrast SCRAM vs mTLS vs OAUTHBEARER. Payment events: encrypt sensitive fields even on TLS — brokers/admins see payload.',
    traps: 'ACL authorizer disabled "because network is private" — zero-trust requires broker auth.',
  },
  {
    id: 'db-security',
    title: 'Database TLS & Access',
    badge: 'Data',
    category: 'Cloud',
    what: 'Encrypt connections to RDS/Aurora, verify server cert, least-privilege DB user, no superuser in app.',
    mermaid: `flowchart LR
  APP[Spring Boot] -->|TLS verify-full| RDS[(RDS PostgreSQL)]
  SM[Secrets Manager] --> APP
  KMS[KMS] --> RDS`,
    code: `# application-prod.yml — PostgreSQL TLS
spring:
  datasource:
    url: jdbc:postgresql://payment.cluster-abc.us-east-1.rds.amazonaws.com:5432/payments?sslmode=verify-full&sslrootcert=/etc/ssl/rds-combined-ca-bundle.pem
    username: \${username}
    password: \${password}
    hikari:
      maximum-pool-size: 20
      connection-timeout: 3000

# Flyway/Liquibase uses same datasource — migrations not sa

# Row-level security example (PostgreSQL)
-- CREATE POLICY tenant_isolation ON payments
--   USING (tenant_id = current_setting('app.tenant_id')::uuid);

@Component
public class TenantConnectionCustomizer {
  @Autowired DataSource ds;
  public void setTenant(UUID tenantId) {
    try (Connection c = ds.getConnection()) {
      c.createStatement().execute("SET app.tenant_id = '" + tenantId + "'");
    }
  }
}`,
    verify: `psql "host=... sslmode=verify-full sslrootcert=rds-ca.pem user=payment_app dbname=payments"
# \\conninfo — should show SSL connection`,
    pitfalls: 'sslmode=require without cert verify — MITM still possible. App connects as rds_superuser. SELECT * logged with PII.',
    production: 'verify-full + RDS CA bundle; read-only replica user for reports; column encryption for PAN; audit pg audit extension.',
    interview30s: 'DB security: TLS in transit, KMS at rest, least-privilege user, no secrets in URL in logs, optional RLS for tenant isolation.',
    interview2m: 'Aurora IAM auth vs password from Secrets Manager. Connection pool exhaustion vs credential rotation timing.',
    traps: 'Trust server certificate without hostname check in JDBC.',
  },
  {
    id: 'api-security',
    title: 'API Security Layers',
    badge: 'API',
    category: 'API',
    what: 'Edge JWT/WAF + service authz + input validation + rate limit + audit — defense in depth.',
    mermaid: `flowchart TB
  C[Client] --> WAF[WAF]
  WAF --> GW[API Gateway :8080]
  GW --> JWT[JWT validate + RL]
  JWT --> SVC[Spring RS :8081]
  SVC --> AUTHZ[@PreAuthorize scopes]
  AUTHZ --> VAL[Bean Validation]`,
    code: `# API Gateway (oauth-jwt-demo) — resource server at edge optional pattern
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:9000

@Bean
SecurityFilterChain gateway(HttpSecurity http) throws Exception {
  return http
      .authorizeHttpRequests(a -> a
          .requestMatchers("/actuator/health").permitAll()
          .requestMatchers(HttpMethod.GET, "/api/payments/**").hasAuthority("SCOPE_payment.read")
          .requestMatchers(HttpMethod.POST, "/api/payments/**").hasAuthority("SCOPE_payment.write")
          .anyRequest().authenticated())
      .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
      .csrf(csrf -> csrf.disable())
      .build();
}

@RestController
@Validated
public class PaymentApi {
  @PostMapping("/api/payments")
  @PreAuthorize("hasAuthority('SCOPE_payment.write')")
  public Payment create(@Valid @RequestBody PaymentRequest req) {
    return service.create(req);
  }
}`,
    verify: `# No token → 401
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/payments
# Wrong scope → 403
curl -H "Authorization: Bearer $READ_ONLY_TOKEN" -X POST http://localhost:8081/api/payments`,
    pitfalls: 'Gateway validates JWT but service permitAll(). Trusting X-Scope header without re-validation.',
    production: 'Validate JWT at edge AND sensitive ops in service; schema validation; problem+json errors; correlation IDs; no stack traces.',
    interview30s: 'API security layers: WAF → gateway JWT/RL → service scope check → validation → audit. Never single gate.',
    interview2m: 'Map oauth-jwt-demo ports. When gateway-only auth is enough vs double validation for wire transfers.',
    traps: 'Actuator/env exposed on same port as API.',
    labHref: '/oauth-jwt-demo',
  },
  {
    id: 'rate-limit-ddos',
    title: 'Rate Limit / DDoS',
    badge: 'Traffic',
    category: 'API',
    what: 'Token bucket at edge and app — 429 Retry-After; CDN/WAF for volumetric; bulkhead for app-layer floods.',
    mermaid: `flowchart TB
  BOT[Bot flood] --> CF[CloudFront + Shield]
  CF --> WAF[WAF rate rule]
  WAF --> GW[Gateway RL 429]
  GW --> APP[Resilience4j RateLimiter]
  APP --> DB[(DB pool protected)]`,
    code: `# Resilience4j — per-IP login rate limit (spring-jwt-demo pattern)
resilience4j.ratelimiter:
  instances:
    authLogin:
      limitForPeriod: 10
      limitRefreshPeriod: 1m
      timeoutDuration: 0

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {
  private final RateLimiter limiter;
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) {
    if (!req.getRequestURI().startsWith("/api/auth/login")) {
      chain.doFilter(req, res);
      return;
    }
    if (!RateLimiter.decorateSupplier(limiter, () -> true).get()) {
      res.setStatus(429);
      res.setHeader("Retry-After", "60");
      res.getWriter().write("{\\"error\\":\\"too_many_requests\\"}");
      return;
    }
    chain.doFilter(req, res);
  }
}

# AWS WAF rate-based rule — 2000 req/5min per IP → block
# CloudFront + Shield Advanced for large volumetric`,
    verify: `for i in $(seq 1 15); do
  curl -s -o /dev/null -w "%{http_code}\\n" -X POST http://localhost:8092/api/auth/login \\
    -H "Content-Type: application/json" -d '{"email":"x","password":"y"}'
done
# Expect 429 after threshold`,
    pitfalls: 'Rate limit only at app — attacker bypasses with distributed IPs. Returning 200 on RL bypass. No Retry-After header.',
    production: 'Edge + app RL; captcha on auth after threshold; autoscale ≠ DDoS defense; runbooks for 429/503 spikes.',
    interview30s: 'DDoS: volumetric (CDN/Shield) vs app-layer (RL/WAF). 429 with Retry-After. Protect login and payment POST hardest.',
    interview2m: 'Distributed RL with Redis vs local Resilience4j. Gateway usage plans vs app token bucket.',
    traps: 'Scaling gateways while backend DB melts — RL first.',
    labHref: '/spring-ddos-demo',
  },
];
