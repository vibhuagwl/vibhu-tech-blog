import type {PatternCard} from './types';

// ---------------------------------------------------------------------------
// Part 20 — Distributed system primitives
// ---------------------------------------------------------------------------

export const DISTRIBUTED_PATTERNS: PatternCard[] = [
  {
    id: 'leader-election',
    part: 20,
    name: 'Leader Election',
    frequency: 'Frequently used',
    definition:
      'Exactly one node in a cluster is designated leader at a time to perform singleton work — schedulers, partition assignment, or write coordination — with automatic failover when the leader dies.',
    problem:
      'Three payment-reconciliation pods all run the nightly batch → triple charges. Or zero run when all assume another is leader.',
    realWorld:
      'Kubernetes Lease API, Curator LeaderLatch, database advisory locks, Redis Redlock for cron, Kafka consumer group coordinator.',
    whyExists:
      'Distributed systems need a single decision maker for tasks that cannot be safely parallelized without coordination.',
    ascii: `Pod A ──campaign──► ┌─────────────┐
Pod B ──campaign──► │  Coordination │──► Leader: Pod B
Pod C ──campaign──► │  (etcd/K8s)   │    Followers: A, C
                    └─────────────┘`,
    flow: 'Nodes acquire lease with TTL → leader renews heartbeat → on failure lease expires → followers compete → new leader resumes work with fencing.',
    components: [
      {name: 'Candidate', responsibility: 'Attempts to acquire leadership lease'},
      {name: 'Lease store', responsibility: 'Authoritative record of current leader + expiry'},
      {name: 'Renewal loop', responsibility: 'Leader extends lease before TTL'},
      {name: 'Follower', responsibility: 'Standby; campaigns on lease loss'},
    ],
    javaCode: `package com.vibhu.distributed.leader;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

/** Minimal lease-based leader election (educational — production: K8s Lease / Curator). */
public final class LeaderElection implements AutoCloseable {

  public interface LeaseStore {
    /** Returns true if lease acquired (compare-and-set on leader id + expiry). */
    boolean tryAcquire(String nodeId, Duration ttl);
    boolean renew(String nodeId, Duration ttl);
    Optional<String> currentLeader();
  }

  public static final class InMemoryLeaseStore implements LeaseStore {
    private final AtomicReference<Lease> lease = new AtomicReference<>();

    private record Lease(String leaderId, Instant expiresAt) {
      boolean isValid(String id) {
        return leaderId.equals(id) && Instant.now().isBefore(expiresAt);
      }
      boolean expired() {
        return Instant.now().isAfter(expiresAt);
      }
    }

    @Override
    public synchronized boolean tryAcquire(String nodeId, Duration ttl) {
      Lease current = lease.get();
      if (current != null && !current.expired()) {
        return current.leaderId().equals(nodeId);
      }
      lease.set(new Lease(nodeId, Instant.now().plus(ttl)));
      return true;
    }

    @Override
    public synchronized boolean renew(String nodeId, Duration ttl) {
      Lease current = lease.get();
      if (current == null || !current.leaderId().equals(nodeId)) {
        return false;
      }
      lease.set(new Lease(nodeId, Instant.now().plus(ttl)));
      return true;
    }

    @Override
    public synchronized Optional<String> currentLeader() {
      Lease current = lease.get();
      if (current == null || current.expired()) {
        return Optional.empty();
      }
      return Optional.of(current.leaderId());
    }
  }

  private final String nodeId;
  private final LeaseStore store;
  private final Duration leaseTtl;
  private final Runnable onElectedLeader;
  private final AtomicBoolean isLeader = new AtomicBoolean(false);
  private final ScheduledExecutorService scheduler =
      Executors.newSingleThreadScheduledExecutor(r -> new Thread(r, "leader-election"));

  public LeaderElection(String nodeId, LeaseStore store, Duration leaseTtl, Runnable onElectedLeader) {
    this.nodeId = Objects.requireNonNull(nodeId);
    this.store = Objects.requireNonNull(store);
    this.leaseTtl = Objects.requireNonNull(leaseTtl);
    this.onElectedLeader = Objects.requireNonNull(onElectedLeader);
  }

  public void start() {
    scheduler.scheduleAtFixedRate(this::tick, 0, leaseTtl.dividedBy(3).toMillis(), TimeUnit.MILLISECONDS);
  }

  private void tick() {
    if (isLeader.get()) {
      if (!store.renew(nodeId, leaseTtl)) {
        isLeader.set(false);
      }
      return;
    }
    if (store.tryAcquire(nodeId, leaseTtl)) {
      if (isLeader.compareAndSet(false, true)) {
        onElectedLeader.run();
      }
    }
  }

  public boolean isLeader() {
    return isLeader.get() && store.currentLeader().map(nodeId::equals).orElse(false);
  }

  @Override
  public void close() {
    scheduler.shutdownNow();
    isLeader.set(false);
  }
}`,
    springCode: `@Component
public class ReconciliationLeaderRunner {
  private final LeaderElection election;

  public ReconciliationLeaderRunner(LeaseStore store) {
    this.election = new LeaderElection(
        InetAddress.getLocalHost().getHostName(),
        store,
        Duration.ofSeconds(15),
        this::runBatch);
    election.start();
  }

  private void runBatch() {
  // only leader executes
  reconciliationService.nightlySettlement();
  }
}`,
    unitTest: `@Test
void onlyOneLeaderAmongThreeNodes() {
  var store = new LeaderElection.InMemoryLeaseStore();
  var leaders = new ConcurrentHashMap<String, Boolean>();
  List<LeaderElection> nodes = IntStream.range(0, 3)
      .mapToObj(i -> new LeaderElection("n" + i, store, Duration.ofSeconds(1),
          () -> leaders.put("n" + i, true)))
      .toList();
  nodes.forEach(LeaderElection::start);
  await().atMost(Duration.ofSeconds(2)).until(() -> leaders.size() == 1);
  nodes.forEach(n -> { try { n.close(); } catch (Exception ignored) {} });
}`,
    edgeCases: ['GC pause longer than lease TTL → split brain without fencing', 'Clock skew between nodes'],
    failureScenarios: ['Leader dies mid-batch → new leader must resume idempotently', 'Network partition → two leaders without fencing token'],
    retry: 'Campaign retry on lease loss with random backoff.',
    idempotency: 'Leader work must be idempotent — new leader may re-run partial batch.',
    timeout: 'Lease TTL bounds max leadership staleness.',
    observability: 'Metric leader_elected{node} gauge; log leadership transitions.',
    security: 'Lease store ACL — only cluster members campaign.',
    performance: 'Renewal every TTL/3 — low overhead.',
    scalability: 'Single leader bottleneck by design — shard work if needed.',
    production: 'Use K8s coordination.k8s.io/v1 Lease or etcd with fencing tokens.',
    mistakes: ['No fencing → stale leader corrupts data', 'Non-idempotent job on failover'],
    antiPatterns: ['Cron on every pod without election', 'DB SELECT FOR UPDATE as only coordination'],
    alternatives: ['Kafka consumer group single partition', 'Database SKIP LOCKED job queue'],
    tradeoffs: 'Simplicity vs failover gap and fencing complexity.',
    interviewQs: ['Leader election without split brain?'],
    trickyQs: ['Why lease/3 renewal interval?'],
    seniorFollowUps: ['Implement fencing token check on shared store writes.'],
  },
  {
    id: 'quorum',
    part: 20,
    name: 'Quorum Read / Write',
    frequency: 'Specialized',
    definition:
      'Require R replicas to agree on read and W replicas to acknowledge write such that R + W > N for strong consistency within a replica set.',
    problem:
      'Reading from a lagging replica returns stale inventory count → oversell. Writing to minority loses data on node failure.',
    realWorld:
      'Cassandra QUORUM, Dynamo-style systems, etcd Raft majority, MongoDB write concern majority.',
    whyExists:
      'Tune consistency vs availability vs latency by choosing R and W for each operation class.',
    ascii: `N=3 replicas:  [R1] [R2] [R3]
Write QUORUM W=2: ──► R1 ✓  R2 ✓  (R3 async)
Read  QUORUM R=2: ◄── R1 + R2 agree → latest`,
    flow: 'Write contacts W nodes → ack when W succeed. Read contacts R nodes → return newest version by vector clock or timestamp.',
    components: [
      {name: 'Coordinator', responsibility: 'Routes read/write to replica set'},
      {name: 'Replica', responsibility: 'Stores versioned value'},
      {name: 'Read repair', responsibility: 'Background sync divergent replicas'},
    ],
    javaCode: `package com.vibhu.distributed.quorum;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

public final class QuorumStore {
  private final int n;
  private final int w;
  private final int r;
  private final Map<String, Map<String, VersionedValue>> replicas = new ConcurrentHashMap<>();

  public record VersionedValue(long version, String value) {}

  public QuorumStore(int n, int w, int r) {
    if (w + r <= n) throw new IllegalArgumentException("need W+R > N for strong quorum");
    this.n = n;
    this.w = w;
    this.r = r;
  }

  public boolean write(String key, String value, List<String> chosenReplicas) {
    Objects.requireNonNull(key);
    long version = System.nanoTime();
    int acks = 0;
    for (String replica : chosenReplicas) {
      if (acks >= w) break;
      replicas.computeIfAbsent(replica, k -> new ConcurrentHashMap<>())
          .merge(key, new VersionedValue(version, value), (old, neu) ->
              neu.version() > old.version() ? neu : old);
      acks++;
    }
    return acks >= w;
  }

  public String read(String key, List<String> chosenReplicas) {
    return chosenReplicas.stream()
        .map(rep -> replicas.getOrDefault(rep, Map.of()).get(key))
        .filter(Objects::nonNull)
        .max(Comparator.comparingLong(VersionedValue::version))
        .map(VersionedValue::value)
        .orElse(null);
  }
}`,
    unitTest: `@Test
void quorumWriteVisibleToQuorumRead() {
  var store = new QuorumStore(3, 2, 2);
  assertTrue(store.write("sku-1", "42", List.of("r1", "r2", "r3")));
  assertEquals("42", store.read("sku-1", List.of("r1", "r2")));
}`,
    edgeCases: ['W+R>N but async replication still has windows', 'Hinted handoff complicates semantics'],
    failureScenarios: ['Minority partition cannot write (CP)', 'Read during node recovery returns older version with ONE'],
    retry: 'Retry write on different replica set on timeout.',
    idempotency: 'Versioned writes — duplicate write with same version is noop.',
    timeout: 'Per-replica RPC timeout; coordinator fails if < W acks in budget.',
    observability: 'replica_lag, quorum_ack_count histogram.',
    security: 'Replica auth; prevent arbitrary coordinator.',
    performance: 'Latency = slowest of W or R replicas.',
    scalability: 'N fixed per shard; scale by sharding keys.',
    production: 'Use managed DB consistency levels; don\'t hand-roll for money.',
    mistakes: ['W=1 for critical writes', 'Ignoring read repair'],
    antiPatterns: ['QUORUM on cross-region 5 replicas — latency disaster'],
    alternatives: ['Leader-based replication (Postgres)', 'Eventual with CRDT'],
    tradeoffs: 'Stronger quorum = higher latency and lower write availability during partition.',
    interviewQs: ['Explain R+W>N'],
    trickyQs: ['QUORUM during network partition — who wins?'],
    seniorFollowUps: ['Sloppy quorum and hinted handoff tradeoffs.'],
  },
  {
    id: 'consistent-hashing-ring',
    part: 20,
    name: 'Consistent Hashing Ring',
    frequency: 'Frequently used',
    definition:
      'Map keys and nodes onto a hash ring so adding/removing a node only remaps K/N keys instead of full rehash.',
    problem:
      'Modulo hash `key % N` reshuffles all keys when N changes — cache stampede and session loss.',
    realWorld:
      'Redis Cluster slots, Cassandra tokens, Memcached ketama, gRPC load balancers.',
    whyExists:
      'Minimize data movement on horizontal scale while preserving sticky key→node mapping.',
    ascii: `         ring 0 ───────────────────── max
              ╱                         ╲
         node A●                    ●node C
              │    key●→ clockwise    │
              │         first node    │
         node B●──────────────────────●`,
    flow: 'Hash key → walk ring clockwise → first virtual node ≥ hash → backend.',
    components: [
      {name: 'Ring', responsibility: 'Sorted map of hash → physical node'},
      {name: 'Virtual node', responsibility: 'Multiple points per physical for even spread'},
      {name: 'Key hasher', responsibility: 'Stable SHA-256 of business key'},
    ],
    javaCode: `package com.vibhu.distributed.hashring;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

public final class ConsistentHashRing {
  private final TreeMap<Long, String> ring = new TreeMap<>();
  private final int virtualNodes;

  public ConsistentHashRing(Map<String, String> nodeIdToHost, int virtualNodes) {
    this.virtualNodes = virtualNodes;
    nodeIdToHost.forEach((id, host) -> {
      for (int v = 0; v < virtualNodes; v++) {
        ring.put(hash(id + "#" + v), id);
      }
    });
  }

  public Optional<String> locate(String key) {
    if (ring.isEmpty()) return Optional.empty();
    long h = hash(key);
    Map.Entry<Long, String> entry = ring.ceilingEntry(h);
    if (entry == null) entry = ring.firstEntry();
    return Optional.ofNullable(entry.getValue());
  }

  private static long hash(String input) {
    try {
      byte[] digest = MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8));
      long value = 0;
      for (int i = 0; i < 8; i++) value = (value << 8) | (digest[i] & 0xff);
      return value;
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }
}`,
    unitTest: `@Test
void sameKeySameNode() {
  var ring = new ConsistentHashRing(Map.of("a", "h1", "b", "h2"), 50);
  assertEquals(ring.locate("user-42"), ring.locate("user-42"));
}`,
    edgeCases: ['Hot key not fixed by hashing', 'Too few virtual nodes → skew'],
    failureScenarios: ['Node removal without handoff → misses until repopulated'],
    retry: 'On backend fail, try successor node for idempotent reads only.',
    idempotency: 'Sticky mapping helps retry same shard.',
    timeout: 'Per-backend timeout.',
    observability: 'Key distribution per node metric.',
    security: 'Predictable mapping — guard hot-key DoS.',
    performance: 'O(log V) lookup.',
    scalability: 'Hundreds of nodes with 100+ vnodes each.',
    production: 'Bounded-load consistent hashing for hot keys.',
    mistakes: ['Object.hashCode on ring', 'No vnodes'],
    antiPatterns: ['Consistent hash without stickiness need'],
    alternatives: ['Rendezvous hashing', 'Range partitioning'],
    tradeoffs: 'Minimal remapping vs hot-key risk.',
    interviewQs: ['Why virtual nodes?'],
    trickyQs: ['Rendezvous vs consistent hash failover?'],
    seniorFollowUps: ['Implement bounded-load cap per node.'],
  },
  {
    id: 'gossip',
    part: 20,
    name: 'Gossip Protocol',
    frequency: 'Occasionally used',
    definition:
      'Nodes periodically exchange state with random peers until cluster-wide information propagates epidemically — membership, failure suspicion, or config.',
    problem:
      'Central registry does not scale to 10k nodes or fails during partition. Need decentralized membership convergence.',
    realWorld:
      'Cassandra gossip, Consul serf, Akka cluster, Redis cluster meet messages.',
    whyExists:
      'O(log N) rounds to spread update with O(1) messages per node per interval — highly scalable.',
    ascii: `A ◄──► B
 ▲      ▲
 └── C ─┘     each round: pick random peer, exchange state`,
    flow: 'Each node maintains member list + version → pick random peer → merge states → suspicion after missed rounds.',
    components: [
      {name: 'Member state', responsibility: 'Id, heartbeat version, status'},
      {name: 'Dissemination', responsibility: 'Push/pull digest to peer'},
      {name: 'Failure suspicion', responsibility: 'Mark SUSPECT before DEAD'},
    ],
    javaCode: `package com.vibhu.distributed.gossip;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

public final class GossipNode implements AutoCloseable {
  public record Member(String id, long version, Instant lastSeen, String status) {}

  private final String selfId;
  private final ConcurrentHashMap<String, Member> membership = new ConcurrentHashMap<>();
  private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
  private final Random random = new Random();

  public GossipNode(String selfId) {
    this.selfId = selfId;
    membership.put(selfId, new Member(selfId, 0, Instant.now(), "ALIVE"));
  }

  public void start(List<GossipNode> peers) {
    scheduler.scheduleAtFixedRate(() -> gossipRound(peers), 0, 1, TimeUnit.SECONDS);
  }

  private void gossipRound(List<GossipNode> peers) {
    bumpSelf();
    if (peers.isEmpty()) return;
    GossipNode peer = peers.get(random.nextInt(peers.size()));
    peer.merge(membershipSnapshot());
    merge(peer.membershipSnapshot());
  }

  private void bumpSelf() {
    membership.compute(selfId, (k, m) ->
        new Member(selfId, m.version() + 1, Instant.now(), "ALIVE"));
  }

  public Map<String, Member> membershipSnapshot() {
    return Map.copyOf(membership);
  }

  public void merge(Map<String, Member> remote) {
    remote.forEach((id, remoteMember) ->
        membership.merge(id, remoteMember, (local, r) ->
            r.version() > local.version() ? r : local));
  }

  @Override
  public void close() {
    scheduler.shutdownNow();
  }
}`,
    unitTest: `@Test
void gossipSpreadsMembership() {
  var a = new GossipNode("A"); var b = new GossipNode("B");
  a.start(List.of(b)); b.start(List.of(a));
  await().until(() -> a.membershipSnapshot().containsKey("B"));
}`,
    edgeCases: ['Partition → divergent membership views', 'Slow convergence for large clusters'],
    failureScenarios: ['False suspicion on long GC'],
    retry: 'Anti-entropy full sync periodically in addition to gossip.',
    idempotency: 'Merge is commutative on version.',
    timeout: 'Suspect after missed heartbeats × factor.',
    observability: 'membership_size, gossip_round_duration.',
    security: 'Sign gossip messages in untrusted networks.',
    performance: 'Constant per-node traffic regardless of N.',
    scalability: '10k+ nodes in Cassandra-class systems.',
    production: 'Combine with strong consistency for data path; gossip for membership only.',
    mistakes: ['Using gossip for financial consensus'],
    antiPatterns: ['Gossip as only failure detector for money writes'],
    alternatives: ['Centralized registry (Eureka)', 'Raft membership'],
    tradeoffs: 'Scalable but eventually consistent membership view.',
    interviewQs: ['Gossip vs centralized registry?'],
    trickyQs: ['How long to detect failure?'],
    seniorFollowUps: ['Phi accrual failure detector on gossip heartbeats.'],
  },
  {
    id: 'heartbeat',
    part: 20,
    name: 'Heartbeat',
    frequency: 'Frequently used',
    definition:
      'Periodic signal from instance to registry or peers proving liveness — missed beats trigger eviction and traffic drain.',
    problem:
      'Load balancer sends traffic to crashed JVM still registered. Or zombie instance after long GC pause.',
    realWorld:
      'Eureka renew every 30s, K8s kubelet probes, Consul TTL check, Kafka group heartbeat.',
    whyExists:
      'Cheap liveness protocol — without it, discovery catalogs fill with dead nodes.',
    ascii: `Instance ──PUT /heartbeat──► Registry (every 30s)
         miss 3 beats ──► status=DOWN ──► LB excludes`,
    flow: 'Register on boot → schedule renew → registry evicts on expiry → clients refresh cache.',
    components: [
      {name: 'Registration', responsibility: 'Initial catalog entry'},
      {name: 'Renewal agent', responsibility: 'Scheduled heartbeat'},
      {name: 'Eviction policy', responsibility: 'TTL × missed beats'},
    ],
    javaCode: `package com.vibhu.distributed.heartbeat;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.*;

public final class HeartbeatAgent implements AutoCloseable {
  public interface Registry {
    void register(String instanceId, String host, int port);
    void renew(String instanceId);
    void deregister(String instanceId);
  }

  public static final class InMemoryRegistry implements Registry {
    private final Map<String, Instant> lastBeat = new ConcurrentHashMap<>();
    private final Duration ttl;

    public InMemoryRegistry(Duration ttl) { this.ttl = ttl; }

    @Override public void register(String id, String host, int port) {
      lastBeat.put(id, Instant.now());
    }
    @Override public void renew(String id) { lastBeat.put(id, Instant.now()); }
    @Override public void deregister(String id) { lastBeat.remove(id); }

    public boolean isAlive(String id) {
      Instant beat = lastBeat.get(id);
      return beat != null && beat.plus(ttl).isAfter(Instant.now());
    }
  }

  private final Registry registry;
  private final String instanceId;
  private final ScheduledExecutorService scheduler =
      Executors.newSingleThreadScheduledExecutor(r -> new Thread(r, "heartbeat"));

  public HeartbeatAgent(Registry registry, String instanceId) {
    this.registry = registry;
    this.instanceId = instanceId;
  }

  public void start(Duration interval) {
    scheduler.scheduleAtFixedRate(() -> registry.renew(instanceId),
        0, interval.toMillis(), TimeUnit.MILLISECONDS);
  }

  @Override public void close() {
    scheduler.shutdownNow();
    registry.deregister(instanceId);
  }
}`,
    unitTest: `@Test
void missedHeartbeatEvicts() throws Exception {
  var reg = new HeartbeatAgent.InMemoryRegistry(Duration.ofMillis(100));
  reg.register("i1", "h", 80);
  Thread.sleep(150);
  assertFalse(reg.isAlive("i1"));
}`,
    edgeCases: ['GC pause > TTL → false eviction', 'Clock skew'],
    failureScenarios: ['Registry partition — split brain registrations'],
    retry: 'Renew on transient failure; deregister on graceful shutdown.',
    idempotency: 'Renew is idempotent.',
    timeout: 'TTL typically 3× heartbeat interval.',
    observability: 'heartbeat_missed_total, registry_size.',
    security: 'Authenticate renew requests.',
    performance: 'Negligible CPU; watch registry write QPS at scale.',
    scalability: 'Eureka self-preservation mode at mass eviction.',
    production: 'Graceful shutdown hook deregister; readiness != liveness.',
    mistakes: ['Same TTL for liveness and readiness', 'No deregister on SIGTERM'],
    antiPatterns: ['Heartbeat without health check of dependencies'],
    alternatives: ['Passive TCP health from LB', 'Service mesh outlier detection'],
    tradeoffs: 'Fast detection vs false positives on pause.',
    interviewQs: ['Heartbeat interval vs TTL?'],
    trickyQs: ['Eureka self-preservation — why?'],
    seniorFollowUps: ['Design readiness that fails when Kafka lag high.'],
  },
  {
    id: 'failure-detector',
    part: 20,
    name: 'Failure Detector',
    frequency: 'Occasionally used',
    definition:
      'Module that outputs suspicion level that a process has crashed — from simple timeouts to phi-accrual statistical detectors.',
    problem:
      'Fixed timeout too short → false alarms; too long → slow failover.',
    realWorld:
      'Akka phi-accrual, Cassandra failure detector, JVM watchdog threads.',
    whyExists:
      'Adapt detection delay to network jitter and load — fewer false positives than naive timeout.',
    ascii: `heartbeats ──► φ accrual ──► φ > threshold ? SUSPECT : ALIVE`,
    flow: 'Record inter-arrival times → estimate distribution → compute phi → trigger suspect callback.',
    components: [
      {name: 'Heartbeat stream', responsibility: 'Incoming signals'},
      {name: 'Phi calculator', responsibility: 'Statistical suspicion'},
      {name: 'State machine', responsibility: 'ALIVE → SUSPECT → DEAD'},
    ],
    javaCode: `package com.vibhu.distributed.failuredetector;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

/** Simplified timeout-based failure detector (phi-accrual simplified). */
public final class FailureDetector {
  public enum State { ALIVE, SUSPECT, DEAD }

  private final Duration suspectAfter;
  private final Duration deadAfter;
  private final AtomicReference<Instant> lastHeartbeat = new AtomicReference<>(Instant.now());
  private volatile State state = State.ALIVE;

  public FailureDetector(Duration suspectAfter, Duration deadAfter) {
    this.suspectAfter = suspectAfter;
    this.deadAfter = deadAfter;
  }

  public void heartbeat() {
    lastHeartbeat.set(Instant.now());
    state = State.ALIVE;
  }

  public State evaluate() {
    Duration silent = Duration.between(lastHeartbeat.get(), Instant.now());
    if (silent.compareTo(deadAfter) > 0) state = State.DEAD;
    else if (silent.compareTo(suspectAfter) > 0) state = State.SUSPECT;
    else state = State.ALIVE;
    return state;
  }
}`,
    unitTest: `@Test
void transitionsToSuspectThenDead() throws Exception {
  var fd = new FailureDetector(Duration.ofMillis(50), Duration.ofMillis(150));
  fd.heartbeat();
  Thread.sleep(80);
  assertEquals(FailureDetector.State.SUSPECT, fd.evaluate());
  Thread.sleep(100);
  assertEquals(FailureDetector.State.DEAD, fd.evaluate());
}`,
    edgeCases: ['Phi sensitive to bimodal latency'], failureScenarios: ['SUSPECT triggers unnecessary failover'],
    retry: 'N/A — detector is passive.', idempotency: 'N/A',
    timeout: 'Tunable suspect/dead thresholds.',
    observability: 'fd_state, phi_value gauge.',
    security: 'N/A',
    performance: 'O(1) per evaluate tick.',
    scalability: 'Per-member detector in O(members) memory.',
    production: 'Use Akka/Cassandra implementations; avoid hand-roll for consensus.',
    mistakes: ['Single global timeout for all deps'],
    antiPatterns: ['DEAD on first missed beat'],
    alternatives: ['Phi accrual', 'SWIM protocol'],
    tradeoffs: 'Adaptive detection vs implementation complexity.',
    interviewQs: ['Suspect vs dead state?'],
    trickyQs: ['Phi accrual intuition?'],
    seniorFollowUps: ['Tune detector for K8s pod eviction alignment.'],
  },
  {
    id: 'lease-primitive',
    part: 20,
    name: 'Lease Primitive',
    frequency: 'Frequently used',
    definition:
      'Time-bounded grant of exclusive or shared access to a resource — holder must renew before expiry or lose rights.',
    problem:
      'Worker crashes holding lock forever. Or two workers think they own the same partition.',
    realWorld:
      'K8s Lease API, HDFS leases, S3 object lock, distributed lock with TTL.',
    whyExists:
      'Automatic release on crash without manual unlock — safety bound by lease duration.',
    ascii: `Client ──acquire(lease 30s)──► Store
       │ renew every 10s
       └── expire ──► another client may acquire`,
    flow: 'Acquire if free or expired → work → renew loop → release or let expire.',
    components: [
      {name: 'Lease record', responsibility: 'holder + expiry epoch'},
      {name: 'Renewal', responsibility: 'Extend before TTL'},
      {name: 'Fencing token', responsibility: 'Optional monotonic token on grant'},
    ],
    javaCode: `package com.vibhu.distributed.lease;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

public final class LeaseManager {
  public record Lease(String holder, long fenceToken, Instant expiresAt) {
    boolean valid(String h) {
      return holder.equals(h) && Instant.now().isBefore(expiresAt);
    }
  }

  private final AtomicReference<Lease> current = new AtomicReference<>();
  private final AtomicLong fenceSeq = new AtomicLong();

  public synchronized Optional<Lease> acquire(String holder, Duration ttl) {
    Lease existing = current.get();
    if (existing != null && existing.expiresAt().isAfter(Instant.now())) {
      return Optional.empty();
    }
    Lease lease = new Lease(holder, fenceSeq.incrementAndGet(), Instant.now().plus(ttl));
    current.set(lease);
    return Optional.of(lease);
  }

  public synchronized boolean renew(String holder, Duration ttl) {
    Lease existing = current.get();
    if (existing == null || !existing.holder().equals(holder)) return false;
    current.set(new Lease(holder, existing.fenceToken(), Instant.now().plus(ttl)));
    return true;
  }

  public synchronized Optional<Lease> current() {
    Lease l = current.get();
    if (l == null || l.expiresAt().isBefore(Instant.now())) return Optional.empty();
    return Optional.of(l);
  }
}`,
    unitTest: `@Test
void leaseExpiresAndReacquired() throws Exception {
  var mgr = new LeaseManager();
  assertTrue(mgr.acquire("A", Duration.ofMillis(50)).isPresent());
  Thread.sleep(60);
  assertTrue(mgr.acquire("B", Duration.ofMillis(50)).isPresent());
}`,
    edgeCases: ['Renewal fails silently → work continues unsafely'], failureScenarios: ['Stale holder after partition'],
    retry: 'Backoff on acquire failure.',
    idempotency: 'Acquire after expiry is safe.',
    timeout: 'Lease TTL is the timeout of ownership.',
    observability: 'lease_holder, renew_failures.',
    security: 'Validate holder identity on renew.',
    performance: 'Renewal traffic vs TTL tradeoff.',
    scalability: 'One lease per resource; shard resources.',
    production: 'Always pair with fencing token for writes.',
    mistakes: ['Long TTL without renew', 'No fence on storage write'],
    antiPatterns: ['Lease as mutex without verifying fence at store'],
    alternatives: ['Redlock', 'DB advisory lock'],
    tradeoffs: 'Auto-release vs false expiry under pause.',
    interviewQs: ['Lease vs lock?'],
    trickyQs: ['What if renew RPC succeeds but response lost?'],
    seniorFollowUps: ['Design fence check in object storage PUT.'],
  },
  {
    id: 'fencing-token-primitive',
    part: 20,
    name: 'Fencing Token',
    frequency: 'Rare but interview-important',
    definition:
      'Monotonically increasing token issued with each lock grant — storage rejects writes with token older than last seen.',
    problem:
      'Stale lock holder resumes after pause and overwrites new leader\'s data — classic distributed lock bug.',
    realWorld:
      'Martin Kleppmann\'s fenced writers, ZooKeeper sequential nodes, some object stores conditional on version.',
    whyExists:
      'Lock alone cannot prevent delayed writes from zombie processes — storage must validate token.',
    ascii: `Lock svc:  grant fence=42 to A
Store:       last_fence=41 → accept 42
A pauses... B gets fence=43, writes OK
A wakes, writes fence=42 → REJECTED`,
    flow: 'Lock service increments token on each grant → client attaches to write → store compare-and-set on token.',
    components: [
      {name: 'Token issuer', responsibility: 'Monotonic counter per resource'},
      {name: 'Fenced writer', responsibility: 'Attach token to mutation'},
      {name: 'Storage guard', responsibility: 'Reject token ≤ last committed'},
    ],
    javaCode: `package com.vibhu.distributed.fencing;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public final class FencingTokenService {
  private final AtomicLong seq = new AtomicLong();

  public long grant() {
    return seq.incrementAndGet();
  }
}

public final class FencedObjectStore {
  private final Map<String, Long> lastToken = new ConcurrentHashMap<>();
  private final Map<String, String> data = new ConcurrentHashMap<>();

  public boolean write(String key, long fenceToken, String value) {
    long last = lastToken.getOrDefault(key, 0L);
    if (fenceToken <= last) {
      return false; // stale writer fenced out
    }
    lastToken.put(key, fenceToken);
    data.put(key, value);
    return true;
  }

  public String read(String key) {
    return data.get(key);
  }
}`,
    unitTest: `@Test
void staleTokenRejected() {
  var store = new FencedObjectStore();
  assertTrue(store.write("k", 2, "B"));
  assertFalse(store.write("k", 1, "A-stale"));
  assertEquals("B", store.read("k"));
}`,
    edgeCases: ['Token overflow theoretical at 2^63'], failureScenarios: ['Store doesn\'t check token — fencing useless'],
    retry: 'Stale writer must re-acquire lock with new token.',
    idempotency: 'Same token + same value write is idempotent.',
    timeout: 'Lock TTL bounds stale writer window.',
    observability: 'fenced_write_rejected_total.',
    security: 'Token not guessable if exposed — use server-side only.',
    performance: 'Single atomic compare per write.',
    scalability: 'Per-key token sequence.',
    production: 'Mandatory with any TTL-based lock used for storage writes.',
    mistakes: ['Redis lock without Lua fence check'],
    antiPatterns: ['Distributed lock + blind S3 PUT'],
    alternatives: ['Version column optimistic locking', 'Single writer per partition'],
    tradeoffs: 'Requires storage layer cooperation — not just client library.',
    interviewQs: ['Why lock without fencing fails?'],
    trickyQs: ['Draw timeline of stale leader write.'],
    seniorFollowUps: ['Implement fence in PostgreSQL UPDATE WHERE fence < ?'],
  },
  {
    id: 'distributed-scheduler',
    part: 20,
    name: 'Distributed Scheduler',
    frequency: 'Occasionally used',
    definition:
      'Cluster-safe cron — exactly one instance runs a scheduled job per tick, with misfire policy and idempotent execution.',
    problem:
      '@Scheduled on every pod fires N times. Or zero times after leader crash without failover.',
    realWorld:
      'ShedLock + Spring @Scheduled, Quartz cluster, K8s CronJob, Temporal schedules.',
    whyExists:
      'Combine leader election with job semantics for reliable background work in horizontally scaled services.',
    ascii: `T=00:00 ──► Leader pod runs job
T=00:05 ──► Followers skip (lock held)
Leader dies ──► new leader runs next tick`,
    flow: 'Acquire ShedLock → execute job → release; lockAtMostFor prevents stuck lock.',
    components: [
      {name: 'Scheduler trigger', responsibility: 'Cron expression firing'},
      {name: 'Distributed lock', responsibility: 'Single runner guarantee'},
      {name: 'Job handler', responsibility: 'Idempotent business logic'},
    ],
    javaCode: `package com.vibhu.distributed.scheduler;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.*;

public final class DistributedScheduler implements AutoCloseable {
  public interface JobLock {
    Optional<String> tryLock(String jobName, Duration lockAtMost);
    void unlock(String jobName, String owner);
  }

  public static final class DbJobLock implements JobLock {
  // INSERT INTO shedlock(name, locked_by, locked_at, lock_until) ...
  // ON CONFLICT DO UPDATE WHERE lock_until < now()
    private final ConcurrentHashMap<String, String> locks = new ConcurrentHashMap<>();
    @Override
    public Optional<String> tryLock(String jobName, Duration lockAtMost) {
      String owner = "node-" + Thread.currentThread().threadId();
      return locks.putIfAbsent(jobName, owner) == null ? Optional.of(owner) : Optional.empty();
    }
    @Override public void unlock(String jobName, String owner) {
      locks.computeIfPresent(jobName, (k, v) -> v.equals(owner) ? null : v);
    }
  }

  private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
  private final JobLock lock;
  private final String jobName;
  private final Runnable job;

  public DistributedScheduler(JobLock lock, String jobName, Runnable job) {
    this.lock = lock;
    this.jobName = jobName;
    this.job = job;
  }

  public void start(Duration period) {
    scheduler.scheduleAtFixedRate(this::runIfLeader, 0, period.toMillis(), TimeUnit.MILLISECONDS);
  }

  private void runIfLeader() {
    Optional<String> owner = lock.tryLock(jobName, Duration.ofMinutes(5));
    owner.ifPresent(o -> {
      try {
        job.run();
      } finally {
        lock.unlock(jobName, o);
      }
    });
  }

  @Override public void close() { scheduler.shutdownNow(); }
}`,
    springCode: `@Scheduled(cron = "0 0 2 * * *")
@SchedulerLock(name = "nightlySettlement", lockAtMostFor = "30m", lockAtLeastFor = "5m")
public void settle() {
  settlementService.run();
}`,
    unitTest: `@Test
void onlyOneRunnerExecutes() throws Exception {
  var latch = new CountDownLatch(1);
  var lock = new DistributedScheduler.DbJobLock();
  var s1 = new DistributedScheduler(lock, "job", latch::countDown);
  var s2 = new DistributedScheduler(lock, "job", latch::countDown);
  s1.start(Duration.ofMillis(50));
  s2.start(Duration.ofMillis(50));
  assertTrue(latch.await(2, TimeUnit.SECONDS));
}`,
    edgeCases: ['Job longer than lockAtMostFor → double run'], failureScenarios: ['Crash before unlock — wait lockAtMostFor'],
    retry: 'Misfire policy: run once or skip.', idempotency: 'Job body must tolerate duplicate.',
    timeout: 'lockAtMostFor caps stuck execution.',
    observability: 'job_last_success, lock_contention.',
    security: 'Lock store credentials scoped.',
    performance: 'One runner — scale by sharding job names.',
    scalability: 'Shard settlement by region key.',
    production: 'ShedLock JDBC + UTC cron; monitor misfires.',
    mistakes: ['No lockAtMostFor', 'Non-idempotent side effects'],
    antiPatterns: ['@Scheduled on all replicas'],
    alternatives: ['K8s CronJob', 'Temporal workflow schedule'],
    tradeoffs: 'App-level scheduler vs platform CronJob ops model.',
    interviewQs: ['ShedLock vs K8s CronJob?'],
    trickyQs: ['lockAtLeastFor purpose?'],
    seniorFollowUps: ['Design settlement sharded by merchantId.'],
  },
  {
    id: 'distributed-id-generation',
    part: 20,
    name: 'Distributed ID Generation',
    frequency: 'Frequently used',
    definition:
      'Generate unique identifiers across many nodes without central DB sequence bottleneck — UUID, Snowflake, DB hi-lo, or lease-based ranges.',
    problem:
      'AUTO_INCREMENT on single MySQL becomes write hotspot and single point of failure at 10k+ inserts/sec.',
    realWorld:
      'Twitter Snowflake, Instagram ID shards, UUID v7, PostgreSQL sequences per service, Leaf (Meituan).',
    whyExists:
      'Decentralized ID issuance scales writes and enables sortable IDs for indexing.',
    ascii: `Option A: UUID random (no coord)
Option B: Snowflake (time + machine + seq)
Option C: DB range lease (bulk fetch 1000 ids)`,
    flow: 'Choose strategy by sortability and ops tolerance → embed in entity before insert.',
    components: [
      {name: 'Id generator', responsibility: 'Produce next ID'},
      {name: 'Machine ID allocator', responsibility: 'Unique worker id for Snowflake'},
      {name: 'Clock source', responsibility: 'Monotonic millis for time-based IDs'},
    ],
    javaCode: `package com.vibhu.distributed.id;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public final class DistributedIdGenerators {

  /** Random UUID — no coordination, not time-sortable. */
  public static String randomUuid() {
    return UUID.randomUUID().toString();
  }

  /** DB hi-lo style: allocate range from DB every N ids. */
  public static final class RangeIdGenerator {
    private final AtomicLong next = new AtomicLong();
    private final AtomicLong ceiling = new AtomicLong();
    private final int batchSize;
    private final RangeAllocator allocator;

    public interface RangeAllocator {
      long allocateBlock(int size); // returns start of block
    }

    public RangeIdGenerator(int batchSize, RangeAllocator allocator) {
      this.batchSize = batchSize;
      this.allocator = allocator;
    }

    public long nextId() {
      long id = next.getAndIncrement();
      if (id >= ceiling.get()) {
        synchronized (this) {
          if (next.get() >= ceiling.get()) {
            long start = allocator.allocateBlock(batchSize);
            next.set(start);
            ceiling.set(start + batchSize);
          }
          id = next.getAndIncrement();
        }
      }
      return id;
    }
  }
}`,
    unitTest: `@Test
void rangeGeneratorUnique() {
  var gen = new DistributedIdGenerators.RangeIdGenerator(100, size -> 1000L);
  assertNotEquals(gen.nextId(), gen.nextId());
}`,
    edgeCases: ['UUID v4 index fragmentation in B-tree'], failureScenarios: ['Range allocator down — cannot insert'],
    retry: 'Retry range fetch on DB timeout.', idempotency: 'IDs always new — not for idempotency keys.',
    timeout: 'Range fetch timeout fails create path.',
    observability: 'id_batch_fetch_latency, clock_drift.',
    security: 'Predictable IDs leak volume — use opaque UUID for public.',
    performance: 'Snowflake ~4096/ms per machine; UUID no coord.',
    scalability: 'Snowflake scales horizontally with machine IDs.',
    production: 'Prefer UUID v7 or Snowflake for sortable; document clock sync.',
    mistakes: ['Snowflake without NTP', 'Public sequential IDs'],
    antiPatterns: ['Single global DB sequence for all services'],
    alternatives: ['Snowflake', 'UUID v7', 'ULID'],
    tradeoffs: 'Sortable vs coordination-free vs opacity.',
    interviewQs: ['Snowflake vs UUID?'],
    trickyQs: ['Clock backward jump on Snowflake?'],
    seniorFollowUps: ['Design Leaf segment DB mode.'],
  },
  {
    id: 'snowflake-id',
    part: 20,
    name: 'Snowflake ID',
    frequency: 'Frequently used',
    definition:
      '64-bit ID: timestamp (ms) + datacenterId + workerId + per-ms sequence — roughly time-ordered and unique cluster-wide.',
    problem:
      'Need Twitter-scale ordered IDs without central DB round-trip per insert.',
    realWorld:
      'Twitter Snowflake, Discord, many payment ledger entry ids (internal).',
    whyExists:
      'Sortable by time aids B-tree locality; 4096 ids/ms per worker in classic layout.',
    ascii: `| 41 bit timestamp | 5 dc | 5 worker | 12 sequence |`,
    flow: 'Same ms → increment sequence; new ms → sequence=0; wait if sequence overflow in same ms.',
    components: [
      {name: 'Epoch', responsibility: 'Custom epoch offset saves bits'},
      {name: 'Worker registry', responsibility: 'Assign unique workerId'},
      {name: 'Sequence', responsibility: 'Per-millisecond counter'},
    ],
    javaCode: `package com.vibhu.distributed.snowflake;

public final class SnowflakeIdGenerator {
  private static final long EPOCH = 1_704_067_200_000L; // 2024-01-01
  private static final int WORKER_BITS = 5;
  private static final int DC_BITS = 5;
  private static final int SEQ_BITS = 12;

  private final long workerId;
  private final long dcId;
  private long lastTs = -1L;
  private long sequence = 0L;

  public SnowflakeIdGenerator(long dcId, long workerId) {
    if (dcId < 0 || dcId >= (1 << DC_BITS)) throw new IllegalArgumentException("dcId");
    if (workerId < 0 || workerId >= (1 << WORKER_BITS)) throw new IllegalArgumentException("workerId");
    this.dcId = dcId;
    this.workerId = workerId;
  }

  public synchronized long nextId() {
    long ts = System.currentTimeMillis();
    if (ts < lastTs) throw new IllegalStateException("clock moved backwards");
    if (ts == lastTs) {
      sequence = (sequence + 1) & ((1 << SEQ_BITS) - 1);
      if (sequence == 0) ts = waitNextMillis(lastTs);
    } else {
      sequence = 0;
    }
    lastTs = ts;
    return ((ts - EPOCH) << (WORKER_BITS + DC_BITS + SEQ_BITS))
        | (dcId << (WORKER_BITS + SEQ_BITS))
        | (workerId << SEQ_BITS)
        | sequence;
  }

  private long waitNextMillis(long last) {
    long ts = System.currentTimeMillis();
    while (ts <= last) ts = System.currentTimeMillis();
    return ts;
  }
}`,
    unitTest: `@Test
void idsIncreaseOverTime() throws Exception {
  var gen = new SnowflakeIdGenerator(1, 1);
  long a = gen.nextId();
  Thread.sleep(2);
  long b = gen.nextId();
  assertTrue(b > a);
}`,
    edgeCases: ['4096+ ids in one ms → spin wait', 'Clock skew across DCs'],
    failureScenarios: ['Duplicate workerId → collision catastrophe'],
    retry: 'N/A on generation.', idempotency: 'New id each call.',
    timeout: 'waitNextMillis blocks under extreme TPS.',
    observability: 'snowflake_clock_backward_total.',
    security: 'Ids enumerable — don\'t expose as auth tokens.',
    performance: 'Synchronized per JVM — shard generators if needed.',
    scalability: '1024 workers per DC × 4096/ms.',
    production: 'Zookeeper worker id assignment; monitor NTP.',
    mistakes: ['Duplicate workerId', 'No backward clock handling'],
    antiPatterns: ['Snowflake as client-facing opaque token'],
    alternatives: ['UUID v7', 'Sonyflake variant'],
    tradeoffs: 'Sortable + fast vs clock dependency.',
    interviewQs: ['Snowflake bit layout?'],
    trickyQs: ['Same millisecond sequence overflow?'],
    seniorFollowUps: ['Parse Snowflake id back to timestamp.'],
  },
  {
    id: 'lamport-clock',
    part: 20,
    name: 'Lamport Clock',
    frequency: 'Specialized',
    definition:
      'Logical clock: each event increments counter; on receive max(local, message)+1 — gives causal ordering without synchronized wall clocks.',
    problem:
      'Event A causes B but wall clocks show B before A — cannot determine order in distributed audit log.',
    realWorld:
      'Dynamo-style versioning hints, some CRDT metadata, teaching foundation for vector clocks.',
    whyExists:
      'Captures happens-before for single-writer chains; lightweight compared to vector clocks.',
    ascii: `A: local=1 send(m,1)
B: receive max(0,1)+1=2 send(ack,2)
C: receive max(0,2)+1=3`,
    flow: 'On local event: L++. On message: L = max(L, msgTs) + 1.',
    components: [
      {name: 'Local counter', responsibility: 'Lamport timestamp'},
      {name: 'Message envelope', responsibility: 'Carries timestamp'},
    ],
    javaCode: `package com.vibhu.distributed.lamport;

import java.util.concurrent.atomic.AtomicLong;

public final class LamportClock {
  private final AtomicLong time = new AtomicLong(0);

  public long tick() {
    return time.incrementAndGet();
  }

  public long onReceive(long sentTime) {
    long now;
    long next;
    do {
      now = time.get();
      next = Math.max(now, sentTime) + 1;
    } while (!time.compareAndSet(now, next));
    return next;
  }

  public long current() {
    return time.get();
  }
}`,
    unitTest: `@Test
void receiveUpdatesClock() {
  var clock = new LamportClock();
  clock.tick();
  long t = clock.onReceive(10);
  assertTrue(t >= 11);
}`,
    edgeCases: ['Concurrent events have same Lamport time — not concurrent detection'],
    failureScenarios: ['Used alone for conflict resolution — insufficient'],
    retry: 'N/A', idempotency: 'N/A',
    timeout: 'N/A',
    observability: 'Attach lamport_ts to domain events.',
    security: 'N/A',
    performance: 'O(1) atomic ops.',
    scalability: 'Per-process clock; merge on message.',
    production: 'Pair with vector clock or version for concurrency detection.',
    mistakes: ['Lamport total order assumed for concurrent events'],
    antiPatterns: ['Lamport as DB primary key'],
    alternatives: ['Vector clock', 'Hybrid logical clock'],
    tradeoffs: 'Simple causal order vs cannot detect concurrent writes.',
    interviewQs: ['Lamport vs wall clock?'],
    trickyQs: ['Two concurrent events — Lamport order?'],
    seniorFollowUps: ['Upgrade to vector clock for replica merge.'],
  },
  {
    id: 'vector-clock',
    part: 20,
    name: 'Vector Clock',
    frequency: 'Specialized',
    definition:
      'Per-node counter vector attached to each event — compare vectors to detect concurrent vs ordered events for conflict resolution.',
    problem:
      'Two replicas accept conflicting updates offline — need detect concurrency not just total order.',
    realWorld:
      'Dynamo/Riak vector clocks (later replaced by dotted version vectors in some systems), Riak siblings, CRDT research.',
    whyExists:
      'Detect when events are concurrent (incomparable vectors) vs strictly before/after.',
    ascii: `Replica A: [A:2, B:1]
Replica B: [A:1, B:3]
Compare: A dominates? concurrent? → merge policy`,
    flow: 'Increment own index on local write → merge component-wise max on receive → compare for dominance.',
    components: [
      {name: 'Vector', responsibility: 'Map nodeId → logical time'},
      {name: 'Dominance test', responsibility: 'v1 < v2 if all ≤ and one <'},
      {name: 'Merge policy', responsibility: 'LWW or application merge on concurrent'},
    ],
    javaCode: `package com.vibhu.distributed.vectorclock;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public final class VectorClock {
  private final String nodeId;
  private final Map<String, Long> vector = new HashMap<>();

  public VectorClock(String nodeId) {
    this.nodeId = Objects.requireNonNull(nodeId);
    vector.put(nodeId, 0L);
  }

  public Map<String, Long> increment() {
    vector.merge(nodeId, 1L, Long::sum);
    return Map.copyOf(vector);
  }

  public void merge(Map<String, Long> remote) {
    remote.forEach((k, v) -> vector.merge(k, v, Math::max));
    vector.merge(nodeId, 1L, Long::sum);
  }

  public static boolean isConcurrent(Map<String, Long> a, Map<String, Long> b) {
    boolean aLess = false, bLess = false;
    var keys = new java.util.HashSet<String>();
    keys.addAll(a.keySet());
    keys.addAll(b.keySet());
    for (String k : keys) {
      long av = a.getOrDefault(k, 0L);
      long bv = b.getOrDefault(k, 0L);
      if (av < bv) aLess = true;
      if (bv < av) bLess = true;
    }
    return aLess && bLess;
  }
}`,
    unitTest: `@Test
void detectsConcurrency() {
  var v1 = Map.of("A", 2L, "B", 1L);
  var v2 = Map.of("A", 1L, "B", 3L);
  assertTrue(VectorClock.isConcurrent(v1, v2));
}`,
    edgeCases: ['Vector size grows with replica count'], failureScenarios: ['Sibling explosion in Riak'],
    retry: 'N/A', idempotency: 'Merge function must be commutative.',
    timeout: 'N/A',
    observability: 'vector_clock_size, concurrent_write_total.',
    security: 'N/A',
    performance: 'O(nodes) per compare — cap replicas or use dotted vectors.',
    scalability: 'Limited to small replica sets; use version vectors in prod.',
    production: 'Prefer CRDT or LWW with business merge for high replica count.',
    mistakes: ['Unbounded siblings'], antiPatterns: ['Vector clock with 1000 nodes'],
    alternatives: ['Dotted version vectors', 'Last-write-wins with wall clock'],
    tradeoffs: 'Precise concurrency detection vs metadata size.',
    interviewQs: ['Vector vs Lamport?'],
    trickyQs: ['What are siblings in Riak?'],
    seniorFollowUps: ['Design merge for shopping cart concurrent adds.'],
  },
];

