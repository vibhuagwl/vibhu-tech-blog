import type {InternalsSequence} from './types';

export const INTERNALS_SEQUENCES: InternalsSequence[] = [
  {
    id: 'produce',
    title: 'Produce → leader append',
    why: 'Clients never write a follower. The leader assigns the offset. Until then the record is not in the log.',
    ascii: `payment-api
    │  ProduceRequest (key=A100:p9)
    ▼
Broker-1  LEADER  partition payments-7
    │  append to active segment
    │  offset 1042 assigned
    ▼
page cache → payments-7/00000000000000000000.log`,
    mermaid: `sequenceDiagram
  participant P as Producer
  participant L as Leader B1
  participant Log as Partition log
  P->>L: Produce key=A100
  L->>Log: append sequential
  Log-->>L: offset 1042
  Note over L: LEO moves. HW not yet.`,
  },
  {
    id: 'replicate',
    title: 'Followers fetch copies',
    why: 'Replication is pull, not push. Followers on other brokers fetch from the leader until their LEO catches up.',
    ascii: `B1 leader   payments-7  offsets 0..1042
    ▲
    │ fetch
B2 follower  (rack az-b)
    │ fetch
B3 follower  (rack az-c)

ISR = {B1, B2, B3}  when all caught up
RF  = 3`,
    mermaid: `sequenceDiagram
  participant L as Leader B1
  participant F2 as Follower B2
  participant F3 as Follower B3
  F2->>L: Fetch from LEO
  L-->>F2: records ..1042
  F3->>L: Fetch from LEO
  L-->>F3: records ..1042
  F2-->>L: replica HW catch-up
  F3-->>L: replica HW catch-up
  Note over L: ISR complete`,
  },
  {
    id: 'acks',
    title: 'acks=all then high watermark',
    why: 'The producer success callback is a durability claim. acks=all waits for ISR. Consumers read only up to HW.',
    ascii: `acks=0   producer does not wait
acks=1   leader appended
acks=all leader + ISR (≥ min.insync.replicas)

HW = last offset known on all ISR replicas
Consumers fetch offsets < HW`,
    mermaid: `sequenceDiagram
  participant P as Producer
  participant L as Leader
  participant ISR as Followers ISR
  participant C as Consumer
  P->>L: Produce acks=all
  L->>ISR: wait fetch catch-up
  ISR-->>L: replicated
  L-->>P: ACK offset 1042
  L->>L: HW = 1043
  C->>L: Fetch
  L-->>C: up to HW`,
  },
  {
    id: 'commit',
    title: 'Poll → process → commit',
    why: 'Consume does not delete. The group cursor in __consumer_offsets is the only “I am done” signal.',
    ascii: `group settlement-workers  owns payments-7
poll  offsets 1040,1041,1042
ledger.write(payment)     // side effect
commitSync(1043)          // next offset to read

__consumer_offsets
  settlement-workers / payments-7 = 1043`,
    mermaid: `sequenceDiagram
  participant C as Consumer
  participant K as Leader
  participant DB as Ledger
  participant O as consumer_offsets
  C->>K: Fetch from 1040
  K-->>C: 1040..1042
  C->>DB: insert payment UNIQUE
  DB-->>C: ok
  C->>O: commit 1043
  Note over C: crash after this = no replay`,
  },
  {
    id: 'crash-before',
    title: 'Crash before commit',
    why: 'The same records come back. Not necessarily to the same JVM. Any group member that inherits the partition will re-read.',
    ascii: `C1 processes 1042, dies, no commit
group rebalance
C2 (or new C1 pod) assigned payments-7
last committed = 1040
→ reads 1040,1041,1042 again

Need UNIQUE(payment_id) / idempotency key`,
    mermaid: `sequenceDiagram
  participant C1 as Consumer-1
  participant K as Kafka
  participant DB as Ledger
  participant C2 as Consumer-2
  C1->>K: poll 1042
  C1->>DB: write payment
  C1--xC1: crash, no commit
  K->>K: rebalance
  C2->>K: assigned payments-7
  C2->>K: fetch from 1040
  K-->>C2: 1042 again
  Note over C2,DB: duplicate delivery, idempotent write`,
  },
  {
    id: 'leader-fail',
    title: 'Leader broker dies',
    why: 'Controller elects a new leader from ISR. Clients refresh metadata. Offsets do not rewind because of a leader change.',
    ascii: `B1 leader dies
Controller (KRaft) → elect B2 from ISR
epoch++
producers / consumers metadata refresh
under-replicated until B1 returns and catches up`,
    mermaid: `sequenceDiagram
  participant Ctrl as KRaft controller
  participant B1 as Leader B1
  participant B2 as Follower B2
  participant P as Producer
  B1--xB1: crash
  Ctrl->>B2: become leader (ISR)
  P->>B1: produce fails
  P->>P: metadata refresh
  P->>B2: Produce to new leader`,
  },
];
