import type {
  BehaviorPredict,
  Incident,
  InterviewQ,
  PseudoExercise,
  ScenarioQ,
} from './types';

export const TRAP_QS: InterviewQ[] = [
  {
    "id": "t1",
    "topic": "Pick two",
    "question": "CAP says pick any two of C, A, P — which two at design time?",
    "answer30s": "You do not permanently pick two. P is mandatory; during partition you trade C vs A.",
    "answer2m": "Gilbert/Lynch: when the network partitions, a shared-data system cannot be both linearizable and fully available. CA only applies to single-node systems.",
    "followUps": [
      "Partition heals?"
    ],
    "trick": "Memorize CP/AP triangle.",
    "wrongAnswer": "We chose CP forever."
  },
  {
    "id": "t2",
    "topic": "SQL CA",
    "question": "SQL databases are always CA — true?",
    "answer30s": "Single-node SQL is CA only without inter-node partition. Multi-node replication is partition-tolerant.",
    "answer2m": "Postgres with cross-AZ replica: partition forces C (reject minority) or A (stale reads).",
    "followUps": [
      "RDS Multi-AZ?"
    ],
    "trick": "SQL exempts CAP.",
    "wrongAnswer": "Yes always CA."
  },
  {
    "id": "t3",
    "topic": "NoSQL AP",
    "question": "NoSQL equals AP?",
    "answer30s": "No. NoSQL is a data model label; Mongo/Cassandra/Dynamo are tunable per operation.",
    "answer2m": "Cassandra QUORUM is CP; Mongo w:majority is CP.",
    "followUps": [
      "CP NoSQL config?"
    ],
    "trick": "NoSQL = eventual.",
    "wrongAnswer": "All NoSQL AP."
  },
  {
    "id": "t4",
    "topic": "Mongo CP",
    "question": "MongoDB is always CP?",
    "answer30s": "No. CAP = writeConcern + readConcern + readPreference. w:1 + secondary reads can be AP.",
    "answer2m": "w:majority + readConcern majority is CP; w:1 nearest secondary is AP.",
    "followUps": [
      "Minority partition?"
    ],
    "trick": "Primary = CP.",
    "wrongAnswer": "Always CP."
  },
  {
    "id": "t5",
    "topic": "Cassandra AP",
    "question": "Cassandra is always AP?",
    "answer30s": "No. CL=ONE is AP; CL=QUORUM RF=3 is CP for that op.",
    "answer2m": "Minority cannot satisfy quorum — rejects/timeouts. ONE returns single replica possibly stale.",
    "followUps": [
      "W+R RF=3?"
    ],
    "trick": "Cassandra logo AP.",
    "wrongAnswer": "Always AP."
  },
  {
    "id": "t6",
    "topic": "Kafka AP",
    "question": "Kafka is AP?",
    "answer30s": "Not a single label. acks=all+minISR is CP on produce; acks=1 risks loss.",
    "answer2m": "ISR below minISR blocks producers. Unclean election trades C for A.",
    "followUps": [
      "CP Kafka moment?"
    ],
    "trick": "Log = AP.",
    "wrongAnswer": "Always AP."
  },
  {
    "id": "t7",
    "topic": "CAP vs ACID",
    "question": "CAP C equals ACID C?",
    "answer30s": "No. CAP C = linearizability; ACID C = invariants/constraints.",
    "answer2m": "SERIALIZABLE on lagging replica violates CAP-C while ACID holds locally.",
    "followUps": [
      "Example?"
    ],
    "trick": "Same C.",
    "wrongAnswer": "Identical."
  },
  {
    "id": "t8",
    "topic": "Eventual",
    "question": "Eventual = no consistency?",
    "answer30s": "Wrong. Replicas converge when writes stop — delayed, not absent.",
    "answer2m": "Anti-entropy and read repair restore agreement.",
    "followUps": [
      "Δ-consistency?"
    ],
    "trick": "Forever inconsistent.",
    "wrongAnswer": "No correctness."
  },
  {
    "id": "t9",
    "topic": "SLA A",
    "question": "CAP A = 99.99% uptime?",
    "answer30s": "No. CAP A = every non-failing node responds during partition, even if stale.",
    "answer2m": "CP minority returns errors; AP returns stale with 100% response rate.",
    "followUps": [
      "CP high uptime?"
    ],
    "trick": "SLA = CAP A.",
    "wrongAnswer": "Same thing."
  },
  {
    "id": "t10",
    "topic": "Partition",
    "question": "Partition = crash?",
    "answer30s": "No. Lost/delayed messages between live nodes — split-brain possible.",
    "answer2m": "All nodes healthy but disconnected is partition, not crash.",
    "followUps": [
      "Asymmetric?"
    ],
    "trick": "Partition = down.",
    "wrongAnswer": "Only on crash."
  },
  {
    "id": "t11",
    "topic": "Quorum",
    "question": "Quorum always linearizable?",
    "answer30s": "Not without W+R>RF overlap and correct paths; sloppy quorum breaks it.",
    "answer2m": "Read non-quorum replica violates linearizability.",
    "followUps": [
      "W=1 R=1?"
    ],
    "trick": "Quorum = strong.",
    "wrongAnswer": "Any quorum works."
  },
  {
    "id": "t12",
    "topic": "Replicas",
    "question": "More replicas always better?",
    "answer30s": "No. More lag surfaces, split-brain risk, minority still blocked with ALL/QUORUM.",
    "answer2m": "RF=5 ALL needs 5 nodes — minority of 2 cannot write.",
    "followUps": [
      "RF 3 vs 5?"
    ],
    "trick": "3x replicas 3x A.",
    "wrongAnswer": "Always helps."
  },
  {
    "id": "t13",
    "topic": "Retries",
    "question": "Retries always help availability?",
    "answer30s": "No. Non-idempotent retries duplicate; storms overload nodes.",
    "answer2m": "Circuit breaker fail-fast is CP protection.",
    "followUps": [
      "Payment POST?"
    ],
    "trick": "Retry forever.",
    "wrongAnswer": "Always retry."
  },
  {
    "id": "t14",
    "topic": "Exactly-once",
    "question": "Exactly-once is absolute?",
    "answer30s": "No. Achieved via idempotent consumers + dedup + outbox.",
    "answer2m": "Kafka EOS is scoped; cross-service needs saga/TCC.",
    "followUps": [
      "EOS scope?"
    ],
    "trick": "Broker magic.",
    "wrongAnswer": "Absolute guarantee."
  },
  {
    "id": "t15",
    "topic": "Async C",
    "question": "Async replication = strong C?",
    "answer30s": "No. Ack before replica persist → stale reads on lagging replica.",
    "answer2m": "Sync quorum before client ack for CAP-C.",
    "followUps": [
      "RPO?"
    ],
    "trick": "Async strong.",
    "wrongAnswer": "Linearizable async."
  },
  {
    "id": "t16",
    "topic": "Multi-AZ CA",
    "question": "Multi-AZ = CA no partition?",
    "answer30s": "False. AZ failure is partition. Multi-AZ is partition-tolerant.",
    "answer2m": "Sync cross-AZ = CP on write; async = AP failover RPO>0.",
    "followUps": [
      "Active-passive?"
    ],
    "trick": "AZ exempt.",
    "wrongAnswer": "Never partition."
  },
  {
    "id": "t17",
    "topic": "PACELC",
    "question": "PACELC replaces CAP?",
    "answer30s": "Use both: CAP for partition; PACELC for latency vs C when healthy.",
    "answer2m": "Dynamo/Cassandra need PACELC for normal path.",
    "followUps": [
      "Cassandra PACELC?"
    ],
    "trick": "Obsolete CAP.",
    "wrongAnswer": "Only CAP."
  },
  {
    "id": "t18",
    "topic": "BASE",
    "question": "BASE = no rules?",
    "answer30s": "BASE = Basically Available, Soft state, Eventual — convergence with app invariants.",
    "answer2m": "Compensations and strong ledger for critical paths.",
    "followUps": [
      "vs ACID?"
    ],
    "trick": "Anything goes.",
    "wrongAnswer": "No consistency."
  },
  {
    "id": "t19",
    "topic": "Global strong",
    "question": "One flag makes all data linearizable?",
    "answer30s": "No. Per-key/shard scope; cross-shard costs latency.",
    "answer2m": "Follower read without sync breaks linearizability.",
    "followUps": [
      "Sharded Mongo?"
    ],
    "trick": "Cluster flag.",
    "wrongAnswer": "Default global."
  },
  {
    "id": "t20",
    "topic": "Read replica",
    "question": "Replicas free read scaling without cost?",
    "answer30s": "Replicas add staleness; inventory/balance on replica violates invariants.",
    "answer2m": "Critical reads to leader/quorum; lag metrics mandatory.",
    "followUps": [
      "Inventory replica?"
    ],
    "trick": "Free scale.",
    "wrongAnswer": "Always fresh."
  },
  {
    "id": "t21",
    "topic": "2PC",
    "question": "2PC safe in partition?",
    "answer30s": "Coordinator failure after prepare blocks — CP availability hit.",
    "answer2m": "Prefer saga/outbox cross-service.",
    "followUps": [
      "XA microservices?"
    ],
    "trick": "2PC solves all.",
    "wrongAnswer": "Always available."
  },
  {
    "id": "t22",
    "topic": "Saga",
    "question": "Saga makes system CP?",
    "answer30s": "No. Saga is eventual with compensations — AP orchestration.",
    "answer2m": "Local steps CP; global not atomic.",
    "followUps": [
      "Choreography?"
    ],
    "trick": "Distributed ACID.",
    "wrongAnswer": "Global strong."
  },
  {
    "id": "t23",
    "topic": "Redis",
    "question": "Redis always CP?",
    "answer30s": "Varies: async replication split-brain; WAIT adds CP moment.",
    "answer2m": "Sentinel misconfig → dual masters.",
    "followUps": [
      "WAIT?"
    ],
    "trick": "In-memory CP.",
    "wrongAnswer": "Pick one forever."
  },
  {
    "id": "t24",
    "topic": "DynamoDB",
    "question": "DynamoDB AP only?",
    "answer30s": "Tunable: strong read per call; Global Tables AP multi-region.",
    "answer2m": "Strong read = RYOW not global linearizable.",
    "followUps": [
      "Global Tables?"
    ],
    "trick": "Only eventual.",
    "wrongAnswer": "No strong reads."
  },
  {
    "id": "t25",
    "topic": "ZK",
    "question": "ZK CP = no availability?",
    "answer30s": "Available on majority; minority rejects — not zero global availability.",
    "answer2m": "Sessions expire; ephemeral nodes failover.",
    "followUps": [
      "Minority ZK?"
    ],
    "trick": "CP = down.",
    "wrongAnswer": "Always down."
  },
  {
    "id": "t26",
    "topic": "etcd",
    "question": "etcd chooses A in partition?",
    "answer30s": "No. Raft CP — minority cannot commit.",
    "answer2m": "K8s etcd prevents split brain.",
    "followUps": [
      "Raft minority?"
    ],
    "trick": "Fails open.",
    "wrongAnswer": "Stale minority."
  },
  {
    "id": "t27",
    "topic": "CDN",
    "question": "CDN stale = AP failure?",
    "answer30s": "Intentional AP for latency; TTL/purge control staleness.",
    "answer2m": "CDN/DNS deliberately serve stale edge content — product choice not outage.",
    "followUps": [
      "DNS TTL and failover?"
    ],
    "trick": "AP = broken system.",
    "wrongAnswer": "CDN stale content is always a bug."
  },
  {
    "id": "t28",
    "topic": "LWW",
    "question": "LWW with wall clocks safe?",
    "answer30s": "Clock skew loses updates; use HLC/CRDT or leader order for money.",
    "answer2m": "NTP drift during partition picks wrong winner; use logical clocks or authoritative ordering.",
    "followUps": [
      "Vector clocks purpose?"
    ],
    "trick": "LWW is always fine.",
    "wrongAnswer": "Latest timestamp always wins correctly."
  },
  {
    "id": "t29",
    "topic": "Sticky",
    "question": "Sticky sessions fix consistency?",
    "answer30s": "Helps RYOW to app server, not DB replica staleness.",
    "answer2m": "Need primary read after write for CAP-C.",
    "followUps": [
      "RYOW vs linear?"
    ],
    "trick": "Sticky = strong.",
    "wrongAnswer": "Eliminates CAP."
  },
  {
    "id": "t30",
    "topic": "Cache",
    "question": "Cache-aside always fresh?",
    "answer30s": "TTL/eviction/partition → stale cache.",
    "answer2m": "Write-through or invalidate for inventory use leader/lock.",
    "followUps": [
      "Stampede?"
    ],
    "trick": "Cache = DB.",
    "wrongAnswer": "Always fresh."
  },
  {
    "id": "t31",
    "topic": "Idempotency",
    "question": "Idempotency only for AP?",
    "answer30s": "Helps both — safe retries on timeout.",
    "answer2m": "Not substitute for strong reads.",
    "followUps": [
      "Dedup table?"
    ],
    "trick": "AP only.",
    "wrongAnswer": "CP never needs."
  },
  {
    "id": "t32",
    "topic": "Fencing",
    "question": "Election alone stops split brain?",
    "answer30s": "Stale leader writes without fencing token/version.",
    "answer2m": "ZK epoch, conditional writes fence old leader.",
    "followUps": [
      "Example?"
    ],
    "trick": "Election enough.",
    "wrongAnswer": "Heartbeat enough."
  },
  {
    "id": "t33",
    "topic": "Gossip",
    "question": "Gossip always AP?",
    "answer30s": "Usually AP membership; data plane CL separate.",
    "answer2m": "Cassandra gossip is AP for ring; QUORUM ops are separate data-plane choice.",
    "followUps": [
      "SWIM?"
    ],
    "trick": "Gossip = no consistency ever.",
    "wrongAnswer": "All gossip is AP."
  },
  {
    "id": "t34",
    "topic": "CRDT",
    "question": "CRDTs solve CAP?",
    "answer30s": "Commutative merge for specific types — not bank balance.",
    "answer2m": "Counters/sets work; ledger needs authoritative CP store.",
    "followUps": [
      "PN-counter?"
    ],
    "trick": "CRDT solves CAP.",
    "wrongAnswer": "Use CRDT for bank balance."
  },
  {
    "id": "t35",
    "topic": "Spanner",
    "question": "Spanner violates CAP?",
    "answer30s": "CP with TrueTime+Paxos; minority unavailable.",
    "answer2m": "TrueTime bounds clock uncertainty; WAN partition still blocks minority — not CA globally.",
    "followUps": [
      "TrueTime role?"
    ],
    "trick": "Spanner proves CAP wrong.",
    "wrongAnswer": "Spanner is CA globally."
  },
  {
    "id": "t36",
    "topic": "Cockroach",
    "question": "Single region = CA?",
    "answer30s": "Still partition-tolerant Raft per range — CP default.",
    "answer2m": "Serializable isolation + Raft: minority partition cannot write.",
    "followUps": [
      "AZ loss?"
    ],
    "trick": "Single region = no CAP.",
    "wrongAnswer": "One region means CA."
  },
  {
    "id": "t37",
    "topic": "Heartbeat",
    "question": "Green heartbeat = no partition?",
    "answer30s": "Asymmetric partitions; slow detection.",
    "answer2m": "A reaches B but not B→A causes split decisions; use quorum failure detection.",
    "followUps": [
      "Asymmetric partition?"
    ],
    "trick": "Heartbeat green = healthy cluster.",
    "wrongAnswer": "Partitions are always symmetric."
  },
  {
    "id": "t38",
    "topic": "Client offline",
    "question": "Client offline = CAP partition?",
    "answer30s": "CAP is server replica partition; client offline is different model.",
    "answer2m": "Mobile offline is local consistency; CAP applies when server replicas cannot sync.",
    "followUps": [
      "Offline-first apps?"
    ],
    "trick": "User offline = CAP partition.",
    "wrongAnswer": "CAP covers client network loss."
  },
  {
    "id": "t39",
    "topic": "Monolith",
    "question": "Monolith avoids CAP?",
    "answer30s": "DB replicas still CAP on read path.",
    "answer2m": "Microservices multiply partition surfaces; monolith reduces boundaries not eliminates CAP.",
    "followUps": [
      "Replica monolith?"
    ],
    "trick": "Monolith = no distributed systems.",
    "wrongAnswer": "CAP only for microservices."
  },
  {
    "id": "t40",
    "topic": "Raft AP",
    "question": "Raft AP because leader?",
    "answer30s": "No. Consensus CP — majority commits, minority unavailable.",
    "answer2m": "Leader orders commits; minority cannot lead or commit during partition.",
    "followUps": [
      "Minority writes?"
    ],
    "trick": "Leader = availability trick.",
    "wrongAnswer": "Raft is AP."
  },
  {
    "id": "t41",
    "topic": "W+R",
    "question": "W=2 R=2 RF=3 latest read?",
    "answer30s": "Only with overlap and quorum members; write must complete first.",
    "answer2m": "W+R>RF overlap ensures reader hits node with latest committed write.",
    "followUps": [
      "W=1 R=3?"
    ],
    "trick": "Any W and R work.",
    "wrongAnswer": "W+R>RF is optional."
  },
  {
    "id": "t42",
    "topic": "Health",
    "question": "LB health = consistent?",
    "answer30s": "Healthy replica can lag; no split-brain prevention.",
    "answer2m": "Lag-aware readiness for CP paths.",
    "followUps": [
      "Lag routing?"
    ],
    "trick": "Healthy = fresh.",
    "wrongAnswer": "LB fixes stale."
  }
];

