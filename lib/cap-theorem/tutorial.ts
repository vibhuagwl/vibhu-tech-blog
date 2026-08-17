/** Story-driven CAP tutorial content — payment failure as the spine. */

export const CAP30 =
  'Two replicas, network breaks, a request arrives: return correct data (CP) or return a response that may be stale (AP). Partition tolerance is assumed in any real multi-node system.';

export const MEMORY_CALLOUT = {
  title: 'When the network partition happens, you must choose',
  cp: 'CP → Give me correct data, even if I have to reject/wait.',
  ap: 'AP → Give me a response, even if the data may temporarily be stale.',
};

export const MEMORY_SENTENCE =
  'Partition → Correct (CP) or Answer (AP). Money-critical ops lean CP. Catalog/likes lean AP. Slice by data domain — not one stamp for the whole product.';

export const VERSION_NOTE =
  'Story · failure · Spring Boot decision · interactive simulator · interview answer. Related: /microservice-communication · /distributed-locking · /kafka-interview.';

export const ARCH_PAYMENT = `                 ┌──────────────┐
                 │    Client    │
                 └──────┬───────┘
                        │
                  ┌─────▼─────┐
                  │ API Gateway│
                  └─────┬─────┘
                        │
              ┌─────────▼─────────┐
              │ Payment Service    │
              └─────────┬─────────┘
                        │
               ┌────────▼────────┐
               │ Distributed DB  │
               └───────┬─────────┘
                       │
              ┌────────┴─────────┐
              │                  │
        ┌─────▼─────┐      ┌─────▼─────┐
        │ DB Node A │      │ DB Node B │
        │ Bangalore │      │ Mumbai    │
        └───────────┘      └───────────┘`;

export const BEFORE_AFTER = {
  healthy: `DB A                         DB B
Balance = ₹1000              Balance = ₹1000

       <------ network ------>
              healthy`,
  afterWithdraw: `DB A                         DB B
₹200                         ₹200

       <------ network ------>
              healthy`,
  partitioned: `DB A                 X                 DB B
₹200            NETWORK PARTITION       ₹200

        ❌ A cannot communicate with B

Partition = servers are alive, but they cannot talk.`,
};

export const CP_DIAGRAM = `Client
  │
  ▼
DB A ─────── X ─────── DB B
  │
  │ cannot verify latest with peer
  ▼
503 / WAIT

Consistency ✅   Partition Tolerance ✅   Availability ❌
→ CP`;

export const AP_DIAGRAM = `             NETWORK PARTITION
                  ❌
                 / \\
                /   \\
          DB A       DB B
          ₹200       ₹1000
            │          │
            ▼          ▼
        accepts      may serve
        local write  old data

Availability ✅   Partition Tolerance ✅   Strong Consistency ❌
→ AP`;

export const FORK_DIAGRAM = `                 PARTITION
                     │
            ┌────────┴────────┐
            │                 │
            ▼                 ▼
       CONSISTENCY       AVAILABILITY
          CP                  AP
       "Be correct"       "Stay available"`;

export const CAP_MEANINGS = [
  {
    letter: 'C',
    title: 'Consistency',
    ask: 'If I write ₹500, can another node immediately return the old ₹1000?',
    memory: 'C = Correct everywhere (under the consistency contract)',
    note: 'Strong consistency: a successful read reflects the latest successful write (linearizability-style).',
  },
  {
    letter: 'A',
    title: 'Availability',
    ask: 'Will a non-failed node respond to my request (non-error)?',
    memory: 'A = Always respond (CAP sense)',
    note: 'Not the same as "99.999% uptime SLA". CAP A = every non-failing node returns a response during partition.',
  },
  {
    letter: 'P',
    title: 'Partition Tolerance',
    ask: 'Can the system survive communication failure between nodes?',
    memory: 'P = Partition / network break survives',
    note: 'Nodes are up; the link is broken or delayed. In multi-AZ / multi-region, P is effectively mandatory.',
  },
] as const;

export const PICK_TWO_FIX = `Distributed system
       │
       ▼
Network partition happens
       │
       ▼
You must choose
       │
   ┌───┴────┐
   ▼        ▼
   C        A

CA (no P) is mainly a single-node conceptual case —
not a useful stamp for a true multi-node distributed system.`;

