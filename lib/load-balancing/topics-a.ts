import type {LbTopic} from './types';

export const TOPICS_A: LbTopic[] = [
  {
    id: 'l4-l7',
    title: 'Layer 4 vs Layer 7',
    badge: 'Core',
    problem: 'Choose TCP distribution vs HTTP-aware routing for payments APIs.',
    whenToUse: 'L4 for raw TCP/UDP/high PPS; L7 for path/host/header routing.',
    whenAvoid: 'Using L7 when you only need opaque TCP with max throughput.',
    mermaid: `flowchart LR
  subgraph L4[Layer 4]
    C1[Client] -->|TCP| NLB[L4 LB]
    NLB --> A1[App-1]
    NLB --> A2[App-2]
  end
  subgraph L7[Layer 7]
    C2[Client] -->|HTTP GET /payments| ALB[L7 LB]
    ALB -->|/payments| P[Payment]
    ALB -->|/users| U[User]
  end`,
    code: `// L4 mental model: 5-tuple / connection → target
// L7 mental model: HTTP attributes → rule → target group

// AWS:
// NLB  = L4 TCP/UDP
// ALB  = L7 HTTP/HTTPS (path/host/header)

// Interview line:
// "L4 is fast and dumb; L7 is slower-ish but route-smart."`,
    failure: 'Path routing on NLB — not available. Cookie stickiness expectations on L4.',
    production: 'ALB for Spring Boot HTTP microservices; NLB for gRPC/TCP/static IP needs.',
    interview30s: 'L4 balances connections by IP/port; L7 inspects HTTP and can route by path/host/header.',
    followUp: 'Where do WebSockets fit on ALB vs NLB?',
    tradeoff: 'Intelligence vs raw latency/throughput.',
    memoryTrick: 'L4 = pipes; L7 = reading the letter inside.',
  },
  {
    id: 'round-robin',
    title: 'Round Robin',
    badge: 'Algorithm',
    problem: 'Evenly spray requests across identical payment pods.',
    whenToUse: 'Homogeneous instances; short similar requests.',
    whenAvoid: 'Unequal capacity or long-lived uneven connections.',
    mermaid: `flowchart LR
  R1[Req1] --> A1
  R2[Req2] --> A2
  R3[Req3] --> A3
  R4[Req4] --> A1`,
    code: `public final class RoundRobinLoadBalancer implements LoadBalancer {
  private final AtomicInteger counter = new AtomicInteger();

  @Override
  public Server select(List<Server> servers) {
    List<Server> up = servers.stream().filter(Server::healthy).toList();
    if (up.isEmpty()) throw new IllegalStateException("no healthy servers");
    int i = Math.floorMod(counter.getAndIncrement(), up.size());
    return up.get(i);
  }
}`,
    failure: 'Slow pod still gets equal share → p99 climbs.',
    production: 'Default for equal EC2/ECS tasks behind ALB target group.',
    interview30s: 'Cycle instances in order; thread-safe counter; ignores live load.',
    followUp: 'How ALB actually distributes within a target group?',
    tradeoff: 'Simplicity vs load blindness.',
    memoryTrick: 'Round robin = dealing cards in a circle.',
  },
  {
    id: 'weighted-rr',
    title: 'Weighted Round Robin',
    badge: 'Algorithm',
    problem: 'App-1 is 2× CPU; send it more traffic during migration/canary.',
    whenToUse: 'Heterogeneous sizes; canary %; gradual cutover.',
    whenAvoid: 'Weights that ignore real saturation (CPU thrash).',
    mermaid: `flowchart TB
  LB[LB] --> A1[App-1 50%]
  LB --> A2[App-2 30%]
  LB --> A3[App-3 20%]`,
    code: `public final class WeightedRoundRobinLoadBalancer implements LoadBalancer {
  private final AtomicInteger cursor = new AtomicInteger();

  @Override
  public Server select(List<Server> servers) {
    List<Server> expanded = new ArrayList<>();
    for (Server s : servers) {
      if (!s.healthy()) continue;
      for (int i = 0; i < s.weight(); i++) expanded.add(s);
    }
    if (expanded.isEmpty()) throw new IllegalStateException("no healthy servers");
    return expanded.get(Math.floorMod(cursor.getAndIncrement(), expanded.size()));
  }
}
// Better production: smooth WRR / EWMA — but expanded list is interview-clear.`,
    failure: 'Static weights during spike on heavy node → overload.',
    production: 'ALB weighted target groups for blue/green & canary.',
    interview30s: 'Bias selection by weight; great for canary and mixed instance sizes.',
    followUp: 'How shift 10% canary safely?',
    tradeoff: 'Control vs needing weight hygiene.',
    memoryTrick: 'Weight = bigger plate gets more servings.',
  },
  {
    id: 'least-conn',
    title: 'Least Connections',
    badge: 'Algorithm',
    problem: 'Long payment callbacks hold connections; RR overloads busy pods.',
    whenToUse: 'Long-lived or variable-duration requests.',
    whenAvoid: 'Tiny equal GETs where counter churn costs more than benefit.',
    mermaid: `flowchart TB
  LB --> A1[App-1 conn=100]
  LB --> A2[App-2 conn=20]
  LB --> A3[App-3 conn=50]
  NEXT[Next request] --> A2`,
    code: `public final class LeastConnectionsLoadBalancer implements LoadBalancer {
  @Override
  public Server select(List<Server> servers) {
    return servers.stream()
        .filter(Server::healthy)
        .min(Comparator.comparingInt(Server::activeConnections))
        .orElseThrow(() -> new IllegalStateException("no healthy servers"));
  }
}
// On acquire: server.incrementConnections(); on complete: decrement.`,
    failure: 'Stale connection counts if you forget decrement on error paths.',
    production: 'Useful for WebSocket/streaming; many LBs track outstanding requests.',
    interview30s: 'Pick the instance with fewest in-flight connections/requests.',
    followUp: 'Weighted least connections?',
    tradeoff: 'Better balance vs needing accurate counters.',
    memoryTrick: 'Least conn = join the shortest checkout line.',
  },
  {
    id: 'ip-hash',
    title: 'IP Hash',
    badge: 'Algorithm',
    problem: 'Need same client IP → same instance without cookies.',
    whenToUse: 'Simple affinity; legacy sticky without shared session store.',
    whenAvoid: 'NAT many users → one IP → hot pod; instance removal reshuffles.',
    mermaid: `flowchart LR
  IP[Client IP] --> H[hash]
  H --> S[Server]`,
    code: `public final class IpHashLoadBalancer implements LoadBalancer {
  @Override
  public Server select(List<Server> servers, String clientIp) {
    List<Server> up = servers.stream().filter(Server::healthy).toList();
    int idx = Math.floorMod(clientIp.hashCode(), up.size());
    return up.get(idx);
  }
}
// When pool size changes, many clients remapped — consistent hash is gentler.`,
    failure: 'Corporate NAT → mega hot key; node down → remapping churn.',
    production: 'Prefer Redis sessions + RR over IP hash for banking UIs.',
    interview30s: 'Hash client IP to pick instance — crude sticky routing.',
    followUp: 'X-Forwarded-For spoofing risk?',
    tradeoff: 'Affinity vs fairness and churn.',
    memoryTrick: 'IP hash = same mailbox always to same clerk.',
  },
  {
    id: 'consistent-hash',
    title: 'Consistent Hashing',
    badge: 'Algorithm',
    problem: 'Minimize remapping when adding/removing cache or sticky backends.',
    whenToUse: 'Distributed cache; shard affinity; sticky with ring stability.',
    whenAvoid: 'Tiny pools where RR is enough.',
    mermaid: `flowchart TB
  R[Hash Ring] --- A1[App-1]
  R --- A2[App-2]
  R --- A3[App-3]
  K[hash key] --> R`,
    code: `public final class ConsistentHashLoadBalancer {
  private final SortedMap<Integer, Server> ring = new TreeMap<>();
  private final int virtualNodes;

  public ConsistentHashLoadBalancer(List<Server> servers, int virtualNodes) {
    this.virtualNodes = virtualNodes;
    for (Server s : servers) add(s);
  }

  public void add(Server s) {
    for (int i = 0; i < virtualNodes; i++) {
      ring.put(Objects.hash(s.id(), i), s);
    }
  }

  public Server select(String key) {
    if (ring.isEmpty()) throw new IllegalStateException("empty ring");
    int h = key.hashCode();
    SortedMap<Integer, Server> tail = ring.tailMap(h);
    return (tail.isEmpty() ? ring.get(ring.firstKey()) : ring.get(tail.firstKey()));
  }
}`,
    failure: 'Too few virtual nodes → imbalance; bad hash → clustering.',
    production: 'Caches (Redis Cluster conceptual), sticky partitions, CDN keys.',
    interview30s: 'Keys map to a ring; add/remove moves only nearby keys.',
    followUp: 'How many vnodes in practice?',
    tradeoff: 'Stability vs implementation complexity.',
    memoryTrick: 'Consistent hash = seats on a circular bus; few riders move when a seat is removed.',
  },
];
