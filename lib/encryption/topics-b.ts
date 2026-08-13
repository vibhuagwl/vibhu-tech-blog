import type {EncryptionTopic} from './types';

export const TOPICS_B: EncryptionTopic[] = [
  {
    id: 'ecc',
    title: 'ECC: ECDH and ECDSA',
    badge: 'Modern',
    problem: 'You need smaller keys and fast handshakes/signatures for mobile, TLS, or partner integrations.',
    whenToUse: 'Use ECDSA for signatures and ECDH for key agreement when platform and compliance support it.',
    whenAvoid: 'Avoid custom curve math or unsupported curves; prefer named curves and provider defaults.',
    mermaid: `sequenceDiagram
  participant A as Service A
  participant B as Service B
  A->>B: ECDH public key
  B->>A: ECDH public key
  A->>A: derive shared secret
  B->>B: derive same secret
  A->>B: AES-GCM message`,
    code: `package com.vibhu.crypto.crypto;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;
import javax.crypto.KeyAgreement;

public class EccCryptoService {
  public KeyPair p256KeyPair() throws Exception {
    KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
    generator.initialize(new ECGenParameterSpec("secp256r1"));
    return generator.generateKeyPair();
  }

  public byte[] sharedSecret(KeyPair mine, java.security.PublicKey peerPublicKey) throws Exception {
    KeyAgreement agreement = KeyAgreement.getInstance("ECDH");
    agreement.init(mine.getPrivate());
    agreement.doPhase(peerPublicKey, true);
    return agreement.generateSecret();
  }

  public byte[] sign(byte[] message, KeyPair keyPair) throws Exception {
    Signature signature = Signature.getInstance("SHA256withECDSA");
    signature.initSign(keyPair.getPrivate());
    signature.update(message);
    return signature.sign();
  }

  public boolean verify(byte[] message, byte[] signed, java.security.PublicKey publicKey) throws Exception {
    Signature signature = Signature.getInstance("SHA256withECDSA");
    signature.initVerify(publicKey);
    signature.update(message);
    return signature.verify(signed);
  }
}`,
    failure: 'Raw ECDH output is not an AES key. Derive keys with HKDF or a provider-backed KDF before AES-GCM.',
    production: 'Keep to approved curves such as P-256/P-384 or X25519 where available; document FIPS requirements before choosing providers.',
    interview30s: 'ECC gives RSA-like asymmetric capabilities with smaller keys: ECDSA for signatures, ECDH for key agreement.',
    followUp: 'Why is ECDH not encryption by itself?',
    tradeoff: 'Better performance/key size, but provider support and compliance details are more nuanced than RSA.',
    memoryTrick: 'ECDH agrees, ECDSA signs.',
  },
  {
    id: 'hybrid',
    title: 'Hybrid Encryption',
    badge: 'Practical',
    problem: 'RSA cannot encrypt a large payment payload, but partners need public-key based delivery.',
    whenToUse: 'Use hybrid encryption for partner payloads: random AES data key for payload, RSA/ECC/KMS wraps the data key.',
    whenAvoid: 'Avoid when both services are inside the same trust boundary and KMS envelope encryption is simpler.',
    mermaid: `sequenceDiagram
  participant Client
  participant API
  Client->>Client: generate AES data key
  Client->>Client: AES-GCM encrypt JSON
  Client->>Client: RSA-OAEP encrypt data key
  Client->>API: encryptedKey + iv + ciphertext
  API->>API: RSA decrypt key
  API->>API: AES-GCM decrypt JSON`,
    code: `package com.vibhu.crypto.crypto;

import java.security.PublicKey;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class HybridEncryptionService {
  private final AesEncryptionService aes;
  private final RsaKeyConfig rsaKeyConfig;
  private final RsaKeyWrap rsaKeyWrap = new RsaKeyWrap();

  public HybridEncryptionService(AesEncryptionService aes, RsaKeyConfig rsaKeyConfig) {
    this.aes = aes;
    this.rsaKeyConfig = rsaKeyConfig;
  }

  public HybridPacket encryptForPartner(String json, PublicKey partnerPublicKey) throws Exception {
    SecretKey dataKey = generateDataKey();
    String encryptedPayload = aes.encryptWithKey("dek-v1", dataKey, json);
    byte[] encryptedDataKey = rsaKeyWrap.encryptSmallSecret(partnerPublicKey, dataKey.getEncoded());
    return new HybridPacket("RSA-OAEP-256", encryptedDataKey, encryptedPayload);
  }

  public String decryptFromPartner(HybridPacket packet) throws Exception {
    byte[] rawDataKey = rsaKeyWrap.decryptSmallSecret(rsaKeyConfig.privateKey(), packet.encryptedDataKey());
    SecretKey dataKey = AesKeys.fromBytes(rawDataKey);
    return aes.decryptWithKey(dataKey, packet.encryptedPayload());
  }

  private SecretKey generateDataKey() throws Exception {
    KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
    keyGenerator.init(256);
    return keyGenerator.generateKey();
  }
}`,
    failure: 'If you reuse one data key forever, compromise of that key exposes every payload encrypted under it.',
    production: 'Use one data key per message or small batch. Include algorithm, key version, IV, and ciphertext in the packet.',
    interview30s: 'Hybrid encryption uses AES for the payload and RSA/ECC/KMS to protect the AES key.',
    followUp: 'What metadata must be stored with a hybrid packet?',
    tradeoff: 'Combines public-key distribution with AES speed, but packet format and key rotation become part of your API contract.',
    memoryTrick: 'Wrap the key, not the world.',
  },
  {
    id: 'envelope',
    title: 'Envelope Encryption',
    badge: 'KMS',
    problem: 'A service must encrypt millions of rows without calling KMS for every decrypt byte.',
    whenToUse: 'Use envelope encryption for cloud-native data-at-rest: KMS protects key-encryption-keys and app uses data-encryption-keys.',
    whenAvoid: 'Avoid direct master-key encryption of all rows or storing plaintext DEKs.',
    mermaid: `flowchart TD
  APP[Spring service] --> KMS[KMS GenerateDataKey]
  KMS --> PT[Plaintext DEK]
  KMS --> EDEK[Encrypted DEK]
  PT --> AES[AES-GCM encrypt data]
  AES --> ROW[keyId|iv|ciphertext]
  ROW --> DB[(Database)]
  EDEK --> DB
  APP --> ZERO[Zeroize plaintext DEK]`,
    code: `package com.vibhu.crypto.crypto;

import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class EnvelopeEncryptionService {
  private final KmsClient kmsClient;
  private final AesEncryptionService aes;

  public EnvelopeEncryptionService(KmsClient kmsClient, AesEncryptionService aes) {
    this.kmsClient = kmsClient;
    this.aes = aes;
  }

  public EnvelopeRecord encryptCustomerField(String plaintext) {
    DataKey dataKey = kmsClient.generateDataKey("alias/customer-pii");
    try {
      String encryptedValue = aes.encryptWithKey(dataKey.keyId(), dataKey.plaintextKey(), plaintext);
      return new EnvelopeRecord(
          dataKey.keyId(),
          dataKey.encryptedKey(),
          encryptedValue); // keyId|iv|ciphertext
    } finally {
      dataKey.destroyPlaintext();
    }
  }

  public String decryptCustomerField(EnvelopeRecord record) {
    SecretKey dek = kmsClient.decryptDataKey(record.encryptedDataKey());
    try {
      return aes.decryptWithKey(dek, record.encryptedValue());
    } finally {
      CryptoZeroizer.destroy(dek);
    }
  }
}`,
    failure: 'Putting the plaintext DEK beside encrypted data is equivalent to leaving the safe key taped to the safe.',
    production: 'Cache decrypted DEKs briefly with strict TTL and max size; log key IDs, never key material.',
    interview30s: 'Envelope encryption: KMS wraps data keys; data keys encrypt data. Store encrypted DEK plus keyId|iv|ciphertext.',
    followUp: 'Why not call KMS for every database column?',
    tradeoff: 'Scalable and rotatable, but adds metadata, cache policy, and KMS availability dependency.',
    memoryTrick: 'KMS protects keys; AES protects data.',
  },
  {
    id: 'spring-boot',
    title: 'Spring Boot Crypto Service',
    badge: 'Hands-on',
    problem: 'Expose safe encrypt/decrypt APIs without leaking keys, plaintext, or stack traces.',
    whenToUse: 'Use a dedicated service/controller layer around crypto primitives, with DTOs and redacted logs.',
    whenAvoid: 'Avoid sprinkling Cipher code across controllers, entities, and repositories.',
    mermaid: `flowchart TB
  C[CryptoController :8093] --> S[AesEncryptionService]
  C --> H[HybridEncryptionService]
  C --> SIG[RsaSignatureService]
  C --> MAC[HmacService]
  S --> KP[AesKeyProvider]
  KP --> CFG[CryptoProperties or KMS]`,
    code: `package com.vibhu.crypto.controller;

import com.vibhu.crypto.crypto.AesEncryptionService;
import com.vibhu.crypto.crypto.HmacService;
import com.vibhu.crypto.crypto.HybridEncryptionService;
import com.vibhu.crypto.crypto.RsaSignatureService;
import com.vibhu.crypto.dto.DecryptRequest;
import com.vibhu.crypto.dto.EncryptRequest;
import com.vibhu.crypto.dto.EncryptResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/crypto")
public class CryptoController {
  private final AesEncryptionService aes;
  private final HybridEncryptionService hybrid;
  private final HmacService hmac;
  private final RsaSignatureService signatures;

  public CryptoController(
      AesEncryptionService aes,
      HybridEncryptionService hybrid,
      HmacService hmac,
      RsaSignatureService signatures) {
    this.aes = aes;
    this.hybrid = hybrid;
    this.hmac = hmac;
    this.signatures = signatures;
  }

  @PostMapping("/encrypt")
  public ResponseEntity<EncryptResponse> encrypt(@RequestBody EncryptRequest request) {
    String ciphertext = aes.encrypt(request.plaintext());
    return ResponseEntity.ok(new EncryptResponse(ciphertext));
  }

  @PostMapping("/decrypt")
  public ResponseEntity<String> decrypt(@RequestBody DecryptRequest request) {
    return ResponseEntity.ok(aes.decrypt(request.ciphertext()));
  }

  @PostMapping("/hmac")
  public ResponseEntity<String> hmac(@RequestBody String canonicalBody) {
    return ResponseEntity.ok(hmac.sign(canonicalBody));
  }
}

# application.yml
server:
  port: 8093
crypto:
  active-key-id: local-v1
  keys:
    local-v1: \${CRYPTO_AES_KEY_BASE64}`,
    failure: 'Returning raw CryptoException details can leak provider names, key IDs, or input fragments to clients.',
    production: 'Centralize exception mapping, use Bean Validation on request sizes, and redact request/response bodies in logging filters.',
    interview30s: 'Wrap crypto in Spring services, expose narrow DTO APIs, and keep key resolution behind providers.',
    followUp: 'Where should the AES key come from in production?',
    tradeoff: 'Central service improves consistency; a remote crypto service can become a latency and availability dependency.',
    memoryTrick: 'Controller orchestrates; service encrypts; provider owns keys.',
  },
  {
    id: 'db-encryption',
    title: 'Database Field Encryption',
    badge: 'JPA',
    problem: 'Customer PII should remain unreadable in database snapshots and read replicas.',
    whenToUse: 'Use application-level field encryption for high-risk PII such as SSN, tax ID, bank account, or card tokens.',
    whenAvoid: 'Do not encrypt columns needed for range queries, sorting, joins, or uniqueness unless you redesign the access pattern.',
    mermaid: `flowchart LR
  API[CustomerController] --> S[CustomerService]
  S --> E[Customer entity]
  E --> C[EncryptedStringConverter]
  C --> AES[AES-GCM]
  AES --> DB[(ciphertext column)]
  DB --> C
  C --> S`,
    code: `package com.vibhu.crypto.crypto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.stereotype.Component;

@Component
@Converter(autoApply = false)
public class EncryptedStringConverter implements AttributeConverter<String, String> {
  private static AesEncryptionService aes;

  public EncryptedStringConverter(AesEncryptionService aesEncryptionService) {
    EncryptedStringConverter.aes = aesEncryptionService;
  }

  @Override
  public String convertToDatabaseColumn(String attribute) {
    if (attribute == null || attribute.isBlank()) {
      return attribute;
    }
    return aes.encrypt(attribute); // keyId|iv|ciphertext
  }

  @Override
  public String convertToEntityAttribute(String dbData) {
    if (dbData == null || dbData.isBlank()) {
      return dbData;
    }
    return aes.decrypt(dbData);
  }
}

package com.vibhu.crypto.entity;

import com.vibhu.crypto.crypto.EncryptedStringConverter;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Customer {
  @Id
  private String id;
  private String emailLookupHash;

  @Convert(converter = EncryptedStringConverter.class)
  private String taxIdentifier;
}`,
    failure: 'JPA converters can decrypt unexpectedly during logging, serialization, dirty checking, or admin screens.',
    production: 'Keep encrypted and lookup columns separate. Mask decrypted values at API boundaries and prevent entity toString from printing PII.',
    interview30s: 'Encrypt sensitive fields before DB write with AES-GCM; store keyId|iv|ciphertext and use separate hashes for lookup.',
    followUp: 'Can you query encrypted SSN by prefix?',
    tradeoff: 'Application encryption protects DB compromise but reduces query capabilities and complicates migrations.',
    memoryTrick: 'Encrypt value, hash lookup, mask output.',
  },
  {
    id: 'searchable',
    title: 'Searchable Encryption and Lookup Hashes',
    badge: 'Trade-off',
    problem: 'Support exact customer lookup by email or account number without decrypting every row.',
    whenToUse: 'Use keyed HMAC lookup columns for exact equality search when deterministic matching is required.',
    whenAvoid: 'Avoid deterministic encryption or HMAC for low-cardinality values like gender or yes/no flags.',
    mermaid: `flowchart TD
  IN[email] --> N[normalize lowercase trim]
  N --> H[HMAC lookup key]
  H --> IDX[(indexed lookup_hash)]
  IN --> AES[AES-GCM random IV]
  AES --> C[(encrypted_email)]
  IDX --> ROW[Find row]
  ROW --> DEC[Decrypt only matched row]`,
    code: `package com.vibhu.crypto.service;

import com.vibhu.crypto.crypto.AesEncryptionService;
import com.vibhu.crypto.crypto.HmacService;
import com.vibhu.crypto.entity.Customer;
import com.vibhu.crypto.repository.CustomerRepository;
import org.springframework.stereotype.Service;

@Service
public class CustomerService {
  private final CustomerRepository repository;
  private final AesEncryptionService aes;
  private final HmacService hmac;

  public CustomerService(CustomerRepository repository, AesEncryptionService aes, HmacService hmac) {
    this.repository = repository;
    this.aes = aes;
    this.hmac = hmac;
  }

  public Customer create(String id, String email, String taxId) {
    String normalized = email.trim().toLowerCase();
    Customer customer = new Customer();
    customer.setId(id);
    customer.setEncryptedEmail(aes.encrypt(normalized));
    customer.setEmailLookupHash(hmac.sign("email:" + normalized));
    customer.setTaxIdentifier(taxId); // JPA converter encrypts
    return repository.save(customer);
  }

  public Customer findByEmail(String email) {
    String lookup = hmac.sign("email:" + email.trim().toLowerCase());
    return repository.findByEmailLookupHash(lookup)
        .orElseThrow(() -> new CustomerNotFoundException(email));
  }
}`,
    failure: 'Plain SHA-256 lookup hashes are vulnerable to dictionary attacks for emails, phone numbers, and common IDs.',
    production: 'Use HMAC with a separate lookup key, normalize consistently, and rotate by adding lookup_v2 columns during migration.',
    interview30s: 'Randomized encryption is not searchable. For exact lookup, store a keyed HMAC lookup column beside encrypted data.',
    followUp: 'What leaks from deterministic lookup?',
    tradeoff: 'Exact search becomes fast, but equality patterns leak and key rotation requires dual-write or backfill.',
    memoryTrick: 'Random ciphertext hides; HMAC index finds.',
  },
];
