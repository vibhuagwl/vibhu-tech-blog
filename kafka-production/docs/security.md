# Security Reference

## TLS vs mTLS vs SASL

| Mode | Encryption | Authentication |
|------|------------|----------------|
| PLAINTEXT | ❌ | ❌ |
| SSL/TLS | ✅ | Server cert only |
| SASL_SSL | ✅ | SCRAM / OAuth |
| mTLS | ✅ | Client + server certs |
| mTLS + SASL | ✅ | Cert + password/OAuth |

**FinTech recommendation:** `SASL_SSL` + `SCRAM-SHA-512` for service accounts, with optional mTLS for zero-trust internal networks.

## Authentication vs Authorization

- **Authentication** = Who are you? (SCRAM username, client cert CN)
- **Authorization** = What may you do? (ACL: READ/WRITE on topic, READ on group)

Both required. TLS alone does not know which microservice is connecting.

## Keystore vs Truststore

| Artifact | Contains | Used by |
|----------|----------|---------|
| Keystore | Private key + own certificate | Broker, mTLS client |
| Truststore | CA + trusted certs | Validates peer certificate |
| CA cert | Root of trust | Signs broker/client certs |

## Security flow (18 steps)

1. Producer starts → loads truststore + SCRAM creds from Secrets Manager
2. TCP connect to bootstrap broker :9093
3. TLS handshake — server presents broker cert
4. Client validates cert against truststore (hostname verify)
5. SASL SCRAM handshake — username/password
6. Broker maps to `User:payment-producer`
7. StandardAuthorizer checks ACL
8. WRITE granted on `payment-events`
9. Producer sends with `acks=all`, idempotence enabled
10. Leader writes + waits for ISR replicas
11. Consumer connects — same TLS + SASL
12. ACL: READ topic + READ group
13. Joins consumer group `payment-group`
14. Assigned partition(s)
15. Fetch records
16. Process idempotently
17. Manual commit offset after TX
18. Audit log records authn/z events

## What NOT to log

Passwords, SASL secrets, private keys, PAN/PII in payloads.