export const RAPID_QS: InterviewQ[] = [
  {
    "id": "r1",
    "topic": "Define C",
    "question": "What is Define C?",
    "answer30s": "Linearizability: latest write or error.",
    "answer2m": "Not ACID C.",
    "followUps": []
  },
  {
    "id": "r2",
    "topic": "Define A",
    "question": "What is Define A?",
    "answer30s": "Non-failing node returns non-error response.",
    "answer2m": "Not SLA uptime.",
    "followUps": []
  },
  {
    "id": "r3",
    "topic": "Define P",
    "question": "What is Define P?",
    "answer30s": "Operates despite message loss/delay between nodes.",
    "answer2m": "Assume P in cloud.",
    "followUps": []
  },
  {
    "id": "r4",
    "topic": "Brewer",
    "question": "What is Brewer?",
    "answer30s": "Eric Brewer PODC 2000.",
    "answer2m": "Gilbert/Lynch 2002 proof.",
    "followUps": []
  },
  {
    "id": "r5",
    "topic": "PACELC",
    "question": "What is PACELC?",
    "answer30s": "Partition→C vs A; Else→Latency vs C.",
    "answer2m": "Normal path trade-off.",
    "followUps": []
  },
  {
    "id": "r6",
    "topic": "CA",
    "question": "What is CA?",
    "answer30s": "Single-node no distributed partition.",
    "answer2m": "Misleading distributed.",
    "followUps": []
  },
  {
    "id": "r7",
    "topic": "CP ex",
    "question": "What is CP ex?",
    "answer30s": "Minority rejects — ZK, w:majority Mongo.",
    "answer2m": "Quorum systems.",
    "followUps": []
  },
  {
    "id": "r8",
    "topic": "AP ex",
    "question": "What is AP ex?",
    "answer30s": "Stale response — DNS, Cassandra ONE.",
    "answer2m": "Partition continues.",
    "followUps": []
  },
  {
    "id": "r9",
    "topic": "Linear vs serial",
    "question": "What is Linear vs serial?",
    "answer30s": "Linear: real-time; serial: txn order.",
    "answer2m": "Different models.",
    "followUps": []
  },
  {
    "id": "r10",
    "topic": "Eventual",
    "question": "What is Eventual?",
    "answer30s": "Converge when writes stop.",
    "answer2m": "Not no consistency.",
    "followUps": []
  },
  {
    "id": "r11",
    "topic": "RYOW",
    "question": "What is RYOW?",
    "answer30s": "Client sees own writes in session.",
    "answer2m": "Weaker than global.",
    "followUps": []
  },
  {
    "id": "r12",
    "topic": "Quorum",
    "question": "What is Quorum?",
    "answer30s": "W+R>RF overlapping majorities.",
    "answer2m": "Dynamo tuning.",
    "followUps": []
  },
  {
    "id": "r13",
    "topic": "NWR",
    "question": "What is NWR?",
    "answer30s": "N replicas; W write acks; R read replicas.",
    "answer2m": "Cassandra CL.",
    "followUps": []
  },
  {
    "id": "r14",
    "topic": "RF",
    "question": "What is RF?",
    "answer30s": "Replica count per partition.",
    "answer2m": "Affects quorum.",
    "followUps": []
  },
  {
    "id": "r15",
    "topic": "ONE",
    "question": "What is ONE?",
    "answer30s": "Single replica response — stale ok.",
    "answer2m": "AP lean.",
    "followUps": []
  },
  {
    "id": "r16",
    "topic": "QUORUM",
    "question": "What is QUORUM?",
    "answer30s": "Majority must respond.",
    "answer2m": "CP lean.",
    "followUps": []
  },
  {
    "id": "r17",
    "topic": "Mongo w maj",
    "question": "What is Mongo w maj?",
    "answer30s": "Majority replication before ack.",
    "answer2m": "CP partition.",
    "followUps": []
  },
  {
    "id": "r18",
    "topic": "Mongo rc maj",
    "question": "What is Mongo rc maj?",
    "answer30s": "Read majority-committed data.",
    "answer2m": "With w:majority.",
    "followUps": []
  },
  {
    "id": "r19",
    "topic": "acks all",
    "question": "What is acks all?",
    "answer30s": "Wait ISR replicas.",
    "answer2m": "CP with minISR.",
    "followUps": []
  },
  {
    "id": "r20",
    "topic": "minISR",
    "question": "What is minISR?",
    "answer30s": "Min in-sync replicas for acks=all.",
    "answer2m": "Durability guard.",
    "followUps": []
  },
  {
    "id": "r21",
    "topic": "ISR",
    "question": "What is ISR?",
    "answer30s": "Caught-up replicas.",
    "answer2m": "Shrink blocks produce.",
    "followUps": []
  },
  {
    "id": "r22",
    "topic": "unclean",
    "question": "What is unclean?",
    "answer30s": "Out-of-sync leader election — data loss.",
    "answer2m": "Finance: false.",
    "followUps": []
  },
  {
    "id": "r23",
    "topic": "split brain",
    "question": "What is split brain?",
    "answer30s": "Dual primaries accept writes.",
    "answer2m": "Fencing prevents.",
    "followUps": []
  },
  {
    "id": "r24",
    "topic": "Raft",
    "question": "What is Raft?",
    "answer30s": "Majority commit; minority blocked.",
    "answer2m": "CP consensus.",
    "followUps": []
  },
  {
    "id": "r25",
    "topic": "Paxos",
    "question": "What is Paxos?",
    "answer30s": "CP ordering under partition.",
    "answer2m": "ZK/etcd base.",
    "followUps": []
  },
  {
    "id": "r26",
    "topic": "2PC block",
    "question": "What is 2PC block?",
    "answer30s": "Coordinator crash blocks participants.",
    "answer2m": "Use saga.",
    "followUps": []
  },
  {
    "id": "r27",
    "topic": "Saga",
    "question": "What is Saga?",
    "answer30s": "Local txs + compensate.",
    "answer2m": "Eventual global.",
    "followUps": []
  },
  {
    "id": "r28",
    "topic": "Outbox",
    "question": "What is Outbox?",
    "answer30s": "Same DB tx + event row.",
    "answer2m": "Reliable publish.",
    "followUps": []
  },
  {
    "id": "r29",
    "topic": "Idempotency",
    "question": "What is Idempotency?",
    "answer30s": "Safe duplicate requests.",
    "answer2m": "AP retries.",
    "followUps": []
  },
  {
    "id": "r30",
    "topic": "Fencing",
    "question": "What is Fencing?",
    "answer30s": "Invalidate stale leader writes.",
    "answer2m": "Split brain.",
    "followUps": []
  },
  {
    "id": "r31",
    "topic": "RPO",
    "question": "What is RPO?",
    "answer30s": "Max data loss window.",
    "answer2m": "Async increases.",
    "followUps": []
  },
  {
    "id": "r32",
    "topic": "RTO",
    "question": "What is RTO?",
    "answer30s": "Max downtime to restore.",
    "answer2m": "Failover planning.",
    "followUps": []
  },
  {
    "id": "r33",
    "topic": "Act-pass",
    "question": "What is Act-pass?",
    "answer30s": "One write region DR.",
    "answer2m": "RPO>0 async.",
    "followUps": []
  },
  {
    "id": "r34",
    "topic": "Act-act",
    "question": "What is Act-act?",
    "answer30s": "Both regions write — merge.",
    "answer2m": "AP multi-master.",
    "followUps": []
  },
  {
    "id": "r35",
    "topic": "Hinted",
    "question": "What is Hinted?",
    "answer30s": "Buffer write for down replica.",
    "answer2m": "Cassandra AP.",
    "followUps": []
  },
  {
    "id": "r36",
    "topic": "Read repair",
    "question": "What is Read repair?",
    "answer30s": "Fix on read mismatch.",
    "answer2m": "Convergence.",
    "followUps": []
  },
  {
    "id": "r37",
    "topic": "Anti-entropy",
    "question": "What is Anti-entropy?",
    "answer30s": "Background sync.",
    "answer2m": "Merkle repair.",
    "followUps": []
  },
  {
    "id": "r38",
    "topic": "LWW",
    "question": "What is LWW?",
    "answer30s": "Clock skew loses updates.",
    "answer2m": "HLC better.",
    "followUps": []
  },
  {
    "id": "r39",
    "topic": "Vector clock",
    "question": "What is Vector clock?",
    "answer30s": "Causal conflict detect.",
    "answer2m": "AP merge.",
    "followUps": []
  },
  {
    "id": "r40",
    "topic": "CRDT",
    "question": "What is CRDT?",
    "answer30s": "Commutative merge types.",
    "answer2m": "Not all invariants.",
    "followUps": []
  },
  {
    "id": "r41",
    "topic": "Jepsen",
    "question": "What is Jepsen?",
    "answer30s": "Partition correctness tests.",
    "answer2m": "Linearizability.",
    "followUps": []
  },
  {
    "id": "r42",
    "topic": "SLA",
    "question": "What is SLA?",
    "answer30s": "Business uptime vs CAP A formal.",
    "answer2m": "Orthogonal.",
    "followUps": []
  },
  {
    "id": "r43",
    "topic": "RPC timeout",
    "question": "What is RPC timeout?",
    "answer30s": "Forces C fail vs A retry.",
    "answer2m": "CAP boundary.",
    "followUps": []
  },
  {
    "id": "r44",
    "topic": "Discovery",
    "question": "What is Discovery?",
    "answer30s": "Stale registry instances.",
    "answer2m": "AP membership.",
    "followUps": []
  },
  {
    "id": "r45",
    "topic": "CB",
    "question": "What is CB?",
    "answer30s": "Fail fast reduce storm.",
    "answer2m": "CP caller protect.",
    "followUps": []
  },
  {
    "id": "r46",
    "topic": "Dynamo",
    "question": "What is Dynamo?",
    "answer30s": "Quorum vector clocks.",
    "answer2m": "Tunable CAP.",
    "followUps": []
  },
  {
    "id": "r47",
    "topic": "GFS",
    "question": "What is GFS?",
    "answer30s": "Single master CP chunks.",
    "answer2m": "Google lineage.",
    "followUps": []
  },
  {
    "id": "r48",
    "topic": "Bigtable",
    "question": "What is Bigtable?",
    "answer30s": "Per-row tablet server.",
    "answer2m": "Not cross-row.",
    "followUps": []
  },
  {
    "id": "r49",
    "topic": "Spanner",
    "question": "What is Spanner?",
    "answer30s": "TrueTime external consistency.",
    "answer2m": "WAN CP.",
    "followUps": []
  },
  {
    "id": "r50",
    "topic": "Percolator",
    "question": "What is Percolator?",
    "answer30s": "Tx on Bigtable.",
    "answer2m": "2PC style.",
    "followUps": []
  },
  {
    "id": "r51",
    "topic": "Redis WAIT",
    "question": "What is Redis WAIT?",
    "answer30s": "Block for replica ack.",
    "answer2m": "CP moment.",
    "followUps": []
  },
  {
    "id": "r52",
    "topic": "Redlock",
    "question": "What is Redlock?",
    "answer30s": "Lock safety debate.",
    "answer2m": "Prefer ZK+fencing.",
    "followUps": []
  },
  {
    "id": "r53",
    "topic": "ZK session",
    "question": "What is ZK session?",
    "answer30s": "Ephemeral on expire.",
    "answer2m": "Failover.",
    "followUps": []
  },
  {
    "id": "r54",
    "topic": "etcd K8s",
    "question": "What is etcd K8s?",
    "answer30s": "CP cluster state.",
    "answer2m": "No split brain.",
    "followUps": []
  },
  {
    "id": "r55",
    "topic": "Causal",
    "question": "What is Causal?",
    "answer30s": "Preserve cause-effect.",
    "answer2m": "Mid ladder.",
    "followUps": []
  },
  {
    "id": "r56",
    "topic": "Monotonic read",
    "question": "What is Monotonic read?",
    "answer30s": "No backward time session.",
    "answer2m": "Session guarantee.",
    "followUps": []
  },
  {
    "id": "r57",
    "topic": "Delta C",
    "question": "What is Delta C?",
    "answer30s": "Bounded staleness Δ.",
    "answer2m": "Practical eventual.",
    "followUps": []
  },
  {
    "id": "r58",
    "topic": "Lease",
    "question": "What is Lease?",
    "answer30s": "Time-bound leader authority.",
    "answer2m": "Failover timing.",
    "followUps": []
  },
  {
    "id": "r59",
    "topic": "R without W",
    "question": "What is R without W?",
    "answer30s": "Stale if write not overlapping.",
    "answer2m": "Need both quorums.",
    "followUps": []
  },
  {
    "id": "r60",
    "topic": "Async primary",
    "question": "What is Async primary?",
    "answer30s": "Primary ack before replica.",
    "answer2m": "Stale replica read.",
    "followUps": []
  },
  {
    "id": "r61",
    "topic": "Sync rep",
    "question": "What is Sync rep?",
    "answer30s": "Wait replica — CP latency.",
    "answer2m": "Postgres sync_commit.",
    "followUps": []
  },
  {
    "id": "r62",
    "topic": "Galera",
    "question": "What is Galera?",
    "answer30s": "Sync multi-primary MySQL.",
    "answer2m": "Certification CP.",
    "followUps": []
  },
  {
    "id": "r63",
    "topic": "Citus",
    "question": "What is Citus?",
    "answer30s": "Shard-level consistency.",
    "answer2m": "Limited dist tx.",
    "followUps": []
  },
  {
    "id": "r64",
    "topic": "Vitess",
    "question": "What is Vitess?",
    "answer30s": "MySQL sharding.",
    "answer2m": "Per-shard primary.",
    "followUps": []
  },
  {
    "id": "r65",
    "topic": "XA",
    "question": "What is XA?",
    "answer30s": "2PC across RM — blocking.",
    "answer2m": "Avoid cross-service.",
    "followUps": []
  },
  {
    "id": "r66",
    "topic": "TCC",
    "question": "What is TCC?",
    "answer30s": "Try-Confirm-Cancel.",
    "answer2m": "Reservation style.",
    "followUps": []
  },
  {
    "id": "r67",
    "topic": "OCC",
    "question": "What is OCC?",
    "answer30s": "Version check write — 412.",
    "answer2m": "CP reject conflict.",
    "followUps": []
  },
  {
    "id": "r68",
    "topic": "Pess lock",
    "question": "What is Pess lock?",
    "answer30s": "Row lock blocks — CP.",
    "answer2m": "Partition isolation.",
    "followUps": []
  },
  {
    "id": "r69",
    "topic": "Merkle",
    "question": "What is Merkle?",
    "answer30s": "Divergence detection.",
    "answer2m": "Repair efficiency.",
    "followUps": []
  },
  {
    "id": "r70",
    "topic": "Gossip",
    "question": "What is Gossip?",
    "answer30s": "Membership dissemination.",
    "answer2m": "Usually AP.",
    "followUps": []
  },
  {
    "id": "r71",
    "topic": "SWIM",
    "question": "What is SWIM?",
    "answer30s": "Failure detector protocol.",
    "answer2m": "Consul serf.",
    "followUps": []
  },
  {
    "id": "r72",
    "topic": "Phi",
    "question": "What is Phi?",
    "answer30s": "Adaptive suspicion.",
    "answer2m": "Cassandra FD.",
    "followUps": []
  },
  {
    "id": "r73",
    "topic": "Bulkhead",
    "question": "What is Bulkhead?",
    "answer30s": "Pool isolation.",
    "answer2m": "Blast radius.",
    "followUps": []
  },
  {
    "id": "r74",
    "topic": "LOCAL_QUORUM",
    "question": "What is LOCAL_QUORUM?",
    "answer30s": "DC-local quorum.",
    "answer2m": "Multi-DC compromise.",
    "followUps": []
  },
  {
    "id": "r75",
    "topic": "Global Tables",
    "question": "What is Global Tables?",
    "answer30s": "Multi-region async DDB.",
    "answer2m": "AP cross-region.",
    "followUps": []
  },
  {
    "id": "r76",
    "topic": "DDB strong",
    "question": "What is DDB strong?",
    "answer30s": "Per-item strong read.",
    "answer2m": "2x cost CP moment.",
    "followUps": []
  },
  {
    "id": "r77",
    "topic": "DNS TTL",
    "question": "What is DNS TTL?",
    "answer30s": "Failover staleness budget.",
    "answer2m": "RTO planning.",
    "followUps": []
  },
  {
    "id": "r78",
    "topic": "CDN purge",
    "question": "What is CDN purge?",
    "answer30s": "Edge stale until purge.",
    "answer2m": "Intentional AP.",
    "followUps": []
  },
  {
    "id": "r79",
    "topic": "Kafka EOS",
    "question": "What is Kafka EOS?",
    "answer30s": "Idempotent + transactional scope.",
    "answer2m": "Not end-to-end magic.",
    "followUps": []
  },
  {
    "id": "r80",
    "topic": "Consumer lag",
    "question": "What is Consumer lag?",
    "answer30s": "Processing delay metric.",
    "answer2m": "Not partition itself.",
    "followUps": []
  }
];

