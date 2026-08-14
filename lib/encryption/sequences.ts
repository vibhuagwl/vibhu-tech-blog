export type CodeSequence = {
  id: string;
  title: string;
  endpoint: string;
  classes: string[];
  why: string;
  mermaid: string;
};

export const CODE_SEQUENCES: CodeSequence[] = [
  {
    id: 'aes-e2e',
    title: 'AES-GCM encrypt / decrypt',
    endpoint: 'POST /api/crypto/encrypt  →  POST /api/crypto/decrypt',
    classes: [
      'CryptoController',
      'AesEncryptionService',
      'ConfigAesKeyProvider',
      'CipherPackage',
    ],
    why: 'This is the default bulk-data path. Follow it when an interviewer asks “how does your Spring service encrypt a PAN?”',
    mermaid: `sequenceDiagram
  autonumber
  participant Client
  participant C as CryptoController
  participant AES as AesEncryptionService
  participant KP as ConfigAesKeyProvider
  participant JCE as Cipher AES/GCM

  Client->>C: POST /api/crypto/encrypt {plaintext}
  C->>AES: encrypt(plaintext)
  AES->>KP: activeKeyId() + requireKey(v2)
  KP-->>AES: SecretKey AES-256
  AES->>AES: SecureRandom 12-byte IV
  AES->>JCE: init ENCRYPT + GCMParameterSpec
  JCE-->>AES: ciphertext + 128-bit tag
  AES-->>C: CipherPackage serialize
  Note over AES,C: wire format keyId then IV then ciphertext
  C-->>Client: {ciphertext}

  Client->>C: POST /api/crypto/decrypt {ciphertext}
  C->>AES: decrypt(packed)
  AES->>AES: CipherPackage.parse
  AES->>KP: requireKey(keyId from package)
  AES->>JCE: init DECRYPT + same IV
  alt tag valid
    JCE-->>AES: plaintext
    C-->>Client: {plaintext}
  else tag / key / IV wrong
    JCE-->>AES: AEADBadTagException
    AES-->>C: CryptoException
    C-->>Client: 400 crypto_failed
  end`,
  },
  {
    id: 'hybrid-e2e',
    title: 'Hybrid RSA-OAEP + AES-GCM',
    endpoint: 'POST /api/crypto/hybrid/encrypt  →  POST /api/crypto/hybrid/decrypt',
    classes: [
      'CryptoController',
      'HybridEncryptionService',
      'AesEncryptionService.encryptBytes',
      'RsaKeyConfig',
    ],
    why: 'RSA cannot encrypt a large JSON payload. The lab wraps a random AES DEK with RSA-OAEP, then AES-GCM encrypts the body.',
    mermaid: `sequenceDiagram
  autonumber
  participant Client
  participant C as CryptoController
  participant H as HybridEncryptionService
  participant AES as AesEncryptionService
  participant RSA as RSA-OAEP Cipher
  participant Keys as RsaKeyConfig beans

  Client->>C: POST /api/crypto/hybrid/encrypt {plaintext}
  C->>H: encryptForServer(plaintext)
  H->>H: KeyGenerator AES-256 DEK
  H->>AES: encryptBytes(DEK, payload)
  AES-->>H: iv + ciphertext + tag
  H->>RSA: encrypt DEK with RSAPublicKey
  Keys-->>RSA: 3072-bit public key
  RSA-->>H: wrapped DEK
  H-->>C: HybridPacket encryptedDek + payload
  C-->>Client: {encryptedDek, payload}

  Client->>C: POST /api/crypto/hybrid/decrypt
  C->>H: decryptOnServer(packet)
  H->>RSA: decrypt wrapped DEK with RSAPrivateKey
  RSA-->>H: raw AES DEK
  H->>AES: decryptBytes(DEK, iv+ct)
  AES-->>H: plaintext
  C-->>Client: {plaintext}`,
  },
  {
    id: 'pki-e2e',
    title: 'PKI issue → validate → sign / encrypt-to-cert',
    endpoint: 'POST /api/crypto/pki/issue  →  validate / sign / encrypt-to-cert',
    classes: ['PkiController', 'PkiService', 'AesEncryptionService', 'CertPathValidator PKIX'],
    why: 'PKI binds a name to a public key with a CA signature. The lab CA issues a leaf, PKIX+SAN decide trust, then the same cert encrypts (RSA-OAEP wrap DEK) and signs (RSA-PSS).',
    mermaid: `sequenceDiagram
  autonumber
  participant Client
  participant API as PkiController
  participant PKI as PkiService
  participant PKIX as CertPathValidator
  participant AES as AesEncryptionService

  Client->>API: POST /pki/issue CN SAN
  API->>PKI: issue leaf signed by lab Root CA
  PKI-->>Client: serial + cert PEM

  Client->>API: POST /pki/validate hostname
  API->>PKI: parse PEM
  PKI->>PKIX: chain to Root trust anchor
  PKI->>PKI: SAN match + not expired + not CRL
  alt all gates pass
    API-->>Client: trusted true
  else hostname mismatch
    API-->>Client: trusted false reason hostname_mismatch
  end

  Client->>API: POST /pki/encrypt-to-cert
  PKI->>PKI: RSA-OAEP wrap DEK with cert public key
  PKI->>AES: AES-GCM payload
  API-->>Client: encryptedDek + payload

  Client->>API: POST /pki/sign
  PKI-->>Client: RSA-PSS signature`,
  },
  {
    id: 'customer-e2e',
    title: 'Customer field encryption + searchable lookup',
    endpoint: 'POST /api/customers  →  GET /api/customers/by-account',
    classes: [
      'CustomerController',
      'CustomerService',
      'EncryptedStringConverter',
      'AesEncryptionService',
      'HmacService',
      'CustomerRepository',
    ],
    why: 'AES-GCM ciphertext is randomized, so SQL equality on the encrypted column fails. Store ciphertext plus an HMAC lookup digest.',
    mermaid: `sequenceDiagram
  autonumber
  participant Client
  participant API as CustomerController
  participant Svc as CustomerService
  participant HMAC as HmacService
  participant JPA as Customer entity
  participant Conv as EncryptedStringConverter
  participant AES as AesEncryptionService
  participant DB as H2 customers

  Client->>API: POST /api/customers name + account + PAN
  API->>Svc: create(...)
  Svc->>HMAC: lookupDigest(normalized account)
  HMAC-->>Svc: account_number_lookup
  Svc->>JPA: setAccountNumber / setPan plaintext in memory
  Svc->>DB: save(Customer)
  JPA->>Conv: convertToDatabaseColumn(account)
  Conv->>AES: encrypt → keyId|iv|ciphertext
  AES-->>DB: encrypted account + PAN
  Note over DB: lookup column is HMAC not AES
  API-->>Client: 201 id, name, masked PAN

  Client->>API: GET /api/customers/by-account?accountNumber=
  API->>Svc: findByAccountNumber
  Svc->>HMAC: lookupDigest(same normalize)
  Svc->>DB: findByAccountNumberLookup
  DB-->>JPA: encrypted columns
  Conv->>AES: decrypt ciphertext
  AES-->>API: plaintext account + PAN
  API-->>Client: CustomerResponse PAN masked`,
  },
  {
    id: 'signed-payment-e2e',
    title: 'Signed payment verify-then-process',
    endpoint: 'POST /api/crypto/sign  →  POST /api/crypto/payments/signed',
    classes: ['CryptoController', 'RsaSignatureService', 'HmacService', 'GlobalExceptionHandler'],
    why: 'A signature proves authenticity/integrity. It does not hide the payload. Verify before any business work.',
    mermaid: `sequenceDiagram
  autonumber
  participant Partner
  participant C as CryptoController
  participant SIG as RsaSignatureService
  participant HMAC as HmacService

  Partner->>C: POST /api/crypto/sign {plaintext: amount=10}
  C->>SIG: sign(payload)
  Note over SIG: RSA-PSS SHA-256 private key
  SIG-->>C: Base64url signature
  C-->>Partner: {signature}

  Partner->>C: POST /api/crypto/payments/signed payload + signature
  C->>SIG: verify(payload, signature)
  alt valid
    SIG-->>C: true
    C->>HMAC: sign(payload) audit mac
    C-->>Partner: {accepted: true}
  else tampered amount=99
    SIG-->>C: false
    C-->>C: throw CryptoException
    Note over C: GlobalExceptionHandler
    C-->>Partner: 400 crypto_failed
  end`,
  },
  {
    id: 'envelope-e2e',
    title: 'Envelope encryption (KMS-shaped)',
    endpoint: 'POST /api/crypto/envelope/encrypt  →  decrypt',
    classes: ['CryptoController', 'EnvelopeEncryptionService'],
    why: 'Apps encrypt with a short-lived DEK. KMS/KEK only wraps that DEK. The master key never encrypts every row.',
    mermaid: `sequenceDiagram
  autonumber
  participant App as CryptoController
  participant Env as EnvelopeEncryptionService
  participant KEK as Simulated KMS KEK
  participant DEK as Random AES-256 DEK
  participant Data as AES-GCM data cipher

  App->>Env: encryptToWireFormat(kek-v2, plaintext)
  Env->>KEK: requireKek(kek-v2)
  Env->>DEK: generate data key
  Env->>Data: AES-GCM encrypt payload with DEK
  Env->>KEK: wrap DEK (AES-GCM under KEK)
  Note over Env: discard plaintext DEK
  Env-->>App: kekId|encryptedDek|iv|ciphertext

  App->>Env: decryptFromWireFormat(wire)
  Env->>KEK: unwrap encryptedDek
  KEK-->>Env: plaintext DEK
  Env->>Data: AES-GCM decrypt payload
  Data-->>App: plaintext`,
  },
  {
    id: 'rotation-e2e',
    title: 'Zero-downtime key rotation',
    endpoint: 'POST /api/crypto/reencrypt',
    classes: ['CryptoController', 'AesEncryptionService', 'ConfigAesKeyProvider'],
    why: 'New writes use active key v2. Old ciphertext still decrypts because keyId is stored in the package.',
    mermaid: `sequenceDiagram
  autonumber
  participant Writer as New write
  participant AES as AesEncryptionService
  participant KP as ConfigAesKeyProvider
  participant Old as Ciphertext v1
  participant New as Ciphertext v2

  Note over KP: crypto.active-key-id = v2<br/>keys.v1 and keys.v2 both loaded

  Writer->>AES: encrypt(plaintext)
  AES->>KP: activeKeyId → v2
  AES-->>New: v2|iv|ciphertext

  AES->>AES: decrypt(old package)
  AES->>KP: requireKey(v1)
  KP-->>AES: historical key
  AES-->>AES: plaintext
  AES->>AES: reencrypt → encrypt under v2
  AES-->>New: v2|iv2|ciphertext2
  Note over Old,New: v1 decrypt stays until backfill finishes`,
  },
  {
    id: 'tenant-e2e',
    title: 'Multi-tenant key isolation',
    endpoint: 'POST /api/crypto/tenant/encrypt  →  decrypt',
    classes: ['CryptoController', 'TenantEncryptionService'],
    why: 'Tenant A ciphertext must not decrypt with Tenant B’s key. Isolation is key hierarchy + ACL, not “different looking ciphertext”.',
    mermaid: `sequenceDiagram
  autonumber
  participant A as Tenant A caller
  participant C as CryptoController
  participant T as TenantEncryptionService
  participant B as Tenant B caller

  A->>C: encrypt tenant-a + secret-a
  C->>T: encrypt(tenant-a, plaintext)
  T-->>A: tenant-a|iv|ciphertext

  B->>C: decrypt tenant-b + A's ciphertext
  C->>T: decrypt(tenant-b, package)
  T-->>T: package tenantId != tenant-b
  T-->>C: CryptoException Tenant key mismatch
  C-->>B: 400 crypto_failed

  A->>C: decrypt tenant-a + own ciphertext
  C->>T: decrypt(tenant-a, package)
  T-->>A: secret-a`,
  },
  {
    id: 'payment-platform-e2e',
    title: 'Payment platform end-to-end',
    endpoint: 'Mobile → Gateway → Payment Service → DB / Kafka / Bank',
    classes: [
      'TLS / JWT',
      'RsaSignatureService',
      'CustomerService + EncryptedStringConverter',
      'AesEncryptionService',
      'EnvelopeEncryptionService / KMS',
      'HmacService',
    ],
    why: 'Each hop uses a different primitive. Interviewers want you to say why, not stack every algorithm on one field.',
    mermaid: `sequenceDiagram
  autonumber
  participant App as Mobile App
  participant GW as API Gateway
  participant Pay as Payment Service :8093
  participant Crypto as Aes / Hybrid / Envelope
  participant DB as Customer DB
  participant Kafka as Kafka
  participant Bank as Bank Adapter

  App->>GW: HTTPS TLS 1.3 payment request
  Note over App,GW: TLS = in transit only
  GW->>GW: verify JWT (public key / JWKS kid)
  GW->>Pay: forward + user claims

  Pay->>Pay: RsaSignatureService.verify payload
  alt signature invalid
    Pay-->>App: 400 rejected
  else valid
    Pay->>Crypto: AES-GCM encrypt PII / account
    Pay->>DB: encrypted columns + HMAC lookup
    Pay->>Crypto: envelope-encrypt event DEK via KEK/KMS
    Pay->>Kafka: encrypted audit / payment event
    Pay->>Bank: mTLS + signed bank payload
    Bank-->>Pay: bank reference
    Pay-->>App: 201 accepted, PAN never logged
  end`,
  },
  {
    id: 'tamper-e2e',
    title: 'Tampered ciphertext is rejected',
    endpoint: 'POST /api/crypto/decrypt with flipped bits',
    classes: ['AesEncryptionService', 'GlobalExceptionHandler'],
    why: 'GCM authentication tag is the interview punchline: changed ciphertext must fail closed, with no plaintext leak.',
    mermaid: `sequenceDiagram
  autonumber
  participant Attacker
  participant C as CryptoController
  participant AES as AesEncryptionService
  participant JCE as AES-GCM
  participant H as GlobalExceptionHandler

  Attacker->>C: ciphertext with last byte flipped
  C->>AES: decrypt(packed)
  AES->>JCE: doFinal
  JCE-->>AES: AEADBadTagException
  AES-->>C: CryptoException decrypt failed
  C->>H: @ExceptionHandler
  Note over H: never return stack / plaintext / keyId details
  H-->>Attacker: 400 {error: crypto_failed}`,
  },
];
