export type AlgoCategoryId = 'lock' | 'seal' | 'key' | 'print' | 'pipe';

export type FamousAlgorithm = {
  id: string;
  category: AlgoCategoryId;
  name: string;
  famousAs: string;
  oneLiner: string;
  analogy: string;
  internals: string[];
  mermaid: string;
  java: string;
  javaTitle: string;
  labClass: string;
  pros: string[];
  cons: string[];
  useWhen: string;
  avoidWhen: string;
  memory: string;
  interview: string;
};

export const FIVE_ROOMS_SENTENCE =
  'Lock the data, seal the message, wrap the key, fingerprint the password, pipe the wire.';

export const FIVE_ROOMS: {
  id: AlgoCategoryId;
  room: string;
  job: string;
  defaultAlgo: string;
  remember: string;
}[] = [
  {id: 'lock', room: 'LOCK', job: 'Hide data', defaultAlgo: 'AES-GCM', remember: 'Same key encrypts and decrypts. Default: AES-GCM.'},
  {id: 'seal', room: 'SEAL', job: 'Prove origin', defaultAlgo: 'HMAC / RSA-PSS / ECDSA', remember: 'Detect tamper. HMAC if you share a secret; signatures if many verifiers.'},
  {id: 'key', room: 'KEY', job: 'Move a small secret', defaultAlgo: 'RSA-OAEP · ECDH · Envelope', remember: 'Never RSA-encrypt a 2 MB JSON. Wrap an AES key instead.'},
  {id: 'print', room: 'PRINT', job: 'One-way fingerprint', defaultAlgo: 'SHA-256 · Argon2id', remember: 'SHA-256 for files/commits. Argon2id for passwords. Never decrypt a password.'},
  {id: 'pipe', room: 'PIPE', job: 'Protect the wire', defaultAlgo: 'TLS 1.3', remember: 'TLS is the pipe. It does not encrypt your DB, Kafka, or logs.'},
];

export const BANNED_ALGORITHMS: {item: string; why: string; useInstead: string}[] = [
  {item: 'AES-ECB', why: 'Same 16-byte block always encrypts the same way — penguin picture still looks like a penguin.', useInstead: 'AES-GCM'},
  {item: 'AES-CBC without HMAC', why: 'Padding-oracle and bit-flip attacks. No built-in tamper tag.', useInstead: 'AES-GCM'},
  {item: 'RSA PKCS#1 v1.5 encrypt', why: 'Padding oracle (Bleichenbacher). Old Java default.', useInstead: 'RSA-OAEP'},
  {item: 'MD5 / SHA-1 for security', why: 'Practical collisions. Fine as a checksum, not as a security boundary.', useInstead: 'SHA-256'},
  {item: 'SHA-256 for passwords', why: 'Too fast — GPUs try billions of guesses.', useInstead: 'Argon2id'},
  {item: 'Base64 / URL encoding', why: 'Anyone decodes it. Encoding is not encryption.', useInstead: 'AES-GCM'},
];

