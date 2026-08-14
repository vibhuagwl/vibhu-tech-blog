# Spring Bloom Filter Lab

Production-shaped Bloom Filter lab for **Senior/Staff system-design interviews**.

- Classic `BloomFilter` from scratch (`BitSet` + double hashing)
- `CountingBloomFilter` for deletion discussion
- Spring Boot user lookup: **Bloom → cache → DB** (cache-penetration shield)
- Kafka idempotency guard showing why Bloom is **not** source of truth
- Micrometer metrics + rebuild API

## Run

```bash
cd spring-bloom-filter-lab
mvn test
mvn spring-boot:run   # http://127.0.0.1:8097
```

## Demo curl

```bash
# Seeded users: user-1 .. user-5000 (configurable)
curl -sS http://127.0.0.1:8097/api/users/user-1 | jq .

# Definitely missing → Bloom short-circuit 404 (no DB)
curl -sS -w '\n%{http_code}\n' http://127.0.0.1:8097/api/users/no-such-user

# Stats
curl -sS http://127.0.0.1:8097/api/bloom/stats | jq .

# Create user (adds to Bloom + cache + DB)
curl -sS -X POST http://127.0.0.1:8097/api/users \
  -H 'Content-Type: application/json' \
  -d '{"id":"user-9001","displayName":"Neo","email":"neo@example.com"}'

# Rebuild from DB
curl -sS -X POST http://127.0.0.1:8097/api/bloom/rebuild | jq .
```

## Interview spine

```text
Definitely NO  → return fast (no Redis/DB)
Maybe YES      → Redis → DB (source of truth)
False positive → extra lookup only — never invent data
False negative → must not happen for inserted keys
```

## Memory rule of thumb

For ~1% FPP: **≈ 10 bits/key** → 1M keys ≈ **1.2 MB**.

Hub: `/bloom-filter` on the interview site.
