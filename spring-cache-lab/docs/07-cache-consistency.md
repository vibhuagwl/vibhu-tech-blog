# 07 — Consistency

Problem: DB new, cache old.

Tools: invalidate on write, short TTL, write-through, pub/sub / Kafka to drop L1, CDC.

Cache is **derived** data — DB remains source of truth.
