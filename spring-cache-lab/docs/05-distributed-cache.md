# 05 — Distributed vs local

```text
Local:   App1→Caffeine   App2→Caffeine   (may diverge)
Shared:  App1 + App2 → Redis
```

Trade-offs: consistency, network, failure domain, memory, invalidation.
