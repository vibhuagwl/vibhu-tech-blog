/** Staff/Architect zero-gap internals — KRaft propagation, fencing, state machines, control-plane scale. */

export const FOUR_LAYERS = `┌─────────────────────────────────────────┐
│          APPLICATION / CLIENT           │
│       Producer / Consumer / Admin       │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│              BROKER DATA PLANE          │
│ Request → Partition → Log → Replication │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│             STORAGE LAYER               │
│ Segments → Indexes → Page Cache → Disk  │
└─────────────────────────────────────────┘

                   +

┌─────────────────────────────────────────┐
│             KRaft CONTROL PLANE         │
│ Controller → Raft → Metadata Log        │
│       → Metadata → Partition State      │
└─────────────────────────────────────────┘

Clients never talk to Raft. Produce/Fetch never require the controller.
Control plane owns membership, leaders, ISR metadata, topics, configs.
Data plane owns appends, fetches, HW, local logs.`;

export const METADATA_PROPAGATION = `Controller Quorum (Raft leader = active controller)
       ↓
Metadata Log append (topic/leader/ISR/broker/config records)
       ↓
Majority commit
       ↓
Apply on controller
       ↓
Broker Metadata Publisher / metadata delta or snapshot catch-up
       ↓
Broker MetadataCache
       ↓
Clients learn via Metadata API refresh

Broker temporarily behind:
  • Still serves Produce/Fetch for partitions it already leads
  • May reject admin views / act on stale leadership until catch-up
  • Clients with stale cache get NOT_LEADER_OR_FOLLOWER → refresh
  • Catch-up = replay metadata log from offset / load snapshot then deltas
  • Never invent leaders locally — only apply committed metadata`;

export const SNAPSHOT_LIFECYCLE = `Why snapshots exist:
  Metadata log would grow forever with every topic/ISR/leader change.
  Snapshots compact history so new/slow brokers catch up without full replay.

Lifecycle:
  1. Controller creates snapshot at a committed metadata offset
  2. Snapshot = materialised cluster metadata image
  3. Lagging broker/controller loads snapshot
  4. Installs image into MetadataCache / controller state
  5. Truncates / skips log prefix covered by snapshot
  6. Replays only newer metadata records after snapshot offset
  7. Controller recovery after crash: load latest snapshot → replay tail → resume Raft

Ops notes:
  Snapshot lag high → slow join / long recovery / controller pressure
  Do not delete metadata dirs casually — cluster.id + snapshots are sacred
  Large clusters = larger snapshots = longer cold-start for new controllers`;

export const KRAFT_FENCING = `Epochs that matter:
  • Raft term / controller epoch — who may commit metadata
  • Broker epoch — registration generation; stale broker is fenced
  • Leader epoch (data plane) — who may append as partition leader

Stale broker:
  Old process reconnects with outdated broker epoch → rejected / fenced
  Prevents zombie broker from claiming to be a live replica/leader

Stale controller:
  Old controller after Raft election cannot commit with old term
  Majority prevents split-brain metadata

Stale partition leader:
  Leader epoch++ on new election
  Old leader’s appends/ISR claims are fenced
  Replicas truncate divergent suffix using epoch checkpoints

Interview line:
  “KRaft fencing is Raft term + broker epoch + leader epoch working together
   so zombies cannot rewrite cluster truth or partition logs.”`;

export const FEATURE_LEVELS = `Feature / metadata versioning (conceptual — check docs for your release):
  • supported features — what this broker/controller binary can speak
  • finalized features — what the cluster has agreed is on for all
  • metadata version — schema of the metadata image/log records

Rolling upgrade behavior:
  1. Deploy new binaries (still compatible with current finalized level)
  2. Cluster remains on old finalized features until operators finalize
  3. Finalize only when all nodes support the new feature
  4. Some upgrades are one-way after finalize — plan rollback BEFORE finalize

Downgrade limits:
  After finalize of a metadata version, downgrade may be impossible or unsafe
  Always follow official upgrade path for your Kafka minor/major

Interview trap:
  “Just rolling restart to new version is enough” — missing feature finalize /
  inter-broker protocol / controller metadata compatibility.`;

export const PARTITION_STATE = `Controller-managed partition lifecycle (interview model):

  OfflinePartition
        ↓  (electable replica available / brokers up)
  OnlinePartition
        ↓
  Leader assigned (+ followers)
        ↓
  Reassignment (adding/removing replicas)
        ↓
  Recovery / catch-up
        ↓
  Stable Online (leader + ISR)

Offline causes:
  No live ISR replica, all brokers down, unclean disabled with empty ISR,
  disk failure on sole remaining replica, bad AZ placement.

Controller actions:
  Detect broker death → shrink ISR → elect if leader gone → bump epoch
  → commit metadata → publish → brokers apply → clients refresh

Staff insight:
  Partition state is control-plane truth. Brokers execute; they do not
  invent a new leader without committed metadata.`;

export const REPLICA_STATE = `Replica lifecycle (per partition copy on a broker):

  New Replica (assigned / reassignment target)
        ↓  create log dir, start ReplicaFetcher
  Catching up (LEO trailing leader)
        ↓  within replica.lag.time.max.ms
  In ISR (Online, in-sync)
        ↓
  Out of ISR (lag / offline / net / disk)
        ↓
  Offline Replica (broker down / log offline)
        ↓
  Replica Recovery (restart → load segments → truncate via epochs → fetch)
        ↓
  Re-enter ISR

Why this matters:
  Broker recovery time ≈ Σ partitions × segment recovery + catch-up bytes
  URP = assigned RF not fully in ISR
  Reassignment must not remove old replica until new one is safe in ISR`;

