# Distributed 2PL / 3PL Money Transfer

Runnable Spring Boot multi-module system: Redis distributed locks (strict 2PL) + PostgreSQL `SELECT … FOR UPDATE` + persisted 3PL state machine + Kafka lifecycle events + recovery.

## Architecture

```
Client → API Gateway (:8080)
       → Transaction Service (:8083)
           → Lock Service (:8081) → Redis
           → Account Service (:8082) → PostgreSQL (accountdb)
           → PostgreSQL (transactiondb)
           → Kafka (async lifecycle only)
Recovery Service (:8084) polls incomplete 3PL states
```

## Prerequisites

- Java 21
- Maven 3.9+
- Docker + Docker Compose

## Build

```bash
cd distributed-locking
mvn clean install
```

## Start infrastructure

```bash
docker compose up -d
```

Waits for PostgreSQL (`accountdb`, `transactiondb`), Redis, Kafka, Prometheus (`:9090`), Grafana (`:3001`, admin/admin).

## Start services

```bash
chmod +x scripts/*.sh
./scripts/start-services.sh
```

Or manually (separate terminals):

```bash
java -jar lock-service/target/lock-service-1.0.0-SNAPSHOT.jar
java -jar account-service/target/account-service-1.0.0-SNAPSHOT.jar
java -jar transaction-service/target/transaction-service-1.0.0-SNAPSHOT.jar
java -jar recovery-service/target/recovery-service-1.0.0-SNAPSHOT.jar
java -jar api-gateway/target/api-gateway-1.0.0-SNAPSHOT.jar
```

Health:

```bash
curl -s http://localhost:8081/actuator/health
curl -s http://localhost:8082/actuator/health
curl -s http://localhost:8083/actuator/health
curl -s http://localhost:8084/actuator/health
curl -s http://localhost:8080/actuator/health
```

## Create accounts

```bash
curl -s -X POST http://localhost:8080/api/v1/accounts \
  -H 'Content-Type: application/json' \
  -d '{"accountId":"A","initialBalance":10000}'

curl -s -X POST http://localhost:8080/api/v1/accounts \
  -H 'Content-Type: application/json' \
  -d '{"accountId":"B","initialBalance":5000}'

curl -s -X POST http://localhost:8080/api/v1/accounts \
  -H 'Content-Type: application/json' \
  -d '{"accountId":"C","initialBalance":2000}'
```

## Execute transfer

```bash
curl -s -X POST http://localhost:8080/api/v1/transfers \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: demo-1' \
  -d '{
    "sourceAccountId":"A",
    "destinationAccountId":"B",
    "amount":7000,
    "idempotencyKey":"demo-1"
  }'
```

Expected:

```json
{"transactionId":"...","status":"COMPLETED"}
```

```bash
curl -s http://localhost:8080/api/v1/accounts/A
curl -s http://localhost:8080/api/v1/transfers/<transactionId>
```

## Concurrent scenario (A=10000; T1 A→B 7000 & T2 A→C 6000)

```bash
./scripts/test-transfer.sh
```

Only one depleting transfer can succeed. Final A is `3000` or `4000`. Never negative.

## Idempotency

Same `Idempotency-Key` returns the original result; unique constraint in PostgreSQL prevents double execution.

## Simulate failure / recovery

1. Start a transfer, kill `transaction-service` mid-flight (leave Redis lease / DB row in `PRE_COMMIT` or `COMMIT_READY`).
2. Wait for lease/stale window (`RECOVERY_STALE_SECONDS`, default 30s).
3. Trigger recovery:

```bash
curl -s -X POST http://localhost:8080/api/v1/recovery/run
```

Recovery continues commit when balances were prepared for commit, otherwise aborts and releases Redis locks. Fencing tokens reject stale writers after lease expiry.

## Metrics

- `distributed_lock_acquisition_total`
- `distributed_lock_timeout_total`
- `distributed_lock_wait_seconds`
- `distributed_deadlock_total`
- `transaction_success_total`
- `transaction_failure_total`
- `transaction_rollback_total`
- `transaction_recovery_total`

Prometheus scrapes actuators via `observability/prometheus.yml`.

---

## Sequence diagrams (match implemented code)

### 1 — Successful transfer

```mermaid
sequenceDiagram
  participant C as Client
  participant G as API Gateway
  participant T as TransactionService
  participant L as LockService
  participant R as Redis
  participant A as AccountService
  participant P as PostgreSQL
  participant K as Kafka

  C->>G: POST /api/v1/transfers
  G->>T: forward
  T->>T: claim idempotency key (PG unique)
  T->>T: begin() ACTIVE
  T-->>K: TransactionStarted
  T->>T: LOCKING
  T->>L: POST /internal/locks/acquire (EXCLUSIVE A,B ordered)
  L->>R: SET excl:account:X NX PX + INCR fence
  R-->>L: ownerToken:fencingToken
  L-->>T: LockToken
  T-->>K: LockAcquired
  T->>T: PRE_COMMIT
  T->>A: POST /internal/accounts/transfer-prepare
  A->>P: SELECT … FOR UPDATE + funds check
  P-->>A: ok
  A-->>T: balances
  T-->>K: TransactionPrepared
  T->>T: COMMIT_READY
  T->>A: POST /internal/accounts/transfer-apply
  A->>P: FOR UPDATE + debit/credit + fence check
  P-->>A: committed
  T->>T: COMMITTED
  T-->>K: TransactionCommitted
  T->>L: POST /internal/locks/release (Lua token check)
  L->>R: DEL only if ownerToken matches
  T->>T: RELEASED
  T-->>K: LockReleased
  T-->>G: {status:COMPLETED}
  G-->>C: 200
```

