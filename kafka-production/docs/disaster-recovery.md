# Disaster Recovery

## Active-passive (FinTech recommended)

```
Primary cluster (us-east-1)          DR cluster (us-west-2)
        │                                      ▲
        └──── MirrorMaker 2 / Cluster Link ────┘
```

- **RPO:** MM2 lag (seconds–minutes depending on bandwidth)
- **RTO:** DNS/bootstrap switch + consumer offset strategy (timestamp reset or MM2 offset mapping)
- Money topics: prefer active-passive with explicit failover runbook over active-active dual-write

## Active-active

- Conflict resolution required (last-write-wins unacceptable for ledger)
- Use single-writer per partition key per region OR CRDT-style merge
- Higher operational complexity — rare for payment core

## Failover checklist

1. Stop producers to primary (feature flag)
2. Verify MM2 lag = 0 or accept bounded loss window
3. Switch bootstrap DNS to DR cluster
4. Reset consumer groups or use MM2 offset sync tool
5. Run reconciliation job for in-flight transactions