export const CONTROLLER_FAILOVER: string[][] = [
  ['During leader election', 'In-flight election may abort; new controller re-reads committed metadata and completes/restarts election; partitions may stay briefly without leader'],
  ['During partition reassignment', 'Committed reassignment state survives; new controller continues from metadata image; uncommitted step is retried safely'],
  ['During topic creation', 'Uncommitted CreateTopics not visible; client retries; committed topics remain'],
  ['During broker registration', 'Broker retries registration; fencing epochs prevent double-live identity'],
  ['During metadata update / ISR change', 'Only majority-committed records apply; broker caches catch up after new controller publishes'],
  ['During replica recovery coordination', 'Data-plane catch-up continues; control-plane ISR expand waits for committed metadata'],
];

export const CONTROLLER_FAILOVER_NOTE = `KRaft resume rule:
  Safety = Raft commit. Anything only on the dead leader’s uncommitted log
  is not cluster truth. New controller loads snapshot + committed log and
  drives state machines forward idempotently.

SEV ranking:
  Controller leader crash → usually brief admin blip (data plane OK)
  Quorum majority loss → metadata freeze (elections/admin stuck) = SEV-1`;

export const CONTROLLER_SCALE: string[][] = [
  ['Controller CPU', 'Metadata ops, elections, reassignments, publish fan-out'],
  ['Metadata size', 'Topics × partitions × replicas + broker/config records'],
  ['Metadata log growth', 'ISR churn and leadership flaps amplify write rate'],
  ['Partition count', 'Dominant control-plane cost; recovery + election cost'],
  ['Broker count', 'Registration, heartbeats/sessions, publish fan-out'],
  ['Topic count', 'Admin storms; ACL/config surface'],
  ['Controller event queue', 'Backlog → slow elections/reassignments'],
  ['Metadata propagation latency', 'Stale MetadataCache → NOT_LEADER storms'],
  ['Snapshot size / install time', 'Cold controller/broker join cost'],
];

export const CONTROLLER_SCALE_NOTE = `Kafka scale is two ceilings:
  1) Broker data plane (disk/net/page cache)
  2) KRaft control plane (partitions, churn, controller CPU)

  500k partitions can be “fine” on paper for bytes/s and still melt
  recovery time, FD counts, and controller publish latency.
  Dedicated controller nodes when metadata fights log I/O.`;

export const REASSIGN_INTERNALS = `Safe reassignment sequence (conceptual):

  Old Assignment [B1, B2, B3]
        ↓
  Add New Replica B4 (RF temporarily elevated / expanding set)
        ↓
  B4 ReplicaFetcher catches up (throttled!)
        ↓
  B4 enters ISR
        ↓
  Optional: move leadership (preferred / explicit) off departing broker
        ↓
  Remove Old Replica (shrink assignment)
        ↓
  Final Assignment [B1, B2, B4]

Throttle:
  leader.replication.throttled.rate / follower.replication.throttled.rate
  (and related reassignment throttle configs — verify for your version)
  Too high → ISR thrash on live traffic
  Too low → multi-day moves / prolonged URP

Failure recovery:
  Reassignment state is in metadata — resume after controller failover
  Never delete the only caught-up copies
  Watch URP, disk, BytesIn, ISR shrink during the move
  Preferred leader election after move to fix produce hotspots`;

export const ELECTION_TYPES: string[][] = [
  ['Failure leader election', 'Leader dies / fenced', 'Controller elects from ISR (or unclean if enabled)', 'Availability of the partition', 'Epoch++; brief client errors'],
  ['Preferred replica election (PLE)', 'Preferred (first) replica is not leader', 'Controller moves leadership back to preferred if in ISR', 'Balance produce load after failovers/moves', 'Should not move to out-of-ISR preferred'],
  ['Manual leader election', 'Operator / tool request', 'kafka-leader-election or Admin API', 'Ops control / targeted balance', 'Same safety rules as PLE'],
  ['Automatic leader balancing', 'Imbalance detected (if enabled/tooling)', 'Periodic preferred elections', 'Reduce hot brokers', 'Not a substitute for fixing key skew'],
];

export const ELECTION_DISTINCTION = `Failure election ≠ preferred election.

Failure election: restore a leader so the partition is writable/readable.
Preferred election: put leadership back on the preferred replica for balance.
Both go through the controller + metadata commit + leader epoch.
Neither should elect an out-of-ISR replica unless unclean is explicitly on.`;

export const STAFF_GAP_CHEATS = {
  propagation: `Commit → publish → MetadataCache → client Metadata refresh
Behind broker: serve old leaders; catch up; no local invent`,
  snapshot: `Snapshot = compacted metadata image
Load snapshot → replay tail → ready
Large clusters ⇒ large snapshots`,
  fencing: `Raft term + broker epoch + leader epoch
Zombies cannot commit metadata or append as leader`,
  features: `Supported → rolling binaries → finalize
Finalize can be one-way — plan rollback first`,
  states: `Partition: Offline → Online → Leader/Follower → Reassign → Recover
Replica: New → Catch-up → ISR → Offline → Recover → ISR`,
  reassign: `Add → catch up → ISR → move leader → remove old
Always throttle; resume from metadata after failover`,
  elections: `Failure election vs PLE vs manual vs auto-balance
All controller-driven; unclean is the only out-of-ISR path`,
};