export const SCENARIO_QS: ScenarioQ[] = [
  {
    "id": "sc1",
    "title": "Bank balance transfer",
    "requirements": "ACID transfers; no double-spend; 99.9% availability",
    "consistency": "Linearizable reads/writes on ledger — SERIALIZABLE or quorum",
    "availability": "Degrade reads on replica only for statements; block transfers on partition minority",
    "partition": "Minority AZ cannot commit transfer — return error not stale balance",
    "architecture": "Postgres primary + sync standby same region; cross-region async DR; transfer API idempotent",
    "tradeoff": "Sacrifice AP on write path for correctness; async DR accepts RPO>0",
    "failure": "Split brain dual write on async DR without fencing",
    "recovery": "Failover with leader epoch; reconcile in-doubt with ops; block until quorum",
    "interviewAnswer": "CP on ledger: w:majority or single leader; never read balance from lagging replica for transfer decision"
  },
  {
    "id": "sc2",
    "title": "E-commerce inventory",
    "requirements": "Prevent oversell; tolerate catalog staleness",
    "consistency": "Strong decrement on stock row; eventual product descriptions",
    "availability": "Show catalog during partition; block checkout if cannot verify stock",
    "partition": "Isolated warehouse partition: reject reservation or queue with expiry",
    "architecture": "Inventory service CP on Postgres row lock; catalog CDN AP; saga for order",
    "tradeoff": "CP inventory + AP catalog hybrid",
    "failure": "Oversell if cache-aside inventory without lock",
    "recovery": "Reconcile reservations; cancel oversold orders; alert",
    "interviewAnswer": "Serializable/row-lock inventory; never trust replica count for purchase"
  },
  {
    "id": "sc3",
    "title": "Social news feed",
    "requirements": "Billions reads; stale OK minutes",
    "consistency": "Eventual timeline; RYOW for own posts",
    "availability": "Always serve feed from nearest replica",
    "partition": "Both regions serve stale feeds during partition",
    "architecture": "Cassandra LOCAL_ONE writes; fan-out on write; CDN AP",
    "tradeoff": "AP feed; CP only for abuse/rate-limit counters if needed",
    "failure": "Viral post lag visible",
    "recovery": "Read repair; backfill; rank recompute",
    "interviewAnswer": "AP with session RYOW for author; monotonic reads optional"
  },
  {
    "id": "sc4",
    "title": "Distributed lock service",
    "requirements": "Exclusive resource; no dual holder",
    "consistency": "Linearizable lock acquire/release",
    "availability": "Unavailable lock API better than two holders",
    "partition": "Partition: minority cannot grant lock",
    "architecture": "etcd/ZooKeeper ephemeral sequential; fencing token returned",
    "tradeoff": "CP lock service; AP app must use fencing",
    "failure": "Split brain without fencing → dual writers",
    "recovery": "Session expire; new leader; fence old tokens",
    "interviewAnswer": "ZK/etcd CP; clients pass fencing token to storage"
  },
  {
    "id": "sc5",
    "title": "Payment authorization",
    "requirements": "No double charge; PCI; low latency",
    "consistency": "Strong idempotency + ledger CP",
    "availability": "Retry-friendly with idempotency key",
    "partition": "Partition: fail auth if cannot reach ledger quorum",
    "architecture": "Payment gateway + ledger DB w:majority; outbox to Kafka",
    "tradeoff": "CP money path; AP notification async",
    "failure": "Duplicate charge on retry without idempotency",
    "recovery": "Dedup table; reconcile settlement batch",
    "interviewAnswer": "Idempotency-Key + CP ledger; saga for cross-service settlement"
  },
  {
    "id": "sc6",
    "title": "Global user profile DB",
    "requirements": "Multi-region reads; edits propagate",
    "consistency": "RYOW after edit; eventual cross-region",
    "availability": "Read from local replica always",
    "partition": "Active-active both accept edits — merge conflicts",
    "architecture": "DynamoDB Global Tables or Cockroach multi-region",
    "tradeoff": "AP across regions; conflict merge LWW/HLC",
    "failure": "Concurrent edits lost with naive LWW",
    "recovery": "CRDT or user-merge prompt; anti-entropy",
    "interviewAnswer": "Session token for RYOW; strong only if business requires global uniqueness"
  },
  {
    "id": "sc7",
    "title": "Ticket booking (SeatGeek)",
    "requirements": "No double booking same seat",
    "consistency": "Linearizable seat hold or DB unique constraint",
    "availability": "Queue users if lock service slow; not oversell",
    "partition": "Partition minority cannot confirm seat",
    "architecture": "Postgres advisory lock per seat map; hold TTL",
    "tradeoff": "CP seat map; AP browse seating chart images",
    "failure": "Two holders if AP lock without fencing",
    "recovery": "Expire holds; reconcile double booking refund",
    "interviewAnswer": "Unique constraint + CP lock; browse AP"
  },
  {
    "id": "sc8",
    "title": "Ride matching",
    "requirements": "Match driver/rider; stale location OK briefly",
    "consistency": "Eventual driver location; strong match commit",
    "availability": "Always accept location updates",
    "partition": "Partition: local matching degraded; no global optimal",
    "architecture": "Redis geo AP + match service CP commit in DB",
    "tradeoff": "AP telemetry; CP assignment transaction",
    "failure": "Same rider two drivers if match AP",
    "recovery": "Reassign; compensate cancelled ride",
    "interviewAnswer": "Location AP; match CP with idempotent accept"
  },
  {
    "id": "sc9",
    "title": "Shopping cart",
    "requirements": "Cart always writable; checkout strict",
    "consistency": "RYOW cart; CP inventory at checkout",
    "availability": "Cart never 503 for partition",
    "partition": "Merge carts on login from regions",
    "architecture": "Redis session cart AP; checkout hits inventory CP",
    "tradeoff": "AP cart AP checkout CP boundary",
    "failure": "Lost cart items on async merge",
    "recovery": "Version vector merge; user confirm",
    "interviewAnswer": "Separate AP cart from CP checkout"
  },
  {
    "id": "sc10",
    "title": "Push notifications",
    "requirements": "Deliver eventually; no duplicate critical alerts",
    "consistency": "At-least-once with dedup id",
    "availability": "Fire-and-forget AP queue",
    "partition": "Both sides queue during partition",
    "architecture": "Kafka + notification worker; dedup by eventId",
    "tradeoff": "AP delivery; CP only for legal audit log",
    "failure": "Duplicate SMS without dedup",
    "recovery": "Idempotent consumer; rate limit",
    "interviewAnswer": "AP queue + idempotency; CP audit trail separate"
  },
  {
    "id": "sc11",
    "title": "Rate limiter global",
    "requirements": "Enforce limit across regions",
    "consistency": "Strong counter or approximate?",
    "availability": "AP approximate OK for abuse; CP for billing quota",
    "partition": "Partition: local token bucket diverges",
    "architecture": "Redis Cluster CP slots or CRDT counter AP",
    "tradeoff": "Choose per API sensitivity",
    "failure": "Over-limit during partition merge",
    "recovery": "Sync counters; HLL merge",
    "interviewAnswer": "Billing CP; soft limit AP with CRDT"
  },
  {
    "id": "sc12",
    "title": "Config/feature flags",
    "requirements": "Fast propagation; rare strong need",
    "consistency": "Eventual flag read; strong kill-switch",
    "availability": "Always return flag value",
    "partition": "Stale flag during partition may wrong rollout",
    "architecture": "CDN + etcd watch for kill-switch CP",
    "tradeoff": "AP flags; CP emergency off",
    "failure": "Bad rollout from stale flag",
    "recovery": "Lower TTL; CP override path",
    "interviewAnswer": "Kill-switch on ZK; normal flags AP"
  },
  {
    "id": "sc13",
    "title": "Search index",
    "requirements": "Full-text search stale OK",
    "consistency": "Eventual index after write",
    "availability": "Search always returns results",
    "partition": "Partition: index diverges per region",
    "architecture": "CDC to Elasticsearch; async indexing",
    "tradeoff": "AP search; CP source DB",
    "failure": "Search missing new docs",
    "recovery": "Reindex; alias swap",
    "interviewAnswer": "Source DB CP; index AP lag bounded SLA"
  },
  {
    "id": "sc14",
    "title": "Analytics dashboard",
    "requirements": "Metrics 5min stale OK",
    "consistency": "Eventual aggregates",
    "availability": "Always render dashboard",
    "partition": "Each region aggregates locally during partition",
    "architecture": "Kafka → Flink → ClickHouse AP reads",
    "tradeoff": "AP analytics; CP billing source events",
    "failure": "Double-count events on retry",
    "recovery": "Idempotent aggregation keys",
    "interviewAnswer": "AP warehouse; CP only for revenue numbers source"
  },
  {
    "id": "sc15",
    "title": "DNS routing",
    "requirements": "Route to healthy region",
    "consistency": "Eventual DNS AP by design",
    "availability": "Always resolve hostname",
    "partition": "Stale DNS to dead region during failover",
    "architecture": "Route53 health checks; low TTL critical",
    "tradeoff": "AP DNS; accept staleness budget in RTO",
    "failure": "Traffic to failed DC",
    "recovery": "Drain TTL; weighted routing",
    "interviewAnswer": "Plan RTO with TTL; not CP DNS"
  },
  {
    "id": "sc16",
    "title": "Chat messaging",
    "requirements": "Order per conversation; deliver fast",
    "consistency": "Causal/per-conversation order",
    "availability": "Deliver from local edge",
    "partition": "Merge message streams on heal",
    "architecture": "Kafka partition per chat; CRDT read state AP optional",
    "tradeoff": "AP delivery; CP session auth",
    "failure": "Duplicate/out-of-order messages",
    "recovery": "Vector clock ordering; dedup",
    "interviewAnswer": "Per-partition ordering CP; cross-room AP"
  },
  {
    "id": "sc17",
    "title": "Video view counter",
    "requirements": "High write rate; approximate OK",
    "consistency": "CRDT counter or sharded atomic",
    "availability": "Always accept view",
    "partition": "Counters diverge during partition",
    "architecture": "Redis INCR AP or Cassandra counter CP tune",
    "tradeoff": "AP approximate vs CP exact trade",
    "failure": "Undercount vs overcount policy",
    "recovery": "Merge CRDT; reconcile audit",
    "interviewAnswer": "Choose business: viral AP approx vs billing CP"
  },
  {
    "id": "sc18",
    "title": "Healthcare appointment",
    "requirements": "No double booking slot",
    "consistency": "Serializable slot booking",
    "availability": "Show calendar stale OK",
    "partition": "Minority cannot book",
    "architecture": "DB unique (doctor,slot) + CP tx",
    "tradeoff": "CP booking; AP calendar UI",
    "failure": "Double appointment without constraint",
    "recovery": "Cancel duplicate; notify patients",
    "interviewAnswer": "DB constraint + CP; UI AP"
  },
  {
    "id": "sc19",
    "title": "IoT device shadow",
    "requirements": "Device state sync",
    "consistency": "Eventual shadow; desired vs reported",
    "availability": "Device always gets shadow",
    "partition": "Partition: cloud/device diverge",
    "architecture": "AWS IoT shadow AP merge",
    "tradeoff": "AP with version field conflict",
    "failure": "Lost commands",
    "recovery": "Version merge; retry command",
    "interviewAnswer": "Versioned shadow; CP command only safety-critical"
  },
  {
    "id": "sc20",
    "title": "Leaderboard gaming",
    "requirements": "Scores fresh enough; cheat prevent",
    "consistency": "Strong write for score submit; eventual read",
    "availability": "Show leaderboard always",
    "partition": "Shard leaderboard AP during partition",
    "architecture": "Redis sorted set AP or CP single shard",
    "tradeoff": "AP display; CP anti-cheat validation",
    "failure": "Inflated scores on client trust",
    "recovery": "Server-side validation; reconcile",
    "interviewAnswer": "Server authoritative CP write; board AP"
  },
  {
    "id": "sc21",
    "title": "Email inbox",
    "requirements": "Mailbox consistent per user",
    "consistency": "Per-user ordering; eventual cross-device",
    "availability": "Always accept send",
    "partition": "Multi-device diverge during partition",
    "architecture": "IMAP AP sync; CP messageId dedup",
    "tradeoff": "AP sync; CP dedup",
    "failure": "Duplicate emails",
    "recovery": "Message-id dedup",
    "interviewAnswer": "CP dedup key; AP sync body"
  },
  {
    "id": "sc22",
    "title": "Stock trading retail",
    "requirements": "Order placement correctness",
    "consistency": "Linearizable order matching engine",
    "availability": "Market data stale OK milliseconds",
    "partition": "Exchange partition halts trading CP",
    "architecture": "Matching engine CP; quotes AP feed",
    "tradeoff": "CP trades AP quotes",
    "failure": "Erroneous trades",
    "recovery": "Halt; bust trades protocol",
    "interviewAnswer": "Never AP the matching engine"
  },
  {
    "id": "sc23",
    "title": "Hotel reservation",
    "requirements": "No overbooking room-night",
    "consistency": "CP reservation row",
    "availability": "Search AP",
    "partition": "Region partition blocks confirm",
    "architecture": "Central reservation DB CP",
    "tradeoff": "CP inventory AP search",
    "failure": "Overbook on AP confirm",
    "recovery": "Waitlist; upgrade compensate",
    "interviewAnswer": "CP central inventory"
  },
  {
    "id": "sc24",
    "title": "Coupon redemption",
    "requirements": "One-time use code",
    "consistency": "Linearizable redeem flag",
    "availability": "Show coupon valid AP marketing",
    "partition": "Partition: reject redeem if no quorum",
    "architecture": "DB unique redemption CP",
    "tradeoff": "CP redeem AP display",
    "failure": "Double redeem AP",
    "recovery": "Reconcile fraud; revoke",
    "interviewAnswer": "CP compare-and-set redeem"
  },
  {
    "id": "sc25",
    "title": "File upload metadata",
    "requirements": "Metadata after blob",
    "consistency": "CP metadata; blob AP CDN",
    "availability": "Upload always accepted",
    "partition": "Metadata lag during partition",
    "architecture": "S3 AP + Dynamo metadata strong conditional",
    "tradeoff": "AP blob CP pointer",
    "failure": "Orphan blobs",
    "recovery": "GC orphan; conditional put",
    "interviewAnswer": "Conditional write metadata after blob"
  },
  {
    "id": "sc26",
    "title": "Session auth token",
    "requirements": "Valid revoke immediately",
    "consistency": "CP token store or short JWT",
    "availability": "Auth always responds",
    "partition": "Stale revoke during partition risk",
    "architecture": "Redis CP primary or JWT short TTL AP",
    "tradeoff": "Short TTL AP vs CP revoke store",
    "failure": "Revoked token works until TTL",
    "recovery": "Token blacklist CP; force re-login",
    "interviewAnswer": "Sensitive: CP session store"
  },
  {
    "id": "sc27",
    "title": "Geo-fencing compliance",
    "requirements": "Data residency",
    "consistency": "CP routing decision",
    "availability": "Serve static AP",
    "partition": "Wrong region serve during partition illegal",
    "architecture": "Route by geo DNS + CP policy service",
    "tradeoff": "CP compliance over AP",
    "failure": "Data leaves region",
    "recovery": "Audit logs; block endpoint",
    "interviewAnswer": "CP policy check before store"
  },
  {
    "id": "sc28",
    "title": "Warehouse pick list",
    "requirements": "Assign picker to aisle",
    "consistency": "CP assign once",
    "availability": "Show list AP cached",
    "partition": "Duplicate assign without lock",
    "architecture": "Row lock assignee CP",
    "tradeoff": "CP assign AP list",
    "failure": "Two pickers same aisle",
    "recovery": "Reassign pick",
    "interviewAnswer": "CP assignment service"
  },
  {
    "id": "sc29",
    "title": "Subscription billing",
    "requirements": "Charge once per period",
    "consistency": "CP billing ledger",
    "availability": "Portal AP",
    "partition": "Double bill on retry",
    "architecture": "Idempotent invoice CP + outbox",
    "tradeoff": "CP charge AP portal",
    "failure": "Duplicate invoice",
    "recovery": "Idempotency + reconcile",
    "interviewAnswer": "CP ledger idempotent"
  },
  {
    "id": "sc30",
    "title": "Comment thread moderation",
    "requirements": "Toxic content removed fast",
    "consistency": "CP ban list propagation",
    "availability": "Read comments AP",
    "partition": "Stale toxic comment visible briefly",
    "architecture": "CP ban ZK + AP comment CDN",
    "tradeoff": "Speed vs safety",
    "failure": "Harmful content visible",
    "recovery": "Purge CDN; lower TTL",
    "interviewAnswer": "CP block list; AP comments"
  },
  {
    "id": "sc31",
    "title": "Multi-tenant SaaS quota",
    "requirements": "Per-tenant API limit",
    "consistency": "CP quota counter or shard",
    "availability": "Always accept API if under soft limit",
    "partition": "Per-region quota diverge",
    "architecture": "Central Redis CP or CRDT AP",
    "tradeoff": "Tenant tier defines strictness",
    "failure": "Quota burst cross region",
    "recovery": "Merge usage; bill true-up",
    "interviewAnswer": "Enterprise CP quota; free tier AP approx"
  },
  {
    "id": "sc32",
    "title": "Blockchain wallet balance",
    "requirements": "Account nonce sequential",
    "consistency": "Linearizable nonce CP",
    "availability": "Read balance AP node",
    "partition": "Fork = partition; longest chain",
    "architecture": "CP consensus chain",
    "tradeoff": "CP chain AP light client",
    "failure": "Double spend fork",
    "recovery": "Reorg handling",
    "interviewAnswer": "Full node CP; SPV AP"
  }
];

