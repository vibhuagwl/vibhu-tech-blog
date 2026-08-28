# Kafka Production Deployment & Security

Production-grade Apache Kafka reference for FinTech: **Producer → Broker → Consumer** with TLS, SASL/SCRAM, ACLs, secrets, monitoring, HA, and failure handling.

## Structure

```
kafka-production/
├── kafka/           broker, controller, client properties + topic scripts
├── security/        OpenSSL cert generation, SCRAM user creation
├── acl/             producer, consumer, admin ACL scripts
├── producer/        Spring Boot producer config
├── consumer/        Spring Boot consumer config
├── kubernetes/      StatefulSet, NetworkPolicy, PDB
├── monitoring/      Prometheus alert rules
└── docs/            architecture, security, DR, rotation, runbook
```

## Quick start (staging)

1. Generate certs: `security/openssl/generate-certs.sh security/certificates`
2. Create SCRAM users: `KAFKA_*_PASSWORD=... security/create-scram-users.sh`
3. Apply ACLs: `acl/producer-acls.sh && acl/consumer-acls.sh`
4. Create topics: `kafka/create-topics.sh`
5. Deploy brokers with `kafka/broker.properties` (env-substituted secrets)

## FinTech recommendation

**SASL_SSL + SCRAM-SHA-512 + TLS 1.2+ + ACL least privilege**

- Separate principal per service (`payment-producer`, `payment-consumer`, …)
- `acks=all`, `min.insync.replicas=2`, `enable.idempotence=true`
- Private subnets only — no public Kafka endpoints
- Secrets in AWS Secrets Manager / Vault — never in Git

## Related site boards

- [/kafka-interview](/kafka-interview) — interview hub
- [/kafka-infra](/kafka-infra) — capacity, incidents, war room
- [/kafka-cluster](/kafka-cluster) — KRaft, ISR, replication internals
- [/spring-security#kafka-security](/spring-security#kafka-security) — Spring Security Kafka deep dive
