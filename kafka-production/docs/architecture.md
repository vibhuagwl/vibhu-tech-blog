# Production Architecture

## Topology

```
                    ┌───────────────────┐
                    │ Producer Services │
                    │ (payment, order)  │
                    └─────────┬─────────┘
                              │ SASL_SSL + TLS
                     ┌────────▼────────┐
                     │ Private Network │
                     │ (VPC / K8s)     │
                     └────────┬────────┘
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
 ┌──────▼──────┐       ┌──────▼──────┐       ┌──────▼──────┐
 │ Kafka Broker│       │ Kafka Broker│       │ Kafka Broker│
 │    AZ-1     │       │    AZ-2     │       │    AZ-3     │
 └──────┬──────┘       └──────┬──────┘       └──────┬──────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                       Replicated Topics
                              │
                    ┌─────────▼─────────┐
                    │ Consumer Groups   │
                    └─────────┬─────────┘
                              │
                  ┌───────────┼───────────┐
                  │           │           │
              Consumer     Consumer    Consumer
```

## Connections requiring encryption + authentication

| Connection | Encrypt | Authenticate |
|------------|---------|--------------|
| Producer → Broker (CLIENT) | TLS | SASL SCRAM or mTLS |
| Consumer → Broker (CLIENT) | TLS | SASL SCRAM or mTLS |
| Admin → Broker | TLS | SASL SCRAM (admin user) |
| Broker → Broker (BROKER) | SSL | mTLS optional |
| Controller quorum | SSL | mTLS |

Clients must **never** connect to CONTROLLER listeners (port 9095).

## Durability settings

```properties
default.replication.factor=3
min.insync.replicas=2
unclean.leader.election.enable=false
```

With `acks=all`, producer waits for minISR acks before confirming — prevents silent loss when ISR shrinks.

## Failure: broker down

1. Leader partition on failed broker → controller elects new leader from ISR
2. Producers/consumers refresh metadata → reconnect to new leader
3. If ISR ≥ minISR, writes continue; if ISR < minISR, `acks=all` fails (correct — no false ack)

## Failure: 2 brokers down

- Partitions with RF=3 may lose quorum if ISR drops below minISR
- Producers with `acks=all` get `NOT_ENOUGH_REPLICAS` — applications must retry or fail gracefully
- Runbook: restore brokers before retention expires; never enable unclean leader election for money topics
