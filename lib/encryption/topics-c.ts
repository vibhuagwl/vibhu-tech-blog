import type {EncryptionTopic} from './types';

export const TOPICS_C: EncryptionTopic[] = [
  {
    id: 'tls',
    title: 'TLS and mTLS',
    badge: 'Transport',
    problem: 'Data is encrypted at rest, but service-to-service traffic can still be intercepted or impersonated.',
    whenToUse: 'Use TLS for all external and internal HTTP traffic; use mTLS when both sides must authenticate at transport level.',
    whenAvoid: 'Do not treat TLS as a replacement for field encryption when databases, logs, queues, or admins can see plaintext after termination.',
    mermaid: `sequenceDiagram
  participant A as Order Service
  participant B as Payment Service
  A->>B: ClientHello
  B-->>A: Server certificate
  A->>A: verify CA + hostname
  A->>B: client certificate (mTLS)
  B->>B: verify client identity
  A->>B: encrypted HTTP/2 request`,
    code: `package com.vibhu.crypto.config;

import java.time.Duration;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class TlsClientConfig {
  @Bean
  RestTemplate paymentRestTemplate(RestTemplateBuilder builder) {
    return builder
        .connectTimeout(Duration.ofMillis(300))
        .readTimeout(Duration.ofSeconds(2))
        .rootUri("https://payment.internal")
        .defaultHeader("User-Agent", "crypto-lab")
        .build();
  }
}

# application.yml for mTLS-capable server
server:
  ssl:
    enabled: true
    key-store: classpath:server.p12
    key-store-password: \${SERVER_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    trust-store: classpath:clients.p12
    trust-store-password: \${CLIENT_TRUSTSTORE_PASSWORD}
    client-auth: need`,
    failure: 'Disabling hostname verification to fix a certificate issue turns TLS into encryption without identity.',
    production: 'Automate certificate issuance/rotation, monitor expiry, enforce TLS 1.2/1.3, and keep app-level authz after mTLS.',
    interview30s: 'TLS encrypts transport and authenticates the server; mTLS also authenticates the client with certificates.',
    followUp: 'Why encrypt fields if TLS is enabled?',
    tradeoff: 'TLS is transparent and fast, but plaintext exists after termination and cert lifecycle becomes production work.',
    memoryTrick: 'TLS protects the pipe, not every bucket the data lands in.',
  },
  {
    id: 'jwt',
    title: 'JWT: Signed vs Encrypted Tokens',
    badge: 'Security',
    problem: 'A team puts roles, email, and sensitive claims into JWT and assumes users cannot read them.',
    whenToUse: 'Use JWS for tamper-proof access tokens; use JWE only when token contents must be hidden from token holders or intermediaries.',
    whenAvoid: 'Avoid JWT for large sensitive session state; avoid symmetric signing secrets shared across too many services.',
    mermaid: `flowchart LR
  Claims[claims JSON] --> B64[base64url header.payload]
  B64 --> SIG[sign RS256/ES256]
  SIG --> JWS[Readable but tamper-proof JWT]
  Claims --> ENC[JWE encrypt]
  ENC --> HIDDEN[Hidden claims]
  JWS --> API[Resource server verifies signature]`,
    code: `package com.vibhu.crypto.jwt;

import java.time.Instant;
import java.util.Map;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {
  private final JwtEncoder encoder; // backed by RSA/ECDSA key, not by AES

  public JwtTokenService(JwtEncoder encoder) {
    this.encoder = encoder;
  }

  public String accessToken(String subject, String tenantId) {
    Instant now = Instant.now();
    JwtClaimsSet claims = JwtClaimsSet.builder()
        .issuer("https://auth.vibhu.com")
        .subject(subject)
        .issuedAt(now)
        .expiresAt(now.plusSeconds(900))
        .claim("tenant", tenantId)
        .claim("scope", "payments:read")
        .build();
    return encoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
  }

  public Map<String, Object> explain(Jwt jwt) {
    // Payload is base64url decoded by anyone. Do not place PAN, passwords, or secrets here.
    return jwt.getClaims();
  }
}`,
    failure: 'Algorithm confusion, accepting none, or using HS256 with a leaked shared secret lets attackers forge tokens.',
    production: 'Prefer short-lived access tokens, asymmetric signing, kid-based JWKS rotation, audience checks, and no secrets in claims.',
    interview30s: 'Most JWTs are signed, not encrypted. Users can read claims; signature prevents tampering.',
    followUp: 'When would you choose JWE?',
    tradeoff: 'JWS is easy to validate statelessly; JWE hides claims but adds key distribution and debugging complexity.',
    memoryTrick: 'JWT signature is a seal, not an envelope.',
  },
  {
    id: 'kms',
    title: 'KMS and HSM Integration',
    badge: 'Keys',
    problem: 'Application instances need encryption but should not own long-lived root keys.',
    whenToUse: 'Use KMS/HSM for master keys, envelope encryption, audit logs, and centralized policy.',
    whenAvoid: 'Avoid KMS round trips for every small field decrypt on a hot path without caching or data-key design.',
    mermaid: `flowchart TB
  APP[Spring app] --> IAM[IAM role]
  IAM --> KMS[KMS CMK or alias]
  KMS --> DK[GenerateDataKey]
  DK --> AES[AES-GCM locally]
  KMS --> AUD[CloudTrail audit]
  SEC[Security team] --> KMS`,
    code: `package com.vibhu.crypto.crypto;

import java.util.Base64;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

public class KmsClient {
  public DataKey generateDataKey(String keyAlias) {
    // Real AWS SDK shape:
    // GenerateDataKeyRequest.builder()
    //   .keyId(keyAlias)
    //   .keySpec(DataKeySpec.AES_256)
    //   .encryptionContext(Map.of("service", "customer"))
    //   .build();
    byte[] plaintext = secureRandomAesKey();
    byte[] encrypted = callKmsEncrypt(keyAlias, plaintext);
    return new DataKey(keyAlias, new SecretKeySpec(plaintext, "AES"), Base64.getEncoder().encodeToString(encrypted));
  }

  public SecretKey decryptDataKey(String encryptedDataKey) {
    byte[] plaintext = callKmsDecrypt(Base64.getDecoder().decode(encryptedDataKey));
    return new SecretKeySpec(plaintext, "AES");
  }

  private byte[] secureRandomAesKey() {
    byte[] bytes = new byte[32];
    new java.security.SecureRandom().nextBytes(bytes);
    return bytes;
  }

  private byte[] callKmsEncrypt(String keyAlias, byte[] plaintext) {
    return plaintext; // lab stub; production delegates to KMS/HSM
  }

  private byte[] callKmsDecrypt(byte[] encrypted) {
    return encrypted; // lab stub
  }
}`,
    failure: 'Running local dev with production KMS permissions is a common path to accidental data exposure.',
    production: 'Separate keys by environment and data class, use IAM conditions/encryption context, and alert on unusual decrypt volume.',
    interview30s: 'KMS stores and uses master keys; apps request data keys or decrypt wrapped keys and do AES locally.',
    followUp: 'How do you survive KMS throttling?',
    tradeoff: 'Central control and audit versus network latency, throttling, and cloud coupling.',
    memoryTrick: 'KMS is key custody, not a bulk cipher.',
  },
  {
    id: 'keystore',
    title: 'Java Keystore and Key Loading',
    badge: 'Ops',
    problem: 'Private keys and AES keys must be loaded into Spring without putting PEM blocks in Git.',
    whenToUse: 'Use PKCS12/JKS, secrets manager, or KMS-backed providers for local/private key material.',
    whenAvoid: 'Avoid checking keystores and passwords into source, container layers, or example configs.',
    mermaid: `flowchart LR
  P12[PKCS12 keystore] --> RsaKeyConfig
  ENV[password env var] --> RsaKeyConfig
  RsaKeyConfig --> PRIV[PrivateKey bean]
  RsaKeyConfig --> PUB[PublicKey bean]
  PUB --> Verify
  PRIV --> SignDecrypt`,
    code: `package com.vibhu.crypto.config;

import java.io.InputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.cert.Certificate;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "crypto.rsa")
public class RsaKeyConfig {
  private String keyStorePath;
  private String keyStorePassword;
  private String keyAlias;

  public PrivateKey privateKey() throws Exception {
    KeyStore keyStore = KeyStore.getInstance("PKCS12");
    try (InputStream in = getClass().getResourceAsStream(keyStorePath)) {
      keyStore.load(in, keyStorePassword.toCharArray());
    }
    return (PrivateKey) keyStore.getKey(keyAlias, keyStorePassword.toCharArray());
  }

  public PublicKey publicKey() throws Exception {
    KeyStore keyStore = KeyStore.getInstance("PKCS12");
    try (InputStream in = getClass().getResourceAsStream(keyStorePath)) {
      keyStore.load(in, keyStorePassword.toCharArray());
    }
    Certificate cert = keyStore.getCertificate(keyAlias);
    return cert.getPublicKey();
  }
}`,
    failure: 'A keystore password in application.yml inside the JAR is still a secret in the artifact.',
    production: 'Inject passwords through secret managers, mount keystores read-only, restrict file permissions, and rotate aliases with kid.',
    interview30s: 'Java loads private keys from PKCS12/JKS or secret providers; the password and file are both sensitive.',
    followUp: 'How do you rotate a private key without downtime?',
    tradeoff: 'Keystores are portable and familiar; KMS/HSM gives stronger custody and audit.',
    memoryTrick: 'Keystore file plus password equals key access.',
  },
  {
    id: 'key-rotation',
    title: 'Key Rotation',
    badge: 'Lifecycle',
    problem: 'A key leaks or expires, but existing ciphertext still needs to decrypt.',
    whenToUse: 'Use key IDs, decrypt-old/encrypt-new behavior, and staged migrations for all production encryption.',
    whenAvoid: 'Avoid one global unversioned key where changing it breaks every stored value.',
    mermaid: `stateDiagram-v2
  [*] --> ReadOld
  ReadOld --> DecryptWithV1: keyId=v1
  DecryptWithV1 --> ReturnPlaintext
  ReturnPlaintext --> EncryptNewWritesWithV2
  EncryptNewWritesWithV2 --> Backfill
  Backfill --> RetireV1: after no ciphertext remains`,
    code: `package com.vibhu.crypto.crypto;

import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

@Component
public class ConfigAesKeyProvider implements AesKeyProvider {
  private final CryptoProperties properties;
  private final Map<String, SecretKey> keys;

  public ConfigAesKeyProvider(CryptoProperties properties) {
    this.properties = properties;
    this.keys = AesKeys.fromBase64Map(properties.keys());
  }

  @Override
  public CipherPackage currentKey() {
    String active = properties.activeKeyId();
    return new CipherPackage(active, keys.get(active));
  }

  @Override
  public SecretKey keyById(String keyId) {
    SecretKey key = keys.get(keyId);
    if (key == null) {
      throw new CryptoException("Unknown encryption key id");
    }
    return key;
  }
}

// Rotation runbook:
// 1. Deploy with v1 and v2, active=v2
// 2. New writes produce v2|iv|ciphertext
// 3. Reads still decrypt v1
// 4. Backfill rows in small batches
// 5. Retire v1 only after metrics show zero v1 reads`,
    failure: 'Rotating by replacing the bytes behind key id v1 makes every old ciphertext undecryptable.',
    production: 'Expose metrics by keyId version, backfill with idempotent jobs, and keep emergency decrypt access under break-glass controls.',
    interview30s: 'Store keyId with ciphertext. New writes use the active key; old reads use historical keys until backfilled.',
    followUp: 'How do you rotate HMAC lookup keys?',
    tradeoff: 'Keeping old keys preserves access but expands compromise blast radius until retirement.',
    memoryTrick: 'Never change what a key ID means.',
  },
  {
    id: 'multi-tenant',
    title: 'Multi-Tenant Encryption',
    badge: 'Isolation',
    problem: 'One tenant compromise should not expose another tenant, and enterprise customers may require their own keys.',
    whenToUse: 'Use tenant-specific data keys or KMS encryption context for B2B SaaS, regulated data, and premium isolation.',
    whenAvoid: 'Avoid unbounded key-per-user designs without cache, quota, and operational lifecycle.',
    mermaid: `flowchart TB
  REQ[Request tenantId] --> RES[TenantKeyResolver]
  RES --> A[Tenant A DEK]
  RES --> B[Tenant B DEK]
  A --> AESA[AES-GCM AAD tenant=A]
  B --> AESB[AES-GCM AAD tenant=B]
  AESA --> DBA[(tenant A ciphertext)]
  AESB --> DBB[(tenant B ciphertext)]`,
    code: `package com.vibhu.crypto.crypto;

import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class TenantEncryptionService {
  private final TenantKeyResolver tenantKeyResolver;
  private final AeadFieldEncryptor aead;

  public TenantEncryptionService(TenantKeyResolver tenantKeyResolver, AeadFieldEncryptor aead) {
    this.tenantKeyResolver = tenantKeyResolver;
    this.aead = aead;
  }

  public String encrypt(String tenantId, String field, String plaintext) {
    TenantKey key = tenantKeyResolver.activeKey(tenantId);
    byte[] iv = RandomBytes.gcmIv();
    byte[] ciphertext = aead.encrypt(key.secretKey(), iv, tenantId, field, plaintext);
    return key.keyId() + "|" + Base64s.encode(iv) + "|" + Base64s.encode(ciphertext);
  }

  public String decrypt(String tenantId, String field, String stored) {
    String[] parts = stored.split("\\\\|", 3);
    SecretKey key = tenantKeyResolver.keyById(tenantId, parts[0]);
    byte[] iv = Base64s.decode(parts[1]);
    byte[] ciphertext = Base64s.decode(parts[2]);
    return aead.decrypt(key, iv, tenantId, field, ciphertext);
  }
}

// AAD includes tenantId so copying ciphertext from tenant A to tenant B fails authentication.`,
    failure: 'If tenantId is trusted only from a request header and not authorization context, attackers can select another tenant key.',
    production: 'Resolve tenant from authenticated principal, bind tenant as AAD, cache keys by tenant with TTL, and cap metric cardinality.',
    interview30s: 'Tenant keys reduce blast radius. Bind ciphertext to tenant with AAD and resolve keys from auth context.',
    followUp: 'What changes for customer-managed keys?',
    tradeoff: 'Isolation improves, but key count, cache behavior, billing, and support workflows become more complex.',
    memoryTrick: 'Tenant identity chooses the key and authenticates the ciphertext.',
  },
];
