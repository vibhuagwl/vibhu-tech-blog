# Principal review

| Dimension              | Score | Notes                                                                                            |
|------------------------|-------|--------------------------------------------------------------------------------------------------|
| Correctness            | 9     | Atomic SQL + unique constraints + outbox. Redis never authoritative.                             |
| Concurrency            | 9     | Three strategies implemented; default is the high-throughput one. 1-vs-N test.                   |
| Scalability            | 7     | Honest about the hot-row limit. Waiting room / tokens are designed, not fully productized.       |
| Availability           | 7     | Fail-closed Redis. Multi-AZ Kafka/PG assumed, not proven in this lab.                            |
| Consistency            | 8     | Eventual across services; strong on stock.                                                       |
| Durability             | 8     | Outbox + `acks=all`.                                                                             |
| Resilience             | 8     | CB/retry/bulkhead on payment; DLQ; reservation TTL.                                              |
| Observability          | 7     | Micrometer names + Prometheus scrape. Full Grafana story is starter dashboards.                  |
| Security               | 7     | JWT resource server + RBAC on admin/replay. Kafka SASL sketched, Compose is plaintext for local. |
| Maintainability        | 8     | Hexagonal packages, small use cases.                                                             |
| Extensibility          | 8     | Payment `Strategy`, reservation `Strategy`.                                                      |
| Cost                   | 7     | Redis+Kafka+4 DBs is the right cost for this problem; overkill for a 50-unit sale.               |
| Operational complexity | 6     | Outbox pollers, saga, DLQ replay — you need a runbook. Worth it.                                 |

**Overall: 8/10** for an interview LLD you can run locally.

## Weaknesses to say out loud

1. Single hot SKU cannot be scaled by adding inventory pods.
2. Local Compose Kafka is not SASL_SSL (see `secure-kafka` lab for that plane).
3. Stripe adapter is a real interface with a mock; no live Stripe account.
4. Waiting room is a design + hook, not a full lottery product.
5. Schema Registry/Avro is discussed, JSON events shipped for lab speed.

## What would change at 10M users / 1 SKU

Admit tokens (waiting room) + pre-split inventory tokens + edge CDN challenge + bot score. The domain model stays.
