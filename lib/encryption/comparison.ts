export const MEMORY_SENTENCE =
  'Encrypt data with AES-GCM, wrap keys with KMS/RSA, hash passwords with Argon2id, sign messages with HMAC/RSA/ECDSA, and rotate every key with a keyId.';

export const DECISION_MATRIX = [
  {need: 'Hide PII at rest', primitive: 'AES-GCM', format: 'keyId|iv|ciphertext', note: 'random IV, authenticated tag'},
  {need: 'Encrypt large file/event', primitive: 'Envelope encryption', format: 'encrypted DEK + AES-GCM payload', note: 'KMS wraps DEK'},
  {need: 'Store password', primitive: 'Argon2id', format: 'encoded hash', note: 'never decrypt passwords'},
  {need: 'Verify webhook', primitive: 'HMAC-SHA256', format: 'signature header', note: 'body + timestamp + nonce'},
  {need: 'Partner verifies origin', primitive: 'RSA-PSS / ECDSA', format: 'kid + signature', note: 'private sign, public verify'},
  {need: 'Service transport', primitive: 'TLS / mTLS', format: 'certificates', note: 'pipe protection'},
  {need: 'Identity between strangers', primitive: 'PKI (X.509 + CA + PKIX)', format: 'cert chain + SAN', note: 'then TLS, sign, or encrypt-to-cert'},
  {need: 'Readable access token', primitive: 'JWS', format: 'signed JWT', note: 'claims are visible'},
  {need: 'Exact encrypted lookup', primitive: 'HMAC lookup column', format: 'lookup_hash + encrypted value', note: 'equality leaks'},
];

export const AES_RSA_ECC_TABLE = [
  {algorithm: 'AES-GCM', key: 'Symmetric 128/256-bit', best: 'Bulk data and fields', avoid: 'Public-key exchange; deterministic search'},
  {algorithm: 'RSA-OAEP', key: 'Asymmetric 3072-bit+', best: 'Wrapping small secrets/data keys', avoid: 'Large payloads; old padding'},
  {algorithm: 'RSA-PSS', key: 'Asymmetric 3072-bit+', best: 'Digital signatures', avoid: 'Encryption use cases'},
  {algorithm: 'ECDH', key: 'P-256/P-384/X25519', best: 'Key agreement', avoid: 'Treating raw secret as AES key'},
  {algorithm: 'ECDSA', key: 'P-256/P-384', best: 'Compact signatures', avoid: 'Unsupported compliance/provider paths'},
];

export const ALGORITHM_CATALOGUE = [
  {status: 'Preferred', item: 'AES/GCM/NoPadding', reason: 'Authenticated encryption for app data'},
  {status: 'Preferred', item: 'Argon2id', reason: 'Password hashing with memory hardness'},
  {status: 'Preferred', item: 'HMAC-SHA256', reason: 'Shared-secret request integrity'},
  {status: 'Preferred', item: 'RSA-OAEP / RSA-PSS', reason: 'Modern RSA encryption/signature padding'},
  {status: 'Preferred', item: 'TLS 1.3', reason: 'Modern transport security'},
  {status: 'Legacy read only', item: 'AES-CBC + HMAC', reason: 'Decrypt old values, migrate to AEAD'},
  {status: 'Legacy read only', item: 'RSA PKCS#1 v1.5', reason: 'Migrate partners to OAEP/PSS'},
  {status: 'Banned', item: 'AES-ECB', reason: 'Pattern leakage'},
  {status: 'Banned', item: 'MD5 / SHA1 for security', reason: 'Collision/weakness concerns'},
  {status: 'Banned', item: 'Base64 as protection', reason: 'Encoding, not security'},
];

export const ARCHITECT_MEMORY: [string, string][] = [
  ['PII', 'AES-GCM with keyId|iv|ciphertext'],
  ['Passwords', 'Argon2id, no decrypt path'],
  ['Webhooks', 'HMAC over canonical body + timestamp + nonce'],
  ['Partners', 'Hybrid encryption plus signatures'],
  ['JWT', 'Signed is readable; encrypted is JWE'],
  ['Keys', 'KMS/keystore, key IDs, rotation runbook'],
  ['Search', 'HMAC lookup column, understand leakage'],
  ['PKI', 'Nametag + notary + who you believe. Then TLS, sign, encrypt-to-cert'],
  ['Payments', 'Tokenize PAN before storing anything'],
];

