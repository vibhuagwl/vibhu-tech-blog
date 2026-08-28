# Production Runbook

## Daily checks

- [ ] UnderReplicatedPartitions = 0
- [ ] OfflinePartitionsCount = 0
- [ ] ActiveControllerCount = 1
- [ ] Consumer lag within SLO per group
- [ ] Disk usage < 80% all brokers

## Incident: URP > 0

1. Identify broker(s): `kafka-topics --describe --under-replicated-partitions`
2. Check broker logs, disk, network to followers
3. If broker down → replace/restart; ISR will catch up
4. Do NOT lower minISR or enable unclean election for payment topics

## Incident: Auth failure spike

1. Check recent deploys for wrong SCRAM password or expired cert
2. Compare ACL IaC vs `kafka-acls --list`
3. Roll back app deployment if credential typo

## Incident: Consumer lag

1. Scale consumers up to partition count max
2. Check handler duration vs max.poll.interval.ms
3. Investigate downstream DB slowness
4. Temporary: add partitions (plan reassignment) — cannot shrink later

## Incident: Producer NOT_ENOUGH_REPLICAS

1. ISR below min.insync.replicas — broker outage
2. Restore brokers; producers retry automatically
3. Alert payment ops — orders may queue in outbox