export const BEHAVIOR_PREDICT: BehaviorPredict[] = [
  {
    "id": "b1",
    "setup": "Cassandra RF=3, CL=QUORUM, 1 node isolated in minority partition",
    "expected": "Write/read timeout or UnavailableException on minority",
    "why": "QUORUM needs majority 2 of 3; minority has 1",
    "tradeoff": "CP rejection on minority"
  },
  {
    "id": "b2",
    "setup": "Cassandra RF=3, CL=ONE, partition splits 2|1",
    "expected": "Both sides accept reads/writes on local replica",
    "why": "ONE needs only one replica — AP stale possible",
    "tradeoff": "Availability over consistency"
  },
  {
    "id": "b3",
    "setup": "Mongo w:majority, minority partition cannot reach primary",
    "expected": "Writes fail; reads may fail election",
    "why": "Majority required for commit and primary",
    "tradeoff": "CP during split"
  },
  {
    "id": "b4",
    "setup": "Mongo w:1, read from secondary nearest",
    "expected": "Write ack from primary only; read may be stale",
    "why": "Async replication lag",
    "tradeoff": "AP read path"
  },
  {
    "id": "b5",
    "setup": "Kafka acks=all, minISR=2, ISR shrinks to 1",
    "expected": "Producer NotEnoughReplicasException",
    "why": "Below minISR — CP block",
    "tradeoff": "Durability over availability"
  },
  {
    "id": "b6",
    "setup": "Kafka acks=1, leader ack only",
    "expected": "Produce succeeds; replica may not have message",
    "why": "Fast AP-leaning ack",
    "tradeoff": "Data loss if leader dies"
  },
  {
    "id": "b7",
    "setup": "ZK 5 nodes, partition 2|3",
    "expected": "Majority side serves; minority rejects",
    "why": "Quorum 3 of 5",
    "tradeoff": "Classic CP"
  },
  {
    "id": "b8",
    "setup": "etcd Raft minority partition",
    "expected": "No new commits on minority",
    "why": "Leader on majority only",
    "tradeoff": "K8s changes halt if lose majority"
  },
  {
    "id": "b9",
    "setup": "Postgres async replica read after write on primary",
    "expected": "Read returns old value on replica",
    "why": "Replication lag",
    "tradeoff": "Violates CAP-C on replica read"
  },
  {
    "id": "b10",
    "setup": "Postgres synchronous_commit=on, sync standby",
    "expected": "Commit waits for standby ack",
    "why": "Sync replication",
    "tradeoff": "CP write path"
  },
  {
    "id": "b11",
    "setup": "Redis master-replica async, partition splits",
    "expected": "Potential dual master if Sentinel misconfigured",
    "why": "Split brain risk",
    "tradeoff": "Need quorum Sentinel + fencing"
  },
  {
    "id": "b12",
    "setup": "DynamoDB eventual read after PutItem",
    "expected": "May read pre-write value briefly",
    "why": "Default eventual",
    "tradeoff": "AP read; strong read fixes"
  },
  {
    "id": "b13",
    "setup": "DynamoDB consistent read same item after put",
    "expected": "Returns latest write",
    "why": "Strong read CP moment",
    "tradeoff": "Per-item only"
  },
  {
    "id": "b14",
    "setup": "Active-active Global Tables two regions write same key",
    "expected": "Concurrent writes; LWW merge",
    "why": "Last timestamp wins",
    "tradeoff": "AP conflict resolution"
  },
  {
    "id": "b15",
    "setup": "DNS TTL 300s, failover primary to DR",
    "expected": "Clients hit old IP up to 5 min",
    "why": "Cached stale records",
    "tradeoff": "AP by design"
  },
  {
    "id": "b16",
    "setup": "CDN edge cache product price change",
    "expected": "Old price until purge/TTL",
    "why": "Edge AP",
    "tradeoff": "Business accepts staleness"
  },
  {
    "id": "b17",
    "setup": "Microservice Feign retry on POST payment no idempotency",
    "expected": "Duplicate charge possible",
    "why": "Retry storm + duplicate",
    "tradeoff": "AP retry without safety"
  },
  {
    "id": "b18",
    "setup": "Circuit breaker open on inventory service",
    "expected": "Fast fail to caller",
    "why": "CP fail-fast vs hang",
    "tradeoff": "Protects downstream"
  },
  {
    "id": "b19",
    "setup": "Cassandra W=3 R=1 RF=3 healthy cluster",
    "expected": "Write all replicas; read one — stale read possible",
    "why": "W+R>RF for strong not met on R=1",
    "tradeoff": "Tunable per query"
  },
  {
    "id": "b20",
    "setup": "Cassandra W=2 R=2 RF=3",
    "expected": "Strong read latest committed quorum write",
    "why": "Overlap 2+2>3",
    "tradeoff": "CP for that operation"
  },
  {
    "id": "b21",
    "setup": "Leader lease expires, old leader still writes",
    "expected": "Stale leader write if no fencing",
    "why": "Split brain window",
    "tradeoff": "Fencing token required"
  },
  {
    "id": "b22",
    "setup": "Saga payment succeeds, inventory fails, compensate",
    "expected": "Payment refunded async",
    "why": "Eventual global consistency",
    "tradeoff": "AP saga"
  },
  {
    "id": "b23",
    "setup": "2PC coordinator dies after prepare",
    "expected": "Participants blocked in-doubt",
    "why": "Blocking protocol",
    "tradeoff": "CP availability hit"
  },
  {
    "id": "b24",
    "setup": "Read-your-writes sticky to primary after update",
    "expected": "User sees own edit",
    "why": "Session routing",
    "tradeoff": "Not global linearizable"
  },
  {
    "id": "b25",
    "setup": "Spanner read after write same row",
    "expected": "External consistency",
    "why": "TrueTime bounded uncertainty",
    "tradeoff": "CP WAN"
  },
  {
    "id": "b26",
    "setup": "Cockroach SERIALIZABLE cross-range txn",
    "expected": "Serializable isolation",
    "why": "Raft per range",
    "tradeoff": "CP default"
  },
  {
    "id": "b27",
    "setup": "Hazelcast partition split brain",
    "expected": "Configured CP subsystem vs AP data",
    "why": "Product mode dependent",
    "tradeoff": "Know subsystem"
  },
  {
    "id": "b28",
    "setup": "Kafka consumer at-least-once crash after process before commit",
    "expected": "Duplicate processing on restart",
    "why": "At-least-once semantics",
    "tradeoff": "Idempotent consumer needed"
  },
  {
    "id": "b29",
    "setup": "Galera cluster partition minority",
    "expected": "Minority non-primary; rejects writes",
    "why": "Certification quorum",
    "tradeoff": "CP"
  },
  {
    "id": "b30",
    "setup": "Eureka registry stale instance",
    "expected": "Traffic to dead instance until heartbeat evict",
    "why": "AP service discovery",
    "tradeoff": "Client retry/CB"
  },
  {
    "id": "b31",
    "setup": "Inventory row SELECT FOR UPDATE during partition hold",
    "expected": "Blocks until lock or timeout",
    "why": "Pessimistic CP",
    "tradeoff": "Availability cost"
  },
  {
    "id": "b32",
    "setup": "OCC version mismatch on update",
    "expected": "412 Precondition Failed",
    "why": "CP reject stale write",
    "tradeoff": "Client refresh retry"
  }
];