### 2 — Concurrent transfers (insufficient combined funds)

```mermaid
sequenceDiagram
  participant T1 as Transfer T1 (A→B 7000)
  participant T2 as Transfer T2 (A→C 6000)
  participant L as LockService/Redis
  participant A as AccountService/PG

  T1->>L: Lock(account:A) EXCLUSIVE
  L-->>T1: acquired fence=n
  T2->>L: Lock(account:A) EXCLUSIVE
  Note over T2,L: waiting / queue
  T1->>A: prepare + apply debit 7000
  A-->>T1: A=3000
  T1->>L: release A
  L-->>T2: acquired fence=n+1
  T2->>A: prepare/apply 6000
  A-->>T2: InsufficientFunds
  T2->>T2: rollback ABORTED
  T2->>L: release A
```

### 3 — Application crash + recovery

```mermaid
sequenceDiagram
  participant T as TransactionService
  participant L as LockService/Redis
  participant A as AccountService
  participant Rec as RecoveryService
  participant PG as transactiondb

  T->>L: acquire locks
  T->>PG: state=COMMIT_READY
  Note over T: process crashes before apply/release
  Rec->>T: POST /internal/recovery/run?staleSeconds=30
  T->>PG: load stale incomplete rows
  T->>T: verify fencing tokens on locks
  alt can finish commit
    T->>A: transfer-apply
    T->>PG: COMMITTED → RELEASED
    T->>L: safe unlock (Lua)
  else cannot finish
    T->>PG: ABORTING → ABORTED → RELEASED
    T->>L: release if still owner
  end
```

### 4 — Lock timeout

```mermaid
sequenceDiagram
  participant T1 as Owner
  participant T2 as Waiter
  participant L as LockService

  T1->>L: acquire Lock(A) lease=30s
  L-->>T1: held
  T2->>L: acquire Lock(A) waitTimeout=2s
  Note over T2,L: spins / wait queue
  L-->>T2: LockTimeoutException LOCK_TIMEOUT
  Note over T2: no account writes occurred
```

### 5 — Deadlock detection

```mermaid
sequenceDiagram
  participant T1 as Tx1
  participant T2 as Tx2
  participant L as LockService
  participant D as DeadlockDetector

  T1->>L: Lock(A) acquired
  T2->>L: Lock(B) acquired
  T1->>L: wait Lock(B)
  L->>D: registerWait(T1 → T2)
  T2->>L: wait Lock(A)
  L->>D: registerWait(T2 → T1)
  D-->>L: DeadlockException
  Note over L: aborts waiting acquisition (one side fails)
  L-->>T2: deadlock / abort
  T2->>L: release B
  T1->>L: acquire B → continue or also abort per policy
```

### 6 — 3PL state transitions

```mermaid
sequenceDiagram
  participant M as ThreePhaseTransactionManager
  participant PG as PostgreSQL transactions.state

  M->>PG: ACTIVE (begin)
  M->>PG: LOCKING (acquireLocks)
  M->>PG: PRE_COMMIT (prepare / account validate)
  M->>PG: COMMIT_READY (preCommit)
  M->>PG: COMMITTED (commit / apply)
  M->>PG: RELEASED (releaseLocks)
  Note over M,PG: Failure: ACTIVE/LOCKING/PRE_COMMIT/COMMIT_READY → ABORTING → ABORTED → RELEASED
```

### State diagram

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> LOCKING
  LOCKING --> PRE_COMMIT
  PRE_COMMIT --> COMMIT_READY
  COMMIT_READY --> COMMITTED
  COMMITTED --> RELEASED
  RELEASED --> [*]

  ACTIVE --> ABORTING
  LOCKING --> TIMED_OUT
  LOCKING --> ABORTING
  PRE_COMMIT --> ABORTING
  COMMIT_READY --> ABORTING
  TIMED_OUT --> ABORTING
  ABORTING --> ABORTED
  ABORTED --> RELEASED

  PRE_COMMIT --> COMMIT_READY: recovery continue
  COMMIT_READY --> COMMITTED: recovery continue
```

## Modules

| Module | Port | Role |
|--------|------|------|
| `api-gateway` | 8080 | Edge routes |
| `lock-service` | 8081 | Redis 2PL locks, fencing, deadlock wait-for graph |
| `account-service` | 8082 | Ledger + `FOR UPDATE` + fence validation |
| `transaction-service` | 8083 | 2PL/3PL coordinator, idempotency, Kafka producer |
| `recovery-service` | 8084 | Stale txn recovery + Kafka consumer/DLQ |
| `common` | — | DTOs / events / exceptions |

## Tests

```bash
mvn test
```

Redis/Testcontainers integration tests skip when Docker is unavailable. End-to-end concurrency is covered by `scripts/test-transfer.sh` against a running stack.