export const FAMOUS_ALGORITHMS: FamousAlgorithm[] = [
  {
    id: 'aes-gcm',
    category: 'lock',
    name: 'AES-GCM',
    famousAs: 'The default lock',
    oneLiner: 'One secret key both encrypts and decrypts. GCM adds a tamper tag so flipped bits fail closed.',
    analogy: 'A hotel safe: same key opens and closes it, and a wax seal on the door tells you if someone pried it.',
    internals: [
      'AES is a 128-bit block cipher. A 128-bit key uses 10 rounds; a 256-bit key uses 14. Each round is SubBytes → ShiftRows → MixColumns → AddRoundKey (the last round skips MixColumns).',
      'The key schedule expands your 16/32-byte key into round keys. You never invent this — JCE Cipher does it.',
      'GCM does two jobs at once. Encryption is AES-CTR: a 96-bit random IV plus a counter becomes a keystream; XOR that with plaintext. XOR is its own inverse, so decrypt is the same XOR.',
      'Authentication is GHASH: a polynomial multiply over GF(2^128) of AAD + ciphertext. The 128-bit result is the tag. Decrypt recomputes the tag and compares; mismatch → AEADBadTagException, no plaintext.',
      'IV is not secret, but it must be unique per key. 12 random bytes from SecureRandom. Store it next to ciphertext: keyId|iv|ciphertext(tag). Reuse IV + key and GCM security collapses.',
    ],
    mermaid: `flowchart LR
  PT[Plaintext] --> XOR
  IV[Random 96-bit IV] --> CTR[AES-CTR keystream]
  KEY[AES-256 key] --> CTR
  CTR --> XOR
  XOR --> CT[Ciphertext]
  AAD[tenant table column] --> GHASH
  CT --> GHASH
  KEY --> GHASH
  GHASH --> TAG[128-bit tag]
  CT --> STORE[keyId iv ciphertext+tag]
  TAG --> STORE`,
    java: `Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
byte[] iv = new byte[12];
new SecureRandom().nextBytes(iv);
cipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(128, iv));
cipher.updateAAD("tenant:acme|col:taxId".getBytes(UTF_8));
byte[] ctAndTag = cipher.doFinal(plaintext.getBytes(UTF_8));
// store: keyId + Base64(iv) + Base64(ctAndTag)

// decrypt uses the same IV + key + AAD; tag mismatch throws
cipher.init(Cipher.DECRYPT_MODE, aesKey, new GCMParameterSpec(128, iv));
cipher.updateAAD("tenant:acme|col:taxId".getBytes(UTF_8));
byte[] pt = cipher.doFinal(ctAndTag);`,
    javaTitle: 'AES-GCM — JCE (lab: AesEncryptionService)',
    labClass: 'AesEncryptionService',
    pros: [
      'Fast in hardware (AES-NI). Default for field and file encryption.',
      'Confidentiality + integrity in one primitive (AEAD).',
      'AAD binds ciphertext to tenant/table/column without encrypting that context.',
    ],
    cons: [
      'IV reuse with the same key is catastrophic — never a counter you might reset.',
      'Same party must hold the key, so it is not for “encrypt to a partner who only has a public key”.',
      'Randomized ciphertext cannot be queried by equality — you need a separate HMAC lookup column.',
    ],
    useWhen: 'PII at rest, Kafka field encryption, files, DEK payload inside envelope encryption.',
    avoidWhen: 'Passwords (use Argon2id). Public-key delivery of a blob (use hybrid). Deterministic search on the ciphertext itself.',
    memory: 'AES hides. GCM seals. Random 12-byte IV. Store keyId|iv|ciphertext.',
    interview: 'AES-GCM is authenticated symmetric encryption. Unique IV, optional AAD, tag lives with ciphertext. I never roll CBC+HMAC for new data.',
  },
  {
    id: 'chacha20',
    category: 'lock',
    name: 'ChaCha20-Poly1305',
    famousAs: 'The mobile lock',
    oneLiner: 'Another AEAD like AES-GCM, built from a stream cipher plus a MAC — famous as the TLS 1.3 alternative when AES-NI is missing.',
    analogy: 'Same hotel safe, different brand. You pick it when the hotel has no AES hardware.',
    internals: [
      'ChaCha20 is a 256-bit stream cipher: 20 rounds of add-rotate-xor (ARX) on a 4×4 word state. No S-boxes, so it is constant-time and fast in pure software.',
      'A 96-bit nonce + 32-bit counter produce a keystream. XOR with plaintext, same as AES-CTR.',
      'Poly1305 is a one-time MAC over the ciphertext (and AAD). Together they are an IETF AEAD (RFC 8439), the same job AES-GCM does.',
      'Java: Cipher.getInstance("ChaCha20-Poly1305") on modern JDKs. In browsers/TLS you rarely pick it — the stack negotiates it.',
    ],
    mermaid: `flowchart LR
  KEY[256-bit key] --> CH[ChaCha20]
  N[96-bit nonce] --> CH
  CH --> KS[Keystream]
  PT[Plaintext] --> XOR
  KS --> XOR
  XOR --> CT[Ciphertext]
  CT --> P[Poly1305]
  KEY --> P
  P --> TAG[MAC tag]`,
    java: `// JDK 11+: ChaCha20-Poly1305 AEAD
Cipher cipher = Cipher.getInstance("ChaCha20-Poly1305");
byte[] nonce = new byte[12];
new SecureRandom().nextBytes(nonce);
cipher.init(Cipher.ENCRYPT_MODE, chachaKey, new IvParameterSpec(nonce));
byte[] ctAndTag = cipher.doFinal(plaintext.getBytes(UTF_8));

// Production Spring apps still default to AES-GCM on servers (AES-NI).
// You meet ChaCha20 as a TLS 1.3 cipher, not as a DB column cipher.`,
    javaTitle: 'ChaCha20-Poly1305 — know it, rarely pick it for DB fields',
    labClass: 'AesEncryptionService',
    pros: [
      'Fast on phones / ARM without AES-NI.',
      'Simple ARX design, fewer timing-attack footguns than table-based AES in software.',
      'First-class TLS 1.3 cipher (Chrome ↔ server).',
    ],
    cons: [
      'Less operational familiarity in Java/KMS/HSM inventories than AES-GCM.',
      'Same IV-reuse rule as GCM — unique nonce per key.',
      'Compliance checklists often name AES-256-GCM specifically.',
    ],
    useWhen: 'TLS 1.3 on mobile; libsodium/NaCl style apps; constrained devices.',
    avoidWhen: 'New Spring field encryption on x86 servers — AES-GCM is the house default.',
    memory: 'ChaCha20 = software AES-GCM. Famous in TLS, not in your JPA converter.',
    interview: 'ChaCha20-Poly1305 is AEAD. I use AES-GCM at rest; I let TLS pick ChaCha20 when the client has no AES-NI.',
  },
  {
    id: 'hmac',
    category: 'seal',
    name: 'HMAC-SHA256',
    famousAs: 'The shared-secret seal',
    oneLiner: 'A keyed hash. Same secret on both sides. Proves “this body was not changed” — it does not hide the body.',
    analogy: 'A wax seal on a postcard. Anyone can read the postcard. The wax proves the sender held the stamp.',
    internals: [
      'HMAC(K, m) = H( (K ⊕ opad) || H( (K ⊕ ipad) || m ) ). Two hash passes with inner/outer padding so length-extension attacks on SHA-256 do not apply.',
      'SHA-256 alone is not a MAC. If you hash only the body, an attacker who can append data may forge a digest. HMAC kills that.',
      'Both parties share K. There is no public verify key — that is why HMAC has no non-repudiation. Either side could have made the tag.',
      'Verify must be constant-time (MessageDigest.isEqual or a XOR loop). Early-return on the first mismatch leaks the prefix via timing.',
      'For webhooks: sign canonical body + timestamp + nonce, reject skew, cache nonce against replay.',
    ],
    mermaid: `flowchart TD
  K[Shared secret] --> INNER[H ipad plus body]
  BODY[Canonical body timestamp nonce] --> INNER
  INNER --> OUTER[H opad plus inner digest]
  K --> OUTER
  OUTER --> TAG[HMAC-SHA256]
  TAG --> CMP{Constant-time compare}
  CMP -->|match| OK[Accept]
  CMP -->|mismatch| NO[Reject]`,
    java: `Mac mac = Mac.getInstance("HmacSHA256");
mac.init(new SecretKeySpec(secret, "HmacSHA256"));
byte[] tag = mac.doFinal(canonical.getBytes(UTF_8));
String b64 = Base64.getUrlEncoder().withoutPadding().encodeToString(tag);

boolean ok = MessageDigest.isEqual(
    expectedBytes,
    Base64.getUrlDecoder().decode(incomingSignature));
// lab: HmacService.sign / verify + lookupDigest for searchable columns`,
    javaTitle: 'HMAC-SHA256 — lab: HmacService',
    labClass: 'HmacService',
    pros: [
      'Fast, simple, perfect for two-party webhooks and internal callbacks.',
      'Keyed lookup digest for exact-match search on encrypted columns.',
      'No certificates or JWKS to rotate — just a secret in a vault.',
    ],
    cons: [
      'Shared secret: every verifier can also forge. No non-repudiation.',
      'Secret distribution is the hard part. Leak one webhook secret, forge all callbacks.',
      'Does not encrypt. Pair with TLS and, if needed, AES-GCM on fields.',
    ],
    useWhen: 'Stripe-style webhooks, idempotency request signing, HMAC lookup columns.',
    avoidWhen: 'Public APIs where any client should verify with a published key — use RSA-PSS / ECDSA / JWKS.',
    memory: 'HMAC = hash with a password. Shared stamp. Constant-time compare. Timestamp + nonce.',
    interview: 'HMAC-SHA256 is a keyed hash. I sign a canonical string with timestamp and nonce, compare constant-time, and never use raw SHA-256 as a MAC.',
  },
  {
    id: 'rsa-pss',
    category: 'seal',
    name: 'RSA-PSS',
    famousAs: 'The partner seal',
    oneLiner: 'Private key signs, public key verifies. Many verifiers, one signer. This is authenticity, not encryption.',
    analogy: 'A notary stamp. Anyone can check the stamp against a public sample. Only the notary’s private die can make it.',
    internals: [
      'RSA math: n = p·q. Public exponent e (usually 65537). Private d with e·d ≡ 1 (mod φ(n)). Sign is essentially “raise the padded hash to d mod n”; verify raises back with e.',
      'Textbook RSA signatures are deterministic and forgeable. PSS (Probabilistic Signature Scheme) salts the hash, then applies MGF1 masks so two signatures of the same message look different and proofs go through.',
      'Java name: RSASSA-PSS with SHA-256, MGF1, salt length 32. Do not use SHA1withRSA or PKCS#1 v1.5 for new signatures.',
      'JWT RS256 in the wild is often PKCS#1 v1.5 (historical). PS256 is PSS. Prefer PS256 / ES256 for new APIs.',
      'Publish the public key via JWKS with kid. Rotate by adding kid-v2, sign new tokens with v2, keep v1 until expiry.',
    ],
    mermaid: `sequenceDiagram
  participant S as Signer private d
  participant V as Verifier public e,n
  S->>S: H = SHA-256 message
  S->>S: PSS pad with random salt
  S->>S: signature = pad to the d mod n
  S->>V: message + signature + kid
  V->>V: pad2 = signature to the e mod n
  V->>V: unmask PSS, recompute hash
  V-->>V: match or reject`,
    java: `Signature sig = Signature.getInstance("RSASSA-PSS");
sig.setParameter(new PSSParameterSpec(
    "SHA-256", "MGF1", MGF1ParameterSpec.SHA256, 32, 1));
sig.initSign(rsaPrivateKey);
sig.update(payload.getBytes(UTF_8));
byte[] signature = sig.sign();

sig.initVerify(rsaPublicKey);
sig.update(payload.getBytes(UTF_8));
boolean ok = sig.verify(signature);
// lab: RsaSignatureService`,
    javaTitle: 'RSA-PSS — lab: RsaSignatureService',
    labClass: 'RsaSignatureService',
    pros: [
      'Public verify — partners, browsers, and APIs do not need your private key.',
      'Non-repudiation (with key custody): only the private holder could have signed.',
      'Works everywhere: JWT, SAML, partner callbacks, code signing.',
    ],
    cons: [
      '3072-bit RSA keys are large; signatures and JWKS are bulky vs ECDSA.',
      'Sign/verify is slower than HMAC. Do not HMAC-replace this on a hot inner loop unless needed.',
      'Private key compromise forges everything until rotation + token expiry.',
    ],
    useWhen: 'JWT access tokens (PS256), partner webhooks you cannot share a secret with, document signing.',
    avoidWhen: 'Encrypting payloads (that is RSA-OAEP). Two-party internal webhooks (HMAC is simpler).',
    memory: 'PSS = Probabilistic Signature. Private signs, public verifies. Not confidentiality.',
    interview: 'RSA-PSS signs a salted hash with the private key. I never encrypt with the signing key pair’s PKCS#1 v1.5 path.',
  },
  {
    id: 'ecdsa',
    category: 'seal',
    name: 'ECDSA / Ed25519',
    famousAs: 'The compact seal',
    oneLiner: 'Same job as RSA-PSS — sign and verify — on an elliptic curve. Smaller keys, smaller JWT, same idea.',
    analogy: 'The same notary stamp, pocket-sized. P-256 ≈ RSA-3072 for classical security estimates.',
    internals: [
      'An elliptic curve over a prime field: points (x, y) that satisfy y² = x³ + ax + b, plus a point at infinity. You can add points; repeating add is scalar multiply.',
      'Private key d is a random scalar. Public key Q = d · G, where G is a standard generator. Given G and Q, finding d is the ECDLP — believed hard.',
      'ECDSA sign: pick nonce k, r = (k·G).x, s = k⁻¹ (H(m) + d·r). Verify checks a linear combination of G and Q lands on r. Never reuse k — Sony’s PS3 firmware key leaked from repeated k.',
      'Ed25519 (Edwards curve, deterministic nonce from the message) is the modern “just use this” signature. Java 15+ has Ed25519; JWT uses EdDSA. P-256 ECDSA is still the compliance default (ES256).',
      'Do not mix ECDSA keys with ECDH. Sign keys sign. Agreement keys agree.',
    ],
    mermaid: `flowchart TD
  D[Private scalar d] --> Q[Public Q = d times G]
  M[Message] --> H[SHA-256]
  K[Nonce k never reuse] --> R[r = kG.x]
  H --> S[s = k inv times H plus d r]
  D --> S
  R --> SIG[signature r,s]
  S --> SIG
  SIG --> V[Verifier uses Q and G]`,
    java: `KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC");
kpg.initialize(new ECGenParameterSpec("secp256r1"));
KeyPair pair = kpg.generateKeyPair();

Signature sig = Signature.getInstance("SHA256withECDSA");
sig.initSign(pair.getPrivate());
sig.update(payload);
byte[] signature = sig.sign();

sig.initVerify(pair.getPublic());
sig.update(payload);
boolean ok = sig.verify(signature);
// lab: EccCryptoService.signEcdsa / verifyEcdsa
// JWT alg: ES256 (P-256) or EdDSA (Ed25519)`,
    javaTitle: 'ECDSA P-256 — lab: EccCryptoService',
    labClass: 'EccCryptoService',
    pros: [
      'Tiny keys and signatures vs RSA. Faster verify on mobile.',
      'ES256 is first-class in JWT / OpenID / TLS certificates.',
      'Ed25519 is misuse-resistant (deterministic nonce).',
    ],
    cons: [
      'Nonce reuse in classic ECDSA leaks the private key. Use a tested provider, not a from-scratch k.',
      'Some HSMs / old partners only speak RSA.',
      'Curve choice matters — stick to P-256, P-384, or Ed25519. No “random curve”.',
    ],
    useWhen: 'JWT ES256, TLS certificates, compact partner signatures, mobile clients.',
    avoidWhen: 'Key agreement (use ECDH). Bulk encryption (use AES). FIPS shops that have not approved Ed25519 yet — use P-256.',
    memory: 'ECDSA signs. ECDH agrees. Same family, opposite rooms (SEAL vs KEY). Never reuse k.',
    interview: 'ECDSA is a curve signature. Private scalar times G is the public point. I use SHA256withECDSA or Ed25519, never a homemade nonce.',
  },
  {
    id: 'rsa-oaep',
    category: 'key',
    name: 'RSA-OAEP',
    famousAs: 'The small-secret wrap',
    oneLiner: 'Public key encrypts a tiny blob (usually an AES key). Private key unwraps it. Not for your 2 MB JSON.',
    analogy: 'A locked mailbox. Anyone drops a small envelope in (public slot). Only the owner opens it.',
    internals: [
      'Same RSA trapdoor as signatures: c = mᵉ mod n, m = cᵈ mod n. Encryption uses the recipient’s public key; decryption uses their private key — opposite of signing.',
      'Raw RSA is deterministic and malleable. OAEP (Optimal Asymmetric Encryption Padding) mixes the message with a random seed through MGF1 (a hash-based mask). Encrypting the same DEK twice produces different ciphertexts.',
      'Size limit: a 2048-bit modulus has 256 bytes. After OAEP+SHA-256 overhead you have ~190 bytes of payload. That is a 32-byte AES key, not a document.',
      'Java transform: RSA/ECB/OAEPWithSHA-256AndMGF1Padding. “ECB” here is a JCE name leftover — RSA is not a block mode like AES-ECB.',
      '2048-bit is legacy; 3072-bit+ for new keys. Or skip RSA wrap and use ECDH / KMS envelope instead.',
    ],
    mermaid: `flowchart LR
  DEK[32-byte AES DEK] --> OAEP[OAEP pad + random seed]
  OAEP --> POW[m^e mod n]
  PUB[Recipient public n,e] --> POW
  POW --> WRAP[encrypted DEK]
  WRAP --> PRIV[Recipient private d]
  PRIV --> UNPAD[OAEP unmask]
  UNPAD --> DEK2[AES DEK]
  DEK2 --> AES[AES-GCM payload]`,
    java: `Cipher rsa = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
rsa.init(Cipher.ENCRYPT_MODE, recipientPublicKey);
byte[] wrappedDek = rsa.doFinal(aesDek.getEncoded()); // 32 bytes in

rsa.init(Cipher.DECRYPT_MODE, recipientPrivateKey);
byte[] raw = rsa.doFinal(wrappedDek);
SecretKey dek = new SecretKeySpec(raw, "AES");
// then AES-GCM the real payload — lab: HybridEncryptionService`,
    javaTitle: 'RSA-OAEP wrap — lab: HybridEncryptionService',
    labClass: 'HybridEncryptionService',
    pros: [
      'Anyone with the public key can encrypt a DEK to you. Classic hybrid / email / partner pattern.',
      'OAEP is the modern RSA encryption padding — constant-time providers resist padding oracles.',
      'Works with existing RSA certificates.',
    ],
    cons: [
      'Tiny payload. Encrypting JSON with RSA is a design smell and a size error.',
      'RSA decrypt is slow and a side-channel magnet — do it once per message for the DEK, not per field.',
      'Key size / quantum discussion: many designs prefer ECDH or KMS wrap for new systems.',
    ],
    useWhen: 'Hybrid encryption to a partner’s RSA cert; wrapping a DEK when KMS is not in the path.',
    avoidWhen: 'Bulk data, passwords, JWTs you meant to sign, anything over a few hundred bytes.',
    memory: 'OAEP = encrypt a key, not a file. Public locks, private opens. Then AES-GCM the file.',
    interview: 'RSA-OAEP wraps small secrets. I generate an AES-256 DEK, GCM-encrypt the payload, OAEP-encrypt the DEK to the recipient.',
  },
  {
    id: 'ecdh',
    category: 'key',
    name: 'ECDH / X25519',
    famousAs: 'The handshake secret',
    oneLiner: 'Two parties each have a key pair. They mix private × peer public and both get the same shared secret — then HKDF it into AES-GCM keys.',
    analogy: 'Two people mix paint. Alice’s blue + Bob’s yellow = the same green on both sides, and a watcher never learns the private colors.',
    internals: [
      'Alice has dA, QA = dA·G. Bob has dB, QB = dB·G. Shared point = dA·QB = dB·QA = dA·dB·G. The eavesdropper sees QA and QB but cannot extract dA or dB.',
      'The raw shared bytes are not an AES key. Run HKDF-SHA256 (extract then expand) with a transcript salt (hello hashes, alg ids) to get traffic keys.',
      'X25519 is the Montgomery-curve Diffie-Hellman used by TLS 1.3 and WireGuard. Java: KeyAgreement.getInstance("XDH") with NamedParameterSpec.X25519, or “ECDH” + secp256r1.',
      'Static-static ECDH without a fresh ephemeral is dangerous (no forward secrecy). TLS 1.3 uses ephemeral ECDHE: new key share every connection, so stealing today’s private key does not decrypt yesterday’s captures.',
      'Never use an ECDSA key pair for ECDH. Separate key uses.',
    ],
    mermaid: `sequenceDiagram
  participant A as Alice
  participant B as Bob
  A->>A: dA, QA = dA G
  B->>B: dB, QB = dB G
  A->>B: QA
  B->>A: QB
  A->>A: S = dA times QB
  B->>B: S = dB times QA
  Note over A,B: S is the same point
  A->>A: HKDF S into AES key
  B->>B: HKDF S into AES key`,
    java: `KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC");
kpg.initialize(new ECGenParameterSpec("secp256r1"));
KeyPair alice = kpg.generateKeyPair();
KeyPair bob = kpg.generateKeyPair();

KeyAgreement ka = KeyAgreement.getInstance("ECDH");
ka.init(alice.getPrivate());
ka.doPhase(bob.getPublic(), true);
byte[] shared = ka.generateSecret(); // then HKDF, never raw AES key
// lab: EccCryptoService.deriveSharedSecretFromA / FromB`,
    javaTitle: 'ECDH P-256 — lab: EccCryptoService',
    labClass: 'EccCryptoService',
    pros: [
      'Forward secrecy when keys are ephemeral (TLS 1.3 ECDHE).',
      'Tiny, fast, the actual engine inside modern TLS and Signal.',
      'No size limit on the later AES payload — ECDH only agrees the key.',
    ],
    cons: [
      'Raw shared secret must go through HKDF. Using it directly as AES key is a common fail.',
      'Needs both parties online (or a stored static key, which loses forward secrecy).',
      'Implementation footguns: invalid-curve attacks if you do not use a vetted KeyAgreement.',
    ],
    useWhen: 'TLS, mobile handshakes, “agree a session key then AES-GCM”.',
    avoidWhen: 'Offline encrypt-to-a-mailbox (RSA-OAEP or KMS envelope is simpler). Signatures (use ECDSA).',
    memory: 'ECDH agrees a secret. ECDSA signs. HKDF the shared point. Then AES-GCM.',
    interview: 'ECDH is key agreement, not encryption. Both sides compute d × peerQ, HKDF that, then AES-GCM. TLS 1.3 does this every connection.',
  },
  {
    id: 'envelope',
    category: 'key',
    name: 'Hybrid + Envelope',
    famousAs: 'The production pattern',
    oneLiner: 'Generate a one-time AES data key. Encrypt the payload with AES-GCM. Wrap that data key with RSA-OAEP or KMS. Store both.',
    analogy: 'A cheap padlock on the suitcase (AES) and a bank vault that holds the padlock key (KMS/RSA). You do not drive the suitcase into the vault.',
    internals: [
      'Hybrid (partner): random DEK → AES-GCM(payload) → RSA-OAEP(DEK) with recipient public key. Wire: encryptedDek + iv + ciphertext.',
      'Envelope (KMS): KMS GenerateDataKey returns plaintext DEK + encrypted DEK under a CMK/KEK that never leaves HSM. App AES-GCM locally. Discard plaintext DEK. Store encrypted DEK beside ciphertext.',
      'Why not KMS-encrypt every row? Latency, throttling, cost. Envelope = one KMS call (or a cached DEK) plus millions of local AES-NI ops.',
      'Rotation: new CMK/KEK id for new wraps; old encrypted DEKs still unwrap with historical CMK until re-enveloped. Data ciphertext can keep the same DEK until you re-encrypt.',
      'Cache plaintext DEKs with a tight TTL and tenant bound. A DEK cache is a blast-radius control, not a dump of the CMK.',
    ],
    mermaid: `sequenceDiagram
  participant App
  participant KMS
  participant AES as AES-GCM
  App->>KMS: GenerateDataKey kek-v2
  KMS-->>App: plain DEK + encrypted DEK
  App->>AES: encrypt PII with DEK + random IV
  AES-->>App: ciphertext + tag
  App->>App: discard plain DEK
  App->>App: store kekId encryptedDEK iv ciphertext`,
    java: `// Hybrid — lab: HybridEncryptionService
KeyGenerator kg = KeyGenerator.getInstance("AES");
kg.init(256);
SecretKey dek = kg.generateKey();
byte[] payload = aes.encryptBytes(dek, plaintext.getBytes(UTF_8));
Cipher rsa = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
rsa.init(Cipher.ENCRYPT_MODE, recipientPublic);
byte[] wrappedDek = rsa.doFinal(dek.getEncoded());

// Envelope — lab: EnvelopeEncryptionService
// KMS GenerateDataKey analog: wrap DEK with KEK, AES-GCM data locally
EnvelopePackage pkg = envelope.encrypt("kek-v2", plaintext.getBytes(UTF_8));
// wire: kekId|encryptedDek|iv|ciphertext`,
    javaTitle: 'Hybrid + envelope — lab: HybridEncryptionService, EnvelopeEncryptionService',
    labClass: 'EnvelopeEncryptionService',
    pros: [
      'Scales: KMS/HSM stays on the key path, AES-NI does the bytes.',
      'Per-message or per-tenant DEKs shrink blast radius; crypto-shred a DEK and that slice dies.',
      'Same AES-GCM format you already test — wrapping is the only extra metadata.',
    ],
    cons: [
      'More moving parts: kekId, encrypted DEK, IV, ciphertext, cache, IAM.',
      'DEK cache in app memory is a compromise if the box is dumped.',
      'Forgot to store encrypted DEK? Ciphertext is a brick. Test restore from backup.',
    ],
    useWhen: 'Every production field/file encryption that needs KMS custody or partner public keys.',
    avoidWhen: 'A toy demo with one hardcoded AES key — fine for local tests, not for prod PII.',
    memory: 'DEK encrypts data. KEK/KMS/RSA wraps the DEK. Never KMS every row. Never RSA the file.',
    interview: 'Envelope encryption: KMS wraps data keys, AES-GCM encrypts data locally. Hybrid is the same idea with RSA-OAEP instead of KMS.',
  },
  {
    id: 'sha256',
    category: 'print',
    name: 'SHA-256',
    famousAs: 'The fingerprint',
    oneLiner: 'One-way 256-bit digest. Same input → same output. You cannot get the input back. Too fast for passwords.',
    analogy: 'A unique fingerprint of a file. Great to detect “did this JAR change?” Useless as a padlock.',
    internals: [
      'Merkle–Damgård: pad the message to a multiple of 512 bits, then compress each 512-bit block into an 8-word (256-bit) state across 64 rounds of bitwise mix (SHA-256). SHA-512 uses 1024-bit blocks and a 512-bit state.',
      'Properties you quote: preimage resistance (~2^256), second-preimage, collision resistance (~2^128 by birthday bound). MD5/SHA-1 lost collision resistance in the real world.',
      'Deterministic and fast — that is why it is wrong for passwords and why HMAC wraps it when you need a keyed fingerprint.',
      'Length-extension: from H(secret||message) an attacker can compute H(secret||message||suffix) without the secret. That is why we use HMAC, not “SHA-256(secret + body)”.',
      'Git, JAR checksums, JWT header hashes, Bitcoin (SHA-256d), CDK/S3 etags-style integrity — all fingerprints, not encryption.',
    ],
    mermaid: `flowchart LR
  M[Message] --> PAD[Pad to 512-bit blocks]
  PAD --> C[64 rounds compress]
  C --> D[256-bit digest]
  D --> OK[Integrity check]
  D --> BAD[Not a password hash]
  D --> HMAC[Wrap with HMAC if keyed]`,
    java: `byte[] digest = MessageDigest.getInstance("SHA-256")
    .digest(fileBytes);
String hex = HexFormat.of().formatHex(digest);

// Integrity of a downloaded artifact — yes
// Password storage — no (use Argon2id)
// API signature — no (use HMAC-SHA256, not SHA-256(secret+body))`,
    javaTitle: 'SHA-256 — fingerprint only',
    labClass: 'EncodingVsEncryptionDemo',
    pros: [
      'Ubiquitous, hardware-accelerated, collision-resistant for practical purposes.',
      'Perfect for file integrity, content addressing, commit IDs.',
      'Building block inside HMAC, HKDF, OAEP, PSS, TLS.',
    ],
    cons: [
      'Not encryption — digest is not reversible and not confidential if the input is guessable.',
      'Too fast for passwords. Not a MAC by itself (length-extension).',
      'Truncating to 8 hex chars for “security” is theater.',
    ],
    useWhen: 'Checksums, Git, artifact verify, HKDF/HMAC inner hash.',
    avoidWhen: 'Passwords, “hash the PAN and store it as the identifier” without a keyed HMAC, hiding PII.',
    memory: 'SHA-256 fingerprints. HMAC keys it. Argon2id slows it. AES hides it.',
    interview: 'SHA-256 is a one-way digest, not encryption and not a password hash. If I need a keyed fingerprint I use HMAC-SHA256.',
  },
  {
    id: 'argon2id',
    category: 'print',
    name: 'Argon2id',
    famousAs: 'The password hash',
    oneLiner: 'Slow, salted, memory-hard hash. You verify by recomputing. There is no decrypt path — by design.',
    analogy: 'A puzzle that needs a desk full of paper. A GPU farm hates buying that much RAM for each guess.',
    internals: [
      'Password hashing must be slow for the attacker and tolerable for one login. SHA-256 is the opposite: billions of guesses per second on a GPU.',
      'Argon2 (Password Hashing Competition winner). Three flavors: Argon2d (data-dependent, GPU-resistant but side-channel-ish), Argon2i (data-independent), Argon2id (hybrid — the one you want).',
      'Parameters: salt (random, stored in the encoded hash), memory (e.g. 19–64 MiB), iterations, parallelism. Spring’s Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8() is a sane starting point.',
      'Encoded form holds algorithm + params + salt + digest. On login: encode(raw) is wrong — use matches(raw, stored). Rehash-on-login when you raise cost.',
      'bcrypt (4–31 cost, 72-byte password limit) is the legacy default. scrypt is memory-hard too. New work: Argon2id. Never AES-encrypt passwords “so we can email them back”.',
    ],
    mermaid: `flowchart TD
  PW[Password] --> MIX[Argon2id fill RAM mix blocks]
  SALT[Random salt] --> MIX
  MEM[Memory cost] --> MIX
  MIX --> HASH[Encoded hash stored]
  LOGIN[Login password] --> MATCH{matches?}
  HASH --> MATCH
  MATCH -->|yes| OK[Authenticate]
  MATCH -->|no| NO[Reject]
  MATCH -.-> NEVER[No decrypt API]`,
    java: `PasswordEncoder argon2 =
    Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
String stored = argon2.encode(rawPassword);      // salt inside
boolean ok = argon2.matches(rawPassword, stored);

PasswordEncoder bcrypt = new BCryptPasswordEncoder(12);
// lab: PasswordHashingDemo — never Cipher.getInstance("AES") for passwords`,
    javaTitle: 'Argon2id — lab: PasswordHashingDemo',
    labClass: 'PasswordHashingDemo',
    pros: [
      'Memory-hard: ASIC/GPU attacks get expensive.',
      'Salted by default; params travel with the hash so you can raise cost later.',
      'Spring Security first-class encoder.',
    ],
    cons: [
      'Heavier CPU/RAM per login — tune so a burst of logins does not starve Tomcat.',
      'You cannot recover a forgotten password; that is a reset flow, not decrypt.',
      'bcrypt still appears in old schemas — plan a rehash-on-login migration.',
    ],
    useWhen: 'User passwords, API client secrets at rest if you only need verify, recovery codes (hashed).',
    avoidWhen: 'PII you must read later (AES-GCM). Fast integrity of a file (SHA-256).',
    memory: 'Passwords: Argon2id. No key, no decrypt, no SHA-256, no AES.',
    interview: 'Passwords use Argon2id (or bcrypt). Encryption is reversible, so it is the wrong control. I rehash on login when cost increases.',
  },
  {
    id: 'tls13',
    category: 'pipe',
    name: 'TLS 1.3',
    famousAs: 'The pipe',
    oneLiner: 'A protocol, not one algorithm. It composes ECDH + signatures + AES-GCM/ChaCha20 so the wire is private. Your database is still your problem.',
    analogy: 'An armored truck between two buildings. The vault inside each building is a different lock (AES-GCM / KMS).',
    internals: [
      'ClientHello carries a key_share (X25519 or P-256 ECDHE) and supported AEAD suites. ServerHello picks one, sends its key_share, certificate, and CertificateVerify (ECDSA or RSA-PSS over the handshake transcript).',
      'Both sides run ECDH, then HKDF-SHA256 to derive handshake secrets and application traffic keys. All following bytes are AES-GCM or ChaCha20-Poly1305.',
      'TLS 1.3 removed RSA key transport, static DH, RC4, CBC+HMAC suites, compression, and renegotiation. 1-RTT handshake. Optional 0-RTT has replay caveats — do not 0-RTT POSTs.',
      'mTLS: the client also presents a certificate. That authenticates the workload, not the user. Still check JWT/scopes in the app.',
      'Hostname verification + certificate expiry monitors. Disabling verify to “fix a local cert” is how MITM wins.',
    ],
    mermaid: `sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: ClientHello + ECDHE share
  S->>C: ServerHello + share + cert + CertificateVerify
  Note over C,S: ECDH then HKDF then AEAD keys
  C->>S: application data AES-GCM
  S->>C: application data AES-GCM
  Note over C,S: TLS ends at the load balancer
  Note over S: DB Kafka logs still need field encryption`,
    java: `// You rarely implement TLS. You configure it.
// Spring Boot + Tomcat / Netty: server.ssl.* or a service mesh.

// Hostname verification must stay on (default JSSE).
HttpsURLConnection.setDefaultHostnameVerifier(/* do not no-op this */);

// mTLS: client-auth=need + truststore of workload certs
// server.ssl.client-auth=need

// Remember: TLS terminates. Then encrypt PII with AES-GCM / envelope.`,
    javaTitle: 'TLS 1.3 — configure, do not reimplement',
    labClass: 'SecurityConfig',
    pros: [
      'Universal pipe protection: browsers, gRPC, Postgres, Kafka SASL_SSL.',
      'Modern suites only: ECDHE + AEAD, forward secrecy by default.',
      'mTLS gives workload identity on top of the pipe.',
    ],
    cons: [
      'Terminates at LB/ingress — hops after that are plaintext unless you encrypt again.',
      'Does not help a stolen database backup, a debug log, or a JWT sitting in localStorage.',
      'Cert expiry is an outage class. Monitor, do not copy-paste trust-all verifiers.',
    ],
    useWhen: 'Every network hop. Always. Then still encrypt sensitive fields at rest.',
    avoidWhen: 'As the only control for PII. As a substitute for webhook HMAC. As “we have HTTPS so the JWT can hold the PAN”.',
    memory: 'TLS = pipe. AES-GCM = vault. HMAC/sign = seal. Three rooms, not one checkbox.',
    interview: 'TLS 1.3 is ECDHE + AEAD. It protects transport only. After termination I still AES-GCM PII and sign callbacks.',
  },
];

export const ROOM_MAP_MERMAID = `flowchart TB
  subgraph HOUSE[Five rooms - memorize this house]
    LOCK[LOCK hide data - AES-GCM]
    SEAL[SEAL prove origin - HMAC RSA-PSS ECDSA]
    KEY[KEY wrap or agree - OAEP ECDH Envelope]
    PRINT[PRINT one-way - SHA-256 Argon2id]
    PIPE[PIPE the wire - TLS 1.3]
  end
  ASK[What property do I need?] --> HOUSE`;