export const PSEUDO: PseudoExercise[] = [
  {
    "id": "p1",
    "title": "Quorum write",
    "statement": "Write must ack W of N replicas before success",
    "approach": "Increment version; send to all replicas; wait W acks",
    "code": "boolean quorumWrite(String key, String value, int W, List<Replica> replicas) {\n  long version = clock.incrementAndGet();\n  Write w = new Write(key, value, version);\n  int acks = 0;\n  for (Replica r : replicas) {\n    if (r.send(w).isAck()) acks++;\n    if (acks >= W) { return true; }\n  }\n  return false; // rollback or anti-entropy repair\n}",
    "complexity": "O(N) messages",
    "edgeCases": [
      "W > N/2 for CP; partial write needs repair"
    ],
    "interviewExplain": "Explain W+R>RF overlap for reads"
  },
  {
    "id": "p2",
    "title": "Quorum read",
    "statement": "Read R replicas; return highest version",
    "approach": "Parallel read R nodes; pick max version",
    "code": "Optional<String> quorumRead(String key, int R, List<Replica> replicas) {\n  List<ReadResult> results = replicas.parallelStream()\n    .map(r -> r.read(key)).filter(ReadResult::isOk).limit(R).toList();\n  if (results.size() < R) return Optional.empty();\n  return results.stream().max(Comparator.comparingLong(ReadResult::version))\n    .map(ReadResult::value);\n}",
    "complexity": "O(R)",
    "edgeCases": [
      "Stale if W+R<=RF; digest repair"
    ],
    "interviewExplain": "Tie version to write quorum"
  },
  {
    "id": "p3",
    "title": "Leader election",
    "statement": "Elect highest epoch leader via ZK sequential ephemeral",
    "approach": "Create ephemeral sequential; smallest wins",
    "code": "class LeaderElection {\n  private final CuratorFramework zk;\n  private volatile String leaderPath;\n  void participate(String path) throws Exception {\n    String myPath = zk.create().withMode(EPHEMERAL_SEQUENTIAL).forPath(path + \"/n-\");\n    List<String> children = zk.getChildren().forPath(path);\n    Collections.sort(children);\n    if (myPath.endsWith(children.get(0))) { becomeLeader(); }\n    else { watchPredecessor(children, myPath); }\n  }\n}",
    "complexity": "O(log n) watchers",
    "edgeCases": [
      "Session expire flapping; fencing on lead"
    ],
    "interviewExplain": "Minority cannot be leader without quorum"
  },
  {
    "id": "p4",
    "title": "Version check write",
    "statement": "Optimistic concurrency — write if version matches",
    "approach": "Read version; conditional update",
    "code": "ResponseEntity<?> updateBalance(long acctId, BigDecimal newBal, long expectedVer) {\n  int updated = jdbc.update(\n    \"UPDATE accounts SET balance=?, version=version+1 WHERE id=? AND version=?\",\n    newBal, acctId, expectedVer);\n  if (updated == 0) return ResponseEntity.status(412).build();\n  return ResponseEntity.ok().build();\n}",
    "complexity": "O(1) DB",
    "edgeCases": [
      "ABA if reuse version; use monotonic"
    ],
    "interviewExplain": "CP reject vs AP overwrite"
  },
  {
    "id": "p5",
    "title": "OCC retry loop",
    "statement": "Client retries on version conflict",
    "approach": "Read-modify-write with backoff",
    "code": "void transfer(long from, long to, BigDecimal amt) {\n  for (int i = 0; i < MAX_RETRY; i++) {\n  Account a = repo.find(from); Account b = repo.find(to);\n  if (a.balance.compareTo(amt) < 0) throw insufficient();\n  if (repo.cas(from, a.version, a.balance.subtract(amt))\n   && repo.cas(to, b.version, b.balance.add(amt))) return;\n  backoff(i);\n  }\n  throw new ConflictException();\n}",
    "complexity": "O(retries)",
    "edgeCases": [
      "Hot account livelock; pessimistic for hot keys"
    ],
    "interviewExplain": "Saga if cross-service"
  },
  {
    "id": "p6",
    "title": "LWW conflict resolution",
    "statement": "Merge two writes by timestamp",
    "approach": "Compare HLC; higher wins; tie-break nodeId",
    "code": "Record merge(Record a, Record b) {\n  if (a.hlc.compareTo(b.hlc) > 0) return a;\n  if (b.hlc.compareTo(a.hlc) > 0) return b;\n  return a.nodeId.compareTo(b.nodeId) > 0 ? a : b;\n}",
    "complexity": "O(1)",
    "edgeCases": [
      "Clock skew loses data"
    ],
    "interviewExplain": "Not for financial balances"
  },
  {
    "id": "p7",
    "title": "Idempotent payment",
    "statement": "Store idempotency key before side effect",
    "approach": "Same key returns cached response",
    "code": "ResponseEntity<PaymentResult> pay(String idemKey, PaymentRequest req) {\n  Optional<PaymentResult> cached = idemStore.get(idemKey);\n  if (cached.isPresent()) return ResponseEntity.ok(cached.get());\n  if (!idemStore.tryInsert(idemKey, PENDING)) return pay(idemKey, req);\n  PaymentResult result = ledger.charge(req);\n  idemStore.complete(idemKey, result);\n  return ResponseEntity.ok(result);\n}",
    "complexity": "O(1) amortized",
    "edgeCases": [
      "TTL cleanup; PENDING stuck on crash"
    ],
    "interviewExplain": "Safe AP retries"
  },
  {
    "id": "p8",
    "title": "Retry with backoff",
    "statement": "Exponential backoff + jitter on transient failure",
    "approach": "Only idempotent ops",
    "code": "<T> T withRetry(Supplier<T> op, Predicate<Exception> retryable) {\n  for (int attempt = 0; ; attempt++) {\n    try { return op.get(); }\n    catch (Exception e) {\n      if (!retryable.test(e) || attempt >= MAX) throw e;\n      Thread.sleep(baseMs * (1L << attempt) + randomJitter());\n    }\n  }\n}",
    "complexity": "O(attempts)",
    "edgeCases": [
      "Non-idempotent POST danger"
    ],
    "interviewExplain": "Pair with circuit breaker"
  },
  {
    "id": "p9",
    "title": "Distributed lock",
    "statement": "Acquire lock with fencing token from ZK/etcd",
    "approach": "Token monotonic; storage rejects old token",
    "code": "class FencingLock {\n  long acquire() { return zkClient.getEpoch(); }\n  void guardedWrite(long fenceToken, String key, byte[] val) {\n    storage.writeIfFenceAtLeast(key, val, fenceToken);\n  }\n}",
    "complexity": "O(1) lock path",
    "edgeCases": [
      "Process pause can expire lease; fence writes"
    ],
    "interviewExplain": "CP lock + fence on data plane"
  }
];

