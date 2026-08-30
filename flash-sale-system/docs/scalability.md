# Scalability and capacity

## Scale dimensions (independent)

| Bottleneck        | Scale                                                                                                      |
|-------------------|------------------------------------------------------------------------------------------------------------|
| HTTP accept       | Gateway + flash-sale replicas (HPA on CPU / RPS)                                                           |
| Redis gate        | Redis Cluster; one hot key still hits one shard — waiting room + token buckets                             |
| Kafka produce     | More flash-sale pods (producers are easy)                                                                  |
| Kafka consume     | Partitions first, then consumers ≤ partitions                                                              |
| Inventory DB      | Atomic update is a **hot row**. You cannot shard one SKU. Shed in Redis. Read replicas do not help writes. |
| Orders / payments | Shard or partition by `orderId` / time                                                                     |

## Hot product

One `productId` = one Kafka partition + one Postgres row + one Redis key.

Solutions we implement or design:

1. Redis gate (must)
2. Load shed at 0
3. Virtual waiting room (optional module — token admit N/s)
4. Inventory **tokens** (10,000 Redis list items / DB rows) — parallelize claims, more write amp
5. Do not “fix” with 200 inventory pods

## Waiting room

```text
Users → Waiting room (queue / lottery) → admit token → Flash sale
```

Protects API, Redis, Kafka, DB. Trade-off: fairness vs conversion. Not enabled by default in Compose; designed in
`FlashSaleProperties.waitingRoom`.

## Token vs counter vs row lock

| Model                     | Parallelism                  | Complexity                |
|---------------------------|------------------------------|---------------------------|
| Counter DECR + atomic SQL | Low on the DB row            | Simple, what we ship      |
| Pre-generated tokens      | High (claim distinct tokens) | Reconciliation harder     |
| `FOR UPDATE`              | 1 writer                     | Interview comparison only |

## Capacity sketch (order of magnitude)

Assumptions: 5M users, 10% try to buy, 10 minutes, 10k units.

- Peak try: ~80k–200k rps if bursty (not 1M unless bots). Design the *gate* for 1M; design DB for ~units + retries (~
  10k–50k reserves).
- Kafka: ~4–6 events per successful order + 1 event per rejected intent if you persist rejects. Winning path ≈ 50k
  events.
- Storage: orders of winners + idempotency of all intents (the large table). Partition/TTL idempotency after 24h.
- Redis: 1 GET/DECR per admitted request. 1M rps is a cluster conversation, not a single `m5.large`.

See `docs/30-minute-deep-dive.md` for the spoken version.

## Kubernetes

HPA on flash-sale (HTTP). Inventory replicas **capped at partition count**. PDB `minAvailable: 1` on inventory during
the sale window — do not roll all pods at 12:00:00. See `infrastructure/k8s/`.