// ---------------------------------------------------------------------------
// Part 21 — Anti-patterns → refactors
// ---------------------------------------------------------------------------

export const ANTI_PATTERN_CARDS: PatternCard[] = [
  {
    id: 'distributed-monolith',
    part: 21,
    name: 'Distributed Monolith',
    frequency: 'Legacy',
    definition:
      'Services deployed separately but must release together — shared DB, sync chains, no true bounded context isolation.',
    problem:
      'Worst of both worlds: microservices ops overhead without independent deployability or team autonomy.',
    realWorld:
      'Enterprise “microservices” on one Oracle schema; 15 services in one docker-compose mandatory version set.',
    whyExists:
      'Incremental extraction stopped halfway — boundaries drawn on paper only.',
    ascii: `Svc A ──sync──► Svc B ──sync──► Svc C
  │                │                │
  └────────────────┴────────────────┘
              ONE shared database`,
    flow: 'Any schema change requires coordinated 15-service deploy — integration tests take hours.',
    components: [
      {name: 'Shared DB', responsibility: 'Hidden coupling'},
      {name: 'Sync mesh', responsibility: 'Runtime coupling'},
      {name: 'Shared DTO jar', responsibility: 'Compile-time coupling'},
    ],
    javaCode: `// BAD: Order service reaches into Payment tables directly
@Repository
public class BadOrderDao {
  @Autowired JdbcTemplate jdbc; // points at SHARED monolith DB

  public void placeOrder(Order o) {
    jdbc.update("INSERT INTO orders ...", ...);
    // cross-schema FK violation waiting to happen
    jdbc.update("INSERT INTO payments.ledger ...", o.amount()); // WRONG bounded context
    jdbc.update("UPDATE inventory.stock SET qty=qty-?", o.sku()); // WRONG
  }
}`,
    springCode: `// BETTER: Order owns orders_db; calls Payment API + publishes events
@Service
@Transactional
public class OrderService {
  private final OrderRepository orders;
  private final OutboxPublisher outbox;
  private final PaymentClient payments; // HTTP with timeout+CB

  public OrderId place(OrderRequest req) {
    Order order = orders.save(Order.pending(req));
    outbox.publish(new OrderCreatedEvent(order.id(), req.amount(), req.idempotencyKey()));
    return order.id();
  }
}`,
    alternatives: ['Finish DB split per service', 'Introduce Kafka choreography', 'Strangler fig extract one BC at a time'],
    tradeoffs: 'Refactor is multi-quarter; staying costs daily deploy pain and outage blast radius.',
    unitTest: 'N/A — organizational test: can one team deploy Friday without others?',
    edgeCases: ['Distributed monolith with Kubernetes — still monolith logically'],
    failureScenarios: ['One slow sync call in chain takes down checkout'],
    retry: 'Retry storm across 5 sync hops — disaster', idempotency: 'Missing — duplicate charges',
    timeout: 'Often missing on internal REST', observability: 'Blame game across 15 repos',
    security: 'Shared DB credentials everywhere', performance: 'Latency sums across chain',
    scalability: 'Scale one service requires scale all', production: 'Freeze features; fix boundaries first',
    mistakes: ['Drawing microservices diagram without DB split'],
    antiPatterns: ['Add API gateway and call it done'],
    interviewQs: ['Signals of distributed monolith?'],
    trickyQs: ['Measure deploy coupling metric?'],
    seniorFollowUps: ['90-day plan to extract Payment BC.'],
  },
  {
    id: 'shared-db-antipattern',
    part: 21,
    name: 'Shared Database',
    frequency: 'Legacy',
    definition:
      'Multiple microservices read/write the same database schema — defeats independent evolution and creates distributed lock-in.',
    problem:
      'Inventory service schema change breaks Order service SELECT * query in production.',
    realWorld:
      'Classic SOA anti-pattern; “we’ll split later” that never happens.',
    whyExists:
      'Short-term convenience of JOINs and FKs across former monolith modules.',
    ascii: `OrderSvc ──┐
PaymentSvc ├──► PostgreSQL (one schema)
Inventory ─┘`,
    flow: 'Schema migration in one service requires downtime window for all consumers of shared tables.',
    components: [
      {name: 'Shared schema', responsibility: 'Couples all services to one DDL timeline'},
      {name: 'Cross-service SQL', responsibility: 'Breaks bounded context encapsulation'},
      {name: 'DB credentials', responsibility: 'Over-shared across deployables'},
    ],
    javaCode: `// BAD: Payment service queries customer PII from shared users table
public BigDecimal calculateFee(String customerId) {
  User u = jdbc.queryForObject(
      "SELECT tier, country FROM shared.users WHERE id=?",
      User.class, customerId); // couples to Order's schema
  return feeRules.forTier(u.tier());
}`,
    springCode: `// BETTER: Payment calls Customer API (cached) or consumes CustomerUpdated events
@Service
public class PaymentFeeService {
  private final CustomerClient customers; // resilience wrapped

  public BigDecimal calculateFee(String customerId) {
    CustomerView c = customers.get(customerId); // owns its cache
    return feeRules.forTier(c.tier());
  }
}`,
    alternatives: ['Database per service', 'CQRS read model fed by events', 'API composition at BFF'],
    tradeoffs: 'Lose ad-hoc JOIN; gain team velocity and independent scale.',
    unitTest: '@DataJpaTest with only payments schema — fails if shared tables referenced',
    edgeCases: ['Read replica shared still couples writes'],
    failureScenarios: ['Migration lock blocks all services'],
    retry: 'N/A', idempotency: 'N/A', timeout: 'N/A', observability: 'N/A',
    security: 'Over-privileged DB users', performance: 'Connection pool contention',
    scalability: 'Cannot shard one service\'s data', production: 'Expand-contract column rename across services impossible',
    mistakes: ['Foreign keys across services via shared DB'],
    antiPatterns: ['Synonym views as “decoupling”'],
    interviewQs: ['Report query without shared DB?'],
    trickyQs: ['Transactional consistency after DB split?'],
    seniorFollowUps: ['Zero-downtime split inventory tables.'],
  },
  {
    id: 'chatty-services',
    part: 21,
    name: 'Chatty Services',
    frequency: 'Frequently used',
    definition:
      'One user request triggers dozens of synchronous internal HTTP calls — latency and failure probability multiply.',
    problem:
      'Checkout calls Customer, Inventory, Pricing, Tax, Shipping, Promo, Fraud — 7 sequential RTTs × 5ms = 35ms minimum before work.',
    realWorld:
      'Mobile app backend orchestrating microservices per screen field.',
    whyExists:
      'Naïve 1:1 mapping of monolith method calls to HTTP without aggregation.',
    ascii: `Gateway ──► Order ──► Cust
              │         ──► Inv
              │         ──► Price
              │         ──► Tax
              └── 7 sequential hops`,
    flow: 'Mobile screen load triggers N sequential internal REST calls — p99 latency is sum of hops.',
    components: [
      {name: 'Orchestrator service', responsibility: 'Calls many deps per request'},
      {name: 'Downstream APIs', responsibility: 'Each adds RTT + failure point'},
      {name: 'Thread pool', responsibility: 'Blocked waiting on chain'},
    ],
    javaCode: `// BAD: sequential chatty calls in OrderService
public CheckoutView checkout(String id) {
  Customer c = customerClient.get(id);      // RTT 1
  Inventory i = inventoryClient.get(sku);     // RTT 2
  Price p = pricingClient.get(sku);           // RTT 3
  Tax t = taxClient.calc(c.country(), p);     // RTT 4
  // ... user waits for sum of all
}`,
    springCode: `// BETTER: parallel CompletableFuture or BFF aggregation
public CheckoutView checkout(String id) {
  var c = CompletableFuture.supplyAsync(() -> customerClient.get(id));
  var i = CompletableFuture.supplyAsync(() -> inventoryClient.get(sku));
  var p = CompletableFuture.supplyAsync(() -> pricingClient.get(sku));
  return CompletableFuture.allOf(c, i, p)
      .thenApply(v -> buildView(c.join(), i.join(), p.join()))
      .join();
}
// OR move aggregation to dedicated BFF / GraphQL`,
    alternatives: ['BFF single round-trip', 'Materialized read model', 'GraphQL with DataLoader'],
    tradeoffs: 'Parallel reduces latency but amplifies load on fan-out; BFF adds another service.',
    unitTest: 'WireMock verify call count — assert ≤ 2 downstream per user request',
    edgeCases: ['Parallel without bulkhead exhausts all pools'],
    failureScenarios: ['One of 7 calls fails → entire checkout fails'],
    retry: '7× retry amplification', idempotency: 'Partial parallel success messy',
    timeout: 'Must be overall deadline', observability: 'Trace shows waterfall',
    security: '7× auth overhead', performance: 'Network bound', scalability: 'Poor',
    production: 'SLO per journey not per hop', mistakes: ['N+1 HTTP per line item'],
    antiPatterns: ['API gateway orchestrating 10 backends synchronously'],
    interviewQs: ['Measure chatty — metric?'],
    trickyQs: ['When is chatty acceptable?'],
    seniorFollowUps: ['Design checkout CQRS read model.'],
  },
  {
    id: 'nano-services',
    part: 21,
    name: 'Nano-services',
    frequency: 'Rare but interview-important',
    definition:
      'Services so small (one table, one endpoint) that operational cost exceeds benefit — “function as a service” smell in JVM.',
    problem:
      '50 deployables, 50 CI pipelines, 50 dashboards, 50 on-call rotations for CRUD that one modular monolith could host.',
    realWorld:
      '“UserEmailService”, “UserPhoneService” split from UserService for resume-driven architecture.',
    whyExists:
      'Misapplied “single responsibility” at deployment boundary instead of module boundary.',
    ascii: `EmailSvc  PhoneSvc  NameSvc  AddressSvc
   4 pods    4 pods    4 pods     4 pods
        └──► User aggregate shattered`,
    flow: 'Update user profile touches 4 deployables — 4× CI, 4× on-call, 4× CVE patches.',
    components: [
      {name: 'Nano deployable', responsibility: 'Single CRUD endpoint'},
      {name: 'Shared user row', responsibility: 'Still logically one aggregate'},
      {name: 'Platform tax', responsibility: 'K8s, metrics, logs per nano service'},
    ],
    javaCode: `// BAD: separate deployable for updating email only
@RestController
public class EmailMicroservice {
  @PutMapping("/email/{userId}")
  public void setEmail(@PathVariable String userId, @RequestBody String email) {
    jdbc.update("UPDATE users SET email=? WHERE id=?", email, userId);
  }
}`,
    springCode: `// BETTER: Customer service owns User aggregate module
@RestController
@RequestMapping("/api/customers/{id}")
public class CustomerController {
  @PatchMapping
  public CustomerDto update(@PathVariable String id, @RequestBody CustomerPatch patch) {
    return customerService.applyPatch(id, patch); // email, phone in one BC
  }
}`,
    alternatives: ['Modular monolith', 'Merge by team ownership', 'Extract only when scale demands'],
    tradeoffs: 'Fewer services = larger blast radius per deploy; merge when no independent scale need.',
    unitTest: 'N/A', edgeCases: ['Nano-service because political boundaries not technical'],
    failureScenarios: ['Cascading version skew across 5 nano user services'],
    retry: 'N/A', idempotency: 'N/A', timeout: 'N/A', observability: 'Cost per service >> value',
    security: '50 TLS certs to rotate', performance: 'HTTP overhead dominates', scalability: 'None gained',
    production: 'Merge candidates: same team, same deploy cadence, same scale profile',
    mistakes: ['One entity per microservice rule'],
    antiPatterns: ['Split before second team needs autonomy'],
    interviewQs: ['When merge services back?'],
    trickyQs: ['Nano vs fine-grained FaaS?'],
    seniorFollowUps: ['Define extraction criteria checklist.'],
  },
  {
    id: 'god-service',
    part: 21,
    name: 'God Service',
    frequency: 'Legacy',
    definition:
      'One service owns most business logic, databases, and integrations — others are thin proxies.',
    problem:
      'Scaling and deploying the entire business requires scaling the god service; teams blocked on one repo.',
    realWorld:
      '“CorePlatformService” with 400 endpoints and 200 tables after failed microservices migration.',
    whyExists:
      'Monolith renamed “microservice” without decomposition courage.',
    ascii: `                    ┌──────────────┐
  All clients ─────►│  GOD SERVICE │
                    │  400 APIs    │
                    └──────┬───────┘
           tiny proxies ◄──┘`,
    flow: 'Every feature PR touches god repo — deploy train weekly for entire business.',
    components: [
      {name: 'God controller', responsibility: 'Hundreds of endpoints'},
      {name: 'God schema', responsibility: 'Most tables in one DB'},
      {name: 'Thin satellites', responsibility: 'Proxies without real boundaries'},
    ],
    javaCode: `// BAD: everything in OrderGodService
@RestController
public class OrderGodController {
  // orders, payments, inventory, shipping, notifications...
  @PostMapping("/checkout") { /* 800 lines */ }
  @PostMapping("/refund") { /* touches 6 tables */ }
}`,
    springCode: `// BETTER: extract Payment and Inventory with strangler routes
// Gateway: /payments/** → payment-service (new)
//           /orders/**   → order-service (slim)
// Order publishes OrderCreated; Payment reacts`,
    alternatives: ['Strangler fig by route', 'Extract highest-churn subdomain first'],
    tradeoffs: 'Extraction temporary dual-write complexity vs permanent god service risk.',
    unitTest: 'ArchUnit: no controller package > 20 classes', edgeCases: ['God service “works” — no pressure to split'],
    failureScenarios: ['OOM in god service takes entire business down'],
    retry: 'N/A', idempotency: 'N/A', timeout: 'N/A', observability: 'One huge log stream',
    security: 'Blast radius = entire company', performance: 'Cannot scale inventory independently',
    scalability: 'Vertical scale only', production: 'Track endpoints-per-service metric',
    mistakes: ['Shared library with all domain logic — distributed god'],
    antiPatterns: ['BFF that became god service'],
    interviewQs: ['First slice to extract from god service?'],
    trickyQs: ['God service vs modular monolith?'],
    seniorFollowUps: ['Identify seams via change coupling analysis.'],
  },
  {
    id: 'circular-dependency',
    part: 21,
    name: 'Circular Dependency',
    frequency: 'Occasionally used',
    definition:
      'Service A calls B calls A (sync or via shared events) — deploy deadlock and runtime infinite retry risk.',
    problem:
      'Order calls Inventory reserves; Inventory calls Order validates status — stack overflow or hung requests.',
    realWorld:
      'Spring @Autowired circular beans masked with @Lazy — same at HTTP layer.',
    whyExists:
      'Bounded contexts not drawn; each team adds “just one callback”.',
    ascii: `Order ──► Inventory
  ▲            │
  └────────────┘`,
    flow: 'Sync callback A→B→A causes deploy ordering deadlock and runtime stack risk.',
    components: [
      {name: 'Service A client in B', responsibility: 'Backward dependency'},
      {name: 'Service B client in A', responsibility: 'Completes the cycle'},
      {name: 'Shared DTO jar', responsibility: 'Compile-time cycle variant'},
    ],
    javaCode: `// BAD: OrderService calls Inventory; Inventory calls Order
@Service
public class InventoryService {
  public void reserve(String sku) {
    orderClient.validateOpen(orderId); // calls back to Order
    stock.reserve(sku);
  }
}`,
    springCode: `// BETTER: one-way flow — Inventory listens OrderCreated event
@KafkaListener(topics = "order.events.v1")
public void onOrderCreated(OrderCreated e) {
  stock.reserve(e.orderId(), e.sku());
  publish StockReserved or StockFailed;
}`,
    alternatives: ['Event-driven one direction', 'Extract shared read model', 'Merge services if truly one BC'],
    tradeoffs: 'Events add latency and eventual consistency; acceptable for most domains.',
    unitTest: 'ArchUnit: no package cycles in module graph',
    edgeCases: ['Circular via shared library not HTTP'],
    failureScenarios: ['Timeout cascade A↔B'],
    retry: 'Infinite ping-pong', idempotency: 'N/A', timeout: 'Both sides hang',
    observability: 'Circular traces in Jaeger', security: 'N/A', performance: 'Terrible',
    scalability: 'Cannot scale independently', production: 'Dependency graph CI check',
    mistakes: ['@Lazy as permanent fix'],
    antiPatterns: ['Shared “commons” service both call'],
    interviewQs: ['Break A↔B cycle how?'],
    trickyQs: ['Saga compensation circular risk?'],
    seniorFollowUps: ['Design event contract to remove callback.'],
  },
  {
    id: 'synchronous-chain',
    part: 21,
    name: 'Synchronous Chain',
    frequency: 'Frequently used',
    definition:
      'Long HTTP call chains for workflows that should be asynchronous — availability = product of all service uptimes.',
    problem:
      '99.9%^5 = 99.5% effective availability for 5-hop sync chain.',
    realWorld:
      'Place order → pay → reserve → ship → notify all sync in one POST.',
    whyExists:
      'Monolith thinking: user must see final state in HTTP response.',
    ascii: `POST /checkout ──► A ──► B ──► C ──► D ──► 201 (3s later)`,
    flow: 'User HTTP thread blocked until slowest downstream completes — no partial progress.',
    components: [
      {name: 'Sync controller', responsibility: 'Orchestrates chain in one thread'},
      {name: 'Downstream chain', responsibility: 'Multiplies latency and failure'},
      {name: 'No compensation', responsibility: 'Partial success leaves inconsistent state'},
    ],
    javaCode: `// BAD: blocking chain in controller
@PostMapping("/checkout")
public ResponseEntity<?> checkout(@RequestBody Cart cart) {
  Order o = orderSvc.create(cart);
  paymentSvc.charge(o);      // blocks
  inventorySvc.reserve(o);   // blocks
  shippingSvc.book(o);       // blocks
  return ok(o);
}`,
    springCode: `// BETTER: accept 202 + async saga
@PostMapping("/checkout")
public ResponseEntity<AcceptedOrder> checkout(@RequestBody Cart cart) {
  OrderId id = orderSvc.startCheckout(cart); // outbox OrderCreated
  return ResponseEntity.accepted().body(new AcceptedOrder(id, "PROCESSING"));
}
@GetMapping("/orders/{id}/status")
public OrderStatus status(@PathVariable OrderId id) { ... }`,
    alternatives: ['Saga + polling/WebSocket', 'BFF parallel for read-only aggregation only'],
    tradeoffs: 'Async UX needs status endpoint; sync simpler mental model for devs.',
    unitTest: 'Assert controller returns before Kafka consumers finish',
    edgeCases: ['Partial failure mid-chain without compensation'],
    failureScenarios: ['Payment OK, inventory fails — money captured without stock'],
    retry: 'Dangerous on POST chain', idempotency: 'Required on each hop',
    timeout: 'Chain timeout > user patience', observability: 'Waterfall spans',
    security: 'N/A', performance: 'p99 = sum(p99)', scalability: 'Poor',
    production: '202 + correlationId + status page', mistakes: ['Distributed transaction 2PC over HTTP'],
    antiPatterns: ['Gateway orchestrating saga synchronously'],
    interviewQs: ['Availability math 5 nines chain?'],
    trickyQs: ['When sync chain OK?'],
    seniorFollowUps: ['Design compensation for payment-after-inventory-fail.'],
  },
  {
    id: 'retry-storm',
    part: 21,
    name: 'Retry Storm',
    frequency: 'Frequently used',
    definition:
      'Clients and intermediaries retry aggressively on outage, multiplying traffic and preventing recovery.',
    problem:
      'Payment down → 1000 clients × 3 retries × 5 services = 15k RPS hitting corpse.',
    realWorld:
      'AWS outage worsened by SDK default retries; Kubernetes crashloop backoff insufficient at scale.',
    whyExists:
      'Retry added without jitter, CB, or retry budget; “retries make it reliable” myth.',
    ascii: `Outage ──► clients retry ──► more load ──► deeper outage ──► more retry`,
    flow: 'Positive feedback loop: outage → retries → overload → longer outage → more retries.',
    components: [
      {name: 'Client retry', responsibility: 'Multiplies request volume'},
      {name: 'Gateway retry', responsibility: 'Second amplification layer'},
      {name: 'Service retry', responsibility: 'Third layer — 27× possible'},
    ],
    javaCode: `// BAD: infinite retry on all exceptions
@Retryable(maxAttempts = 10, backoff = @Backoff(delay = 100))
public PaymentResult pay(Order o) {
  return paymentGateway.charge(o); // still runs when gateway melting
}`,
    springCode: `// BETTER: Resilience4j retry + CB + only idempotent + jitter
RetryConfig retry = RetryConfig.custom()
    .maxAttempts(3)
    .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(Duration.ofMillis(200), 2.0))
    .retryExceptions(TransientPaymentException.class)
    .build();
CircuitBreakerConfig cb = CircuitBreakerConfig.custom()
    .slidingWindowSize(50).failureRateThreshold(50).build();`,
    alternatives: ['Retry budget per dependency', 'Client-side CB', 'Queue-based async retry'],
    tradeoffs: 'Fewer retries = slower recovery for transient blips — tune per SLO.',
    unitTest: 'WireMock 503 → verify exactly 3 attempts then CB open',
    edgeCases: ['Retry on POST without idempotency → duplicate charges'],
    failureScenarios: ['Thundering herd when service recovers — all retry at once'],
    retry: 'Meta: fix retry config', idempotency: 'Mandatory if retrying mutations',
    timeout: 'Shorter than retry window', observability: 'retry_attempts_total by outcome',
    security: 'Retry amplification as DoS vector', performance: 'Kills recovering service',
    scalability: 'N/A', production: 'Platform-wide retry standards doc',
    mistakes: ['10 retries on 503 during incident'],
    antiPatterns: ['Retry at every layer (client, gateway, service)'],
    interviewQs: ['Retry storm mitigation?'],
    trickyQs: ['Jitter formula?'],
    seniorFollowUps: ['Design centralized retry budget service.'],
  },
  {
    id: 'missing-timeout',
    part: 21,
    name: 'Missing Timeout',
    frequency: 'Frequently used',
    definition:
      'HTTP/DB/Kafka calls use default infinite wait — one slow dependency exhausts thread pools.',
    problem:
      'Payment gateway hangs → 200 Tomcat threads blocked → entire order service 503.',
    realWorld:
      'RestTemplate default infinite read timeout; JDBC without query timeout.',
    whyExists:
      '“It usually responds in 50ms” — no defensive bounds.',
    ascii: `Threads: [blocked][blocked][blocked]... pool exhausted`,
    flow: 'Slow dependency blocks thread indefinitely → pool full → all endpoints 503.',
    components: [
      {name: 'HTTP client', responsibility: 'Default infinite read timeout'},
      {name: 'Tomcat thread pool', responsibility: 'Finite blocked threads'},
      {name: 'Downstream hang', responsibility: 'Single root cause'},
    ],
    javaCode: `// BAD: no timeout
RestTemplate rt = new RestTemplate(); // infinite
String body = rt.getForObject("http://payment/charge", String.class);`,
    springCode: `// BETTER: HttpClient + Resilience4j TimeLimiter
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofMillis(500))
    .build();
WebClient wc = WebClient.builder()
    .clientConnector(new ReactorClientHttpConnector(client))
    .build();
// + @TimeLimiter(name="payment") on service method`,
    alternatives: ['gRPC deadline', 'Istio route timeout'],
    tradeoffs: 'False timeouts under load — tune with p99 + margin.',
    unitTest: 'WireMock delay 5s → assert TimeoutException < 1s',
    edgeCases: ['Timeout without canceling underlying work'],
    failureScenarios: ['Cascade thread starvation'],
    retry: 'Only after timeout classified transient', idempotency: 'N/A',
    timeout: 'connect < read < overall deadline', observability: 'timeout_total by dependency',
    security: 'Slowloris-style attacks', performance: 'Pool sizing vs timeout',
    scalability: 'Virtual threads help density not overload', production: 'Document per-dep SLA table',
    mistakes: ['Timeout only at gateway not downstream'],
    antiPatterns: ['@Async without timeout on CompletableFuture.get()'],
    interviewQs: ['Default timeout if unknown SLA?'],
    trickyQs: ['Propagate deadline across Kafka?'],
    seniorFollowUps: ['Thread dump shows all blocked on socketRead0 — fix?'],
  },
  {
    id: 'missing-idempotency',
    part: 21,
    name: 'Missing Idempotency',
    frequency: 'Frequently used',
    definition:
      'POST/consumer handlers not safe on duplicate delivery — retries and at-least-once messaging cause double side effects.',
    problem:
      'Client retries checkout → double charge. Kafka redelivery → duplicate shipment.',
    realWorld:
      'Stripe Idempotency-Key header; payment APIs without it in internal services.',
    whyExists:
      'Assumed TCP “once” semantics; ignored Kafka at-least-once.',
    ascii: `Retry POST /pay ──► charge $100
Retry POST /pay ──► charge $100 again`,
    flow: 'Client timeout retry or Kafka redelivery executes side effect twice.',
    components: [
      {name: 'Mutable POST', responsibility: 'Not safe to repeat'},
      {name: 'No idempotency store', responsibility: 'Cannot detect duplicate'},
      {name: 'Payment gateway', responsibility: 'Charges per call'},
    ],
    javaCode: `// BAD: no idempotency
@PostMapping("/payments")
public Payment capture(@RequestBody PaymentRequest req) {
  return paymentGateway.charge(req.orderId(), req.amount()); // duplicate on retry
}`,
    springCode: `// BETTER: Idempotency-Key header + UNIQUE constraint
@PostMapping("/payments")
public ResponseEntity<Payment> capture(
    @RequestHeader("Idempotency-Key") String key,
    @RequestBody PaymentRequest req) {
  return idempotencyService.execute(key, () -> payments.capture(req));
}
// CREATE TABLE idempotency_keys (key VARCHAR PRIMARY KEY, response JSONB, created_at TIMESTAMPTZ);`,
    alternatives: ['Natural key UNIQUE (order_id)', 'Inbox pattern on consumer'],
    tradeoffs: 'Key storage TTL vs how long clients retry; 24h typical.',
    unitTest: 'Parallel same Idempotency-Key → single charge mock verify once',
    edgeCases: ['Same key different body → 409 Conflict'],
    failureScenarios: ['Crash after charge before response stored'],
    retry: 'Safe only with idempotency', idempotency: 'This IS the fix',
    timeout: 'Store response before returning to client', observability: 'idempotent_replay_total',
    security: 'Key scoped to auth principal', performance: 'One extra INSERT per mutation',
    scalability: 'Partition idempotency table by date', production: 'Gateway can dedupe or pass through',
    mistakes: ['Idempotency only at gateway not service'],
    antiPatterns: ['GET for mutations to be “safe”'],
    interviewQs: ['Idempotency vs dedupe inbox?'],
    trickyQs: ['Crash between charge and key save?'],
    seniorFollowUps: ['Design idempotent Kafka consumer for PaymentCaptured.'],
  },
  {
    id: 'event-driven-everything',
    part: 21,
    name: 'Event-Driven Everything',
    frequency: 'Occasionally used',
    definition:
      'Kafka used for simple request/response and CRUD where sync HTTP would be simpler — operational tax without benefit.',
    problem:
      '“Get customer name” via publish CustomerQuery event, wait for CustomerQueryResponse topic — latency, debugging nightmare.',
    realWorld:
      'Resume-driven Kafka for 5-user internal admin tool.',
    whyExists:
      'Hype: “microservices must be event-driven”.',
    ascii: `GET /customer/1 ──► publish query event ──► wait consumer ──► response topic ──► 200`,
    flow: 'Simple read becomes async request-reply — adds topics, consumers, and hung-thread risk.',
    components: [
      {name: 'Query topic', responsibility: 'Unnecessary for sync read'},
      {name: 'Blocking waiter', responsibility: 'Poll loop in HTTP thread'},
      {name: 'Response topic', responsibility: 'Correlation and timeout complexity'},
    ],
    javaCode: `// BAD: request-reply over Kafka for simple read
public Customer getCustomer(String id) {
  kafka.send("customer.query", id);
  return responseQueue.poll(5, SECONDS); // blocking anti-pattern
}`,
    springCode: `// BETTER: sync HTTP/gRPC inside bounded context; events for cross-BC facts
@GetMapping("/customers/{id}")
public CustomerDto get(@PathVariable String id) {
  return customerService.find(id); // local DB or cache
}
// Use Kafka only: CustomerUpdated, OrderCreated — past tense facts`,
    alternatives: ['Sync for query in BC', 'CQRS projection for cross-service read'],
    tradeoffs: 'Events excel at decouple and scale writes; sync excels at low-latency read.',
    unitTest: 'Architecture test: no request-reply Kafka in hot path',
    edgeCases: ['Kafka as RPC bus without schema registry'],
    failureScenarios: ['Lost response message → hung request'],
    retry: 'Complex with request-reply', idempotency: 'Still needed on events',
    timeout: 'Hard to bound end-to-end', observability: 'Distributed trace breaks',
    security: 'ACL per topic explosion', performance: 'ms vs tens ms',
    scalability: 'Kafka ops for 10 RPS admin tool — waste', production: 'Decision tree: sync vs event per use case',
    mistakes: ['Command query on Kafka for UI autocomplete'],
    antiPatterns: ['Dual write DB + event without outbox'],
    interviewQs: ['When NOT to use Kafka?'],
    trickyQs: ['Command vs event on bus?'],
    seniorFollowUps: ['Draw sync vs async boundary for checkout.'],
  },
];