export const INCIDENTS: Incident[] = [
  {
    "id": "i1",
    "title": "Stale balance displayed",
    "symptom": "User sees $1000 after $800 transfer completed",
    "cause": "Read from async replica; replication lag 30s",
    "investigate": "Compare primary vs replica balance; check read routing",
    "fix": "Route balance reads to primary; fix replica lag alert",
    "prevent": "Read-after-write routing; lag SLO on replica"
  },
  {
    "id": "i2",
    "title": "Conflicting orders same SKU",
    "symptom": "Two orders fulfilled for last item",
    "cause": "AP inventory check on cache; no row lock",
    "investigate": "Audit inventory decrements; trace cache vs DB",
    "fix": "Pessimistic lock or SERIALIZABLE decrement; invalidate cache on write",
    "prevent": "CP inventory path; unique constraint safety net"
  },
  {
    "id": "i3",
    "title": "Double payment charge",
    "symptom": "Customer charged twice same idempotency window",
    "cause": "Retry on timeout without idempotency key",
    "investigate": "Payment gateway logs duplicate POST same amount",
    "fix": "Enforce Idempotency-Key; dedup table unique constraint",
    "prevent": "Mandatory idempotency; 412 on replay mismatch"
  },
  {
    "id": "i4",
    "title": "Negative inventory",
    "symptom": "Stock count -3 in warehouse DB",
    "cause": "Oversell during partition; eventual merge lost update",
    "investigate": "Find concurrent writes; check CL=ONE reads",
    "fix": "Restore from audit log; CP QUORUM writes; CHECK constraint",
    "prevent": "DB CHECK qty>=0; CP write path"
  },
  {
    "id": "i5",
    "title": "Two Kafka cluster leaders",
    "symptom": "Duplicate messages; offset divergence",
    "cause": "Unclean election or misconfigured controller",
    "investigate": "Controller logs; ISR state per partition",
    "fix": "Disable unclean election; restore from ISR; rebuild follower",
    "prevent": "acks=all minISR=2; unclean=false for finance"
  },
  {
    "id": "i6",
    "title": "Replica lag customer complaints",
    "symptom": "Users see old profile after update",
    "cause": "Heavy write load; replica I/O saturated",
    "investigate": "pg_stat_replication lag; Mongo secondary lag metrics",
    "fix": "Throttle writes; add replica; route session reads to primary",
    "prevent": "Lag alerts; RYOW routing policy"
  },
  {
    "id": "i7",
    "title": "Split-brain Redis masters",
    "symptom": "Conflicting cache values both regions",
    "cause": "Sentinel quorum lost during network flap",
    "investigate": "Redis INFO replication; Sentinel logs",
    "fix": "Force single master; resync replicas; fix quorum",
    "prevent": "Odd number Sentinels; quorum + auth"
  }
];

export const SENIOR_TRADEOFF_QS: InterviewQ[] = [
  {
    "id": "st1",
    "topic": "Sacrifice A",
    "question": "When do you sacrifice Availability for correctness?",
    "answer30s": "When invariant cost exceeds downtime: money, inventory, safety.",
    "answer2m": "Payment auth, seat booking, drug dosage — return 503 on minority partition rather than stale affirmative. Measure cost of wrong yes vs wrong no.",
    "followUps": [
      "Always CP?"
    ],
    "trick": "Never sacrifice A.",
    "wrongAnswer": "Always available payments."
  },
  {
    "id": "st2",
    "topic": "AP payments",
    "question": "Can payments be AP?",
    "answer30s": "Notification/settlement pipeline AP; authorization hold must be CP.",
    "answer2m": "Separate auth (CP ledger) from async capture/settlement. Never AP the double-spend check.",
    "followUps": [
      "Stripe model?"
    ],
    "trick": "AP whole payment.",
    "wrongAnswer": "AP is fine for money."
  },
  {
    "id": "st3",
    "topic": "AP strong ops",
    "question": "Can AP systems have strong operations?",
    "answer30s": "Yes — per-operation CL/consistency knob.",
    "answer2m": "Cassandra ONE for metrics, QUORUM for inventory same cluster. Hybrid by API parameter.",
    "followUps": [
      "Dynamo consistent read?"
    ],
    "trick": "AP cannot be strong.",
    "wrongAnswer": "Pick one globally."
  },
  {
    "id": "st4",
    "topic": "CP highly available",
    "question": "Can CP be highly available?",
    "answer30s": "On majority partition — yes; globally during WAN split — minority unavailable.",
    "answer2m": "ZK/etcd available to majority clients; 99.99% SLA possible if design handles minority errors gracefully.",
    "followUps": [
      "Spanner?"
    ],
    "trick": "CP = down.",
    "wrongAnswer": "CP means outage."
  },
  {
    "id": "st5",
    "topic": "Eventual payments",
    "question": "Is eventual consistency ever OK in payments?",
    "answer30s": "For read models and notifications — yes; not for balance authorization.",
    "answer2m": "Eventual settlement batch OK; available balance for debit must be CP.",
    "followUps": [
      "Blockchain?"
    ],
    "trick": "Never in finance.",
    "wrongAnswer": "All finance CP."
  },
  {
    "id": "st6",
    "topic": "Multi-region CP",
    "question": "Multi-region strong consistency cost?",
    "answer30s": "Latency of sync quorum or single leader — PACELC L vs C.",
    "answer2m": "Spanner/Cockroach pay WAN RTT; active-passive one write region simpler CP.",
    "followUps": [
      "Global ACID?"
    ],
    "trick": "Free with cloud.",
    "wrongAnswer": "Easy multi-master CP."
  },
  {
    "id": "st7",
    "topic": "Saga vs 2PC",
    "question": "Saga vs 2PC for cross-service?",
    "answer30s": "Saga for microservices (AP eventual); 2PC only colocated RM with ops runbook.",
    "answer2m": "2PC blocks on coordinator failure; saga compensates with business logic.",
    "followUps": [
      "TCC when?"
    ],
    "trick": "2PC always.",
    "wrongAnswer": "Saga is ACID."
  },
  {
    "id": "st8",
    "topic": "Cache CP",
    "question": "Make cache CP or AP?",
    "answer30s": "Cache is AP by nature; invalidate/write-through for critical keys.",
    "answer2m": "Inventory: cache-aside dangerous — read-through leader or no cache on stock.",
    "followUps": [
      "Redis CP?"
    ],
    "trick": "Cache always fresh.",
    "wrongAnswer": "TTL enough for stock."
  },
  {
    "id": "st9",
    "topic": "Kafka money",
    "question": "Kafka for payment events CAP?",
    "answer30s": "Log is CP on produce with acks=all; consumer processing AP without idempotency.",
    "answer2m": "End-to-end CP needs idempotent consumer + transactional outbox source.",
    "followUps": [
      "Exactly-once?"
    ],
    "trick": "Kafka EOS everywhere.",
    "wrongAnswer": "Fire and forget OK."
  },
  {
    "id": "st10",
    "topic": "RPO vs CAP",
    "question": "How RPO maps to CAP?",
    "answer30s": "RPO>0 implies async replication — AP on failover reads.",
    "answer2m": "RPO=0 needs sync CP replication; higher latency and partition unavailability on minority.",
    "followUps": [
      "RTO DNS?"
    ],
    "trick": "Independent.",
    "wrongAnswer": "RPO unrelated."
  },
  {
    "id": "st11",
    "topic": "Staff hybrid",
    "question": "Design hybrid CAP system?",
    "answer30s": "CP authority per invariant; AP views; explicit client contracts.",
    "answer2m": "Ledger CP Postgres + feed AP Cassandra + CDN AP images; map each path.",
    "followUps": [
      "One database?"
    ],
    "trick": "One CAP pick.",
    "wrongAnswer": "Single label enough."
  },
  {
    "id": "st12",
    "topic": "Principal prove",
    "question": "Prove you cannot have C and A during P?",
    "answer30s": "Gilbert/Lynch: async network, if both available during partition, reads can disagree → not linearizable.",
    "answer2m": "Two nodes partition; both accept writes; client reads different values — violates linearizability.",
    "followUps": [
      "Synchronous network?"
    ],
    "trick": "Spanner disproves.",
    "wrongAnswer": "CAP is wrong."
  },
  {
    "id": "st13",
    "topic": "DNS AP accept",
    "question": "When accept DNS-level AP?",
    "answer30s": "Public website, CDN assets, non-financial routing with TTL budget.",
    "answer2m": "Never for authoritative financial ledger routing without health-checked low TTL.",
    "followUps": [
      "Service mesh?"
    ],
    "trick": "Never AP DNS.",
    "wrongAnswer": "DNS must be CP."
  },
  {
    "id": "st14",
    "topic": "Jepsen culture",
    "question": "Role of Jepsen in CAP decisions?",
    "answer30s": "Empirical partition testing validates claimed consistency.",
    "answer2m": "Vendor CP claims vs Jepsen findings — staff cites concrete failures.",
    "followUps": [
      "Testing cost?"
    ],
    "trick": "Vendors always right.",
    "wrongAnswer": "Theory enough."
  }
];

