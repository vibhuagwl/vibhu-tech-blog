import type {SecTopic} from './types';

export const TOPICS_CRYPTO: SecTopic[] = [
  {
    id: 'symmetric',
    title: 'Symmetric Encryption (AES-GCM)',
    badge: 'AES',
    category: 'Crypto',
    what: 'Same secret key encrypts and decrypts — AES-GCM provides confidentiality + authentication tag.',
    mermaid: `flowchart LR
  PT[Plaintext] --> ENC[AES-GCM encrypt]
  KEY[(SecretKey 256-bit)] --> ENC
  ENC --> OUT[IV + ciphertext + tag]
  OUT --> DEC[AES-GCM decrypt]
  KEY --> DEC
  DEC --> PT2[Plaintext]`,
    code: `@Service
public class AesEncryptionService {
  private static final String TRANSFORMATION = "AES/GCM/NoPadding";
  private static final int GCM_TAG_BITS = 128;
  private static final int IV_BYTES = 12;

  private final SecretKey key;

  public AesEncryptionService(@Value("\${crypto.aes-key-base64}") String b64) {
    byte[] raw = Base64.getDecoder().decode(b64);
    if (raw.length != 32) throw new IllegalArgumentException("AES-256 key required");
    this.key = new SecretKeySpec(raw, "AES");
  }

  public String encrypt(String plaintext) throws Exception {
    byte[] iv = new byte[IV_BYTES];
    SecureRandom.getInstanceStrong().nextBytes(iv);
    Cipher cipher = Cipher.getInstance(TRANSFORMATION);
    cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
    byte[] ct = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
    return Base64.getEncoder().encodeToString(iv) + "|"
        + Base64.getEncoder().encodeToString(ct);
  }

  public String decrypt(String packed) throws Exception {
    String[] parts = packed.split("\\|");
    byte[] iv = Base64.getDecoder().decode(parts[0]);
    byte[] ct = Base64.getDecoder().decode(parts[1]);
    Cipher cipher = Cipher.getInstance(TRANSFORMATION);
    cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
    return new String(cipher.doFinal(ct), StandardCharsets.UTF_8);
  }
}

# NEVER reuse IV with same key — GCM breaks catastrophically`,
    verify: `# Lab: spring-encryption-lab :8093
curl -s -X POST http://localhost:8093/api/crypto/encrypt \\
  -H "Content-Type: application/json" \\
  -d '{"plaintext":"account-12345"}' | jq
curl -s -X POST http://localhost:8093/api/crypto/decrypt \\
  -H "Content-Type: application/json" \\
  -d '{"ciphertext":"<from-above>"}' | jq`,
    pitfalls: 'AES-ECB mode. Static IV. Key in application.yml committed to git. Using AES for password storage.',
    production: 'Envelope encryption with KMS; unique IV per encrypt; rotate DEKs; never log ciphertext keys.',
    interview30s: 'AES-GCM: symmetric, fast, authenticated encryption. 256-bit key, random 12-byte IV per message, never reuse IV+key.',
    interview2m: 'When symmetric works: bulk field encryption, TLS record layer. Key distribution problem — solved by KMS envelope or TLS handshake.',
    traps: '"AES encrypts passwords" — use bcrypt/Argon2 for passwords; AES for data at rest.',
    labHref: '/encryption',
  },
  {
    id: 'asymmetric',
    title: 'Asymmetric Encryption (RSA/EC)',
    badge: 'RSA',
    category: 'Crypto',
    what: 'Key pair — public encrypts (rare), private decrypts; primarily used for signatures and key wrapping.',
    mermaid: `flowchart LR
  PUB[Public key] --> WRAP[Wrap AES key]
  PRIV[Private key] --> UNWRAP[Unwrap AES key]
  WRAP --> BLOB[Encrypted DEK]
  BLOB --> UNWRAP`,
    code: `@Configuration
public class RsaKeyConfig {
  @Bean
  KeyPair rsaKeyPair() throws Exception {
    KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
    gen.initialize(2048);
    return gen.generateKeyPair();
  }

  @Bean
  JwtEncoder jwtEncoder(KeyPair kp) {
    JWK jwk = new RSAKey.Builder((RSAPublicKey) kp.getPublic())
        .privateKey((RSAPrivateKey) kp.getPrivate())
        .keyID(UUID.randomUUID().toString())
        .build();
    return new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(jwk)));
  }
}

@Service
public class RsaOaepService {
  public byte[] wrapAesKey(PublicKey publicKey, SecretKey aesKey) throws Exception {
    Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
    cipher.init(Cipher.WRAP_MODE, publicKey);
    return cipher.wrap(aesKey);
  }

  public SecretKey unwrapAesKey(PrivateKey privateKey, byte[] wrapped) throws Exception {
    Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
    cipher.init(Cipher.UNWRAP_MODE, privateKey);
    return (SecretKey) cipher.unwrap(wrapped, "AES", Cipher.SECRET_KEY);
  }
}

# JWT RS256 uses private key sign, public key verify — not encryption`,
    verify: `curl -s http://localhost:8093/api/crypto/public-key | jq
# oauth-jwt-demo JWKS
curl -s http://localhost:9000/oauth2/jwks | jq '.keys[0].kid'`,
    pitfalls: 'RSA PKCS1 v1.5 padding for new code — prefer OAEP. 1024-bit keys. Encrypting large payloads directly with RSA.',
    production: '2048+ RSA or P-256 EC; private keys in HSM/KMS; public keys via JWKS; rotate with kid header.',
    interview30s: 'Asymmetric: key pair. Sign with private, verify with public (JWT RS256). Wrap symmetric keys with RSA-OAEP — do not RSA large data.',
    interview2m: 'ECDSA vs RSA size/performance. Why TLS uses ephemeral DH/ECDH for forward secrecy, not RSA encrypt of bulk data.',
    traps: 'Confusing JWT signing (JWS) with encryption (JWE).',
    labHref: '/encryption',
  },
  {
    id: 'hybrid',
    title: 'Hybrid / Envelope Encryption',
    badge: 'Pattern',
    category: 'Crypto',
    what: 'Generate random AES DEK → encrypt data with AES → wrap DEK with RSA/KMS public key.',
    mermaid: `flowchart TB
  DATA[Payment record] --> AES[AES-GCM with DEK]
  DEK[Random DEK] --> AES
  DEK --> KMS[KMS Encrypt DEK]
  KMS --> STORE[(DB: ciphertext + encryptedDEK)]
  CMK[(KMS CMK)] --> KMS`,
    code: `@Service
public class HybridEncryptionService {
  private final AesEncryptionService aes;
  private final RsaOaepService rsa;
  private final PublicKey recipientPublicKey;

  public HybridPacket encryptField(String plaintext) throws Exception {
    SecretKey dek = aes.generateDek();
    String ciphertext = aes.encryptWithKey(dek, plaintext);
    byte[] wrappedDek = rsa.wrapAesKey(recipientPublicKey, dek);
    return new HybridPacket(
        Base64.getEncoder().encodeToString(wrappedDek),
        ciphertext);
  }
}

@Service
public class EnvelopeEncryptionService {
  private final KmsClient kms;
  private final String cmkArn;

  public EncryptedBlob envelopeEncrypt(byte[] plaintext) {
    GenerateDataKeyResponse dataKey = kms.generateDataKey(GenerateDataKeyRequest.builder()
        .keyId(cmkArn)
        .keySpec(DataKeySpec.AES_256)
        .build());
    byte[] iv = randomIv();
    byte[] ciphertext = aesGcmEncrypt(dataKey.plaintext().asByteArray(), iv, plaintext);
    return new EncryptedBlob(
        Base64.getEncoder().encodeToString(dataKey.ciphertextBlob().asByteArray()),
        Base64.getEncoder().encodeToString(iv),
        Base64.getEncoder().encodeToString(ciphertext));
  }
}`,
    verify: `curl -s -X POST http://localhost:8093/api/crypto/hybrid \\
  -H "Content-Type: application/json" \\
  -d '{"plaintext":"wire-transfer-999"}' | jq`,
    pitfalls: 'Storing DEK plaintext alongside ciphertext. Same DEK for all rows. No key rotation strategy.',
    production: 'Per-record or per-tenant DEK; CMK rotation with re-encrypt job; cache decrypted DEKs with short TTL only in memory.',
    interview30s: 'Hybrid = AES speed + RSA/KMS key safety. DEK encrypts data; CMK encrypts DEK. Standard for S3, RDS, field-level PCI.',
    interview2m: 'Walk envelope decrypt at read time: KMS Decrypt DEK → AES decrypt field. Blast radius if app compromised vs CMK in HSM.',
    traps: '"We use hybrid for passwords" — still use Argon2; hybrid is for data fields/blobs.',
    labHref: '/encryption',
  },
  {
    id: 'hash-encoding',
    title: 'Hash vs Encrypt vs Encode',
    badge: 'Basics',
    category: 'Crypto',
    what: 'Hash = one-way digest; encrypt = reversible with key; encode = representation (Base64/hex).',
    mermaid: `flowchart TB
  subgraph hash [Hash SHA-256]
    H1[Input] --> H2[Fixed digest]
  end
  subgraph enc [Encrypt AES-GCM]
    E1[Input] --> E2[Ciphertext]
    KEY[(Key)] --> E2
  end
  subgraph encd [Encode Base64]
    B1[Bytes] --> B2[Text]
  end`,
    code: `@Service
public class EncodingVsEncryptionDemo {

  // WRONG — Base64 is NOT encryption
  public String badObfuscation(String s) {
    return Base64.getEncoder().encodeToString(s.getBytes());
  }

  // RIGHT — SHA-256 for integrity fingerprint (not passwords alone)
  public String fingerprint(byte[] data) throws Exception {
    MessageDigest md = MessageDigest.getInstance("SHA-256");
    return HexFormat.of().formatHex(md.digest(data));
  }

  // RIGHT — HMAC for lookup token without storing plaintext
  public String accountLookupToken(String accountNumber, SecretKey hmacKey) throws Exception {
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(hmacKey);
    return Base64.getUrlEncoder().withoutPadding()
        .encodeToString(mac.doFinal(accountNumber.getBytes(StandardCharsets.UTF_8)));
  }
}

# Interview table
# | Operation  | Reversible | Key needed | Use |
# | Base64     | yes        | no         | transport only |
# | SHA-256    | no         | no         | integrity |
# | HMAC       | no         | yes        | authenticated fingerprint |
# | AES-GCM    | yes        | yes        | confidentiality |`,
    verify: `curl -s -X POST http://localhost:8093/api/crypto/hash \\
  -H "Content-Type: application/json" -d '{"input":"hello"}' | jq
curl -s "http://localhost:8093/api/customers/by-account?token=<hmac-token>"`,
    pitfalls: 'SHA-256(password) without salt for credentials. Confusing encoding with encryption in audit docs.',
    production: 'Name algorithms explicitly in APIs/docs; HMAC keys from KMS; never reversible-encode PII as "protection".',
    interview30s: 'Encoding ≠ encryption ≠ hashing. Base64 is reversible without a key. SHA-256 is one-way. AES needs a secret key.',
    interview2m: 'Password storage: Argon2id/bcrypt adaptive hash. Lookup: HMAC token. Integrity at rest: hash chain or signature.',
    traps: '"We hashed it with Base64" — instant fail in interview.',
    labHref: '/encryption',
  },
  {
    id: 'digital-signature',
    title: 'Digital Signature',
    badge: 'Integrity',
    category: 'Crypto',
    what: 'Private key signs hash of message; anyone with public key verifies integrity and signer identity.',
    mermaid: `sequenceDiagram
  participant S as Sender
  participant R as Receiver
  S->>S: hash(payload)
  S->>S: sign with private key
  S->>R: payload + signature
  R->>R: verify with public key`,
    code: `@Service
public class RsaSignatureService {
  public SignedPayment sign(PaymentRequest req, PrivateKey privateKey) throws Exception {
    byte[] payload = canonicalJson(req);
    Signature sig = Signature.getInstance("SHA256withRSA");
    sig.initSign(privateKey);
    sig.update(payload);
    return new SignedPayment(req, Base64.getEncoder().encodeToString(sig.sign()));
  }

  public void verify(PaymentRequest req, String signatureB64, PublicKey publicKey) throws Exception {
    byte[] payload = canonicalJson(req);
    Signature sig = Signature.getInstance("SHA256withRSA");
    sig.initVerify(publicKey);
    sig.update(payload);
    if (!sig.verify(Base64.getDecoder().decode(signatureB64))) {
      throw new SecurityException("Invalid signature");
    }
  }

  private byte[] canonicalJson(PaymentRequest req) throws Exception {
    ObjectMapper om = new ObjectMapper();
    om.configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true);
    return om.writeValueAsBytes(req);
  }
}

# JWT RS256 IS a digital signature over header.payload
# JWS compact: base64url(header).base64url(payload).base64url(signature)`,
    verify: `curl -s -X POST http://localhost:8093/api/crypto/sign \\
  -H "Content-Type: application/json" \\
  -d '{"paymentId":"P-99","amount":250.00,"currency":"USD"}' | jq`,
    pitfalls: 'Signing without canonical JSON — verify fails across platforms. MD5withRSA. Confusing MAC (HMAC) with asymmetric signature.',
    production: 'ECDSA P-256 or RSA-2048+; timestamp + nonce in signed payload prevents replay; rotate signing keys with kid.',
    interview30s: 'Signature = private sign, public verify. Proves integrity + who signed. JWT access tokens are signed, not encrypted.',
    interview2m: 'Compare HMAC (shared secret, both sides can sign) vs RSA signature (only holder of private key signs). Webhook Stripe-style HMAC-SHA256 vs JWT RS256.',
    traps: 'Assuming encrypted JWT — most are only signed; payload is readable.',
    labHref: '/encryption',
  },
  {
    id: 'certificates',
    title: 'X.509 / CA Chain',
    badge: 'PKI',
    category: 'Crypto',
    what: 'X.509 cert binds public key to identity (CN/SAN); chain validates leaf → intermediate → trusted root.',
    mermaid: `flowchart BT
  ROOT[Root CA — trust anchor]
  INT[Intermediate CA]
  LEAF[api.example.com leaf cert]
  ROOT --> INT
  INT --> LEAF
  Client -->|truststore has ROOT| ROOT
  Client -->|validates chain| LEAF`,
    code: `# Inspect cert chain
openssl s_client -connect api.example.com:443 -showcerts </dev/null 2>/dev/null \\
  | openssl x509 -noout -subject -issuer -dates -ext subjectAltName

# Spring Boot trust custom corporate CA
server:
  ssl:
    trust-store: classpath:corp-ca-bundle.p12
    trust-store-password: \${TRUSTSTORE_PASS}

# Programmatic hostname verification (do NOT disable)
HttpsURLConnection.setDefaultHostnameVerifier((host, session) -> {
  return host.equalsIgnoreCase(session.getPeerHost());
});

# Better: use default JVM verifier + correct SAN on cert
# Cert must include DNS SAN for api.example.com — CN alone is legacy

@Service
public class PkiService {
  public void validatePeerCert(X509Certificate cert, Set<TrustAnchor> anchors) throws Exception {
    PKIXParameters params = new PKIXParameters(anchors);
    params.setRevocationEnabled(true); // OCSP when available
    CertPathValidator.getInstance("PKIX").validate(
        CertificateFactory.getInstance("X.509")
            .generateCertPath(List.of(cert)), params);
  }
}`,
    verify: `keytool -printcert -sslserver api.example.com:443
curl -vI https://api.example.com 2>&1 | grep "subject:"`,
    pitfalls: 'Expired intermediate not in chain. Cert valid but SAN missing service hostname. CRL/OCSP ignored.',
    production: 'Automated renewal; monitor all chain members; pin corporate root in truststore; short-lived leaf certs (90d).',
    interview30s: 'X.509: subject, issuer, validity, SAN, public key. Client builds chain to trust anchor in truststore. SAN must match hostname.',
    interview2m: 'Debug SSL handshake failures: expired, wrong hostname, missing intermediate, untrusted CA. mTLS adds client cert validation.',
    traps: 'Trust-all or disable hostname verify "temporarily" shipped to production.',
    labHref: '/encryption',
  },
  {
    id: 'password-security',
    title: 'Password Hashing',
    badge: 'Credentials',
    category: 'Crypto',
    what: 'Adaptive one-way hash (bcrypt/Argon2) — never encrypt or reversible-hash passwords.',
    mermaid: `flowchart LR
  REG[Register password] --> HASH[Argon2id hash]
  HASH --> DB[(store hash only)]
  LOGIN[Login password] --> VERIFY[PasswordEncoder.matches]
  DB --> VERIFY
  VERIFY --> OK[JWT / session]`,
    code: `@Configuration
public class PasswordConfig {
  @Bean
  PasswordEncoder passwordEncoder() {
    // Production: tune Argon2 memory/iterations to ~250ms on prod hardware
    return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    // Ubiquitous alternative:
    // return new BCryptPasswordEncoder(12);
  }
}

@Service
public class AuthService {
  private final UserRepository users;
  private final PasswordEncoder encoder;

  public User register(String email, String rawPassword) {
    if (rawPassword.length() < 12) throw new WeakPasswordException();
    User u = new User(email, encoder.encode(rawPassword));
    return users.save(u);
  }

  public boolean authenticate(String email, String rawPassword) {
    return users.findByEmail(email)
        .map(u -> encoder.matches(rawPassword, u.getPasswordHash()))
        .orElse(false);
  }
}

# spring-jwt-demo :8092 — BCrypt on register/login
# POST /api/auth/register {"email":"...","password":"..."}`,
    verify: `curl -s -X POST http://localhost:8092/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"demo@vibhu.com","password":"Str0ngP@ssw0rd!"}'
curl -s -X POST http://localhost:8092/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"demo@vibhu.com","password":"Str0ngP@ssw0rd!"}' | jq '.accessToken'`,
    pitfalls: 'MD5/SHA1(password). Same salt for all users (bcrypt embeds salt — OK). Logging raw password on failed login.',
    production: 'Argon2id or bcrypt cost tuned to ~250ms; breach detection (HIBP); MFA for sensitive ops; rate-limit login.',
    interview30s: 'Passwords: adaptive hash + unique salt per user. bcrypt/Argon2 — NOT AES, NOT SHA-256 alone. Verify with constant-time matches().',
    interview2m: 'Registration vs login flow. Upgrade hash algorithm on successful login. OAuth shifts password handling to IdP.',
    traps: '"We encrypt passwords with AES" — wrong; reversible encryption forbidden for passwords.',
    labHref: '/spring-jwt-demo',
  },
];