export const CP_JAVA = `// Simplified teaching CP path — NOT a real payment protocol
@PostMapping("/payments")
public PaymentResponse pay(@RequestBody PaymentRequest request) {
  if (!replicationAvailable()) {
    // Cannot confirm peer/quorum — refuse rather than risk wrong money
    throw new ServiceUnavailableException(
        "Cannot guarantee consistency during partition");
  }
  debitAccount(request);   // durable local + quorum write
  replicate();             // ensure required replicas see it
  return PaymentResponse.success();
}

/*
  Replication unavailable
          ↓
  Reject request (503)
          ↓
  Consistency preserved
          ↓
  Availability sacrificed for this op
*/`;

export const AP_JAVA = `// Simplified teaching AP path — local accept + async reconcile
@PostMapping("/payments")
public PaymentResponse pay(@RequestBody PaymentRequest request) {
  debitLocalReplica(request);                 // stay available
  publishEvent(new PaymentCreatedEvent(request)); // Kafka / outbox
  return PaymentResponse.success();           // may diverge briefly
}

/*
  Local write
     ↓
  Event bus
     ↓
  Replication / consumers
     ↓
  Other replica eventually catches up
*/`;

export const SIM_JAVA = `// In-memory teaching sketch of the CAP fork
record AccountNode(String name, BigDecimal balance) {
  AccountNode debit(BigDecimal amount) {
    return new AccountNode(name, balance.subtract(amount));
  }
}

boolean networkAvailable;

PaymentResponse withdrawCp(AccountNode a, AccountNode b, BigDecimal amt) {
  if (!networkAvailable) {
    throw new ServiceUnavailableException("CP: cannot verify peers");
  }
  // …quorum debit on both…
  return PaymentResponse.success();
}

PaymentResponse withdrawAp(AccountNode a, BigDecimal amt) {
  if (!networkAvailable) {
    // Accept locally; replicate later when the link heals
    a = a.debit(amt);
    queueReplication(a);
    return PaymentResponse.success(); // available, temporarily inconsistent
  }
  // healthy path: debit + sync
  return PaymentResponse.success();
}`;

export const DOUBLE_SPEND = `Customer balance = ₹10,000

Two concurrent withdraw ₹8,000 requests during partition:

             ❌
        NETWORK PARTITION

      Node A             Node B
      ₹10,000            ₹10,000
         │                  │
     Withdraw            Withdraw
      ₹8,000              ₹8,000

If BOTH accept → ₹16,000 withdrawn from ₹10,000
→ OVERSPENDING / DOUBLE SPEND

Why ledgers often choose CP (or quorum) for debit:
wrong money costs more than a temporary 503.`;

export const ECOM_AP = `Product: iPhone   Stock: 1

India Region        US Region
Stock = 1           Stock = 1
        \\             /
         \\    ❌     /
          NETWORK PARTITION

AP checkout:
  India → accepts order
  US    → accepts order

Later:
  Conflict detected → backorder / cancel one order

Availability now > immediate stock agreement.
Browse/catalog can be AP; unique-SKU hard reserve may still be CP.`;

export const DB_TABLE = {
  headers: ['Technology', 'Typical CAP discussion', 'Why (nuanced)'],
  rows: [
    [
      'MongoDB',
      'Often CP-oriented',
      'Leader-based writes; elections prioritize a consistent primary view — depends on writeConcern/readConcern',
    ],
    [
      'Cassandra',
      'Often AP-oriented',
      'Tunable consistency; ONE favors A; QUORUM can behave CP for that op',
    ],
    [
      'Dynamo-style',
      'AP-oriented',
      'Designed for availability + eventual/tunable consistency',
    ],
    [
      'ZooKeeper / etcd',
      'CP-oriented',
      'Coordination/locking needs strong agreement',
    ],
    [
      'Single-node PostgreSQL',
      'CA-like (conceptual)',
      'No inter-node partition to tolerate — not a multi-node CAP stamp',
    ],
  ],
};

export const DB_CAVEAT =
  'Actual guarantees depend on configuration, operation, replication mode, read/write concern, topology, and consistency settings — never stamp a vendor logo as absolute CAP.';

export const CAP_VS_ACID = `CAP
│
├── Distributed systems
├── Network partition
└── C vs A trade-off during P

ACID
│
├── Database transactions
├── Atomicity
├── Consistency (invariants / constraints)
├── Isolation
└── Durability

Interview trap: CAP "Consistency" ≠ ACID "Consistency".
CAP-C ≈ single latest value / linearizability-style agreement across nodes.
ACID-C ≈ constraints & business rules inside a transaction.`;

