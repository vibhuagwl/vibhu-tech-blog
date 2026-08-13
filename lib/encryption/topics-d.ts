import type {EncryptionTopic} from './types';

export const TOPICS_D: EncryptionTopic[] = [
  {
    id: 'algorithm-comparison',
    title: 'Algorithm Comparison',
    badge: 'Matrix',
    problem: 'Interviewers ask AES vs RSA vs ECC to see whether you understand primitives and production use.',
    whenToUse: 'Use comparison tables when deciding crypto for data-at-rest, partner exchange, TLS, JWT, and password storage.',
    whenAvoid: 'Avoid declaring one algorithm universally best; each solves a different property.',
    mermaid: `flowchart LR
  AES[AES-GCM fast symmetric] --> DATA[bulk data]
  RSA[RSA-OAEP/PSS] --> WRAP[key wrap and signatures]
  ECC[ECDH/ECDSA] --> MODERN[small keys and TLS]
  ARG[Argon2id] --> PASS[passwords]
  HMAC[HMAC-SHA256] --> INTEGRITY[shared-secret integrity]`,
    code: `public final class AlgorithmChooser {
  public String choose(CryptoUseCase useCase) {
    return switch (useCase) {
      case PII_AT_REST -> "AES-256-GCM with keyId|iv|ciphertext";
      case LARGE_FILE -> "Envelope encryption with per-file DEK";
      case PASSWORD -> "Argon2id with per-password salt and work factor";
      case WEBHOOK -> "HMAC-SHA256 over canonical body + timestamp";
      case PARTNER_SIGNATURE -> "RSA-PSS or ECDSA with key id";
      case API_TRANSPORT -> "TLS 1.3, mTLS for service identity";
      case JWT_ACCESS_TOKEN -> "JWS RS256/ES256, optional JWE only for hidden claims";
    };
  }
}

// Never choose:
// - AES/ECB/PKCS5Padding for records
// - MD5/SHA1 for security
// - RSA without OAEP/PSS
// - home-grown random/token generation
// - password encryption instead of password hashing`,
    failure: 'Algorithm agility without constraints can let clients negotiate down to weak algorithms.',
    production: 'Maintain an allowlist and deprecation schedule: approved, legacy-read-only, banned.',
    interview30s: 'AES is fast symmetric data encryption; RSA/ECC are asymmetric for wrapping/signing/key agreement; Argon2 hashes passwords.',
    followUp: 'Why is AES-GCM usually preferred over AES-CBC?',
    tradeoff: 'Agility helps migrations; too much configurability creates downgrade risk.',
    memoryTrick: 'AES data, RSA/ECC trust, Argon2 passwords, HMAC webhooks.',
  },
  {
    id: 'mistakes',
    title: 'Production Mistakes',
    badge: 'Avoid',
    problem: 'Most crypto incidents come from misuse, key handling, logging, and operational gaps rather than broken AES.',
    whenToUse: 'Review this list before shipping crypto changes, migrations, or partner integrations.',
    whenAvoid: 'Do not postpone mistakes review to pen-test week; by then formats and APIs are hard to change.',
    mermaid: `flowchart TD
  BAD[Bad crypto rollout] --> LOG[plaintext in logs]
  BAD --> KEY[hardcoded key]
  BAD --> IV[IV reuse]
  BAD --> JWT[secrets in JWT]
  BAD --> ROT[no rotation path]
  BAD --> TEST[no tamper tests]
  LOG --> BREACH[breach blast radius]`,
    code: `// BAD
private static final String KEY = "my-secret-key";
Cipher.getInstance("AES/ECB/PKCS5Padding");
log.info("decrypt request={}", request);
String token = new String(Base64.getDecoder().decode(jwtPayload));
if (signature.equals(expected)) { accept(); }

// GOOD
SecretKey key = keyProvider.keyById(keyId);
Cipher.getInstance("AES/GCM/NoPadding");
log.info("decrypt keyId={} ciphertextBytes={}", keyId, ciphertext.length);
MessageDigest.isEqual(actualSignature, expectedSignature);

// GOOD operational contract
record CryptoMetadata(
    String algorithm,
    String keyId,
    String formatVersion,
    String owner,
    String rotationRunbook,
    String piiLoggingPolicy) {}`,
    failure: 'A single debug log line with plaintext PANs can bypass all encryption-at-rest controls.',
    production: 'Add static checks and code-review checklists for ECB, fixed IVs, Base64 secrets, weak hashes, and unsafe logging.',
    interview30s: 'Do not hardcode keys, use ECB, reuse IVs, log plaintext, put secrets in JWT, or ship without rotation.',
    followUp: 'What is the first thing you check in a suspicious crypto PR?',
    tradeoff: 'Guardrails slow experimentation slightly but prevent expensive irreversible data exposure.',
    memoryTrick: 'The math is strong; misuse is weak.',
  },
  {
    id: 'testing',
    title: 'Testing Encryption Code',
    badge: 'CI',
    problem: 'Crypto bugs are often silent until a rotation, backfill, or partner integration fails.',
    whenToUse: 'Test round trips, tamper detection, wrong keys, old key IDs, empty values, migration backfills, and known vectors.',
    whenAvoid: 'Avoid tests that only assert decrypt(encrypt(x)) equals x with one happy path.',
    mermaid: `flowchart LR
  T[Crypto tests] --> RT[round trip]
  T --> TAM[tamper fails]
  T --> OLD[old key decrypt]
  T --> ROT[new key writes]
  T --> SIZE[max payload]
  T --> LOG[no plaintext logs]`,
    code: `package com.vibhu.crypto.crypto;

import static org.assertj.core.api.Assertions.*;
import org.junit.jupiter.api.Test;

class AesEncryptionServiceTest {
  private final AesEncryptionService aes = TestCryptoFactory.aesWithKeys("v1", "v2");

  @Test
  void roundTripUsesPortableFormat() {
    String stored = aes.encrypt("4111111111111111");
    assertThat(stored).contains("|");
    assertThat(stored.split("\\\\|")).hasSize(3);
    assertThat(aes.decrypt(stored)).isEqualTo("4111111111111111");
  }

  @Test
  void tamperingFailsAuthentication() {
    String stored = aes.encrypt("secret");
    String tampered = stored.substring(0, stored.length() - 2) + "AA";
    assertThatThrownBy(() -> aes.decrypt(tampered))
        .isInstanceOf(CryptoException.class);
  }

  @Test
  void oldKeyStillDecryptsAfterRotation() {
    String v1 = aes.encryptWithActiveKey("v1", "legacy");
    aes.rotateActiveKey("v2");
    String v2 = aes.encrypt("new");
    assertThat(aes.decrypt(v1)).isEqualTo("legacy");
    assertThat(v2).startsWith("v2|");
  }
}`,
    failure: 'Mocks that skip Cipher.doFinal hide tag failures and key format mistakes.',
    production: 'Keep deterministic test keys in test resources only, run property tests for random payload sizes, and include migration dry-runs.',
    interview30s: 'Test round trip plus negative cases: tamper, wrong key, old key, bad format, large payload, and no plaintext logs.',
    followUp: 'How do you test key rotation safely?',
    tradeoff: 'Real crypto tests are slower than mocks but catch the failures that matter.',
    memoryTrick: 'Happy path proves function; tamper path proves security.',
  },
  {
    id: 'performance',
    title: 'Performance and Operational Cost',
    badge: 'Scale',
    problem: 'Encrypting every field, calling KMS per row, or decrypting in list views can destroy latency and cost budgets.',
    whenToUse: 'Measure crypto at hot paths: API p99, batch throughput, KMS calls, DB index impact, and object allocation.',
    whenAvoid: 'Do not optimize by weakening algorithms or disabling authentication tags.',
    mermaid: `flowchart TD
  REQ[List customers] --> Q[Query lookup hash]
  Q --> ROW[Only matched rows]
  ROW --> DEC[Decrypt selected fields]
  DEC --> MASK[Mask response]
  HOT[Hot path] --> CACHE[short TTL DEK cache]
  HOT --> MET[metrics p95 p99 KMS]`,
    code: `package com.vibhu.crypto.crypto;

import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

@Service
public class TimedEncryptionService {
  private final AesEncryptionService delegate;
  private final Timer encryptTimer;
  private final Timer decryptTimer;

  public TimedEncryptionService(AesEncryptionService delegate, CryptoMetrics metrics) {
    this.delegate = delegate;
    this.encryptTimer = metrics.timer("crypto.encrypt", "algorithm", "AES-GCM");
    this.decryptTimer = metrics.timer("crypto.decrypt", "algorithm", "AES-GCM");
  }

  public String encrypt(String plaintext) {
    return encryptTimer.record(() -> delegate.encrypt(plaintext));
  }

  public String decrypt(String ciphertext) {
    return decryptTimer.record(() -> delegate.decrypt(ciphertext));
  }
}

// Performance rules:
// - AES-GCM is usually cheap; KMS/network calls are not.
// - Decrypt only fields needed for the response.
// - Prefer batch/backfill jobs for re-encryption.
// - Keep DEK cache bounded by TTL, tenant, and max entries.
// - Never cache plaintext PII in shared caches.`,
    failure: 'A customer search page that decrypts 10,000 rows per request becomes a crypto-powered table scan.',
    production: 'Add metrics for encrypt/decrypt latency, key cache hit ratio, KMS throttles, and decrypt failures by key version.',
    interview30s: 'AES is fast; KMS, unnecessary decrypts, and lost indexes are the usual performance problems.',
    followUp: 'How do you size a DEK cache?',
    tradeoff: 'Caching keys improves latency but increases in-memory exposure and invalidation complexity.',
    memoryTrick: 'Measure KMS and queries before blaming AES.',
  },
  {
    id: 'payment-e2e',
    title: 'Payment Data End-to-End',
    badge: 'System',
    problem: 'Design a payment microservice flow where PAN/token, customer PII, webhooks, JWT, TLS, and key rotation all fit together.',
    whenToUse: 'Use this as the system design answer for fintech, banking, and regulated data interviews.',
    whenAvoid: 'Avoid inventing a single crypto service that all data must synchronously call without fallback or ownership boundaries.',
    mermaid: `flowchart TB
  U[User] --> TLS[TLS API Gateway]
  TLS --> AUTH[JWT verification]
  AUTH --> PAY[Payment Service]
  PAY --> TOK[Tokenize PAN externally]
  PAY --> AES[AES-GCM PII keyId|iv|ciphertext]
  AES --> DB[(Customer DB)]
  PAY --> HMAC[HMAC webhook verify]
  PAY --> KMS[KMS envelope keys]
  PAY --> BUS[Kafka encrypted event]
  BUS --> CONS[Consumer decrypts allowed fields]
  KMS --> ROT[Key rotation runbook]`,
    code: `package com.vibhu.crypto.service;

import com.vibhu.crypto.crypto.AesEncryptionService;
import com.vibhu.crypto.crypto.HmacService;
import com.vibhu.crypto.dto.SignedPaymentRequest;
import org.springframework.stereotype.Service;

@Service
public class PaymentCryptoWorkflow {
  private final CustomerService customers;
  private final AesEncryptionService aes;
  private final HmacService hmac;
  private final PaymentTokenizationClient tokenizationClient;

  public PaymentCryptoWorkflow(
      CustomerService customers,
      AesEncryptionService aes,
      HmacService hmac,
      PaymentTokenizationClient tokenizationClient) {
    this.customers = customers;
    this.aes = aes;
    this.hmac = hmac;
    this.tokenizationClient = tokenizationClient;
  }

  public PaymentResult accept(SignedPaymentRequest request) {
    verifyWebhook(request);
    String cardToken = tokenizationClient.tokenize(request.pan()); // prefer not storing PAN

    Customer customer = customers.create(
        request.customerId(),
        request.email(),
        request.taxIdentifier());

    String encryptedEvent = aes.encrypt("""
        {"customerId":"%s","cardToken":"%s","amount":%d}
        """.formatted(customer.getId(), cardToken, request.amountCents()));

    publishEncryptedAuditEvent(encryptedEvent);
    return new PaymentResult("ACCEPTED", cardToken);
  }

  private void verifyWebhook(SignedPaymentRequest request) {
    String canonical = request.timestamp() + "." + request.body();
    if (!hmac.verify(canonical, request.signature())) {
      throw new InvalidSignatureException();
    }
  }
}`,
    failure: 'Encrypting PAN yourself may expand PCI scope; tokenization by a payment provider is often the better architecture.',
    production: 'Minimize sensitive data, tokenize cards, encrypt PII, sign webhooks, verify JWT, run over TLS, and rotate keys with audit.',
    interview30s: 'For payments: TLS in transit, JWT auth, tokenization for PAN, AES-GCM for PII, HMAC/signatures for callbacks, KMS for keys.',
    followUp: 'What data should never enter your database?',
    tradeoff: 'Strong controls add metadata and operations; tokenization reduces scope but creates provider dependency.',
    memoryTrick: 'Tokenize cards, encrypt PII, sign callbacks, rotate keys.',
  },
  {
    id: 'threats',
    title: 'Threat Modeling Crypto',
    badge: 'Risk',
    problem: 'Encryption is only useful when it blocks a concrete attacker in a concrete path.',
    whenToUse: 'Threat-model database leak, log leak, rogue admin, service compromise, network MITM, replay, and key compromise.',
    whenAvoid: 'Avoid saying encrypted without naming attacker, asset, key owner, and residual exposure.',
    mermaid: `flowchart TD
  ASSET[PII/payment data] --> DB[DB snapshot leak]
  ASSET --> LOG[log leak]
  ASSET --> NET[network MITM]
  ASSET --> APP[app RCE]
  DB --> AES[AES-GCM helps]
  LOG --> REDACT[redaction helps]
  NET --> TLS[TLS/mTLS helps]
  APP --> LIMIT[least privilege + KMS policy]
  KEY[key compromise] --> ROT[rotation + reencrypt]`,
    code: `package com.vibhu.crypto.security;

public record CryptoThreatModel(
    String asset,
    String attacker,
    String control,
    String keyOwner,
    String residualRisk,
    String detection) {

  public static CryptoThreatModel piiDatabaseDump() {
    return new CryptoThreatModel(
        "customer taxIdentifier",
        "read-only database snapshot thief",
        "AES-GCM field encryption; key not in database",
        "KMS alias/customer-pii",
        "application compromise can still decrypt authorized fields",
        "unusual decrypt volume and snapshot export alerts");
  }

  public static CryptoThreatModel webhookReplay() {
    return new CryptoThreatModel(
        "payment callback",
        "attacker replays old valid request",
        "HMAC over body+timestamp+nonce with replay cache",
        "webhook secret in KMS",
        "secret compromise enables forgery until rotation",
        "duplicate nonce and timestamp skew metrics");
  }
}`,
    failure: 'Encryption does not protect against a compromised application that is authorized to decrypt every record.',
    production: 'Combine crypto with least privilege, data minimization, masking, audit, anomaly detection, and incident runbooks.',
    interview30s: 'Name the threat. Field encryption helps DB leaks; TLS helps network MITM; signatures help tampering; none replace authorization.',
    followUp: 'What is the residual risk after field encryption?',
    tradeoff: 'Threat models take discipline, but they prevent cargo-cult encryption that solves no attacker path.',
    memoryTrick: 'Asset, attacker, control, key, residual risk.',
  },
];
