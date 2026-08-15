import type {CommSection} from './types';

export const DISCOVERY: CommSection[] = [
  {
    id: 'client-side-discovery',
    title: 'Client-Side Service Discovery',
    what:
      'The calling application (or its embedded library) queries a registry or platform API, caches healthy instances, and selects a target host for each outbound request. Load balancing and health filtering happen inside the client process — not at a central proxy.',
    why:
      'Hard-coded host:port lists rot when pods scale, AZs fail, or blue/green deploys swap endpoints. Client-side discovery decouples service location from deployment topology so instances self-register and callers react to registry changes.',
    when:
      'Spring Cloud Netflix Eureka + LoadBalancer, Consul templates, or custom registries in brownfield JVM shops. Less common on pure Kubernetes when kube-proxy + ClusterIP already provide server-side discovery.',
    how:
      'Instance boots → registers with Eureka/Consul → heartbeats every 30s → client polls/subscribes → caches UP instances → per-request selector picks one → HTTP call. Spring Boot 3: `spring-cloud-starter-netflix-eureka-client` + `@LoadBalanced RestClient` or `LoadBalancerClient`.',
    flow: `sequenceDiagram
  participant S as Service Instance
  participant R as Registry (Eureka)
  participant C as Client (RestClient)
  S->>R: POST register + heartbeat
  C->>R: GET /apps/ORDER
  R-->>C: instance list (UP)
  C->>C: filter healthy + zone affinity
  C->>S: HTTP to chosen host:port`,
    failure:
      'Stale cache after registry eviction — client calls dead instance until refresh. Split-brain registry during partition. Client library bug takes down every caller. Thundering herd when cache expires simultaneously across fleet.',
    tradeoff:
      'Pros: no extra network hop, rich per-client policies (zone, weight). Cons: every language needs a client; registry coupling; harder to enforce global traffic policy without mesh/gateway.',
    security:
      'Registry APIs must be authenticated (mTLS, token). Never expose Eureka dashboard publicly. TLS to instances even inside VPC. Validate instance metadata before trusting host:port.',
    observability:
      'Metrics: registry fetch latency, cache age, instance count per service, selection failures. Trace outbound calls with service name tag, not just IP. Alert when healthy instance count drops to zero.',
    trap:
      'Saying "we use Kubernetes so we need Eureka." On K8s, ClusterIP + CoreDNS is usually enough; Eureka adds moving parts unless you span clusters without K8s service discovery.',
    interviewAnswer:
      'Client-side discovery means the caller fetches instance lists from a registry and picks a target locally — Netflix Eureka + Spring Cloud LoadBalancer is the classic JVM pattern. Server-side puts a load balancer or kube-proxy between caller and instances. I choose client-side when I need zone-aware routing in a non-K8s estate; on EKS I default to server-side ClusterIP and only add Eureka for multi-cluster federation.',
    remember: [
      'Client = registry fetch + local LB',
      'Eureka/Ribbon legacy; LoadBalancer is modern Spring',
      'Cache refresh interval drives staleness window',
      'Every client language needs equivalent library',
    ],
    oneLiner: 'Caller queries registry and picks instance locally — no central proxy hop.',
  },
  {
    id: 'server-side-discovery',
    title: 'Server-Side Service Discovery',
    what:
      'Callers use a stable virtual hostname (DNS name, VIP, or K8s Service name). A platform component — kube-proxy, cloud LB, or reverse proxy — resolves that name to healthy backends and forwards traffic without the client knowing instance topology.',
    why:
      'Simplifies clients: any process can call `http://payment-service` without registry libraries. Centralizes TLS termination, connection pooling to backends, and global policies (rate limit, WAF) at the edge or mesh ingress.',
    when:
      'Kubernetes ClusterIP/Headless services, AWS ALB/NLB target groups, NGINX/Envoy upstream clusters, Spring Cloud Gateway `lb://payment-service` with server-side resolution.',
    how:
      'Client resolves DNS → gets ClusterIP or LB VIP → kube-proxy/Envoy selects pod endpoint from EndpointSlice → forwards. Spring Boot 3 Gateway route: `uri: lb://payment-service` with `spring-cloud-starter-kubernetes-client` or Eureka behind the scenes.',
    flow: `flowchart LR
  C[Client pod] -->|payment-service:8080| DNS[CoreDNS]
  DNS --> VIP[ClusterIP]
  VIP --> KP[kube-proxy / CNI]
  KP --> P1[Pod A]
  KP --> P2[Pod B]`,
    failure:
      'DNS cache returns stale ClusterIP after Service delete/recreate. EndpointSlice lag — new pods not ready but DNS already resolves. LB health check misconfiguration marks all backends down. Single VIP hotspot under extreme throughput.',
    tradeoff:
      'Pros: thin clients, uniform policy enforcement, works for non-JVM callers. Cons: extra hop latency; less per-client customization; debugging requires platform knowledge (iptables, Envoy config).',
    security:
      'NetworkPolicy restricts which namespaces can reach Service ClusterIP. mTLS at mesh/proxy layer. Private DNS zones; no public resolution of internal service names.',
    observability:
      'kube-proxy/CNI metrics, EndpointSlice endpoint count, ALB target health, Gateway upstream latency. Service mesh adds per-route success rate without client instrumentation.',
    trap:
      'Assuming ClusterIP load balancing is "smart" — it is roughly random across endpoints with no least-conn unless you add mesh or an intelligent proxy.',
    interviewAnswer:
      'Server-side discovery hides instance lists behind a stable name. Kubernetes Service + CoreDNS is the default: client resolves `payment-service`, kube-proxy distributes to pod IPs from EndpointSlices. Clients stay dumb; the platform routes. I pair this with readiness probes so only healthy pods appear in endpoints.',
    remember: [
      'Stable DNS/VIP — client unaware of pod count',
      'K8s default: ClusterIP + kube-proxy/CNI',
      'Readiness probe gates EndpointSlice membership',
      'Gateway/mesh adds intelligent LB algorithms',
    ],
    oneLiner: 'Stable service name; platform resolves and forwards to healthy backends.',
  },
  {
    id: 'eureka-registry',
    title: 'Netflix Eureka Service Registry',
    what:
      'AP-oriented service registry where instances self-register, renew heartbeats, and clients fetch full or delta registry snapshots. Eureka Server clusters replicate registry state; clients cache locally and refresh periodically.',
    why:
      'Battle-tested in Spring Cloud microservices before Kubernetes dominance. Provides a JVM-friendly HTTP API for registration, deregistration, and instance metadata (zone, VIP, status).',
    when:
      'Multi-region Spring estates, hybrid VM + K8s, or teams already on Spring Cloud Netflix. Avoid for greenfield pure-K8s unless you need cross-cluster service catalog beyond K8s DNS.',
    how:
      'Boot 3: `spring-cloud-starter-netflix-eureka-client` on services, `eureka-server` standalone or peer-replicated. Config: `eureka.client.serviceUrl.defaultZone`, `eureka.instance.prefer-ip-address=true` on K8s. RestClient with `@LoadBalanced` resolves `http://ORDER-SERVICE/...` via Eureka + LoadBalancer.',
    flow: `sequenceDiagram
  participant I as order-service pod
  participant E as Eureka Server
  participant C as payment-service
  I->>E: REGISTER instanceId host port zone
  loop every 30s
    I->>E: RENEW heartbeat
  end
  C->>E: GET /eureka/apps/ORDER-SERVICE
  E-->>C: JSON instance list
  C->>I: HTTP call selected instance`,
    failure:
      'Self-preservation mode keeps dead instances during mass heartbeat loss — clients see ghosts. Registry partition → split views. Client cache too long → calls evicted instances. Eureka 2.x maintenance mode — verify Spring Cloud release train compatibility.',
    tradeoff:
      'Pros: simple HTTP, zone metadata, Spring integration. Cons: AP not CP — no strong consistency; another ops surface; redundant on single K8s cluster.',
    security:
      'Enable Eureka basic auth or mTLS between client and server. Restrict Eureka dashboard to admin VPN. Do not leak instance metadata (env tags) to untrusted clients.',
    observability:
      'Eureka Server metrics: registrations, renewals, evictions, self-preservation events. Client: `DiscoveryClient` cache refresh failures. Correlate eviction spikes with deploys or network cuts.',
    trap:
      'Treating Eureka as CP — during partition, different clients may see different instance sets (AP). Not a substitute for health checks at call time.',
    interviewAnswer:
      'Eureka is an AP service registry: instances register and heartbeat; clients pull snapshots and pick instances locally. It favors availability over perfect consistency — during network issues Eureka may keep stale entries in self-preservation. On modern EKS I usually skip Eureka unless I need a registry outside Kubernetes.',
    remember: [
      'AP registry — availability over consistency',
      'Heartbeat 30s default; eviction after missed renewals',
      'Self-preservation retains instances during mass failure',
      'Spring Cloud LoadBalancer replaced Ribbon',
    ],
    oneLiner: 'AP HTTP registry — register, heartbeat, client pulls instance snapshots.',
  },
  {
    id: 'consul-discovery',
    title: 'Consul Service Discovery & Health',
    what:
      'HashiCorp Consul combines service discovery, health checking, KV store, and optional service mesh (Consul Connect). Agents on each node register services; catalog is queried via DNS (`.consul`) or HTTP API with blocking queries for near-real-time updates.',
    why:
      'Multi-datacenter WAN federation, integrated health checks (HTTP/TCP/script), and DNS SRV records without a separate health system. Works across VMs, K8s, and bare metal uniformly.',
    when:
      'Polyglot estates, multi-DC active-active, or when you want DNS-based discovery for non-JVM services. Consul Connect adds mTLS sidecars similar to Istio.',
    how:
      'Agent registers service with check → catalog updated → clients query DNS `payment.service.consul` or HTTP `/v1/health/service/payment`. Spring: `spring-cloud-starter-consul-discovery`. Java 21 without Spring: blocking HTTP API with `?passing=true` filter.',
    flow: `flowchart TB
  A[Consul Agent] -->|register + check| S[Consul Server]
  C[Client] -->|DNS or HTTP| S
  S -->|healthy endpoints| C
  C --> Svc[Service Instance]`,
    failure:
      'WAN partition during federation — catalog divergence. DNS TTL caching delays failure detection. Agent failure deregisters all local services. KV misuse — storing large blobs in catalog.',
    tradeoff:
      'Pros: DNS + HTTP, health integrated, multi-DC. Cons: agent per node ops, WAN gossip complexity, Connect mesh overlap with Istio decisions.',
    security:
      'ACL tokens per service for register/query. Connect auto-encrypt with CA. mTLS between services when Connect enabled. Least-privilege ACL for agent tokens.',
    observability:
      'Consul telemetry: check failures, catalog sync, Raft leader changes. Integrate with Prometheus via consul_exporter. Alert on critical service zero passing instances.',
    trap:
      'Using Consul KV as primary database — it is for config and small metadata, not high-write application data.',
    interviewAnswer:
      'Consul provides discovery via DNS or HTTP with built-in health checks and optional WAN federation. Unlike Eureka’s pure AP model, Consul uses Raft for catalog consistency on the server side. I pick Consul when I need multi-DC service catalog and DNS-based discovery for polyglot clients, or Consul Connect for mTLS without full Istio.',
    remember: [
      'DNS .consul + HTTP API + blocking queries',
      'Health checks gate "passing" instances',
      'WAN federation for multi-DC catalog',
      'Connect = mesh/mTLS optional layer',
    ],
    oneLiner: 'Agent-based catalog with health checks, DNS, and optional Connect mesh.',
  },
  {
    id: 'dns-srv-discovery',
    title: 'DNS & SRV-Based Discovery',
    what:
      'Clients resolve a hostname to IP addresses (A/AAAA) or structured records (SRV: port + priority + weight) via DNS. No application registry — the DNS server (CoreDNS, Route53 private zone, Consul DNS) is the catalog.',
    why:
      'Universal: every language has DNS. Works for gRPC, JDBC over DNS, and legacy apps that cannot embed Eureka. SRV records encode port and load-spreading weights without hard-coded URLs.',
    when:
      'Headless K8s Services (`clusterIP: None`), Consul DNS, AWS Cloud Map, external-dns with Route53. gRPC clients often resolve `xds://` or DNS targets.',
    how:
      'K8s Headless Service → CoreDNS returns all ready pod IPs. Java 21 HttpClient uses resolved IP directly. gRPC: `dns:///payment-service:9090` with round_robin LB policy. Spring: `spring.cloud.discovery.client.simple.instances` for local dev DNS substitute.',
    flow: `sequenceDiagram
  participant C as Client
  participant D as DNS (CoreDNS)
  participant P as Pod IPs
  C->>D: A/AAAA payment-service.ns.svc.cluster.local
  D-->>C: 10.0.1.5, 10.0.1.6, 10.0.1.7
  C->>P: connect to one IP (client LB)`,
    failure:
      'DNS TTL stale cache — client holds dead IP until TTL expires (often 30s). Resolver library caches independently of OS. Large answer sets truncated without TCP fallback. No health signal — DNS returns IPs of not-ready pods if probes misconfigured.',
    tradeoff:
      'Pros: zero client library, works everywhere. Cons: no health-aware DNS by default; TTL vs freshness trade-off; connection storms on TTL refresh.',
    security:
      'Private hosted zones; DNSSEC where supported. Prevent DNS exfiltration from pods. Split-horizon DNS for internal vs external names.',
    observability:
      'CoreDNS query rate/latency, NXDOMAIN spikes, upstream forward failures. Client-side: log resolved IPs and rotation. Low DNS TTL increases query load — monitor QPS.',
    trap:
      'Expecting DNS to drop unhealthy instances instantly — only readiness probe + EndpointSlice update speed matters; DNS TTL adds lag on top.',
    interviewAnswer:
      'DNS discovery resolves a stable name to backend IPs. Kubernetes headless services return all pod IPs via CoreDNS. It is universal but not health-aware unless the DNS backend reflects health (Consul passing, K8s endpoints). I shorten TTL or use HTTP registry when staleness window is unacceptable.',
    remember: [
      'Headless K8s Service → multiple A records',
      'SRV = port + weight + priority',
      'TTL staleness is inherent — not instant failover',
      'gRPC dns:/// + round_robin common pattern',
    ],
    oneLiner: 'Resolve stable hostname to IPs via DNS — universal but TTL-limited freshness.',
  },
  {
    id: 'k8s-service-clusterip',
    title: 'Kubernetes Service (ClusterIP)',
    what:
      'A Kubernetes Service is a stable ClusterIP (or headless DNS name) that selects pods via label selector. kube-proxy or CNI dataplane programs rules to distribute traffic to pod endpoints listed in EndpointSlice objects.',
    why:
      'Pods are ephemeral — IP changes every reschedule. Service abstraction gives callers a constant DNS name (`payment-service.default.svc.cluster.local`) and virtual IP independent of pod lifecycle.',
    when:
      'Every internal microservice call on K8s. ClusterIP for east-west HTTP/gRPC. NodePort/LoadBalancer for north-south ingress to the cluster.',
    how:
      'YAML: `kind: Service`, `selector: app: payment`, `ports: - port: 80 targetPort: 8080`. Spring Boot 3 on K8s: `spring.cloud.kubernetes.discovery.enabled=true` or plain `http://payment-service` with no Eureka. RestClient.Builder without LoadBalancer when using K8s DNS directly.',
    flow: `flowchart LR
  subgraph Service payment-service
    VIP[ClusterIP 10.96.0.10]
  end
  EP[EndpointSlice] --> VIP
  P1[pod-1 10.0.1.5] --> EP
  P2[pod-2 10.0.1.6] --> EP
  C[caller] --> VIP`,
    failure:
      'Selector mismatch — Service has zero endpoints. `targetPort` wrong — blackhole. SessionAffinity causing uneven load. ClusterIP only reachable inside cluster — external caller needs Ingress/Gateway.',
    tradeoff:
      'Pros: platform-native, no extra registry. Cons: kube-proxy iptables/IPVS mode affects scale; default LB is approximate random, not least-conn.',
    security:
      'NetworkPolicy: allow only namespace X → Service Y. Service mesh adds mTLS on top of ClusterIP. Avoid exposing ClusterIP outside cluster without intentional LB.',
    observability:
      'kubectl get endpointslices; Prometheus kube-state-metrics: `kube_endpointslice_endpoints`. Alert `available < desired` for critical services.',
    trap:
      'Calling pod IP directly in code — breaks on every reschedule. Always use Service name or mesh virtual service.',
    interviewAnswer:
      'A K8s Service provides stable ClusterIP and DNS for a set of pods matched by labels. EndpointSlices list ready pod IPs; kube-proxy or CNI forwards traffic. It is server-side discovery — clients resolve DNS and the platform load-balances. Readiness probes determine which pods appear in endpoints.',
    remember: [
      'ClusterIP = virtual IP + DNS name',
      'Label selector links Service → Pods',
      'EndpointSlice is source of backend list',
      'Readiness probe gates endpoint membership',
    ],
    oneLiner: 'Stable ClusterIP/DNS selecting ready pods via label selector and EndpointSlices.',
  },
  {
    id: 'coredns-resolution',
    title: 'CoreDNS in Kubernetes',
    what:
      'CoreDNS is the default cluster DNS server. It resolves `*.svc.cluster.local` names to ClusterIP or pod IPs (headless), forwards external names to upstream resolvers, and supports custom plugins (rewrite, health, template).',
    why:
      'Every pod gets `dnsPolicy: ClusterFirst` — `payment-service` resolves automatically. Without cluster DNS, microservices cannot find each other by name.',
    when:
      'All K8s workloads. Custom CoreDNS ConfigMap for stub domains, internal company DNS integration, or ndots tuning.',
    how:
      'Pod spec: `dnsPolicy: ClusterFirst`. FQDN: `payment-service.default.svc.cluster.local`. ndots:5 means short names like `payment-service` try search paths first. Java: default JVM resolver uses pod DNS — no special code. Tune `resolv.conf` ndots to reduce lookup latency.',
    flow: `sequenceDiagram
  participant P as Pod
  participant CD as CoreDNS
  participant API as K8s API
  P->>CD: payment-service.default.svc.cluster.local
  CD->>API: watch Endpoints/EndpointSlice
  API-->>CD: backend records
  CD-->>P: ClusterIP or pod IPs`,
    failure:
      'CoreDNS overload — DNS timeouts cascade to all services. ndots misconfiguration causes extra search path queries (5 lookups per name). Upstream forwarder down — external API calls fail DNS. Cache plugin serves stale records after rapid endpoint churn.',
    tradeoff:
      'Pros: centralized, plugin-extensible. Cons: shared failure domain; DNS caching vs endpoint churn latency.',
    security:
      'Restrict CoreDNS network access. Disable unnecessary plugins. DNS policy for egress filtering. Private cluster DNS not exposed publicly.',
    observability:
      'CoreDNS metrics: request count, RCODES, forward latency. `dns_lookup_duration_seconds` in client traces. Alert DNS error rate > baseline.',
    trap:
      'Setting `ndots:2` without understanding — can break resolution of external FQDNs or add latency to internal short names.',
    interviewAnswer:
      'CoreDNS resolves Kubernetes service names to ClusterIP or pod IPs by watching the API server. Pods use ClusterFirst DNS so `http://payment-service` works without Eureka. I watch CoreDNS QPS and p99 latency — DNS failure looks like "every dependency is down."',
    remember: [
      'ClusterFirst DNS in every pod',
      'FQDN: name.ns.svc.cluster.local',
      'ndots affects short name resolution paths',
      'CoreDNS watches API for endpoint changes',
    ],
    oneLiner: 'Cluster DNS resolves svc.cluster.local names from live EndpointSlice data.',
  },
  {
    id: 'endpointslices',
    title: 'EndpointSlices & Endpoint Propagation',
    what:
      'EndpointSlice is the modern K8s API object (replacing Endpoints) that lists network endpoints (pod IP + port + readiness) for a Service. Slices are sharded for scale (max 100 endpoints per slice by default) and watched by kube-proxy, CNI, and mesh controllers.',
    why:
      'At thousands of pods per Service, monolithic Endpoints objects caused API server watch storms. EndpointSlices enable incremental updates and better scalability for large fleets.',
    when:
      'Default on K8s 1.21+. Any debugging of "Service has no endpoints" or mesh route population. Dual-stack clusters use addressType IPv4/IPv6 slices.',
    how:
      'Controller manager creates EndpointSlice when pods match Service selector and pass readiness. Inspect: `kubectl get endpointslices -l kubernetes.io/service-name=payment-service`. Spring K8s Fabric8 client can watch slices for custom discovery. Latency: slice update → kube-proxy programming ~1-2s typical.',
    flow: `flowchart TB
  Pod[Pod ready] --> EP[EndpointSlice controller]
  EP --> ES[EndpointSlice object]
  ES --> KP[kube-proxy / CNI]
  ES --> Istio[Istio/Envoy xDS]
  KP --> Traffic`,
    failure:
      'Readiness flapping — endpoints churn, connection resets. Topology hints ignored by older kube-proxy. EndpointSlice without matching Service — orphaned. Overlapping selectors — duplicate traffic paths.',
    tradeoff:
      'Pros: scalable, incremental watches. Cons: more objects to reason about; propagation delay still exists between probe pass and dataplane update.',
    security:
      'RBAC: restrict who can read EndpointSlices (reveals pod topology). NetworkPolicy still required — knowing IP is not authorization.',
    observability:
      'Compare `kubectl get endpointslices` count vs ready pods. Metrics: endpoint slice sync latency. Trace connection failures against slice update events during deploys.',
    trap:
      'Pod Running but not Ready — appears in `kubectl get pods` but missing from EndpointSlice. Always check readiness probe, not just pod status.',
    interviewAnswer:
      'EndpointSlices list ready pod IPs for a Service, sharded for scale. kube-proxy and service mesh controllers watch them to program load balancing. If calls fail after deploy, I check EndpointSlice contents and readiness probe — Running pod ≠ in endpoints.',
    remember: [
      'Replaced legacy Endpoints for scale',
      'Max ~100 endpoints per slice — sharded',
      'Readiness probe required for inclusion',
      'Mesh and kube-proxy both consume slices',
    ],
    oneLiner: 'Sharded ready-pod lists feeding kube-proxy and mesh dataplanes.',
  },
  {
    id: 'k8s-probes-health',
    title: 'Kubernetes Probes (Liveness / Readiness / Startup)',
    what:
      'Kubelet executes HTTP/TCP/exec probes on containers. Liveness: restart if deadlocked. Readiness: include/exclude from Service endpoints. Startup: defer liveness until slow-boot apps finish initialization.',
    why:
      'Discovery must not route to broken instances. Readiness gates EndpointSlice membership — the link between health and service discovery on K8s.',
    when:
      'Every production Deployment. Readiness for dependency checks (DB, cache). Startup for JVM apps with 60s+ boot. Liveness only for deadlock detection — not for downstream failures.',
    how:
      'Boot 3 Actuator: `management.endpoint.health.probes.enabled=true` exposes `/actuator/health/liveness` and `/actuator/health/readiness`. YAML probe on port 8080. Readiness includes custom `ReadinessHealthIndicator` for Kafka/DB. Do NOT put downstream failures in liveness — causes restart loops.',
    flow: `stateDiagram-v2
  [*] --> Starting
  Starting --> Ready: startupProbe success
  Ready --> NotReady: readiness fails
  NotReady --> Ready: readiness ok
  Ready --> Restart: liveness fails`,
    failure:
      'Liveness checks DB → pod restart storm during DB outage. Readiness too shallow (always UP) → traffic to JVM still starting. Probe timeout < slow GC pause → false restart. Shared actuator port blocked by NetworkPolicy.',
    tradeoff:
      'Pros: platform-native health gating. Cons: probe design errors cause outages worse than the original failure.',
    security:
      'Actuator on management port — separate from app port or secure with NetworkPolicy. Do not expose actuator publicly on Ingress. Probe endpoints leak dependency status — restrict internally.',
    observability:
      'Kube events: Unhealthy probe failures. Correlate readiness flaps with deploy times. `kube_pod_status_ready` metric. Custom readiness should be cheap — sub-100ms.',
    trap:
      'Using liveness for "dependency down" — kills pod instead of removing from load balancer. Use readiness for dependencies.',
    interviewAnswer:
      'Readiness determines EndpointSlice membership — if readiness fails, the pod is removed from service discovery. Liveness restarts the container on deadlock. Startup protects slow JVM boot from premature liveness kills. I put DB/Kafka checks in readiness, never liveness.',
    remember: [
      'Readiness → EndpointSlice → discovery',
      'Liveness → kubelet restart only',
      'Startup → defer liveness for slow boot',
      'Actuator probes.enabled=true in Boot 3',
    ],
    oneLiner: 'Readiness gates discovery; liveness restarts; startup protects slow boot.',
  },
  {
    id: 'lb-round-robin',
    title: 'Load Balancing — Round Robin',
    what:
      'Distributes requests sequentially across healthy backends: instance 1, 2, 3, 1, 2, 3… Spring Cloud LoadBalancer, nginx `upstream`, Envoy cluster, and AWS ALB default algorithms use variants of round robin.',
    why:
      'Simple, stateless, fair when requests are homogeneous and backends are equal capacity. No memory of past assignments — easy to implement in client libraries and proxies.',
    when:
      'Uniform microservices (same CPU/RAM), stateless REST APIs, short-lived requests. Default choice before profiling shows skew.',
    how:
      'Spring Cloud LoadBalancer default `RoundRobinLoadBalancer`. Java 21 manual: `AtomicInteger` counter modulo instance list size. Envoy: `lb_policy: ROUND_ROBIN`. Verify equal instance count per zone to avoid accidental zone skew when list is ordered.',
    flow: `flowchart LR
  R1 --> I1
  R2 --> I2
  R3 --> I3
  R4 --> I1`,
    failure:
      'Long requests pile on same instance if connection reuse sticks (HTTP keep-alive to one backend). Unequal instance sizes — round robin ignores capacity. One slow instance gets equal share → tail latency spikes.',
    tradeoff:
      'Pros: O(1), no state. Cons: ignores load, connection count, or response time — poor for heterogeneous fleets.',
    security:
      'Rotate backends in LB pool after compromise — round robin does not isolate attacked instance faster than health check removal.',
    observability:
      'Per-instance request rate should be flat ±10%. Skew alerts: one instance 2x QPS of peers. Trace backend IP tag to detect stickiness issues.',
    trap:
      'HTTP keep-alive + single connection → not round robin per request — one TCP connection = one backend until reconnect.',
    interviewAnswer:
      'Round robin cycles through backends in order. It works when instances are homogeneous and requests are short. I watch per-instance QPS — skew often means keep-alive stickiness or unequal readiness counts, not the algorithm failing.',
    remember: [
      'Default LB — simple cyclic selection',
      'Keep-alive can stick to one backend',
      'Ignores load and capacity differences',
      'Spring LoadBalancer default strategy',
    ],
    oneLiner: 'Cycle requests across backends — simple but ignores load and capacity.',
  },
  {
    id: 'lb-weighted-least-conn',
    title: 'Load Balancing — Weighted & Least Connections',
    what:
      'Weighted round robin assigns proportional traffic by weight (canary 10%, stable 90%). Least connections routes to the backend with the fewest active connections — better for long-lived or variable-duration requests.',
    why:
      'Heterogeneous instance types (large vs small nodes), canary releases, and connection-heavy workloads need smarter selection than plain round robin.',
    when:
      'Canary deploys (Istio `VirtualService` weights), mixed instance sizes on ASG, WebSocket/gRPC streams, JDBC connection pools behind pooler.',
    how:
      'Istio: `weight: 90` / `weight: 10` on route destinations. Nginx: `least_conn` in upstream. Spring custom `ReactorLoadBalancer` with weight metadata from Eureka. Envoy: `LEAST_REQUEST` LB policy (approximate least conn).',
    flow: `flowchart TB
  subgraph Weighted
    W90[stable 90%] 
    W10[canary 10%]
  end
  subgraph LeastConn
    A[conn=50] 
    B[conn=12] --> pick B
  end`,
    failure:
      'Weight misconfiguration sends 100% to canary. Least-conn with HTTP/2 multiplexing — one connection carries many streams, metric misleading. Stale weight metadata after scale-down.',
    tradeoff:
      'Pros: supports canary and load awareness. Cons: weights need governance; least-conn state adds memory and sync complexity in distributed clients.',
    security:
      'Canary must receive same auth/policy as stable — weight alone does not isolate security boundary.',
    observability:
      'Compare canary vs stable error rate at same weight ratio. Least-conn: active connection count per backend from Envoy/nginx stats.',
    trap:
      'Using weights for A/B without monitoring canary errors — 10% traffic with 5x error rate still hurts SLO.',
    interviewAnswer:
      'Weighted routing splits traffic by percentage — essential for canary deploys. Least connections picks the backend with fewest active connections — better for long requests than round robin. On HTTP/2, I prefer least-request (Envoy) because one connection multiplexes many streams.',
    remember: [
      'Weight = canary/blue-green traffic split',
      'Least-conn for long-lived connections',
      'HTTP/2 multiplexing distorts conn count',
      'Istio VirtualService weight common pattern',
    ],
    oneLiner: 'Weight for canary splits; least-conn for connection-heavy workloads.',
  },
  {
    id: 'lb-consistent-hashing',
    title: 'Load Balancing — Consistent Hashing',
    what:
      'Maps a key (user ID, session ID, partition key) to a backend via hash ring so the same key always hits the same instance (until topology change). Minimizes redistribution when nodes add/remove compared to naive modulo hash.',
    why:
      'Local caching per key, sticky sessions without server-side session store, and shard-aware routing reduce cross-node chatter and cache miss rates.',
    when:
      'Cart/session affinity, rate limiter per-tenant counters on instance, Kafka partition-like sharding at HTTP layer. Envoy ring hash, nginx hash `$request_uri consistent`.',
    how:
      'Envoy: `hash_policy: cookie` or `header: x-tenant-id` with `RING_HASH`. Java: `hash(tenantId) % n` with rendezvous hash for minimal remapping on scale. Spring Session Redis is alternative — consistent hash when you cannot centralize session.',
    flow: `flowchart LR
  K1[user:42] --> H[hash ring]
  K2[user:99] --> H
  H --> I2[instance B]
  H --> I1[instance A]`,
    failure:
      'Hot key — one hash slot overloaded while others idle. Topology change remaps keys — cache stampede. Weak hash on attacker-controlled keys → DoS one backend.',
    tradeoff:
      'Pros: affinity without central session DB. Cons: uneven load with skewed key distribution; remapping on scale events.',
    security:
      'Hash on stable internal tenant ID, not spoofable client header without auth. Rate limit per hash bucket to mitigate hot-key abuse.',
    observability:
      'Per-backend cache hit rate, key distribution histogram. Alert one instance CPU 3x peers — likely hot key.',
    trap:
      'Modulo hash on instance count change remaps most keys — use consistent hashing (ring) or rendezvous hashing for smoother scale.',
    interviewAnswer:
      'Consistent hashing routes the same key to the same backend for cache affinity. Use ring hash (Envoy) or rendezvous hash to limit remapping when nodes change. Watch for hot keys — hashing does not fix skewed access patterns.',
    remember: [
      'Same key → same backend (affinity)',
      'Ring/rendezvous hash smooths scale events',
      'Hot key problem still possible',
      'Prefer Redis session if affinity too brittle',
    ],
    oneLiner: 'Hash key to backend for affinity — mind hot keys and remapping on scale.',
  },
  {
    id: 'gateway-north-south',
    title: 'API Gateway — North-South Traffic',
    what:
      'North-south is external client → cluster edge → internal services. API Gateway (Spring Cloud Gateway, Kong, AWS API Gateway, Envoy Gateway) terminates TLS, authenticates, rate-limits, routes `/api/payments/**` to `payment-service`, and hides internal topology.',
    why:
      'Clients should not know internal service URLs, JWT validation rules, or rate limits per API. Central edge enforces CORS, WAF, API keys, and protocol translation (HTTP/JSON ↔ gRPC).',
    when:
      'Mobile/web apps hitting public APIs. BFF aggregation at edge. Multi-tenant SaaS API product surface. Not for every internal east-west call.',
    how:
      'Spring Cloud Gateway Boot 3: `spring-cloud-starter-gateway`, route `uri: lb://payment-service`, predicates `Path=/api/payments/**`, filters `RequestRateLimiter`, global `JwtAuthenticationFilter`. Deploy behind ALB with TLS. Propagate `traceparent` — do not mint new ID every hop.',
    flow: `flowchart TB
  Client[Mobile/Web] --> ALB[ALB TLS]
  ALB --> GW[API Gateway]
  GW --> Auth[JWT validate]
  GW --> RL[Rate limit]
  GW --> PS[payment-service]
  GW --> OS[order-service]`,
    failure:
      'Gateway becomes ESB — business logic in filters. Blocking JDBC in reactive Gateway stalls Netty event loop. Gateway outage = total API blackout — need HA replicas and health checks. Timeout mismatch — edge 30s, backend 3s chain sums wrong.',
    tradeoff:
      'Pros: single security perimeter, API product features. Cons: latency hop, bottleneck risk, operational complexity.',
    security:
      'TLS termination, OAuth2/OIDC JWT validation, mTLS to backends optional. WAF, IP allowlists, request size limits. Never trust client tenant header without JWT claim.',
    observability:
      'Gateway access logs with route id, latency, status. RED metrics per route. Trace root span at gateway — parent for all downstream.',
    trap:
      'Putting domain validation in gateway that belongs in service — duplicates rules and drifts.',
    interviewAnswer:
      'North-south traffic enters through API Gateway at the cluster edge. Gateway handles TLS, auth, rate limiting, routing, and observability for external clients. Internal services stay private. I keep business rules in domain services — gateway only cross-cutting concerns.',
    remember: [
      'North-south = external → edge → services',
      'Gateway = auth, rate limit, route, TLS',
      'Spring Cloud Gateway on Netty — no blocking',
      'Do not duplicate domain logic at edge',
    ],
    oneLiner: 'External traffic enters via gateway for auth, routing, and policy at the edge.',
  },
  {
    id: 'gateway-east-west',
    title: 'East-West Traffic & Mesh Ingress',
    what:
      'East-west is service-to-service inside the cluster (order → payment). Traditionally ClusterIP direct calls. Mesh ingress/egress gateways optional for controlled cross-namespace or cross-cluster east-west with TLS and policy.',
    why:
      'Direct pod-to-pod calls skip mTLS and fine-grained policy unless mesh adds L7 rules. East-west gateway consolidates cross-cluster or legacy VM traffic into mesh with identity.',
    when:
      'Istio east-west gateway for multi-cluster, namespace isolation with explicit egress rules, or replacing direct ClusterIP with mesh VirtualService for retries/timeouts uniformly.',
    how:
      'Default K8s: `http://payment-service` ClusterIP. Istio: `VirtualService` + `DestinationRule` with mTLS, retries, subset routing. Cross-cluster: expose `istio-eastwestgateway` and route via `networking.istio.io/exportTo`. Spring: same RestClient — mesh intercepts transparently with sidecar.',
    flow: `flowchart LR
  O[order-service] -->|ClusterIP or mesh| P[payment-service]
  subgraph Mesh optional
    S[sidecar Envoy]
  end
  O --> S --> P`,
    failure:
      'Bypassing mesh (direct ClusterIP) skips mTLS and policy — shadow traffic unprotected. Double timeout — app 3s + mesh 3s misunderstanding. East-west gateway as SPOF without HA.',
    tradeoff:
      'Pros: uniform policy on internal traffic. Cons: sidecar CPU/latency; complexity for simple ClusterIP that already works.',
    security:
      'mTLS STRICT mode for east-west. AuthorizationPolicy: order-service SA can POST payment-service only. Egress control for external APIs.',
    observability:
      'Mesh telemetry: success rate per source→destination pair. Without mesh, rely on client tracing and ServiceMonitor.',
    trap:
      'Installing Istio for north-south only — most value is consistent east-west mTLS, retries, and golden metrics.',
    interviewAnswer:
      'East-west is internal service-to-service traffic. Default K8s uses ClusterIP DNS. Service mesh adds sidecars for mTLS, retries, and L7 policy on east-west without changing Java code. East-west gateway appears in multi-cluster federation — not every internal call needs a gateway hop.',
    remember: [
      'East-west = service ↔ service inside cluster',
      'ClusterIP default; mesh adds policy layer',
      'East-west gateway for multi-cluster mesh',
      'Sidecar intercepts without app code change',
    ],
    oneLiner: 'Internal service calls — ClusterIP default; mesh adds mTLS and L7 policy.',
  },
  {
    id: 'istio-envoy-service-mesh',
    title: 'Service Mesh — Istio & Envoy',
    what:
      'Istio control plane (istiod) configures Envoy sidecars (or ambient ztunnel) for L4/L7 traffic management: routing, TLS, retries, circuit breaking, fault injection, and telemetry. Envoy is the data plane proxy executing those rules.',
    why:
      'Polyglot services — uniform retries, mTLS, and metrics without per-language libraries. Decouple traffic policy from application release cycle via K8s CRDs (`VirtualService`, `DestinationRule`).',
    when:
      'Multi-team K8s with mixed languages, strict mTLS compliance, canary/traffic mirroring at platform level. Skip for small clusters where Resilience4j + K8s NetworkPolicy suffices.',
    how:
      'Label namespace `istio-injection=enabled`. Deploy app — sidecar injected. `VirtualService` route weights; `DestinationRule` subsets and `connectionPool` limits. Boot 3 app unchanged — `RestClient` to `http://payment-service`; Envoy captures outbound. Use `holdApplicationUntilProxyStarts` for startup ordering.',
    flow: `flowchart TB
  CP[istiod control plane]
  CP -->|xDS config| E1[Envoy sidecar order]
  CP -->|xDS config| E2[Envoy sidecar payment]
  E1 -->|mTLS| E2`,
    failure:
      'Sidecar resource limits too low — OOM during large payloads. xDS push storm on config churn. Ambient vs sidecar migration complexity. Debugging "who closed connection" requires Envoy access logs.',
    tradeoff:
      'Pros: uniform policy, mTLS, rich telemetry. Cons: ~50-100ms p99 added in some setups; CPU/memory per pod; operational learning curve.',
    security:
      'PeerAuthentication STRICT mTLS. RequestAuthentication JWT at ingress. AuthorizationPolicy least privilege. Rotate Istio CA / cert lifetime.',
    observability:
      'Istio metrics: request duration, tcp bytes, 5xx by source/destination. Kiali service graph. Envoy access log JSON to Loki.',
    trap:
      'Mesh retries on non-idempotent POST — duplicates payments. Must align mesh retry policy with app idempotency.',
    interviewAnswer:
      'Istio configures Envoy sidecars for traffic management and security without changing service code. Control plane pushes xDS config; data plane enforces mTLS, routing, retries, and circuit breaking. I adopt mesh when I need uniform east-west policy across polyglot services — not as default for tiny Spring-only clusters.',
    remember: [
      'Istio = control plane; Envoy = data plane',
      'VirtualService + DestinationRule = route + pool',
      'Sidecar intercepts all pod traffic',
      'Align mesh retries with idempotency',
    ],
    oneLiner: 'Istio programs Envoy sidecars for mTLS, routing, retries without app changes.',
  },
  {
    id: 'mesh-mtls-retries-circuit-breaker',
    title: 'Mesh mTLS, Retries & Circuit Breaking',
    what:
      'Envoy/Istio enforces mutual TLS between sidecars (SPIFFE identities), automatic HTTP/gRPC retries with per-route budgets, and outlier detection (eject unhealthy hosts) — platform-level resilience distinct from app libraries.',
    why:
      'Encrypt east-west traffic without app cert management. Retry transient 5xx/connection failures closer to the wire with configurable per-try timeout. Circuit break via `maxConnections`, `maxPendingRequests`, `outlierDetection` — shed load before cascade.',
    when:
      'Compliance mTLS, uniform retry across Node + Java + Go services. Outlier detection when one pod version is bad during partial deploy.',
    how:
      'DestinationRule: `trafficPolicy.tls.mode: ISTIO_MUTUAL`, `connectionPool.tcp.maxConnections: 100`, `outlierDetection.consecutive5xx: 5`. VirtualService: `retries: { attempts: 3, perTryTimeout: 2s, retryOn: 5xx,reset,connect-failure }`. Boot 3: disable duplicate Resilience4j retry when mesh owns retries.',
    flow: `sequenceDiagram
  participant O as order Envoy
  participant P as payment Envoy
  O->>P: mTLS request try1
  P-->>O: 503
  O->>P: mTLS retry try2
  P-->>O: 200`,
    failure:
      'Double retry — app Resilience4j 3x + mesh 3x = 9 attempts. mTLS STRICT breaks legacy pod without sidecar. Outlier detection too aggressive — flapping during slow deploy.',
    tradeoff:
      'Pros: consistent wire-level policy. Cons: opaque to developers; duplicate with app libraries if not coordinated.',
    security:
      'SPIFFE ID per service account — AuthorizationPolicy binds to principal. mTLS encrypts payload on wire; not a substitute for authZ at app layer.',
    observability:
      'Istio: `istio_requests_total`, outlier ejection events. Compare mesh retry count vs app retry metrics — should not both spike.',
    trap:
      'retryOn including `retriable-4xx` on POST — dangerous. Limit to connect-failure, 5xx, refused-stream for gRPC.',
    interviewAnswer:
      'Mesh mTLS gives encrypted east-west with automatic cert rotation via Istio CA. Envoy retries are configured in VirtualService with perTryTimeout; circuit breaking and outlier detection live in DestinationRule connectionPool. I disable app-level retries when mesh handles them to avoid retry multiplication on non-idempotent writes.',
    remember: [
      'ISTIO_MUTUAL = automatic east-west mTLS',
      'perTryTimeout × attempts ≤ route timeout',
      'Outlier detection = mesh circuit breaker',
      'Never double retry app + mesh',
    ],
    oneLiner: 'Mesh mTLS encrypts east-west; Envoy retries and outlier detection shed unhealthy peers.',
  },
  {
    id: 'mesh-vs-resilience4j',
    title: 'Service Mesh vs Resilience4j — When Which',
    what:
      'Resilience4j runs in-process (Java): CircuitBreaker, Retry, Bulkhead, TimeLimiter around method calls. Service mesh runs out-of-process in Envoy: wire-level retries, mTLS, LB, outlier detection. They overlap but operate at different layers.',
    why:
      'Teams waste effort duplicating policies or miss coverage — Node services without Resilience4j still need retries; Java-only Resilience4j leaves east-west unencrypted and metrics fragmented.',
    when:
      'Resilience4j: Spring-only estate, fine-grained business exception classification, bulkhead per dependency in code. Mesh: polyglot, mandatory mTLS, platform team owns traffic policy, canary at L7. Both: mesh for mTLS + metrics; Resilience4j for business-aware fallback and bulkhead — disable mesh retries.',
    how:
      'Resilience4j Boot 3: `resilience4j-spring-boot3`, `@CircuitBreaker(name="payment")`, `@Retry` only on idempotent reads. Mesh: mTLS + outlier detection ON; VirtualService `retries.attempts: 0` for mutating routes. Document ownership matrix per route.',
    flow: `flowchart TB
  subgraph App layer
    R4J[Resilience4j CB Bulkhead Fallback]
  end
  subgraph Mesh layer
    E[Envoy mTLS LB outlier]
  end
  R4J --> E --> Backend`,
    failure:
      'Both retry → storm. Mesh CB opens while app CB closed — confusing dashboards. TimeLimiter cancels thread while mesh retry still in flight.',
    tradeoff:
      'Resilience4j: precise, testable in unit tests, Java-only. Mesh: universal, opaque, infra cost. Hybrid is common at scale.',
    security:
      'Mesh mTLS does not replace app authZ. Resilience4j fallback must not leak data from cache without auth check.',
    observability:
      'Single dashboard: mesh istio_requests + resilience4j circuitbreaker_state. Alert when both layers show elevated failures.',
    trap:
      'Interview "mesh replaces circuit breaker" — false. Mesh outlier detection is host-level; Resilience4j CB is dependency-call-level with fallback logic.',
    interviewAnswer:
      'Mesh and Resilience4j are complementary layers. Mesh excels at mTLS, uniform metrics, and host-level outlier detection across all languages. Resilience4j excels at Java business-aware retries, bulkheads, and fallbacks in unit-testable code. I use mesh for encryption and platform policy; Resilience4j for domain-specific resilience — and I never double retry.',
    remember: [
      'Mesh = wire/platform; R4J = in-process Java',
      'Mesh mTLS ≠ app circuit breaker semantics',
      'Pick one owner for retries per route',
      'Hybrid: mesh mTLS + R4J bulkhead/fallback',
    ],
    oneLiner: 'Mesh for platform mTLS/metrics; Resilience4j for Java business resilience — not duplicate retries.',
    tables: [
      {
        headers: ['Concern', 'Resilience4j', 'Istio/Envoy mesh'],
        rows: [
          ['mTLS east-west', 'No', 'Yes (ISTIO_MUTUAL)'],
          ['Retry on 5xx', 'Yes (method-level)', 'Yes (route-level)'],
          ['Circuit breaker', 'Call-level states', 'Outlier detection / pool limits'],
          ['Bulkhead', 'Thread/semaphore pools', 'maxConnections pending queue'],
          ['Fallback logic', 'Java code', 'No — fail or mirror only'],
          ['Polyglot', 'Java only', 'All languages'],
          ['Unit test', 'Easy @CircuitBreaker', 'Integration/e2e'],
        ],
      },
    ],
  },
];