export const STRONG_VS_EVENTUAL = `Strong Consistency
  Write
    ↓
  Required replicas agree
    ↓
  Read latest value

Eventual Consistency
  Write
    ↓
  Local acceptance
    ↓
  Async replication
    ↓
  Temporary stale reads
    ↓
  Eventually same value

Timeline (AP heal):
  T0 → DB A = ₹200, DB B = ₹200
  T1 → network partition
  T2 → DB A accepts update → ₹100
  T3 → network restored
  T4 → replication / anti-entropy
  T5 → DB A = DB B = ₹100`;

export const QUORUM = `N = 3 replicas
W = write quorum
R = read quorum

Example:
  N = 3, W = 2, R = 2
  W + R > N  →  2 + 2 > 3
  Overlapping replica sets help a read see the latest write.

WRITE → 2 of 3 replicas
READ  → 2 of 3 replicas

Quorum settings influence consistency and availability,
but quorum alone does not "break" or cancel CAP.`;

export const MICROSERVICES = `                API Gateway
                     │
                     ▼
              Payment Service
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
      PostgreSQL              Kafka
          │                     │
          ▼                     ▼
      Payment DB          Other Services

CAP is about distributed data behavior under partitions.
Kafka, caches, DBs, and services each have their own C/A trade-offs.

Do NOT say: "Microservices = AP."
Say: "Choice depends on the data domain and failure semantics."`;

export const PACELC = `             System
               │
       ┌───────┴────────┐
       │                │
    Partition?        No Partition
       │                │
      YES               │
       │                │
    C vs A              │
                        │
                     L vs C
                 Latency vs Consistency

P → A/C
Else → L/C

CAP asks:  What happens during a partition?
PACELC asks: What trade-off do we make even when healthy?`;

export const INTERVIEW_2MIN = `Imagine two payment DB replicas — Bangalore and Mumbai — with the balance replicated.

A customer withdraws ₹800; both nodes show ₹200. Then the network between them breaks. Both nodes are alive; they just cannot talk. That cut is the partition — P.

Now a balance or debit request hits Node A. I have two engineering choices.

CP: I refuse or wait because I cannot confirm the latest state with peers. Return 503. Consistency and partition tolerance held; availability for that op sacrificed. I lean this way for ledger debits — wrong money is worse than a temporary error.

AP: I accept on the local replica and replicate later. The system stays responsive, but Node B may briefly show stale ₹1000 until the link heals and anti-entropy converges. Fine for likes or catalog; dangerous for double-spendable cash without extra controls.

I do not "pick any two" at design time. In a multi-AZ system P is assumed; during a partition the fork is C versus A — and I slice by operation: payment auth CP-ish, notifications AP.`;

export const MASTER_MEMORY = `                 NETWORK BREAK
                      ❌
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
        "I need CORRECT"   "I need RESPONSE"
              │                 │
              ▼                 ▼
             CP                AP
              │                 │
          C + P              A + P
              │                 │
        Reject / Wait       Accept / Stale

C = Correct
A = Always respond (CAP sense)
P = Partition survives`;

export const TRAPS: {wrong: string; right: string}[] = [
  {
    wrong: 'CAP means choose any two of C, A, P at design time.',
    right:
      'During a partition, a distributed system must trade off consistency and availability. P is assumed for multi-node systems.',
  },
  {
    wrong: 'CAP consistency is the same as ACID consistency.',
    right:
      'They are related words for different guarantees: CAP-C is cross-node latest-value agreement; ACID-C is transactional invariants.',
  },
  {
    wrong: 'MongoDB is always CP.',
    right:
      'Commonly described as CP-oriented under majority write/read concerns, but guarantees depend on configuration and read/write behavior.',
  },
  {
    wrong: 'Kafka is AP.',
    right:
      'Kafka has its own replication, durability, ordering, and availability semantics; classification depends on the guarantee you mean (e.g. acks=all + min ISR).',
  },
  {
    wrong: 'Microservices are AP.',
    right:
      'Architecture style ≠ CAP stamp. Each data path chooses CP-leaning or AP-leaning behavior.',
  },
  {
    wrong: 'Eventual consistency means no consistency.',
    right: 'Replicas converge when updates stop — delayed agreement, not permanent chaos.',
  },
];

export const EVENTUAL_TIMELINE = [
  ['T0', 'DB A = ₹200, DB B = ₹200 — healthy'],
  ['T1', 'Network partition'],
  ['T2', 'DB A accepts update (AP)'],
  ['T3', 'Network restored'],
  ['T4', 'Replication / repair'],
  ['T5', 'DB A = DB B again'],
];