export const SPOKEN = {
  "sixtySec": "Draw two replicas and cut the wire. Consistency = correct latest answer or refuse. Availability = live node still answers, maybe stale. Partition will happen in multi-AZ — so under the cut I pick Correct (CP) or Answer (AP), not both. Money and seats = CP. Likes and feed = AP. One product has both. If the network is healthy but cross-region, that is PACELC — speed versus strong reads.",
  "twoMin": "I do not recite Gilbert/Lynch. I design: which APIs must never lie, which may be briefly wrong. Ledger debit, inventory reserve, payment auth → CP with quorum or leader and idempotency. Catalog, feed, notifications, search → AP with merge later. I refuse the tattoo “Cassandra is AP” — consistency level ONE vs QUORUM changes the mood. Kafka is the same: acks and min.ISR are the receipt. Close the whiteboard with one CP box and one AP box in the same product.",
  "staff": "Staff answer names failure domain and evidence. Under partition: majority serves money, minority returns 503; fencing stops two leaders. On heal: read repair / anti-entropy, never dual primary without tokens. Cross-region: PACELC — sync if RPO≈0, async if latency budget wins. Prove with lag metrics, quorum errors, and a game day. Saga/outbox across services — not 2PC. CAP is a decision per request path, not a vendor slogan."
};

export const CHEAT_ROWS = [
  {
    "term": "CAP",
    "purpose": "Framework for partition trade-offs",
    "rule": "During P: choose C or A, not both",
    "trap": "\"Pick any two\" at design time"
  },
  {
    "term": "C",
    "purpose": "Linearizability",
    "rule": "Latest write or error",
    "trap": "Confuse with ACID C"
  },
  {
    "term": "A",
    "purpose": "Non-error response from non-failed nodes",
    "rule": "Includes stale success",
    "trap": "Confuse with SLA uptime"
  },
  {
    "term": "P",
    "purpose": "Operate despite network split",
    "rule": "Assume in distributed systems",
    "trap": "Think P is optional in cloud"
  },
  {
    "term": "CP",
    "purpose": "Reject minority during partition",
    "rule": "Quorum/consensus required",
    "trap": "Label product forever CP"
  },
  {
    "term": "AP",
    "purpose": "Respond possibly stale",
    "rule": "DNS, CDN, CL=ONE",
    "trap": "AP means broken"
  },
  {
    "term": "CA",
    "purpose": "Single-node mental model",
    "rule": "No inter-node partition",
    "trap": "Claim multi-AZ is CA"
  },
  {
    "term": "PACELC",
    "purpose": "Normal-path trade-off",
    "rule": "Else Latency vs Consistency",
    "trap": "Ignore when only citing CAP"
  },
  {
    "term": "linearizability",
    "purpose": "Strongest single-object order",
    "rule": "Real-time precedence",
    "trap": "Same as serializable"
  },
  {
    "term": "eventual",
    "purpose": "Converge when writes stop",
    "rule": "No time bound by default",
    "trap": "Means no consistency"
  },
  {
    "term": "quorum",
    "purpose": "Majority overlap",
    "rule": "W+R>RF for strong reads",
    "trap": "Any W/R works"
  },
  {
    "term": "N",
    "purpose": "Replica count targeted",
    "rule": "Cassandra replication param",
    "trap": "Same as RF always"
  },
  {
    "term": "W",
    "purpose": "Write ack count",
    "rule": "Higher W = stronger write",
    "trap": "W=1 always fine for inventory"
  },
  {
    "term": "R",
    "purpose": "Read replica count",
    "rule": "Higher R = fresher read",
    "trap": "R=1 with W=1 is strong"
  },
  {
    "term": "leader",
    "purpose": "Ordering authority",
    "rule": "Writes via leader",
    "trap": "Leader without fencing"
  },
  {
    "term": "consensus",
    "purpose": "Agreed log order",
    "rule": "Majority commit",
    "trap": "Consensus is AP"
  },
  {
    "term": "split brain",
    "purpose": "Dual primaries",
    "rule": "Fencing + quorum prevent",
    "trap": "Heartbeat alone enough"
  },
  {
    "term": "failover",
    "purpose": "Redirect to standby",
    "rule": "Plan RTO/RPO",
    "trap": "Instant global consistency"
  },
  {
    "term": "replication",
    "purpose": "Copies for durability/scale",
    "rule": "Sync=CP async=AP reads",
    "trap": "More replicas always help"
  },
  {
    "term": "RPO",
    "purpose": "Max data loss window",
    "rule": "Async replication increases RPO",
    "trap": "Same as RTO"
  },
  {
    "term": "RTO",
    "purpose": "Max downtime",
    "rule": "DNS TTL affects RTO",
    "trap": "Independent of consistency"
  },
  {
    "term": "Saga",
    "purpose": "Distributed workflow",
    "rule": "Compensate on failure",
    "trap": "Saga is 2PC"
  },
  {
    "term": "idempotency",
    "purpose": "Safe retries",
    "rule": "Same key same effect",
    "trap": "Only AP needs it"
  }
];

export const DECISION_ASCII = "\nCAP / PACELC decision tree\n══════════════════════════\nIs the system distributed (multi-node / multi-AZ / multi-region)?\n  NO  → CAP triangle not meaningful (single-node \"CA\")\n  YES → Partition tolerance P is assumed\n\n── During PARTITION (CAP) ──\nMust invariant hold NOW (money, inventory, seat, lock)?\n  YES → Choose C (CP): quorum write, leader read, reject minority (503)\n        │   Postgres sync / w:majority / Cassandra QUORUM / ZK etcd\n        │   Return error rather than stale affirmative\n  NO  → Choose A (AP): respond from local replica/cache\n        │   Cassandra ONE / DNS / CDN / async replica read\n        │   Plan conflict merge on heal (LWW, CRDT, saga)\n\n── When HEALTHY (PACELC) ──\nLatency sensitive read-mostly?\n  YES → Weaker consistency / replica reads / cache (L over C)\n  NO  → Strong quorum / leader / sync replication (C over L)\n\n── Per technology knob ──\nCassandra:  CL=ONE (AP)  vs  CL=QUORUM (CP)     W+R>RF?\nMongoDB:      w:1 + secondary (AP)  vs  w:majority (CP)\nKafka:        acks=1 (risk)  vs  acks=all + minISR (CP)\nDynamoDB:     eventual read  vs  ConsistentRead=true\nRedis:        async replica  vs  WAIT N\n\n── Recovery checklist ──\n  □ Fencing token on leader failover\n  □ Idempotency on all retries\n  □ Replication lag alerts\n  □ Anti-entropy / read repair\n  □ Jepsen or chaos partition drills\n";

export const COVERAGE_CHECKLIST: string[] = [
  "CAP fundamentals: Brewer 2000, Gilbert/Lynch 2002 proof intuition",
  "Define C as linearizability — not ACID C",
  "Define A as non-error response — not SLA uptime",
  "Define P as message loss/delay tolerance",
  "Not \"pick any two\" — partition forces C vs A",
  "Normal operation vs partition behavior",
  "CP systems: minority rejection, quorum, consensus",
  "AP systems: stale reads, conflict resolution, DNS/CDN",
  "CA single-node limitation",
  "CAP triangle misleading diagram",
  "PACELC: Else Latency vs Consistency",
  "CAP vs ACID vs BASE",
  "Strong consistency model ladder",
  "Eventual consistency and convergence",
  "Read-your-writes and session guarantees",
  "Quorum N/W/R and W+R>RF rule",
  "Quorum failure scenarios",
  "Leader replication and fencing",
  "Consensus Raft/Paxos CP behavior",
  "Split brain prevention",
  "Partition scenario walkthrough",
  "Microservices multiply CAP surfaces",
  "Database selection matrix (Postgres, Cassandra, Mongo)",
  "Kafka acks, ISR, minISR, unclean election",
  "Redis replication and WAIT",
  "DynamoDB strong vs eventual reads",
  "Cassandra CL tuning per query",
  "MongoDB writeConcern readConcern",
  "XA/2PC vs Saga",
  "Caching AP staleness",
  "Distributed locking CP",
  "Service discovery AP staleness",
  "DNS/CDN intentional AP",
  "Multi-region active-active vs active-passive",
  "RPO/RTO mapping to replication",
  "Read/write routing policies",
  "API idempotency ETag OCC",
  "Exactly-once end-to-end scope",
  "Retry storms and circuit breakers",
  "Observability: lag, quorum fail, elections",
  "Design examples: banking, feed, inventory",
  "Interview trap questions",
  "Formal partition impossibility intuition",
  "Linearizability vs serializability",
  "SLA vs CAP availability",
  "Decision matrix per operation",
  "Hybrid CP authority + AP views",
  "Interview framework: invariant → CAP choice",
  "60s / 2min / Staff spoken answers",
  "Rapid-fire definitions",
  "Predict behavior N/W/R scenarios",
  "Pseudocode: quorum, lock, idempotency",
  "Production incidents: stale, double pay, split brain",
  "Senior trade-off questions",
  "Cheat sheet rows",
  "Decision ASCII tree",
  "Coverage checklist complete",
  "Interview mode aliases SENIOR ARCHITECT RAPID ALL",
  "MEMORY_RULES mnemonics",
  "DESIGN_SCENARIO_SHORT hybrid patterns",
  "Triangle diagram limitations",
  "Formal proof intuition Gilbert/Lynch",
  "Behavioral prediction drills",
  "Incident postmortem patterns",
  "Java pseudocode exercises",
  "Staff principal spoken depth"
];

export const DESIGN_SCENARIO_SHORT = "Banking CP ledger + AP statements | Inventory CP row + AP catalog | Feed AP Cassandra ONE + RYOW session | Payment idempotency + CP auth | Multi-region: CP single writer or AP merge with HLC";

