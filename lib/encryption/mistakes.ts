export const PRODUCTION_MISTAKES = [
  {
    bad: 'Base64 encode SSN and store it as encrypted_ssn',
    good: 'AES-GCM encrypt SSN and store keyId|iv|ciphertext',
    why: 'Encoding is reversible without a key.',
  },
  {
    bad: 'Use AES/ECB/PKCS5Padding because it is easy',
    good: 'Use AES/GCM/NoPadding with random IV and auth tag',
    why: 'ECB leaks patterns and has no integrity.',
  },
  {
    bad: 'Put PAN or secrets in JWT claims',
    good: 'Put only minimal authorization claims in signed JWTs',
    why: 'Signed JWT payloads are readable.',
  },
  {
    bad: 'Log decrypt request and response for debugging',
    good: 'Log keyId, operation, size, and correlation ID only',
    why: 'Logs often outlive databases and have wider access.',
  },
  {
    bad: 'Replace bytes behind key id v1 during rotation',
    good: 'Create v2, write with v2, read v1 and v2, then backfill',
    why: 'Key IDs must be immutable meanings.',
  },
  {
    bad: 'Use SHA-256(email) for lookup',
    good: 'Use HMAC-SHA256 with a protected lookup key',
    why: 'Emails and phone numbers are dictionary-guessable.',
  },
  {
    bad: 'Compare webhook signatures with equals',
    good: 'Use MessageDigest.isEqual and enforce timestamp/nonce',
    why: 'Timing leaks and replay attacks bypass naive checks.',
  },
  {
    bad: 'Call KMS for every row in a hot list API',
    good: 'Use envelope encryption and bounded DEK cache',
    why: 'KMS is for key custody, not high-volume bulk cipher work.',
  },
];