export const CHECKLIST: string[] = [
  'Every ciphertext format includes keyId, IV/nonce, ciphertext, and format version where needed',
  'AES-GCM uses random 96-bit IV and never reuses IV with the same key',
  'Keys come from KMS, keystore, or secret manager, not source code',
  'Old key IDs decrypt until migration/backfill is complete',
  'Passwords use Argon2id/bcrypt/scrypt, never reversible encryption',
  'JWT claims contain no PAN, password, API secret, or high-risk PII',
  'Webhooks use timestamp, nonce, canonical body, and constant-time signature compare',
  'Logs, traces, metrics, errors, and audit events redact plaintext and key material',
  'Database encryption has separate lookup hashes where exact search is required',
  'KMS permissions are environment-specific and least privilege',
  'TLS hostname verification is enabled; certificate expiry is monitored',
  'PKI validation covers chain, time, SAN/hostname, key usage, and revocation — never trust-all',
  'Tests cover tampering, wrong key, malformed format, rotation, and old ciphertext',
  'Backfills are idempotent, throttled, observable, and resumable',
  'Threat model documents attacker, asset, control, key owner, and residual risk',
];

export const CHEAT: [string, string][] = [
  ['LOCK', 'AES-GCM hides data; same key encrypts and decrypts'],
  ['SEAL', 'HMAC / RSA-PSS / ECDSA prove origin — they do not hide bytes'],
  ['KEY', 'RSA-OAEP, ECDH, or KMS wrap a DEK — never RSA-encrypt the file'],
  ['PRINT', 'SHA-256 fingerprints files; Argon2id hashes passwords'],
  ['PIPE', 'TLS 1.3 is the wire. DB, Kafka, and logs still need LOCK'],
  ['PKI', 'Certificate = nametag. CA = notary. Truststore = whose notaries you believe'],
  ['Base64', 'Encoding only; anyone can decode'],
  ['AES-GCM', 'Default for field/data encryption'],
  ['IV/nonce', 'Random per encryption; stored with ciphertext'],
  ['AAD', 'Authenticated context such as tenant/table/column'],
  ['RSA', 'Wrap small secrets or sign; not bulk data'],
  ['ECC', 'ECDH agrees keys; ECDSA signs'],
  ['HMAC', 'Fast shared-secret tamper proofing'],
  ['Argon2id', 'Password verification, not encryption'],
  ['JWS', 'Signed JWT; readable claims'],
  ['JWE', 'Encrypted JWT; hidden claims'],
  ['KMS', 'Master-key custody and audit'],
  ['Rotation', 'New writes active key, old reads historical keys'],
];

export const SIXTY_SEC =
  'For production Java/Spring crypto, I start with the required property. PII at rest uses AES-GCM and stores keyId|iv|ciphertext. Passwords use Argon2id, not encryption. Webhooks use HMAC or signatures with timestamp/nonce. JWTs are usually signed and readable. Keys live in KMS/keystore with rotation: new writes use the active key, old reads use keyId. TLS/PKI protects transport and identity — chain, SAN, expiry, revocation — not logs or databases.';

export const FIVE_MIN =
  'In a payment platform I minimize sensitive data first: tokenize PANs, avoid storing secrets, and classify fields. For fields I must keep, I use AES-GCM with random IV, AAD binding tenant/table/column, and keyId|iv|ciphertext. Key hierarchy is KMS envelope encryption: CMK/KEK wraps DEKs; the app performs local AES with bounded DEK cache. Search is separate: HMAC lookup columns for exact match only, with leakage documented. External callbacks are HMAC/RSA signed over canonical body+timestamp+nonce with replay cache. Access tokens are JWS with short expiry and no secrets in claims. Rotation is designed on day one: active key for writes, historical keys for reads, metrics by keyId, and idempotent backfills. Finally, tests include tampering, wrong key, malformed values, old key reads, and no plaintext logging.';

export const CLOSING =
  'Good crypto design is less about clever algorithms and more about correct primitives, key ownership, safe formats, rotation, and data minimization.';