export const MEMORY_RULES = [
  {
    "title": "C = Copy correct or Cancel",
    "rule": "Linearizable read returns latest write OR error — never stale lie on critical path"
  },
  {
    "title": "A = Answer always",
    "rule": "Every live node responds — even if stale; not uptime percent"
  },
  {
    "title": "P = Partitions happen",
    "rule": "Multi-AZ = partitioned; cannot opt out"
  },
  {
    "title": "Not Pick Two",
    "rule": "Pick behavior during partition, not permanent two-letter stamp"
  },
  {
    "title": "PACELC = Peace when healthy",
    "rule": "If no partition: Latency vs Consistency still trades"
  },
  {
    "title": "QUORUM = Quality Over Random Unreliable Majority",
    "rule": "W+R>RF overlapping majorities for strong"
  },
  {
    "title": "SQL single = Solo Queue Local",
    "rule": "One node SQL is CA diagram only; replica = CAP"
  },
  {
    "title": "NoSQL ≠ No SQL ≠ AP",
    "rule": "Model label not CAP stamp — tune CL/wc"
  },
  {
    "title": "Kafka acks = All Keeps Integrity",
    "rule": "acks=all + minISR for CP produce moment"
  },
  {
    "title": "Eventual = Ending uniform, not empty",
    "rule": "Converges when writes stop — not chaos"
  },
  {
    "title": "Retry = Risk if not Repeat-safe",
    "rule": "Idempotency before retry on mutations"
  },
  {
    "title": "Split = Stop if no fence",
    "rule": "Leader election needs fencing token on writes"
  },
  {
    "title": "Saga = Steps And Go Around",
    "rule": "Compensate — not global 2PC across services"
  },
  {
    "title": "RPO = Records Possibly Off",
    "rule": "Async replication → data loss window"
  },
  {
    "title": "DNS = Delayed Not Synced",
    "rule": "TTL staleness is AP by design"
  }
];

const trapSample = TRAP_QS.filter((_, i) => i % 2 === 0);
const scenarioAsInterview: InterviewQ[] = [
  {
    "id": "sc1",
    "topic": "Scenario",
    "question": "Bank balance transfer",
    "answer30s": "CP on ledger: w:majority or single leader; never read balance from lagging replica for transfer decision",
    "answer2m": "CP on ledger: w:majority or single leader; never read balance from lagging replica for transfer decision",
    "followUps": [
      "Sacrifice AP on write path for correctness; async DR accepts RPO>0"
    ]
  },
  {
    "id": "sc2",
    "topic": "Scenario",
    "question": "E-commerce inventory",
    "answer30s": "Serializable/row-lock inventory; never trust replica count for purchase",
    "answer2m": "Serializable/row-lock inventory; never trust replica count for purchase",
    "followUps": [
      "CP inventory + AP catalog hybrid"
    ]
  },
  {
    "id": "sc3",
    "topic": "Scenario",
    "question": "Social news feed",
    "answer30s": "AP with session RYOW for author; monotonic reads optional",
    "answer2m": "AP with session RYOW for author; monotonic reads optional",
    "followUps": [
      "AP feed; CP only for abuse/rate-limit counters if needed"
    ]
  },
  {
    "id": "sc4",
    "topic": "Scenario",
    "question": "Distributed lock service",
    "answer30s": "ZK/etcd CP; clients pass fencing token to storage",
    "answer2m": "ZK/etcd CP; clients pass fencing token to storage",
    "followUps": [
      "CP lock service; AP app must use fencing"
    ]
  },
  {
    "id": "sc5",
    "topic": "Scenario",
    "question": "Payment authorization",
    "answer30s": "Idempotency-Key + CP ledger; saga for cross-service settlement",
    "answer2m": "Idempotency-Key + CP ledger; saga for cross-service settlement",
    "followUps": [
      "CP money path; AP notification async"
    ]
  },
  {
    "id": "sc6",
    "topic": "Scenario",
    "question": "Global user profile DB",
    "answer30s": "Session token for RYOW; strong only if business requires global uniqueness",
    "answer2m": "Session token for RYOW; strong only if business requires global uniqueness",
    "followUps": [
      "AP across regions; conflict merge LWW/HLC"
    ]
  },
  {
    "id": "sc7",
    "topic": "Scenario",
    "question": "Ticket booking (SeatGeek)",
    "answer30s": "Unique constraint + CP lock; browse AP",
    "answer2m": "Unique constraint + CP lock; browse AP",
    "followUps": [
      "CP seat map; AP browse seating chart images"
    ]
  },
  {
    "id": "sc8",
    "topic": "Scenario",
    "question": "Ride matching",
    "answer30s": "Location AP; match CP with idempotent accept",
    "answer2m": "Location AP; match CP with idempotent accept",
    "followUps": [
      "AP telemetry; CP assignment transaction"
    ]
  },
  {
    "id": "sc9",
    "topic": "Scenario",
    "question": "Shopping cart",
    "answer30s": "Separate AP cart from CP checkout",
    "answer2m": "Separate AP cart from CP checkout",
    "followUps": [
      "AP cart AP checkout CP boundary"
    ]
  },
  {
    "id": "sc10",
    "topic": "Scenario",
    "question": "Push notifications",
    "answer30s": "AP queue + idempotency; CP audit trail separate",
    "answer2m": "AP queue + idempotency; CP audit trail separate",
    "followUps": [
      "AP delivery; CP only for legal audit log"
    ]
  },
  {
    "id": "sc11",
    "topic": "Scenario",
    "question": "Rate limiter global",
    "answer30s": "Billing CP; soft limit AP with CRDT",
    "answer2m": "Billing CP; soft limit AP with CRDT",
    "followUps": [
      "Choose per API sensitivity"
    ]
  },
  {
    "id": "sc12",
    "topic": "Scenario",
    "question": "Config/feature flags",
    "answer30s": "Kill-switch on ZK; normal flags AP",
    "answer2m": "Kill-switch on ZK; normal flags AP",
    "followUps": [
      "AP flags; CP emergency off"
    ]
  },
  {
    "id": "sc13",
    "topic": "Scenario",
    "question": "Search index",
    "answer30s": "Source DB CP; index AP lag bounded SLA",
    "answer2m": "Source DB CP; index AP lag bounded SLA",
    "followUps": [
      "AP search; CP source DB"
    ]
  },
  {
    "id": "sc14",
    "topic": "Scenario",
    "question": "Analytics dashboard",
    "answer30s": "AP warehouse; CP only for revenue numbers source",
    "answer2m": "AP warehouse; CP only for revenue numbers source",
    "followUps": [
      "AP analytics; CP billing source events"
    ]
  },
  {
    "id": "sc15",
    "topic": "Scenario",
    "question": "DNS routing",
    "answer30s": "Plan RTO with TTL; not CP DNS",
    "answer2m": "Plan RTO with TTL; not CP DNS",
    "followUps": [
      "AP DNS; accept staleness budget in RTO"
    ]
  },
  {
    "id": "sc16",
    "topic": "Scenario",
    "question": "Chat messaging",
    "answer30s": "Per-partition ordering CP; cross-room AP",
    "answer2m": "Per-partition ordering CP; cross-room AP",
    "followUps": [
      "AP delivery; CP session auth"
    ]
  },
  {
    "id": "sc17",
    "topic": "Scenario",
    "question": "Video view counter",
    "answer30s": "Choose business: viral AP approx vs billing CP",
    "answer2m": "Choose business: viral AP approx vs billing CP",
    "followUps": [
      "AP approximate vs CP exact trade"
    ]
  },
  {
    "id": "sc18",
    "topic": "Scenario",
    "question": "Healthcare appointment",
    "answer30s": "DB constraint + CP; UI AP",
    "answer2m": "DB constraint + CP; UI AP",
    "followUps": [
      "CP booking; AP calendar UI"
    ]
  },
  {
    "id": "sc19",
    "topic": "Scenario",
    "question": "IoT device shadow",
    "answer30s": "Versioned shadow; CP command only safety-critical",
    "answer2m": "Versioned shadow; CP command only safety-critical",
    "followUps": [
      "AP with version field conflict"
    ]
  },
  {
    "id": "sc20",
    "topic": "Scenario",
    "question": "Leaderboard gaming",
    "answer30s": "Server authoritative CP write; board AP",
    "answer2m": "Server authoritative CP write; board AP",
    "followUps": [
      "AP display; CP anti-cheat validation"
    ]
  },
  {
    "id": "sc21",
    "topic": "Scenario",
    "question": "Email inbox",
    "answer30s": "CP dedup key; AP sync body",
    "answer2m": "CP dedup key; AP sync body",
    "followUps": [
      "AP sync; CP dedup"
    ]
  },
  {
    "id": "sc22",
    "topic": "Scenario",
    "question": "Stock trading retail",
    "answer30s": "Never AP the matching engine",
    "answer2m": "Never AP the matching engine",
    "followUps": [
      "CP trades AP quotes"
    ]
  },
  {
    "id": "sc23",
    "topic": "Scenario",
    "question": "Hotel reservation",
    "answer30s": "CP central inventory",
    "answer2m": "CP central inventory",
    "followUps": [
      "CP inventory AP search"
    ]
  },
  {
    "id": "sc24",
    "topic": "Scenario",
    "question": "Coupon redemption",
    "answer30s": "CP compare-and-set redeem",
    "answer2m": "CP compare-and-set redeem",
    "followUps": [
      "CP redeem AP display"
    ]
  },
  {
    "id": "sc25",
    "topic": "Scenario",
    "question": "File upload metadata",
    "answer30s": "Conditional write metadata after blob",
    "answer2m": "Conditional write metadata after blob",
    "followUps": [
      "AP blob CP pointer"
    ]
  },
  {
    "id": "sc26",
    "topic": "Scenario",
    "question": "Session auth token",
    "answer30s": "Sensitive: CP session store",
    "answer2m": "Sensitive: CP session store",
    "followUps": [
      "Short TTL AP vs CP revoke store"
    ]
  },
  {
    "id": "sc27",
    "topic": "Scenario",
    "question": "Geo-fencing compliance",
    "answer30s": "CP policy check before store",
    "answer2m": "CP policy check before store",
    "followUps": [
      "CP compliance over AP"
    ]
  },
  {
    "id": "sc28",
    "topic": "Scenario",
    "question": "Warehouse pick list",
    "answer30s": "CP assignment service",
    "answer2m": "CP assignment service",
    "followUps": [
      "CP assign AP list"
    ]
  },
  {
    "id": "sc29",
    "topic": "Scenario",
    "question": "Subscription billing",
    "answer30s": "CP ledger idempotent",
    "answer2m": "CP ledger idempotent",
    "followUps": [
      "CP charge AP portal"
    ]
  },
  {
    "id": "sc30",
    "topic": "Scenario",
    "question": "Comment thread moderation",
    "answer30s": "CP block list; AP comments",
    "answer2m": "CP block list; AP comments",
    "followUps": [
      "Speed vs safety"
    ]
  },
  {
    "id": "sc31",
    "topic": "Scenario",
    "question": "Multi-tenant SaaS quota",
    "answer30s": "Enterprise CP quota; free tier AP approx",
    "answer2m": "Enterprise CP quota; free tier AP approx",
    "followUps": [
      "Tenant tier defines strictness"
    ]
  },
  {
    "id": "sc32",
    "topic": "Scenario",
    "question": "Blockchain wallet balance",
    "answer30s": "Full node CP; SPV AP",
    "answer2m": "Full node CP; SPV AP",
    "followUps": [
      "CP chain AP light client"
    ]
  }
];

export const SENIOR: InterviewQ[] = [...trapSample, ...scenarioAsInterview.slice(0, 16)];

export const ARCHITECT: InterviewQ[] = [...SENIOR_TRADEOFF_QS, ...TRAP_QS.filter((_, i) => i % 3 === 0)];

export const RAPID: InterviewQ[] = RAPID_QS;

export const ALL: InterviewQ[] = [
  ...TRAP_QS,
  ...RAPID_QS,
  ...SENIOR_TRADEOFF_QS,
  ...scenarioAsInterview,
];
