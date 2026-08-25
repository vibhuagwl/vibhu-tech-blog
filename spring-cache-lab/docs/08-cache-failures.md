# 08 — Failures

- **Stampede** — `sync=true` (JVM), locks, soft TTL
- **Penetration** — `NegativeCache`, Bloom, validation
- **Avalanche** — `TtlJitter`
- **Hot key** — L1, coalescing
- **Redis down** — fail-open handler → DB
