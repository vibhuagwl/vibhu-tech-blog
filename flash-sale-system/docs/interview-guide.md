# Interview guide — 50 questions

1. **How do you prevent overselling?** Atomic `UPDATE … WHERE available >= qty`; `rows==1`. Redis only sheds.
2. **Why not Redis as source of truth?** Crash, flush, replica lag. Stock is money.
3. **Why Kafka?** Absorb spike, decouple payment, replay, backpressure.
4. **Why not sync REST inventory→order→pay?** Tail latency, TX across HTTP, one slow provider kills checkout.
5. **Duplicate Kafka messages?** `eventId` unique / processed table. Unique reservation per order.
6. **How does outbox fix dual-write?** Same TX as business write; poller after commit.
7. **Outbox publisher crashes?** Rows stay `NEW`; another replica `SKIP LOCKED`.
8. **Why saga not 2PC?** Three systems; coordinator availability; Stripe is not XA.
9. **Payment timeout?** Idempotent retry then compensate (release + cancel).
10. **Release inventory?** Idempotent reservation state `RELEASED`; increment available + Redis.
11. **Redis crashes?** Fail closed 503 on purchase. Do not stampede Postgres.
12. **Hot keys?** Gate + shed + waiting room + tokens. You cannot shard one row.
13. **Scale Kafka?** Partitions first. Consumers ≤ partitions.
14. **Scale consumers?** Same. Extra consumers idle.
15. **Rebalance?** No long TX; ack after commit; cooperative sticky.
16. **Poison messages?** Permanent → DLQ. Replay with idempotency, ADMIN only.
17. **Cache stampede?** Jitter, single-flight on miss, warm-up. No lock on every GET.
18. **DB deadlocks?** Fixed lock order (inventory then reservation). Retry 40P01.
19. **Duplicate HTTP?** Idempotency key unique + return stored body.
20. **Exactly-once?** Kafka EOS ≠ business EOS. Constraints + idempotency + outbox.
21. **10M users?** Waiting room. Gate at 1M. DB sees winners + a thin reject path.
22. **One hot product?** Same as 12. Admit N tokens/s.
23. **Partition DB?** Orders/outbox by time when vacuum/p99 hurts. Unique keys must include partition key.
24. **Monitor lag?** `kafka_consumer_lag` + outbox age. Lag without CPU = need partitions; CPU maxed = need shed.
25. **Metrics that matter?** Gate rejects, reserve ok/fail, 429/503, CB open, outbox pending, DLT count.
26. **DR?** Multi-AZ Kafka/PG, outbox as the rebuild log, documented RPO (at-least-once events).
27. **Zero-downtime deploy?** Don’t roll inventory at T-0. PDB. Backward-compatible events.
28. **Schema evolution?** Add optional fields. `eventVersion`. Never reuse field meaning.
29. **Safe DLQ replay?** Idempotent handlers; rate-limit replay; don’t replay permanent business rejects as new buys.
30. **Idempotent compensation?** Reservation status machine; increment only from `RESERVED`.
31. **Optimistic vs pessimistic vs atomic?** Retry storm vs hold time vs one statement. Atomic for hot SKU.
32. **When distributed lock?** Admin/restock/cache fill. Not 1M checkout.
33. **Lua vs DB?** Lua = filter. DB = truth.
34. **Why `acks=all`?** Lose leader without it.
35. **Why manual ack?** Crash after ack/before DB = skipped reserve.
36. **SKIP LOCKED?** Multi-publisher without a lock manager.
37. **Hikari max 200?** 50 pods × 200 = death.
38. **Circuit breaker vs retry?** CB stops calling a dead peer. Retry without CB amplifies outage.
39. **Rate limit where?** Gateway (cluster), service (user), Redis (global). Defense in depth.
40. **Waiting room vs 429?** 429 is shed. Waiting room is fairness/UX + shed.
41. **Token inventory?** Parallel claims; harder reconcile. Use when one row is the bottleneck *and* you already shed.
42. **CDC vs outbox?** CDC at scale; outbox for explicit events in this lab.
43. **Choreography vs orchestration?** We orchestrate payment+release for visibility.
44. **Who allocates orderId?** Flash-sale on 202 so every event shares one id.
45. **Reservation TTL?** Heals “payment never came back.”
46. **Reconciliation?** `initial = available + reserved + sold`. Alert on drift.
47. **Security of replay?** `OPERATIONS`/`ADMIN` + audit log. Never USER.
48. **PII in Kafka?** No PAN/CVV. Payment service talks to Stripe; events carry `orderId` + amount.
49. **Why quantity=1 policy?** Simplifies unique(user,sale,product). Configurable.
50. **What do you cut at 3am?** Live Stripe, Avro, waiting-room lottery. You do not cut atomic SQL or outbox.

Bonus: “Would you use Mongo for inventory?” Document CAS exists; you still need a single atomic compare. The problem is
the hot item, not SQL vs NoSQL.
