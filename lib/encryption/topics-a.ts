import type {EncryptionTopic} from './types';

export const TOPICS_A: EncryptionTopic[] = [
  {
    id: 'encoding-vs-encryption',
    title: 'Encoding vs Encryption vs Hashing vs Signing',
    badge: 'Foundation',
    problem: 'Teams store base64 PANs and call it encrypted. Interviewers use this to separate vocabulary from security judgment.',
    whenToUse: 'Use encoding for transport, encryption for confidentiality, hashing for one-way verification, HMAC/signatures for integrity and authenticity.',
    whenAvoid: 'Do not use Base64, URL encoding, gzip, SHA-256, or JWT parsing as a confidentiality boundary.',
    mermaid: `flowchart LR
  P[Plain card token] --> B[Base64 encoding]
  B --> D[Anyone decodes]
  P --> E[AES-GCM encrypt]
  E --> K[Key required]
  P --> H[Argon2id hash]
  H --> V[Verify only]
  P --> S[HMAC or RSA signature]
  S --> I[Detect tamper]`,
    code: `package com.vibhu.crypto.crypto;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;

public final class CryptoVocabularyDemo {
  private final AesEncryptionService aes;
  private final HmacService hmac;
  private final Argon2PasswordEncoder argon2 =
      Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();

  public CryptoVocabularyDemo(AesEncryptionService aes, HmacService hmac) {
    this.aes = aes;
    this.hmac = hmac;
  }

  public void explain(String ssn, String password) {
    String encoded = Base64.getEncoder().encodeToString(ssn.getBytes(StandardCharsets.UTF_8));
    String decoded = new String(Base64.getDecoder().decode(encoded), StandardCharsets.UTF_8);

    String ciphertext = aes.encrypt(ssn);       // keyId|iv|ciphertext
    String plaintext = aes.decrypt(ciphertext); // requires AES key

    String passwordHash = argon2.encode(password);
    boolean passwordOk = argon2.matches(password, passwordHash);

    String mac = hmac.sign("customerId=42&amount=1000");
    boolean untouched = hmac.verify("customerId=42&amount=1000", mac);
  }
}`,
    failure: 'Base64 secrets leak instantly in logs, browser dev tools, Kafka, and database exports because there is no key and no cryptographic hardness.',
    production: 'Use names that teach: encodeForUrl, encryptPii, hashPassword, signWebhook. Review PRs for words like encodedSecret.',
    interview30s: 'Encoding is reversible formatting; encryption is reversible only with a key; hashing is one-way; signatures/HMAC prove integrity and origin.',
    followUp: 'Is JWT payload encrypted?',
    tradeoff: 'Encryption adds key management and rotation; hashing removes recovery; signatures do not hide data.',
    memoryTrick: 'Encode = read differently, Encrypt = hide, Hash = fingerprint, Sign = tamper seal.',
  },
  {
    id: 'decision-matrix',
    title: 'Crypto Decision Matrix',
    badge: 'Architect',
    problem: 'Given PAN, password, webhook, JWT, TLS, and search requirements, choose the right primitive quickly.',
    whenToUse: 'Use this as the first whiteboard table in interviews and design reviews before writing crypto code.',
    whenAvoid: 'Do not start from an algorithm you like; start from the security property you need.',
    mermaid: `flowchart TD
  Q[What do you need?]
  Q --> C[Confidentiality]
  Q --> P[Password verify]
  Q --> T[Tamper proof]
  Q --> X[Transport]
  C --> A[AES-GCM or envelope]
  P --> ARG[Argon2id]
  T --> SIG[HMAC or signature]
  X --> TLS[TLS mTLS]`,
    code: `package com.vibhu.crypto.service;

public enum CryptoUseCase {
  PII_AT_REST("AES-GCM", "keyId|iv|ciphertext", "rotate with keyId"),
  LARGE_FILE("Envelope encryption", "DEK encrypted by KMS KEK", "stream AES-GCM"),
  PASSWORD("Argon2id", "salted one-way hash", "never decrypt"),
  WEBHOOK("HMAC-SHA256", "body + timestamp", "constant-time compare"),
  PARTNER_SIGNATURE("RSA-PSS or ECDSA", "private sign public verify", "cert rotation"),
  API_TRANSPORT("TLS 1.3", "server auth or mTLS", "cert lifecycle"),
  JWT_ACCESS_TOKEN("JWS", "signed claims", "payload is not secret");

  final String primitive;
  final String storage;
  final String productionNote;

  CryptoUseCase(String primitive, String storage, String productionNote) {
    this.primitive = primitive;
    this.storage = storage;
    this.productionNote = productionNote;
  }
}`,
    failure: 'Using RSA directly for all payloads creates size limits, latency, padding risk, and operational pain.',
    production: 'Create an internal crypto decision record for each sensitive data class: owner, primitive, key owner, rotation, logging rules, and test vectors.',
    interview30s: 'Ask: hide data, verify password, prove tamper, authenticate peer, or search? Then choose AES-GCM, Argon2, HMAC/signature, TLS, or tokenization.',
    followUp: 'Why does password storage not use AES?',
    tradeoff: 'A simple matrix prevents misuse, but edge cases like searchable encryption still need threat modeling.',
    memoryTrick: 'Property first, primitive second, provider third.',
  },
  {
    id: 'aes',
    title: 'AES Symmetric Encryption',
    badge: 'Core',
    problem: 'Encrypt PII in a service where the same backend must decrypt it later.',
    whenToUse: 'Use AES for bulk data encryption when the same trust boundary owns encryption and decryption.',
    whenAvoid: 'Do not use raw AES/ECB/CBC without authentication; do not hardcode keys in source.',
    mermaid: `sequenceDiagram
  participant S as Spring Service
  participant KP as AesKeyProvider
  participant AES as AES-GCM
  S->>KP: currentKey()
  KP-->>S: keyId + SecretKey
  S->>AES: plaintext + random IV
  AES-->>S: auth tag + ciphertext
  S-->>S: keyId|iv|ciphertext`,
    code: `package com.vibhu.crypto.crypto;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.springframework.stereotype.Service;

@Service
public class AesEncryptionService implements EncryptionService {
  private static final String TRANSFORMATION = "AES/GCM/NoPadding";
  private static final int IV_BYTES = 12;
  private static final int TAG_BITS = 128;
  private final SecureRandom secureRandom = new SecureRandom();
  private final AesKeyProvider keyProvider;

  public AesEncryptionService(AesKeyProvider keyProvider) {
    this.keyProvider = keyProvider;
  }

  @Override
  public String encrypt(String plaintext) {
    try {
      CipherPackage active = keyProvider.currentKey();
      byte[] iv = new byte[IV_BYTES];
      secureRandom.nextBytes(iv);

      Cipher cipher = Cipher.getInstance(TRANSFORMATION);
      cipher.init(Cipher.ENCRYPT_MODE, active.secretKey(), new GCMParameterSpec(TAG_BITS, iv));
      byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

      return active.keyId() + "|" + b64(iv) + "|" + b64(encrypted);
    } catch (Exception ex) {
      throw new CryptoException("AES encryption failed", ex);
    }
  }

  @Override
  public String decrypt(String stored) {
    try {
      String[] parts = stored.split("\\\\|", 3);
      SecretKey key = keyProvider.keyById(parts[0]);
      byte[] iv = Base64.getDecoder().decode(parts[1]);
      byte[] ciphertext = Base64.getDecoder().decode(parts[2]);

      Cipher cipher = Cipher.getInstance(TRANSFORMATION);
      cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
      return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
    } catch (Exception ex) {
      throw new CryptoException("AES decryption failed", ex);
    }
  }

  private static String b64(byte[] bytes) {
    return Base64.getEncoder().encodeToString(bytes);
  }
}`,
    failure: 'Reusing IVs with the same AES-GCM key can reveal relationships and break authentication guarantees.',
    production: 'Use 256-bit keys from KMS/Secrets Manager/keystore, random 96-bit IV per encryption, and store keyId with the ciphertext.',
    interview30s: 'AES is fast symmetric crypto; use AES-GCM with random IV and auth tag, store keyId|iv|ciphertext.',
    followUp: 'Why 12-byte IV for GCM?',
    tradeoff: 'Fast and simple, but every decrypting service that holds the key is in the trust boundary.',
    memoryTrick: 'AES moves the data; key management secures the system.',
  },
  {
    id: 'aes-gcm',
    title: 'AES-GCM Authenticated Encryption',
    badge: 'AEAD',
    problem: 'Encryption without integrity lets attackers flip bits or tamper with stored ciphertext.',
    whenToUse: 'Use AES-GCM for most application field encryption because it provides confidentiality and integrity in one operation.',
    whenAvoid: 'Avoid when you cannot guarantee unique IV per key or when you need deterministic ciphertext for exact lookup.',
    mermaid: `flowchart LR
  PT[Plaintext] --> G[AES-GCM]
  AAD[tenantId:field:v1] --> G
  IV[Random 96-bit IV] --> G
  KEY[DEK] --> G
  G --> CT[Ciphertext]
  G --> TAG[Auth tag]
  CT --> STORE[keyId|iv|ciphertext+tag]`,
    code: `package com.vibhu.crypto.crypto;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.nio.charset.StandardCharsets;

public final class AeadFieldEncryptor {
  private static final int TAG_BITS = 128;

  public byte[] encrypt(
      SecretKey key,
      byte[] iv,
      String tenantId,
      String columnName,
      String plaintext) throws Exception {

    Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
    cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));

    // AAD is authenticated but not encrypted. It binds ciphertext to context.
    cipher.updateAAD(("tenant=" + tenantId + ";column=" + columnName + ";v=1")
        .getBytes(StandardCharsets.UTF_8));

    return cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
  }

  public String decrypt(
      SecretKey key,
      byte[] iv,
      String tenantId,
      String columnName,
      byte[] ciphertext) throws Exception {

    Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
    cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
    cipher.updateAAD(("tenant=" + tenantId + ";column=" + columnName + ";v=1")
        .getBytes(StandardCharsets.UTF_8));

    return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
  }
}`,
    failure: 'If AAD differs on decrypt, GCM throws AEADBadTagException. That is a security signal, not a parse error to ignore.',
    production: 'Include non-secret context as AAD: tenant, table, column, schema version. Alert on tag failures.',
    interview30s: 'AES-GCM is AEAD: encrypts data and authenticates ciphertext plus optional AAD. Tampering fails during decrypt.',
    followUp: 'What should you log on AEADBadTagException?',
    tradeoff: 'Integrity comes almost free, but deterministic search becomes harder.',
    memoryTrick: 'GCM = hide plus tamper alarm.',
  },
  {
    id: 'rsa',
    title: 'RSA Encryption and Key Transport',
    badge: 'Asymmetric',
    problem: 'A partner has your public key and must send a small secret only you can decrypt.',
    whenToUse: 'Use RSA-OAEP to wrap small keys or payloads and RSA-PSS for signatures.',
    whenAvoid: 'Do not encrypt large JSON bodies directly with RSA; use hybrid encryption.',
    mermaid: `sequenceDiagram
  participant Partner
  participant API as Crypto API
  participant RSA as RSA Private Key
  Partner->>Partner: generate one-time AES key
  Partner->>API: RSA-OAEP(encrypted AES key) + AES-GCM(data)
  API->>RSA: unwrap AES key
  RSA-->>API: AES key
  API-->>API: decrypt payload`,
    code: `package com.vibhu.crypto.crypto;

import javax.crypto.Cipher;
import java.security.PrivateKey;
import java.security.PublicKey;

public final class RsaKeyWrap {
  private static final String RSA_OAEP =
      "RSA/ECB/OAEPWithSHA-256AndMGF1Padding";

  public byte[] encryptSmallSecret(PublicKey publicKey, byte[] secret) throws Exception {
    Cipher cipher = Cipher.getInstance(RSA_OAEP);
    cipher.init(Cipher.ENCRYPT_MODE, publicKey);
    return cipher.doFinal(secret);
  }

  public byte[] decryptSmallSecret(PrivateKey privateKey, byte[] encryptedSecret) throws Exception {
    Cipher cipher = Cipher.getInstance(RSA_OAEP);
    cipher.init(Cipher.DECRYPT_MODE, privateKey);
    return cipher.doFinal(encryptedSecret);
  }
}

// In production: RsaKeyConfig loads keys from PEM, PKCS12, or KMS/HSM.
// Keep private keys out of Git and out of application.yml.
// Prefer 3072-bit RSA+ or use ECC where ecosystem support is mature.`,
    failure: 'RSA/ECB/PKCS1Padding or hand-rolled padding is a common interview red flag.',
    production: 'For Java/Spring APIs, use public key for encrypt/verify and private key for decrypt/sign. Version partner public keys.',
    interview30s: 'RSA is asymmetric and slower. Use it for key wrapping or signatures, not bulk encryption.',
    followUp: 'Why does hybrid encryption exist?',
    tradeoff: 'Easy public-key distribution, but slower operations and key-size/padding constraints.',
    memoryTrick: 'RSA carries the key, AES carries the data.',
  },
  {
    id: 'signatures',
    title: 'Digital Signatures and HMAC',
    badge: 'Integrity',
    problem: 'You must prove a webhook or payment callback was not tampered with.',
    whenToUse: 'Use HMAC when both sides share a secret; use RSA/ECDSA signatures when many parties verify with a public key.',
    whenAvoid: 'Do not use encryption as a substitute for request signing; do not compare signatures with String.equals.',
    mermaid: `sequenceDiagram
  participant Sender
  participant Receiver
  Sender->>Sender: canonical body + timestamp
  Sender->>Sender: HMAC(secret) or Sign(private key)
  Sender->>Receiver: body + signature header
  Receiver->>Receiver: verify with shared secret or public key
  Receiver-->>Sender: accept only if fresh and valid`,
    code: `package com.vibhu.crypto.crypto;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

@Service
public class HmacService {
  private final byte[] secret = "replace-with-kms-secret".getBytes(StandardCharsets.UTF_8);

  public String sign(String canonicalBody) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret, "HmacSHA256"));
      return HexFormat.of().formatHex(mac.doFinal(canonicalBody.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception ex) {
      throw new CryptoException("HMAC failed", ex);
    }
  }

  public boolean verify(String canonicalBody, String expectedHex) {
    byte[] actual = HexFormat.of().parseHex(sign(canonicalBody));
    byte[] expected = HexFormat.of().parseHex(expectedHex);
    return MessageDigest.isEqual(actual, expected);
  }
}

@Service
public class RsaSignatureService {
  private final RsaKeyConfig keys;

  public RsaSignatureService(RsaKeyConfig keys) {
    this.keys = keys;
  }

  public byte[] sign(byte[] message) throws Exception {
    PrivateKey privateKey = keys.privateKey();
    Signature signature = Signature.getInstance("RSASSA-PSS");
    signature.initSign(privateKey);
    signature.update(message);
    return signature.sign();
  }

  public boolean verify(byte[] message, byte[] signed) throws Exception {
    PublicKey publicKey = keys.publicKey();
    Signature signature = Signature.getInstance("RSASSA-PSS");
    signature.initVerify(publicKey);
    signature.update(message);
    return signature.verify(signed);
  }
}`,
    failure: 'Signing an uncanonicalized JSON body breaks when whitespace or field order changes; accepting old timestamps enables replay.',
    production: 'Sign method + path + body hash + timestamp + nonce. Enforce freshness, replay cache, and constant-time comparison.',
    interview30s: 'HMAC is shared-secret integrity; digital signatures use private sign and public verify, so verifiers do not need the secret.',
    followUp: 'How do you prevent replay?',
    tradeoff: 'HMAC is faster and simpler; signatures scale better across partners because private keys stay with signers.',
    memoryTrick: 'Encrypt hides; sign proves who and whether changed.',
  },
];
