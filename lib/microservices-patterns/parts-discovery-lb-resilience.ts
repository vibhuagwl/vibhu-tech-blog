import type {PatternCard} from './types';

// ---------------------------------------------------------------------------
// Part 3 — Service discovery
// ---------------------------------------------------------------------------

export const DISCOVERY_PATTERNS: PatternCard[] = [
  {
    id: 'client-side-discovery',
    part: 3,
    name: 'Client-Side Service Discovery',
    frequency: 'Occasionally used',
    definition:
      'The client queries a service registry (e.g. Eureka), caches healthy instances, and chooses a target for each outbound call — load balancing lives in the application, not the network edge.',
    problem:
      'Hard-coded host:port lists go stale when pods scale or fail. Without a registry, clients cannot find newly registered instances or avoid dead ones.',
    realWorld:
      'Netflix Eureka + Ribbon (legacy Spring Cloud), Consul client agents, or custom registries in brownfield JVM shops before Kubernetes became dominant.',
    whyExists:
      'Decouples service location from deployment topology. Instances self-register; clients poll or subscribe for changes and apply local selection policies (round-robin, zone affinity).',
    ascii: `┌─────────┐   register/heartbeat   ┌──────────────┐
│ Service │ ──────────────────────► │   Registry   │
│   A,B,C │ ◄────────────────────── │   (Eureka)   │
└─────────┘   fetch instances       └──────┬───────┘
                                           │
┌─────────┐   pick instance + call         │
│ Client  │ ◄──────────────────────────────┘
└─────────┘`,
    flow: `sequenceDiagram
  participant S as Service Instance
  participant E as Eureka Server
  participant C as Client
  S->>E: POST /eureka/apps/ORDER (register)
  loop every 30s
    S->>E: PUT /eureka/apps/ORDER/{id} (heartbeat)
  end
  C->>E: GET /eureka/apps/ORDER
  E-->>C: instance list (UP)
  C->>C: filter healthy + zone
  C->>S: HTTP call to chosen host:port
  Note over S,E: On shutdown: DELETE registration`,
    components: [
      {name: 'Service Registry', responsibility: 'Authoritative catalog of instance metadata (host, port, health, zone).'},
      {name: 'Registration Agent', responsibility: 'Boot-time register + periodic heartbeat renewal on each instance.'},
      {name: 'Discovery Client', responsibility: 'Fetch/cache registry snapshot; react to cache refresh events.'},
      {name: 'Health Indicator', responsibility: 'Mark instance DOWN when dependency checks fail; registry evicts on missed heartbeats.'},
      {name: 'Instance Selector', responsibility: 'Choose one instance per request from the healthy set.'},
    ],
    javaCode: `package com.vibhu.discovery.client;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/** Minimal Eureka-style client-side discovery (Java 21, no Spring). */
public final class ClientSideDiscovery {

  public record ServiceInstance(
      String instanceId,
      String host,
      int port,
      String zone,
      String status,
      Instant lastHeartbeat) {
    public URI baseUri() {
      return URI.create("http://" + host + ":" + port);
    }
    public boolean isUp() {
      return "UP".equalsIgnoreCase(status);
    }
  }

  public interface RegistryClient {
    void register(ServiceInstance self) throws Exception;
    void renew(String appName, String instanceId) throws Exception;
    void deregister(String appName, String instanceId) throws Exception;
    List<ServiceInstance> fetchInstances(String appName) throws Exception;
  }

  /** In-memory registry stand-in for Eureka HTTP API semantics. */
  public static final class InMemoryRegistry implements RegistryClient {
    private final Map<String, Map<String, ServiceInstance>> apps = new ConcurrentHashMap<>();
    private final Duration evictionAfterMissedHeartbeats;

    public InMemoryRegistry(Duration evictionAfterMissedHeartbeats) {
      this.evictionAfterMissedHeartbeats = evictionAfterMissedHeartbeats;
    }

    @Override
    public void register(ServiceInstance self) {
      apps.computeIfAbsent("ORDER", k -> new ConcurrentHashMap<>()).put(self.instanceId(), self);
    }

    @Override
    public void renew(String appName, String instanceId) {
      Map<String, ServiceInstance> instances = apps.get(appName);
      if (instances == null) {
        return;
      }
      ServiceInstance current = instances.get(instanceId);
      if (current != null) {
        instances.put(instanceId, new ServiceInstance(
            current.instanceId(), current.host(), current.port(), current.zone(),
            current.status(), Instant.now()));
      }
    }

    @Override
    public void deregister(String appName, String instanceId) {
      Map<String, ServiceInstance> instances = apps.get(appName);
      if (instances != null) {
        instances.remove(instanceId);
      }
    }

    @Override
    public List<ServiceInstance> fetchInstances(String appName) {
      evictStale(appName);
      Map<String, ServiceInstance> instances = apps.getOrDefault(appName, Map.of());
      return List.copyOf(instances.values());
    }

    private void evictStale(String appName) {
      Map<String, ServiceInstance> instances = apps.get(appName);
      if (instances == null) {
        return;
      }
      Instant cutoff = Instant.now().minus(evictionAfterMissedHeartbeats);
      instances.entrySet().removeIf(e -> e.getValue().lastHeartbeat().isBefore(cutoff));
    }
  }

  public static final class EurekaRegistrationAgent implements AutoCloseable {
    private final RegistryClient registry;
    private final String appName;
    private final ServiceInstance self;
    private final ScheduledExecutorService scheduler =
        Executors.newSingleThreadScheduledExecutor(r -> new Thread(r, "eureka-heartbeat"));
    private final HealthCheck healthCheck;

    public EurekaRegistrationAgent(
        RegistryClient registry, String appName, ServiceInstance self, HealthCheck healthCheck) {
      this.registry = Objects.requireNonNull(registry);
      this.appName = Objects.requireNonNull(appName);
      this.self = Objects.requireNonNull(self);
      this.healthCheck = Objects.requireNonNull(healthCheck);
    }

    public void start() throws Exception {
      registry.register(self);
      scheduler.scheduleAtFixedRate(this::heartbeat, 0, 30, TimeUnit.SECONDS);
    }

    private void heartbeat() {
      try {
        if (!healthCheck.isHealthy()) {
          return;
        }
        registry.renew(appName, self.instanceId());
      } catch (Exception ignored) {
        // production: log + metric
      }
    }

    @Override
    public void close() throws Exception {
      scheduler.shutdownNow();
      registry.deregister(appName, self.instanceId());
    }
  }

  public interface HealthCheck {
    boolean isHealthy();
  }

  public static final class CompositeHealthCheck implements HealthCheck {
    private final List<HealthCheck> checks;
    public CompositeHealthCheck(List<HealthCheck> checks) {
      this.checks = List.copyOf(checks);
    }
    @Override
    public boolean isHealthy() {
      return checks.stream().allMatch(HealthCheck::isHealthy);
    }
  }

  public static final class DiscoveryClient {
    private final RegistryClient registry;
    private final AtomicReference<List<ServiceInstance>> cache = new AtomicReference<>(List.of());

    public DiscoveryClient(RegistryClient registry) {
      this.registry = registry;
    }

    public void refresh(String appName) throws Exception {
      List<ServiceInstance> up = registry.fetchInstances(appName).stream()
          .filter(ServiceInstance::isUp)
          .toList();
      cache.set(up);
    }

    public List<ServiceInstance> instances() {
      return cache.get();
    }
  }

  public static final class RoundRobinSelector {
    private final AtomicInteger cursor = new AtomicInteger(0);

    public Optional<ServiceInstance> choose(List<ServiceInstance> instances) {
      if (instances.isEmpty()) {
        return Optional.empty();
      }
      int index = Math.floorMod(cursor.getAndIncrement(), instances.size());
      return Optional.of(instances.get(index));
    }
  }

  public static final class OrderServiceClient implements AutoCloseable {
    private final DiscoveryClient discovery;
    private final RoundRobinSelector selector;
    private final HttpClient http = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(2))
        .build();
    private final String appName;

    public OrderServiceClient(DiscoveryClient discovery, String appName) {
      this.discovery = discovery;
      this.appName = appName;
      this.selector = new RoundRobinSelector();
    }

    public String getOrder(String orderId) throws Exception {
      discovery.refresh(appName);
      ServiceInstance target = selector.choose(discovery.instances())
          .orElseThrow(() -> new IllegalStateException("No healthy ORDER instances"));
      HttpRequest req = HttpRequest.newBuilder(target.baseUri().resolve("/orders/" + orderId))
          .timeout(Duration.ofSeconds(3))
          .GET()
          .build();
      HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
      if (resp.statusCode() >= 500) {
        throw new RuntimeException("Upstream error: " + resp.statusCode());
      }
      return resp.body();
    }

    @Override
    public void close() {
      // HttpClient has no close in Java 21
    }
  }
}`,
    springCode: `@Configuration
@EnableDiscoveryClient
public class DiscoveryConfig {
  @Bean
  @LoadBalanced
  RestClient.Builder restClientBuilder() {
    return RestClient.builder();
  }
}

@Service
public class OrderGateway {
  private final RestClient client;
  public OrderGateway(RestClient.Builder builder) {
    this.client = builder.baseUrl("http://order-service").build();
  }
  public String fetch(String id) {
    return client.get().uri("/orders/{id}", id).retrieve().body(String.class);
  }
}`,
    config: `eureka:
  client:
    serviceUrl:
      defaultZone: http://eureka-1:8761/eureka/,http://eureka-2:8762/eureka/
    register-with-eureka: true
    fetch-registry: true
    registry-fetch-interval-seconds: 30
  instance:
    prefer-ip-address: true
    lease-renewal-interval-in-seconds: 30
    lease-expiration-duration-in-seconds: 90
    health-check-url-path: /actuator/health
spring:
  application:
    name: order-service`,
    restApi: `POST /eureka/apps/{appName}     — register instance
PUT  /eureka/apps/{appName}/{id} — heartbeat renewal
DELETE /eureka/apps/{appName}/{id} — deregister
GET  /eureka/apps/{appName}      — fetch all instances`,
    unitTest: `package com.vibhu.discovery.client;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;

class ClientSideDiscoveryTest {

  private ClientSideDiscovery.EurekaRegistrationAgent agent;

  @AfterEach
  void tearDown() throws Exception {
    if (agent != null) {
      agent.close();
    }
  }

  @Test
  void registersHeartbeatsAndDiscoversInstances() throws Exception {
    ClientSideDiscovery.InMemoryRegistry registry =
        new ClientSideDiscovery.InMemoryRegistry(Duration.ofMinutes(2));
    ClientSideDiscovery.ServiceInstance inst = new ClientSideDiscovery.ServiceInstance(
        "order-1", "10.0.0.5", 8080, "us-east-1a", "UP", Instant.now());
    AtomicBoolean healthy = new AtomicBoolean(true);
    agent = new ClientSideDiscovery.EurekaRegistrationAgent(
        registry, "ORDER", inst, () -> healthy.get());
    agent.start();

    ClientSideDiscovery.DiscoveryClient client = new ClientSideDiscovery.DiscoveryClient(registry);
    client.refresh("ORDER");
    assertEquals(1, client.instances().size());
    assertEquals("order-1", client.instances().getFirst().instanceId());

    ClientSideDiscovery.RoundRobinSelector selector = new ClientSideDiscovery.RoundRobinSelector();
    assertTrue(selector.choose(client.instances()).isPresent());
  }

  @Test
  void deregistrationRemovesInstance() throws Exception {
    ClientSideDiscovery.InMemoryRegistry registry =
        new ClientSideDiscovery.InMemoryRegistry(Duration.ofMinutes(2));
    ClientSideDiscovery.ServiceInstance inst = new ClientSideDiscovery.ServiceInstance(
        "order-2", "10.0.0.6", 8080, "us-east-1a", "UP", Instant.now());
    agent = new ClientSideDiscovery.EurekaRegistrationAgent(
        registry, "ORDER", inst, () -> true);
    agent.start();
    agent.close();
    agent = null;

    ClientSideDiscovery.DiscoveryClient client = new ClientSideDiscovery.DiscoveryClient(registry);
    client.refresh("ORDER");
    assertTrue(client.instances().isEmpty());
  }

  @Test
  void compositeHealthCheckRequiresAllChecks() {
    AtomicBoolean db = new AtomicBoolean(true);
    AtomicBoolean disk = new AtomicBoolean(false);
    ClientSideDiscovery.CompositeHealthCheck check = new ClientSideDiscovery.CompositeHealthCheck(
        List.of(db::get, disk::get));
    assertFalse(check.isHealthy());
    disk.set(true);
    assertTrue(check.isHealthy());
  }
}`,
    integrationTest: `@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
class EurekaIntegrationTest {
  @Container
  static GenericContainer<?> eureka = new GenericContainer<>("steeltoeoss/eureka-server:latest")
      .withExposedPorts(8761);
  // register microservice, assert fetch-registry returns UP instance
}`,
    failureTest: `@Test
void staleCacheAfterInstanceDeath() throws Exception {
  // stop heartbeat agent; after lease expiration fetchInstances is empty
}`,
    edgeCases: [
      'Split-brain registry clusters return inconsistent instance lists — clients need version stamps or stick to one AZ.',
      'Cache stampede when thousands of clients refresh simultaneously after an outage.',
      'Self-preservation mode in Eureka keeps dead instances visible during partial registry failure.',
      'Zone-aware routing breaks when all instances in preferred zone are DOWN.',
    ],
    failureScenarios: [
      'Registry unavailable: client uses stale cache until TTL; calls may hit dead nodes.',
      'Missed heartbeats: instance evicted while still processing in-flight requests.',
      'Thundering herd on cold start: every client refreshes and hammers the same healthy pod.',
    ],
    retry: 'Retry on connection refused to a different instance after refresh; do not retry business 4xx.',
    idempotency: 'Discovery itself is read-only; downstream calls must be idempotent if retried against another instance.',
    timeout: 'Short connect timeout (1–2s) per instance attempt; cap total discovery refresh at 5s.',
    observability: 'Metrics: registry fetch latency, cache age, instances per app, selection failures. Trace outbound host tag.',
    security: 'mTLS between client and instances; registry ACLs; never expose Eureka UI publicly.',
    performance: 'Local cache avoids per-request registry round-trip; refresh interval trades freshness vs load.',
    scalability: 'Registry becomes hot spot at 10k+ services — shard by region or move to server-side (K8s).',
    production: 'Run Eureka in HA pairs; align lease duration with LB health checks; prefer K8s DNS for greenfield.',
    mistakes: [
      'Disabling fetch-registry on clients that still use @LoadBalanced URLs.',
      'Heartbeats continue after the JVM is wedged — combine with actuator health.',
      'Ignoring zone affinity causing cross-AZ latency and data transfer cost.',
    ],
    antiPatterns: [
      'Client-side discovery without caching — N×registry load per request.',
      'Hard-coded fallback IP when registry is down — masks real outages.',
    ],
    alternatives: [
      'Server-side discovery (Kubernetes Service, cloud LB).',
      'Service mesh (Envoy xDS) with client-side proxy.',
      'DNS SRV records with short TTL.',
    ],
    tradeoffs:
      'Pros: rich client-side routing (zone, weight, custom). Cons: library coupling, cache coherence, registry SPOF. K8s-native stacks usually skip Eureka.',
    interviewQs: [
      'How does Eureka lease renewal interact with load balancer health checks?',
      'What happens when the registry is partitioned from a subset of instances?',
    ],
    trickyQs: [
      'Why did Netflix move away from Eureka toward Envoy/mesh for new services?',
    ],
    seniorFollowUps: [
      'Design discovery for multi-region active-active with stale read tolerance bounds.',
      'Compare Eureka self-preservation vs Kubernetes Endpoints eventual consistency.',
    ],
  },
  {
    id: 'server-side-discovery',
    part: 3,
    name: 'Server-Side Service Discovery',
    frequency: 'Frequently used',
    definition:
      'Clients use a stable virtual address (DNS name or VIP). A platform component (kube-proxy, cloud LB, service mesh) resolves it to healthy pod IPs — discovery is opaque to application code.',
    problem:
      'Client-side registries add SDK weight and cache bugs. Platforms like Kubernetes already maintain Endpoint slices — pushing discovery into the client duplicates that work.',
    realWorld:
      'Kubernetes ClusterIP Services, AWS ALB/NLB target groups, GCP Internal LB, Linkerd/istio virtual services — the JVM calls http://order-service:8080.',
    whyExists:
      'Centralizes routing, health checking, and TLS at the platform layer. Application code stays a simple HTTP client against a DNS name that never changes when pods churn.',
    ascii: `┌────────┐  DNS: order-service   ┌─────────────┐
│ Client │ ─────────────────────► │  Service    │
└────────┘                        │  ClusterIP  │
                                  └──────┬──────┘
                                         │ Endpoints
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
                 Pod :8080           Pod :8080           Pod :8080`,
    flow: `sequenceDiagram
  participant C as Client Pod
  participant D as CoreDNS
  participant S as Service ClusterIP
  participant E as Endpoints Controller
  participant P as Order Pods
  E->>E: watch Pod readiness
  E->>S: update EndpointSlice
  C->>D: resolve order-service.ns.svc.cluster.local
  D-->>C: ClusterIP (virtual)
  C->>S: TCP to ClusterIP:8080
  S->>P: kube-proxy DNAT to healthy pod`,
    components: [
      {name: 'Service (virtual IP)', responsibility: 'Stable cluster DNS name + port mapping independent of pod lifecycle.'},
      {name: 'Endpoints / EndpointSlice', responsibility: 'Materialized list of ready pod IPs maintained by control plane.'},
      {name: 'kube-proxy / CNI', responsibility: 'Programs iptables/IPVS/eBPF to forward Service traffic to backends.'},
      {name: 'Readiness probe', responsibility: 'Removes not-ready pods from Endpoints — server-side health gate.'},
      {name: 'Client HTTP stack', responsibility: 'Resolve DNS; connection pooling; retries at app or mesh layer.'},
    ],
    javaCode: `package com.vibhu.discovery.server;

import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Objects;

/**
 * Server-side discovery: client uses Kubernetes Service DNS name.
 * No registry SDK — kube-proxy + Endpoints pick the backend pod.
 */
public final class ServerSideDiscoveryClient implements AutoCloseable {

  private final HttpClient httpClient;
  private final URI baseUri;
  private final String serviceHost;

  public ServerSideDiscoveryClient(String serviceHost, int port) {
    this.serviceHost = Objects.requireNonNull(serviceHost);
    this.baseUri = URI.create("http://" + serviceHost + ":" + port);
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(2))
        .version(HttpClient.Version.HTTP_1_1)
        .build();
  }

  /** Verify DNS resolves inside the cluster (CoreDNS). */
  public InetAddress[] resolveService() throws Exception {
    return InetAddress.getAllByName(serviceHost);
  }

  public String getOrder(String orderId) throws Exception {
    HttpRequest request = HttpRequest.newBuilder()
        .uri(baseUri.resolve("/orders/" + orderId))
        .timeout(Duration.ofSeconds(5))
        .header("Accept", "application/json")
        .GET()
        .build();
    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() == 404) {
      return null;
    }
    if (response.statusCode() >= 500) {
      throw new UpstreamException("order-service returned " + response.statusCode());
    }
    return response.body();
  }

  public static final class UpstreamException extends RuntimeException {
    public UpstreamException(String message) {
      super(message);
    }
  }

  @Override
  public void close() {
    // HttpClient is reusable; no explicit close required in Java 21
  }
}`,
    springCode: `@Service
public class OrderClient {
  private final RestClient restClient;

  public OrderClient(RestClient.Builder builder,
      @Value("\${order.service.url:http://order-service:8080}") String baseUrl) {
    this.restClient = builder.baseUrl(baseUrl).build();
  }

  public OrderDto get(String id) {
    return restClient.get()
        .uri("/orders/{id}", id)
        .retrieve()
        .body(OrderDto.class);
  }
}`,
    config: `apiVersion: v1
kind: Service
metadata:
  name: order-service
  namespace: payments
  labels:
    app: order-service
spec:
  type: ClusterIP
  selector:
    app: order-service
  ports:
    - name: http
      port: 8080
      targetPort: 8080
      protocol: TCP
---
apiVersion: discovery.k8s.io/v1
kind: EndpointSlice
metadata:
  name: order-service-abc12
  namespace: payments
  labels:
    kubernetes.io/service-name: order-service
addressType: IPv4
ports:
  - name: http
    port: 8080
    protocol: TCP
endpoints:
  - addresses: ["10.244.1.15"]
    conditions: {ready: true}
  - addresses: ["10.244.2.22"]
    conditions: {ready: true}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  namespace: payments
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
        - name: order-service
          image: registry.example/order-service:1.4.0
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            periodSeconds: 5
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            periodSeconds: 10`,
    restApi: `# Client resolves and calls — no registry REST API
GET http://order-service.payments.svc.cluster.local:8080/orders/{id}
# FQDN inside cluster; short name order-service works in same namespace`,
    unitTest: `package com.vibhu.discovery.server;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class ServerSideDiscoveryClientTest {

  private HttpServer server;
  private int port;

  @BeforeEach
  void setUp() throws Exception {
    server = HttpServer.create(new InetSocketAddress(0), 0);
    server.createContext("/orders/42", exchange -> {
      byte[] body = "{\\"id\\":\\"42\\"}".getBytes(StandardCharsets.UTF_8);
      exchange.getResponseHeaders().add("Content-Type", "application/json");
      exchange.sendResponseHeaders(200, body.length);
      try (OutputStream os = exchange.getResponseBody()) {
        os.write(body);
      }
    });
    server.start();
    port = server.getAddress().getPort();
  }

  @AfterEach
  void tearDown() {
    if (server != null) {
      server.stop(0);
    }
  }

  @Test
  void fetchesOrderViaServiceHost() throws Exception {
  // In tests we point at localhost; in K8s this would be order-service DNS
    ServerSideDiscoveryClient client =
        new ServerSideDiscoveryClient("localhost", port);
    String body = client.getOrder("42");
    assertNotNull(body);
    assertTrue(body.contains("42"));
    client.close();
  }

  @Test
  void upstream5xxThrows() throws Exception {
    server.createContext("/orders/boom", exchange -> {
      exchange.sendResponseHeaders(503, -1);
      exchange.close();
    });
    ServerSideDiscoveryClient client =
        new ServerSideDiscoveryClient("localhost", port);
    assertThrows(ServerSideDiscoveryClient.UpstreamException.class,
        () -> client.getOrder("boom"));
    client.close();
  }
}`,
    integrationTest: `@SpringBootTest
@EnabledIf("isKubernetesAvailable")
class K8sServiceDiscoveryIT {
  @Test
  void resolvesClusterDns() throws Exception {
    var client = new ServerSideDiscoveryClient(
        "order-service.payments.svc.cluster.local", 8080);
    assertTrue(client.resolveService().length > 0);
  }
}`,
    failureTest: `@Test
void noReadyEndpointsReturnsConnectionRefused() {
  // scale deployment to 0; client should fail fast with connect timeout
}`,
    edgeCases: [
      'DNS caching in JVM (networkaddress.cache.ttl) hides new pods for minutes if misconfigured.',
      'Headless Service (ClusterIP: None) returns all pod A records — client must load-balance.',
      'ExternalName Service aliases to external DNS — different failure modes.',
    ],
    failureScenarios: [
      'All pods fail readiness: Service exists but connections hang or refuse.',
      'Rolling deploy: brief window where Endpoints list is in flux.',
      'NetworkPolicy blocks pod-to-pod while DNS still resolves.',
    ],
    retry: 'Retry idempotent GET on 503/connect timeout; Kubernetes Service already retries at kube-proxy for new connections.',
    idempotency: 'Safe retries on reads; writes need idempotency keys because different pods may not share session state.',
    timeout: 'Connect 2s, read 5s — fail before client thread pool exhausts during outage.',
    observability: 'Trace service.name tag; metrics for DNS resolve time, connection errors, per-upstream latency via mesh.',
    security: 'NetworkPolicy least privilege; mTLS via mesh; no ClusterIP exposure outside namespace without Ingress policy.',
    performance: 'Connection pooling amortizes TCP+TLS; HTTP/2 multiplexing to same Service backend.',
    scalability: 'EndpointSlice shards beyond 1000 endpoints; CoreDNS horizontal scale for QPS.',
    production: 'Always configure readiness distinct from liveness; use PodDisruptionBudgets during deploys.',
    mistakes: [
      'Using liveness failure to gate traffic — kills pod instead of removing from Service.',
      'Hard-coding pod IPs in config — defeats server-side discovery.',
      'Ignoring JVM DNS TTL defaults in long-lived pods.',
    ],
    antiPatterns: [
      'Re-introducing Eureka inside Kubernetes without a migration reason.',
      'ClusterIP Service with selector mismatch — blackhole traffic.',
    ],
    alternatives: [
      'Service mesh virtual service with subset routing.',
      'Headless + client-side LB for StatefulSets.',
      'Cloud vendor managed LB for north-south only.',
    ],
    tradeoffs:
      'Pros: zero SDK, platform-native health, works with any language. Cons: DNS/LB behavior opaque, limited L7 routing without mesh/Ingress.',
    interviewQs: [
      'How does kube-proxy implement ClusterIP load balancing?',
      'Difference between readiness and liveness for Endpoint membership?',
    ],
    trickyQs: [
      'When would you choose Headless Service over ClusterIP?',
    ],
    seniorFollowUps: [
      'Design zero-downtime migration from Eureka to K8s Services with dual-write period.',
      'Explain EndpointSlice vs Endpoints scalability limits.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Part 4 — Load balancing algorithms
// ---------------------------------------------------------------------------

export const LOAD_BALANCE_PATTERNS: PatternCard[] = [
  {
    id: 'lb-round-robin',
    part: 4,
    name: 'Round Robin',
    frequency: 'Frequently used',
    definition:
      'Distributes requests sequentially across backends in circular order — instance i, then i+1, …, wrapping to 0.',
    problem:
      'Single-backend bottlenecks; need stateless fair spread when all instances have equal capacity.',
    realWorld:
      'Default kube-proxy mode, NGINX upstream round_robin, Spring Cloud LoadBalancer RoundRobinLoadBalancer.',
    whyExists:
      'O(1) selection, deterministic, easy to reason about when backends are homogeneous and requests are similar cost.',
    ascii: `Requests:  R1  R2  R3  R4  R5  R6
              |   |   |   |   |   |
              v   v   v   v   v   v
Backends:   [A] [B] [C] [A] [B] [C]`,
    flow: `stateDiagram-v2
  [*] --> A
  A --> B: next()
  B --> C: next()
  C --> A: wrap`,
    components: [
      {name: 'Backend pool', responsibility: 'Ordered list of healthy upstream addresses.'},
      {name: 'Cursor', responsibility: 'Atomic index advanced modulo pool size.'},
      {name: 'Health filter', responsibility: 'Remove DOWN backends before selection.'},
      {name: 'Selector', responsibility: 'Returns next backend or empty if pool drained.'},
    ],
    javaCode: `package com.vibhu.lb;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

/** Round-robin load balancer — O(1) time, O(n) space for n backends. */
public final class RoundRobinLoadBalancer {

  public record Backend(String id, String host, int port, boolean healthy) {}

  private final AtomicReference<List<Backend>> backends = new AtomicReference<>(List.of());
  private final AtomicInteger cursor = new AtomicInteger(0);

  public void setBackends(List<Backend> next) {
    backends.set(List.copyOf(Objects.requireNonNull(next)));
  }

  public Optional<Backend> select() {
    List<Backend> healthy = backends.get().stream().filter(Backend::healthy).collect(Collectors.toList());
    if (healthy.isEmpty()) {
      return Optional.empty();
    }
    int index = Math.floorMod(cursor.getAndIncrement(), healthy.size());
    return Optional.of(healthy.get(index));
  }

  /** Time complexity: O(n) filter + O(1) index. Space: O(n). */
  public static String complexity() {
    return "select: O(n) healthy scan + O(1) cursor; space O(n)";
  }
}`,
    unitTest: `package com.vibhu.lb;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RoundRobinLoadBalancerTest {

  @Test
  void cyclesThroughHealthyBackends() {
    RoundRobinLoadBalancer lb = new RoundRobinLoadBalancer();
    lb.setBackends(List.of(
        new RoundRobinLoadBalancer.Backend("a", "10.0.0.1", 80, true),
        new RoundRobinLoadBalancer.Backend("b", "10.0.0.2", 80, true),
        new RoundRobinLoadBalancer.Backend("c", "10.0.0.3", 80, false)));
    assertEquals("a", lb.select().orElseThrow().id());
    assertEquals("b", lb.select().orElseThrow().id());
    assertEquals("a", lb.select().orElseThrow().id());
  }

  @Test
  void emptyWhenAllUnhealthy() {
    RoundRobinLoadBalancer lb = new RoundRobinLoadBalancer();
    lb.setBackends(List.of(
        new RoundRobinLoadBalancer.Backend("a", "10.0.0.1", 80, false)));
    assertTrue(lb.select().isEmpty());
  }
}`,
    edgeCases: [
      'Long-lived TCP connections bypass per-request round robin at L4.',
      'Concurrent select() is thread-safe via AtomicInteger but ordering is not strict FIFO fairness.',
      'Adding/removing backends shifts the modulo ring — brief imbalance after pool change.',
    ],
    failureScenarios: [
      'Slow backend receives equal share — tail latency dominates p99.',
      'Backend dies between select and connect — client must retry another instance.',
      'All backends unhealthy — selector returns empty; caller must fail fast.',
    ],
    retry: 'On connect failure, advance cursor and try next backend (max 3 attempts).',
    idempotency: 'Safe to retry read requests on next backend; writes need sticky routing or idempotency keys.',
    timeout: 'Per-attempt connect timeout 1s; total selection budget 3s across retries.',
    observability: 'Metric: selections per backend_id; alert on skew > 20% when counts should be equal.',
    security: 'Validate backend list source — poisoned registry could redirect traffic.',
    performance: 'O(1) selection after O(n) health filter; cache healthy subset if health checks are expensive.',
    scalability: 'Works to thousands of backends; health scan becomes bottleneck — maintain healthy subset asynchronously.',
    production: 'Combine with active health checks; use for homogeneous stateless APIs only.',
    mistakes: [
      'Round robin across heterogeneous instance sizes (2 CPU vs 16 CPU).',
      'Ignoring connection pooling — one client connection sticks to one backend.',
    ],
    antiPatterns: [
      'Round robin for long-polling/WebSocket without connection-aware LB.',
      'No health awareness — sends traffic to draining nodes.',
    ],
    alternatives: ['Weighted round robin', 'Least connections', 'Power of two choices'],
    tradeoffs: 'Simple and fair for equal-cost requests; fails when request cost or backend capacity varies.',
    interviewQs: ['Why does round robin perform poorly with mixed request durations?'],
    trickyQs: ['How does HTTP keep-alive interact with round robin at L7?'],
    seniorFollowUps: ['Design connection-aware round robin for gRPC long streams.'],
  },
  {
    id: 'lb-weighted-round-robin',
    part: 4,
    name: 'Weighted Round Robin',
    frequency: 'Frequently used',
    definition:
      'Round robin where each backend receives traffic proportional to its weight — higher weight means more slots in the rotation.',
    problem:
      'Heterogeneous fleet: canary 10%, new hardware 2× capacity, or gradual traffic shift during deploy.',
    realWorld:
      'NGINX weight directive, Envoy endpoint weights, AWS ALB target group weights, Istio subset percentages.',
    whyExists:
      'Smooth capacity-based routing without separate pools; supports blue/green and canary by weight tuning.',
    ascii: `Weights: A=3  B=1  C=2
Sequence: A A A B C C  (repeats)
          | | | | | |
          3 slots for A, 1 for B, 2 for C per cycle`,
    flow: `flowchart LR
  W[Weight map] --> B[Build smooth weighted sequence]
  B --> C[Cursor over sequence]
  C --> N[Next backend]`,
    components: [
      {name: 'Weight table', responsibility: 'Integer weight per backend (gcd-normalized).'},
      {name: 'Smooth scheduler', responsibility: 'Interleaves backends to avoid bursts (NGINX smooth WRR).'},
      {name: 'Cursor', responsibility: 'Index into precomputed or dynamic weighted sequence.'},
      {name: 'Health gate', responsibility: 'Skip or redistribute weight of unhealthy nodes.'},
    ],
    javaCode: `package com.vibhu.lb;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/** Smooth weighted round-robin — O(k) build, O(1) select; k = sum(weights). */
public final class WeightedRoundRobinLoadBalancer {

  public record WeightedBackend(String id, String host, int port, int weight, boolean healthy) {}

  private final AtomicReference<List<WeightedBackend>> backends = new AtomicReference<>(List.of());
  private final AtomicReference<List<String>> sequence = new AtomicReference<>(List.of());
  private final AtomicInteger cursor = new AtomicInteger(0);

  public void setBackends(List<WeightedBackend> next) {
    backends.set(List.copyOf(Objects.requireNonNull(next)));
    sequence.set(buildSmoothSequence(next));
    cursor.set(0);
  }

  static List<String> buildSmoothSequence(List<WeightedBackend> backends) {
    List<WeightedBackend> healthy = backends.stream().filter(WeightedBackend::healthy).toList();
    if (healthy.isEmpty()) {
      return List.of();
    }
    int maxWeight = healthy.stream().mapToInt(WeightedBackend::weight).max().orElse(1);
    int gcd = healthy.stream().mapToInt(WeightedBackend::weight).reduce(WeightedRoundRobinLoadBalancer::gcd).orElse(1);
    int normalizedMax = maxWeight / gcd;
    List<String> result = new ArrayList<>();
    for (int i = 0; i < normalizedMax; i++) {
      for (WeightedBackend b : healthy) {
        int slots = b.weight() / gcd;
        for (int j = 0; j < slots; j++) {
          result.add(b.id());
        }
      }
    }
    return List.copyOf(result);
  }

  private static int gcd(int a, int b) {
    int x = Math.abs(a);
    int y = Math.abs(b);
    while (y != 0) {
      int t = y;
      y = x % y;
      x = t;
    }
    return x == 0 ? 1 : x;
  }

  public Optional<WeightedBackend> select() {
    List<String> seq = sequence.get();
    if (seq.isEmpty()) {
      return Optional.empty();
    }
    int index = Math.floorMod(cursor.getAndIncrement(), seq.size());
    String id = seq.get(index);
    return backends.get().stream().filter(b -> b.id().equals(id) && b.healthy()).findFirst();
  }
}`,
    unitTest: `package com.vibhu.lb;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class WeightedRoundRobinLoadBalancerTest {

  @Test
  void respectsWeightsOverCycle() {
    List<WeightedRoundRobinLoadBalancer.WeightedBackend> backends = List.of(
        new WeightedRoundRobinLoadBalancer.WeightedBackend("a", "h1", 80, 3, true),
        new WeightedRoundRobinLoadBalancer.WeightedBackend("b", "h2", 80, 1, true));
    Map<String, Long> counts = WeightedRoundRobinLoadBalancer.buildSmoothSequence(backends).stream()
        .collect(Collectors.groupingBy(id -> id, Collectors.counting()));
    assertEquals(3L, counts.get("a"));
    assertEquals(1L, counts.get("b"));
  }

  @Test
  void selectDistributesByWeight() {
    WeightedRoundRobinLoadBalancer lb = new WeightedRoundRobinLoadBalancer();
    lb.setBackends(List.of(
        new WeightedRoundRobinLoadBalancer.WeightedBackend("a", "h1", 80, 2, true),
        new WeightedRoundRobinLoadBalancer.WeightedBackend("b", "h2", 80, 1, true)));
    int aCount = 0;
    int bCount = 0;
    for (int i = 0; i < 6; i++) {
      String id = lb.select().orElseThrow().id();
      if ("a".equals(id)) aCount++;
      else bCount++;
    }
    assertEquals(4, aCount);
    assertEquals(2, bCount);
  }
}`,
    edgeCases: [
      'Weight 0 backends excluded entirely until weight raised.',
      'GCD normalization prevents enormous sequences when weights are 1000:2000:3000.',
      'Dynamic weight change rebuilds sequence — reset cursor or accept brief skew.',
    ],
    failureScenarios: [
      'Canary at 5% weight still receives poison requests — monitor error rate per weight slice.',
      'Unhealthy high-weight node removed — remaining nodes absorb spike.',
    ],
    retry: 'Retry on different backend only if request is idempotent; canary errors should trip circuit not blind retry.',
    idempotency: 'Canary traffic to new version must use same idempotency contract as stable.',
    timeout: 'Same as round robin; weight does not affect timeout policy.',
    observability: 'Per-backend weight, selection count, error rate by version label.',
    security: 'Weight changes are config — audit who can shift 100% traffic to canary.',
    performance: 'Precomputed sequence O(sum weights) memory; select O(1). Rebuild on config change only.',
    scalability: 'Large weight sums inflate sequence — normalize with GCD or use dynamic WRR (Envoy style).',
    production: 'Start canary at 1–5%; automate rollback on SLO breach; sync weights with HPA replica ratio.',
    mistakes: [
      'Setting weight by replica count without normalizing for CPU/memory.',
      'Forgetting to zero-weight drained nodes during deploy.',
    ],
    antiPatterns: ['Weight 50/50 during incompatible schema migration without feature flags.'],
    alternatives: ['Consistent hashing with virtual nodes', 'Mesh traffic split', 'Separate services per version'],
    tradeoffs: 'Granular traffic shift vs sequence rebuild cost; integer weights only in many implementations.',
    interviewQs: ['How is smooth WRR different from naive repeated entries?'],
    trickyQs: ['What happens to in-flight requests when canary weight goes to 0?'],
    seniorFollowUps: ['Automate canary analysis tying weight to error budget burn rate.'],
  },
  {
    id: 'lb-random',
    part: 4,
    name: 'Random',
    frequency: 'Occasionally used',
    definition:
      'Each request selects a backend uniformly at random from the healthy pool — no shared cursor state.',
    problem:
      'Stateless spread without coordination; avoids synchronized cursor contention at extreme QPS.',
    realWorld:
      'gRPC pick_first (variant), some RPC frameworks, quick prototype LBs, power-of-two-choices precursor.',
    whyExists:
      'Trivially parallel — no atomic counter hot spot; statistically fair over large request volumes.',
    ascii: `     R1 ──► ? ──► B
     R2 ──► ? ──► A
     R3 ──► ? ──► C
   (each ? = random pick)`,
    flow: `flowchart TD
  R[Request] --> H[Healthy pool]
  H --> RNG[ThreadLocalRandom]
  RNG --> B[Backend i]`,
    components: [
      {name: 'Healthy pool', responsibility: 'Snapshot or live view of UP backends.'},
      {name: 'RNG', responsibility: 'ThreadLocalRandom or SplittableRandom for lock-free selection.'},
      {name: 'Selector', responsibility: 'index = random % n; return backend[index].'},
    ],
    javaCode: `package com.vibhu.lb;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

/** Random load balancer — O(n) filter + O(1) pick. */
public final class RandomLoadBalancer {

  public record Backend(String id, String host, int port, boolean healthy) {}

  private final AtomicReference<List<Backend>> backends = new AtomicReference<>(List.of());

  public void setBackends(List<Backend> next) {
    backends.set(List.copyOf(Objects.requireNonNull(next)));
  }

  public Optional<Backend> select() {
    List<Backend> healthy = backends.get().stream().filter(Backend::healthy).collect(Collectors.toList());
    if (healthy.isEmpty()) {
      return Optional.empty();
    }
    int index = ThreadLocalRandom.current().nextInt(healthy.size());
    return Optional.of(healthy.get(index));
  }
}`,
    unitTest: `package com.vibhu.lb;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class RandomLoadBalancerTest {

  @Test
  void selectsOnlyHealthy() {
    RandomLoadBalancer lb = new RandomLoadBalancer();
    lb.setBackends(List.of(
        new RandomLoadBalancer.Backend("a", "h1", 80, true),
        new RandomLoadBalancer.Backend("b", "h2", 80, false)));
    for (int i = 0; i < 20; i++) {
      assertEquals("a", lb.select().orElseThrow().id());
    }
  }

  @Test
  void distributionApproachesUniform() {
    RandomLoadBalancer lb = new RandomLoadBalancer();
    lb.setBackends(List.of(
        new RandomLoadBalancer.Backend("a", "h1", 80, true),
        new RandomLoadBalancer.Backend("b", "h2", 80, true)));
    Map<String, Integer> counts = new HashMap<>();
    for (int i = 0; i < 10_000; i++) {
      String id = lb.select().orElseThrow().id();
      counts.merge(id, 1, Integer::sum);
    }
    int diff = Math.abs(counts.get("a") - counts.get("b"));
    assertTrue(diff < 800, "expected roughly uniform, diff=" + diff);
  }
}`,
    edgeCases: [
      'Low traffic volume shows high variance — one backend may get streaks.',
      'Poor seed not an issue with ThreadLocalRandom but reproducibility in tests needs fixed seed.',
    ],
    failureScenarios: [
      'Random hit on dead node — 1/n failure rate without health checks.',
      'Statistical imbalance with few requests during canary.',
    ],
    retry: 'Random retry excluding failed backend for idempotent ops.',
    idempotency: 'Random routing breaks stickiness — session state requires affinity layer.',
    timeout: 'Standard per-backend timeouts; random does not reduce tail latency.',
    observability: 'Chi-squared test on selection distribution in synthetic monitors.',
    security: 'Same as RR — trust backend list integrity.',
    performance: 'No atomic contention; O(1) pick after health filter.',
    scalability: 'Scales horizontally; no shared state beyond backend list.',
    production: 'Prefer power-of-two-choices over pure random for better max-load.',
    mistakes: ['Expecting perfect fairness at low QPS.', 'Using Random() instead of ThreadLocalRandom (contention).'],
    antiPatterns: ['Random for sticky session workloads without cookie affinity.'],
    alternatives: ['Round robin', 'Power of two choices', 'Consistent hashing'],
    tradeoffs: 'Zero coordination vs variance and no guarantee of even short-window spread.',
    interviewQs: ['When is random better than round robin?'],
    trickyQs: ['Why ThreadLocalRandom over synchronized Random?'],
    seniorFollowUps: ['Derive expected max load for n backends with random vs power-of-two.'],
  },
  {
    id: 'lb-least-connection',
    part: 4,
    name: 'Least Connections',
    frequency: 'Frequently used',
    definition:
      'Routes each new request to the backend with the fewest active connections (or in-flight requests).',
    problem:
      'Round robin fails when requests have variable duration — long polls tie up backends unevenly.',
    realWorld:
      'NGINX least_conn, HAProxy leastconn, Envoy active request balancing, WebSocket/gRPC streaming APIs.',
    whyExists:
      'Adapts to live load — backends finishing work receive more traffic; better for persistent connections.',
    ascii: `Backend A: ████░░  (4 active)
Backend B: ██░░░░  (2 active)  ◄── next request
Backend C: █████░  (5 active)`,
    flow: `flowchart TD
  R[New request] --> M[Scan backends]
  M --> MIN[Pick min activeConnections]
  MIN --> INC[increment on assign]
  DONE[Request complete] --> DEC[decrement]`,
    components: [
      {name: 'Connection counter', responsibility: 'Per-backend atomic active count.'},
      {name: 'Selector', responsibility: 'Linear scan for minimum; tie-break by id.'},
      {name: 'Lifecycle hooks', responsibility: 'Increment on acquire, decrement on release (try/finally).'},
      {name: 'Health filter', responsibility: 'Exclude backends over max connections cap.'},
    ],
    javaCode: `package com.vibhu.lb;

import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/** Least-connections LB — O(n) select per request. */
public final class LeastConnectionsLoadBalancer implements AutoCloseable {

  public record Backend(String id, String host, int port, boolean healthy, int maxConnections) {}

  private final AtomicReference<Map<String, Backend>> backends = new AtomicReference<>(Map.of());
  private final ConcurrentHashMap<String, AtomicInteger> active = new ConcurrentHashMap<>();

  public void setBackends(Map<String, Backend> next) {
    backends.set(Map.copyOf(Objects.requireNonNull(next)));
    next.keySet().forEach(id -> active.putIfAbsent(id, new AtomicInteger(0)));
  }

  public Optional<Lease> acquire() {
    Backend chosen = null;
    int min = Integer.MAX_VALUE;
    for (Backend b : backends.get().values()) {
      if (!b.healthy()) continue;
      int count = active.getOrDefault(b.id(), new AtomicInteger(0)).get();
      if (count >= b.maxConnections()) continue;
      if (count < min) {
        min = count;
        chosen = b;
      }
    }
    if (chosen == null) {
      return Optional.empty();
    }
    active.get(chosen.id()).incrementAndGet();
    return Optional.of(new Lease(chosen));
  }

  public final class Lease implements AutoCloseable {
    private final Backend backend;
    private boolean released;

    private Lease(Backend backend) {
      this.backend = backend;
    }

    public Backend backend() {
      return backend;
    }

    @Override
    public void close() {
      if (!released) {
        active.get(backend.id()).decrementAndGet();
        released = true;
      }
    }
  }

  @Override
  public void close() {
    active.clear();
  }
}`,
    unitTest: `package com.vibhu.lb;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class LeastConnectionsLoadBalancerTest {

  @Test
  void picksBackendWithFewestActive() {
    LeastConnectionsLoadBalancer lb = new LeastConnectionsLoadBalancer();
    lb.setBackends(Map.of(
        "a", new LeastConnectionsLoadBalancer.Backend("a", "h1", 80, true, 100),
        "b", new LeastConnectionsLoadBalancer.Backend("b", "h2", 80, true, 100)));
    LeastConnectionsLoadBalancer.Lease l1 = lb.acquire().orElseThrow();
    assertEquals("a", l1.backend().id());
    LeastConnectionsLoadBalancer.Lease l2 = lb.acquire().orElseThrow();
    assertEquals("b", l2.backend().id());
    l1.close();
    LeastConnectionsLoadBalancer.Lease l3 = lb.acquire().orElseThrow();
    assertEquals("a", l3.backend().id());
    l2.close();
    l3.close();
  }

  @Test
  void respectsMaxConnections() {
    LeastConnectionsLoadBalancer lb = new LeastConnectionsLoadBalancer();
    lb.setBackends(Map.of(
        "a", new LeastConnectionsLoadBalancer.Backend("a", "h1", 80, true, 1)));
    LeastConnectionsLoadBalancer.Lease l1 = lb.acquire().orElseThrow();
    assertTrue(lb.acquire().isEmpty());
    l1.close();
    assertTrue(lb.acquire().isPresent());
  }
}`,
    edgeCases: [
      'Forgotten decrement leaks counts — backend starves forever.',
      'HTTP/2 multiplexing: one connection carries many streams — count streams not TCP connections.',
      'Tie on min count — deterministic tie-break avoids oscillation.',
    ],
    failureScenarios: [
      'Counter drift after JVM crash without reset — periodic reconcile from mesh stats.',
      'All backends at maxConnections — acquire returns empty; queue or 503.',
    ],
    retry: 'On acquire empty, brief backoff then retry or shed load.',
    idempotency: 'Lease must cover full request lifecycle including async completion.',
    timeout: 'Lease timeout watchdog decrements stale counts after request deadline.',
    observability: 'Gauge active_connections per backend; alert on sustained max.',
    security: 'maxConnections prevents single-backend DoS absorption.',
    performance: 'O(n) scan — acceptable for <100 backends; heap for large n.',
    scalability: 'Use approximate least-load (power-of-two) at very large scale.',
    production: 'Always use try-with-resources for Lease; integrate with reactive cancel signals.',
    mistakes: ['Counting TCP connects only on HTTP/2.', 'No max cap — one slow node accepts unlimited load.'],
    antiPatterns: ['Least conn without health checks — sends to dying slow node.'],
    alternatives: ['Weighted least connections', 'Latency-aware (Peak EWMA)'],
    tradeoffs: 'Better for long-lived work vs O(n) scan and accurate accounting burden.',
    interviewQs: ['How does least conn differ for HTTP/1.1 vs HTTP/2?'],
    trickyQs: ['What if decrement is lost due to worker crash?'],
    seniorFollowUps: ['Design distributed least-connection with only local views (power-of-two choices).'],
  },
  {
    id: 'lb-consistent-hashing',
    part: 4,
    name: 'Consistent Hashing',
    frequency: 'Frequently used',
    definition:
      'Maps both keys and backends onto a hash ring; key routes to first backend clockwise — adding/removing nodes moves only adjacent key ranges.',
    problem:
      'Modulo hashing (key % n) reshuffles almost all keys when n changes — cache stampedes and session loss.',
    realWorld:
      'Memcached client ketama, Amazon DynamoDB partitions, Cassandra tokens, Envoy ring hash, Redis Cluster slots.',
    whyExists:
      'Minimal remapping on topology change; enables sticky sessions and partition-aware caching at scale.',
    ascii: `         0
    C ─────●───── A
         /   \\
        ●     ●
       B       (ring)
  key K ──hash──► lands between A and B → B`,
    flow: `flowchart LR
  K[cache key] --> H[hash key]
  H --> R[Walk ring clockwise]
  R --> N[First virtual node backend]`,
    components: [
      {name: 'Hash ring', responsibility: 'Sorted map of hash → backend id (virtual nodes).'},
      {name: 'Virtual nodes', responsibility: 'Multiple points per physical node for even distribution.'},
      {name: 'Lookup', responsibility: 'ceilingEntry(keyHash) on TreeMap — O(log v).'},
      {name: 'Topology watcher', responsibility: 'Add/remove nodes with bounded key migration.'},
    ],
    javaCode: `package com.vibhu.lb;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Objects;
import java.util.Optional;
import java.util.TreeMap;

/** Consistent hash ring with virtual nodes — O(log v) lookup, v = virtual nodes. */
public final class ConsistentHashLoadBalancer {

  public record Backend(String id, String host, int port) {}

  private final NavigableMap<Long, String> ring = new TreeMap<>();
  private final Map<String, Backend> backends;
  private final int virtualNodesPerBackend;

  public ConsistentHashLoadBalancer(Map<String, Backend> backends, int virtualNodesPerBackend) {
    this.backends = Map.copyOf(Objects.requireNonNull(backends));
    this.virtualNodesPerBackend = Math.max(1, virtualNodesPerBackend);
    rebuildRing();
  }

  private void rebuildRing() {
    ring.clear();
    for (Backend b : backends.values()) {
      for (int i = 0; i < virtualNodesPerBackend; i++) {
        long hash = hash(b.id() + "#" + i);
        ring.put(hash, b.id());
      }
    }
  }

  public Optional<Backend> select(String key) {
    if (ring.isEmpty()) {
      return Optional.empty();
    }
    long keyHash = hash(key);
    Map.Entry<Long, String> entry = ring.ceilingEntry(keyHash);
    if (entry == null) {
      entry = ring.firstEntry();
    }
    Backend backend = backends.get(entry.getValue());
    return Optional.ofNullable(backend);
  }

  static long hash(String input) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
      long value = 0L;
      for (int i = 0; i < 8; i++) {
        value = (value << 8) | (digest[i] & 0xffL);
      }
      return value;
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }
}`,
    unitTest: `package com.vibhu.lb;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ConsistentHashLoadBalancerTest {

  @Test
  void sameKeyMapsToSameBackend() {
    ConsistentHashLoadBalancer lb = new ConsistentHashLoadBalancer(Map.of(
        "a", new ConsistentHashLoadBalancer.Backend("a", "h1", 80),
        "b", new ConsistentHashLoadBalancer.Backend("b", "h2", 80)), 100);
    String id1 = lb.select("user-42").orElseThrow().id();
    String id2 = lb.select("user-42").orElseThrow().id();
    assertEquals(id1, id2);
  }

  @Test
  void addingNodeMovesBoundedKeys() {
    ConsistentHashLoadBalancer lb2 = new ConsistentHashLoadBalancer(Map.of(
        "a", new ConsistentHashLoadBalancer.Backend("a", "h1", 80),
        "b", new ConsistentHashLoadBalancer.Backend("b", "h2", 80)), 50);
    ConsistentHashLoadBalancer lb3 = new ConsistentHashLoadBalancer(Map.of(
        "a", new ConsistentHashLoadBalancer.Backend("a", "h1", 80),
        "b", new ConsistentHashLoadBalancer.Backend("b", "h2", 80),
        "c", new ConsistentHashLoadBalancer.Backend("c", "h3", 80)), 50);
    int moved = 0;
    for (int i = 0; i < 1000; i++) {
      String key = "k-" + i;
      String before = lb2.select(key).orElseThrow().id();
      String after = lb3.select(key).orElseThrow().id();
      if (!before.equals(after)) moved++;
    }
    assertTrue(moved < 500, "expected minority remapped, moved=" + moved);
  }
}`,
    edgeCases: [
      'Too few virtual nodes → uneven load on ring.',
      'Hot key still hot — hashing does not split single key load.',
      'Clockwise wrap when key hash > max ring point.',
    ],
    failureScenarios: [
      'Backend removed — its keys remap to successor; brief cache miss storm.',
      'Ring not updated on slow failure — stale mapping until health removes node.',
    ],
    retry: 'On backend failure, optional override list (successor+1) for idempotent reads only.',
    idempotency: 'Sticky mapping helps idempotent retries hit same shard if backend alive.',
    timeout: 'Per-backend; hot key timeouts may need request coalescing layer above hash.',
    observability: 'Key distribution histogram per backend; migration count on topology change.',
    security: 'Predictable mapping — guard against targeted hot-key DoS.',
    performance: 'O(log v) lookup; v = backends × virtualNodes; SHA-256 acceptable at gateway rate.',
    scalability: 'Standard for distributed caches and sharded databases; millions of keys, hundreds of nodes.',
    production: '150+ virtual nodes per physical; handoff cache during migration; bounded load with bounded loads paper.',
    mistakes: [
      'Using Object.hashCode for ring — poor distribution.',
      'No virtual nodes — two backends cluster on ring gaps.',
    ],
    antiPatterns: ['Consistent hash for equal-cost stateless APIs without stickiness need.'],
    alternatives: ['Rendezvous (HRW) hashing', 'Range-based partitioning', 'Maglev hashing'],
    tradeoffs: 'Sticky locality vs uneven hot keys; remapping minimized but not eliminated on churn.',
    interviewQs: ['Why virtual nodes on the ring?'],
    trickyQs: ['Compare consistent hash vs rendezvous hashing failover behavior.'],
    seniorFollowUps: ['Implement bounded-load consistent hashing to cap per-node QPS.'],
  },
];

// ---------------------------------------------------------------------------
// Part 5 — Resilience patterns
// ---------------------------------------------------------------------------

export const RESILIENCE_PATTERNS: PatternCard[] = [
  {
    id: 'timeout',
    part: 5,
    name: 'Timeout (Connect / Read / Overall + Propagation)',
    frequency: 'Frequently used',
    definition:
      'Bound wait time at connect, read/response, and end-to-end chain levels so threads and users never block indefinitely on slow dependencies.',
    problem:
      'Without timeouts, one slow payment gateway holds threads, exhausts pools, and cascades latency across the fleet.',
    realWorld:
      'HttpClient connect/read timeouts, Resilience4j TimeLimiter, gRPC deadlines, Istio route timeout, DB statement_timeout.',
    whyExists:
      'Fail fast preserves capacity; deadline propagation lets downstream services budget remaining time and avoid wasted work.',
    ascii: `Client ──overall 3s──► Service A ──remaining──► Service B
              │ connect 500ms
              │ read 2s
              └── propagate: deadline = now + remaining`,
    flow: `sequenceDiagram
  participant C as Client
  participant A as Service A
  participant B as Service B
  C->>A: request deadline=3s
  A->>A: connect timeout 500ms
  A->>B: X-Deadline-Ms = remaining
  B->>B: read timeout min(local, remaining)
  B-->>A: response or timeout
  A-->>C: 504 if budget exhausted`,
    components: [
      {name: 'Connect timeout', responsibility: 'Max wait to establish TCP/TLS handshake.'},
      {name: 'Read timeout', responsibility: 'Max idle wait for bytes after connection established.'},
      {name: 'Overall/deadline', responsibility: 'Wall-clock budget for entire operation including retries.'},
      {name: 'Propagation header', responsibility: 'Forwards remaining budget to downstream (gRPC deadline, X-Request-Deadline).'},
    ],
    javaCode: `package com.vibhu.resilience.timeout;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

public final class TimeoutClient {

  private final HttpClient httpClient;
  private final Duration connectTimeout;
  private final Duration readTimeout;

  public TimeoutClient(Duration connectTimeout, Duration readTimeout) {
    this.connectTimeout = Objects.requireNonNull(connectTimeout);
    this.readTimeout = Objects.requireNonNull(readTimeout);
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(connectTimeout)
        .build();
  }

  public String callWithOverallDeadline(URI uri, Duration overallDeadline) throws Exception {
    Instant deadline = Instant.now().plus(overallDeadline);
    Duration remaining = Duration.between(Instant.now(), deadline);
    if (remaining.isNegative() || remaining.isZero()) {
      throw new TimeoutException("overall deadline already expired");
    }
    HttpRequest request = HttpRequest.newBuilder(uri)
        .timeout(readTimeout.min(remaining))
        .header("X-Deadline-Epoch-Ms", String.valueOf(deadline.toEpochMilli()))
        .GET()
        .build();
    CompletableFuture<HttpResponse<String>> future =
        httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString());
    return future.get(remaining.toMillis(), TimeUnit.MILLISECONDS).body();
  }

  public static Duration remainingBudget(String deadlineHeaderMs) {
    long epochMs = Long.parseLong(deadlineHeaderMs);
    Duration remaining = Duration.between(Instant.now(), Instant.ofEpochMilli(epochMs));
    return remaining.isNegative() ? Duration.ZERO : remaining;
  }
}`,
    springCode: `resilience4j.timelimiter:
  instances:
    payment:
      timeoutDuration: 3s
      cancelRunningFuture: true`,
    config: `http.client.connect-timeout: 500ms
http.client.read-timeout: 2s
server.tomcat.connection-timeout: 5s`,
    unitTest: `package com.vibhu.resilience.timeout;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class TimeoutClientTest {

  private HttpServer server;

  @BeforeEach
  void setUp() throws Exception {
    server = HttpServer.create(new InetSocketAddress(0), 0);
    server.start();
  }

  @AfterEach
  void tearDown() {
    if (server != null) server.stop(0);
  }

  @Test
  void overallDeadlineTimesOutOnSlowHandler() {
    server.createContext("/slow", exchange -> {
      try { Thread.sleep(2000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
      exchange.sendResponseHeaders(200, -1);
      exchange.close();
    });
    TimeoutClient client = new TimeoutClient(Duration.ofMillis(200), Duration.ofMillis(500));
    URI uri = URI.create("http://localhost:" + server.getAddress().getPort() + "/slow");
    assertThrows(Exception.class, () -> client.callWithOverallDeadline(uri, Duration.ofMillis(300)));
  }

  @Test
  void remainingBudgetZeroWhenExpired() {
    String past = String.valueOf(Instant.now().minusSeconds(5).toEpochMilli());
    assertEquals(Duration.ZERO, TimeoutClient.remainingBudget(past));
  }
}`,
    edgeCases: ['Clock skew breaks deadline headers', 'Retry eats overall budget', 'Large payload needs transfer timeout'],
    failureScenarios: ['Too aggressive → false timeouts', 'No propagation → wasted downstream work'],
    retry: 'Subtract elapsed from budget before each retry attempt.',
    idempotency: 'Timeout on write may have succeeded — reconcile before retry.',
    timeout: 'Edge 3s user-facing; batch jobs use async with longer internal limits.',
    observability: 'timeout_count by layer; trace deadline_remaining_ms.',
    security: 'Generic timeout messages to clients.',
    performance: 'Fail-fast frees threads under load.',
    scalability: 'Deadline trees prevent multiplied wall-clock across hops.',
    production: 'Derive from p99 dependency latency × safety factor.',
    mistakes: ['Default infinite HttpClient timeout', 'Same timeout for health and payment'],
    antiPatterns: ['Identical timeout at every hop without budget subtraction'],
    alternatives: ['Circuit breaker', 'Async polling'],
    tradeoffs: 'Capacity vs false timeout rate; propagation adds coupling.',
    interviewQs: ['Connect vs read timeout?'],
    trickyQs: ['Client timed out but server committed payment?'],
    seniorFollowUps: ['Deadline propagation over Kafka request-reply'],
    deepLabHref: '/resilience4j',
  },
  {
    id: 'retry',
    part: 5,
    name: 'Retry (Resilience4j + Manual Exponential Backoff)',
    frequency: 'Frequently used',
    definition:
      'Re-attempt failed operations for transient errors with bounded attempts, exponential backoff, and jitter.',
    problem: 'Brief 503s and network blips cause user failures that would succeed on retry.',
    realWorld: 'Resilience4j Retry, AWS SDK, Spring Retry, gRPC retry policies.',
    whyExists: 'Improves availability when combined with idempotency and retry budgets.',
    ascii: `A1 fail → wait+jitter → A2 fail → A3 ok`,
    flow: `stateDiagram-v2
  [*] --> Attempt
  Attempt --> Success
  Attempt --> Retry: transient
  Retry --> Attempt`,
    components: [
      {name: 'RetryConfig', responsibility: 'maxAttempts, backoff, exception classification.'},
      {name: 'RetryRegistry', responsibility: 'Named instances with metrics.'},
      {name: 'Manual backoff', responsibility: 'Exponential delay + jitter without library.'},
      {name: 'Idempotency guard', responsibility: 'Safe write retries with same key.'},
    ],
    javaCode: `package com.vibhu.resilience.retry;

import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.Callable;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Predicate;

public final class RetryPolicies {

  public static RetryRegistry resilience4jRegistry() {
    RetryConfig config = RetryConfig.custom()
        .maxAttempts(3)
        .waitDuration(Duration.ofMillis(200))
        .intervalFunction(io.github.resilience4j.core.IntervalFunction.ofExponentialBackoff(
            Duration.ofMillis(200), 2.0))
        .retryOnException(e -> e instanceof IOException)
        .build();
    return RetryRegistry.of(config);
  }

  public static <T> T withResilience4j(RetryRegistry registry, String name, Callable<T> callable) throws Exception {
    Retry retry = registry.retry(name);
    return Retry.decorateCallable(retry, callable).call();
  }

  public static <T> T manualExponentialBackoff(
      Callable<T> callable, int maxAttempts, Duration initialDelay,
      double multiplier, Duration maxDelay, Predicate<Exception> retryable) throws Exception {
    Exception last = null;
    Duration delay = initialDelay;
    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return callable.call();
      } catch (Exception ex) {
        last = ex;
        if (attempt == maxAttempts || !retryable.test(ex)) throw ex;
        long jitter = ThreadLocalRandom.current().nextLong(delay.toMillis() / 2, delay.toMillis());
        Thread.sleep(jitter);
        delay = Duration.ofMillis(Math.min((long) (delay.toMillis() * multiplier), maxDelay.toMillis()));
      }
    }
    throw last;
  }
}`,
    springCode: `resilience4j.retry.instances.payment.maxAttempts: 3`,
    unitTest: `package com.vibhu.resilience.retry;

import org.junit.jupiter.api.Test;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;

class RetryPoliciesTest {
  @Test
  void succeedsOnThirdAttempt() throws Exception {
    AtomicInteger calls = new AtomicInteger();
    String r = RetryPolicies.manualExponentialBackoff(() -> {
      if (calls.incrementAndGet() < 3) throw new java.io.IOException("t");
      return "ok";
    }, 5, Duration.ofMillis(5), 2.0, Duration.ofMillis(50), e -> e instanceof java.io.IOException);
    assertEquals("ok", r);
    assertEquals(3, calls.get());
  }
}`,
    edgeCases: ['Nested 3×3×3 retry storm', 'POST without idempotency duplicates charge'],
    failureScenarios: ['Retry pool exhaustion', 'Retry 429 ignoring Retry-After'],
    retry: 'Exponential + full jitter; one layer only.',
    idempotency: 'Idempotency-Key + UNIQUE for payment writes.',
    timeout: 'Each attempt respects remaining deadline.',
    observability: 'retry_attempts_total, retry_exhausted.',
    security: 'Never retry 401/403.',
    performance: 'Retries add tail latency.',
    scalability: 'Jitter desynchronizes clients after outage.',
    production: 'Classify exceptions; document retry budget.',
    mistakes: ['Retry all Exception', 'Client+service+both retry'],
    antiPatterns: ['Infinite while-retry', 'Retry 400 business errors'],
    alternatives: ['DLQ async retry', 'Circuit breaker'],
    tradeoffs: 'Availability vs amplification and duplicate risk.',
    interviewQs: ['Prevent retry storms?'],
    trickyQs: ['Timeout then retry on payment?'],
    seniorFollowUps: ['Org-wide retry budget design'],
  },
  {
    id: 'circuit-breaker',
    part: 5,
    name: 'Circuit Breaker (CLOSED / OPEN / HALF_OPEN)',
    frequency: 'Frequently used',
    definition: 'Fail fast when dependency error rate exceeds threshold; probe recovery in HALF_OPEN.',
    problem: 'Cascading failure when callers hammer a dying dependency.',
    realWorld: 'Resilience4j, Istio outlier detection, Envoy.',
    whyExists: 'Protects caller threads and gives dependency recovery time.',
    ascii: `CLOSED→OPEN→HALF_OPEN→CLOSED`,
    flow: `stateDiagram-v2
  CLOSED --> OPEN
  OPEN --> HALF_OPEN
  HALF_OPEN --> CLOSED
  HALF_OPEN --> OPEN`,
    components: [
      {name: 'Sliding window', responsibility: 'Failure/slow call statistics.'},
      {name: 'State machine', responsibility: 'CLOSED/OPEN/HALF_OPEN transitions.'},
      {name: 'Resilience4j', responsibility: 'Production registry and metrics.'},
      {name: 'Manual sketch', responsibility: 'Interview-level implementation.'},
    ],
    javaCode: `package com.vibhu.resilience.circuitbreaker;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;

public final class CircuitBreakerDemo {

  public static CircuitBreakerRegistry resilience4jRegistry() {
    CircuitBreakerConfig config = CircuitBreakerConfig.custom()
        .slidingWindowSize(10)
        .minimumNumberOfCalls(5)
        .failureRateThreshold(50f)
        .waitDurationInOpenState(Duration.ofSeconds(30))
        .permittedNumberOfCallsInHalfOpenState(3)
        .build();
    return CircuitBreakerRegistry.of(config);
  }

  public static <T> T callWithCb(CircuitBreaker breaker, Supplier<T> supplier) {
    return breaker.executeSupplier(supplier);
  }

  public enum State { CLOSED, OPEN, HALF_OPEN }

  public static final class ManualCircuitBreaker {
    private volatile State state = State.CLOSED;
    private final AtomicInteger failures = new AtomicInteger();
    private final AtomicInteger successes = new AtomicInteger();
    private final int failureThreshold;
    private final int halfOpenPermits;
    private volatile long openedAtEpochMs;
    private final long openDurationMs;

    public ManualCircuitBreaker(int failureThreshold, long openDurationMs, int halfOpenPermits) {
      this.failureThreshold = failureThreshold;
      this.openDurationMs = openDurationMs;
      this.halfOpenPermits = halfOpenPermits;
    }

    public synchronized <T> T execute(Supplier<T> supplier) {
      if (state == State.OPEN && System.currentTimeMillis() - openedAtEpochMs >= openDurationMs) {
        state = State.HALF_OPEN;
        failures.set(0);
        successes.set(0);
      }
      if (state == State.OPEN) throw new IllegalStateException("OPEN");
      try {
        T result = supplier.get();
        if (state == State.HALF_OPEN && successes.incrementAndGet() >= halfOpenPermits) state = State.CLOSED;
        return result;
      } catch (RuntimeException ex) {
        if (state == State.HALF_OPEN) { state = State.OPEN; openedAtEpochMs = System.currentTimeMillis(); }
        else if (failures.incrementAndGet() >= failureThreshold) { state = State.OPEN; openedAtEpochMs = System.currentTimeMillis(); }
        throw ex;
      }
    }
    public State state() { return state; }
  }
}`,
    springCode: `resilience4j.circuitbreaker.instances.payment.failureRateThreshold: 50`,
    unitTest: `package com.vibhu.resilience.circuitbreaker;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CircuitBreakerDemoTest {
  @Test
  void opensAfterFailures() {
    var cb = new CircuitBreakerDemo.ManualCircuitBreaker(2, 60_000, 2);
    assertThrows(RuntimeException.class, () -> cb.execute(() -> { throw new RuntimeException(); }));
    assertThrows(RuntimeException.class, () -> cb.execute(() -> { throw new RuntimeException(); }));
    assertEquals(CircuitBreakerDemo.State.OPEN, cb.state());
  }
}`,
    edgeCases: ['Low QPS below minimumNumberOfCalls', 'HALF_OPEN probe herd'],
    failureScenarios: ['Flapping thresholds', 'OPEN during recovery'],
    retry: 'No retry while OPEN.',
    idempotency: 'Fallback must not double-charge when CB closes.',
    timeout: 'Slow calls trip slowCallRate.',
    observability: 'circuitbreaker_state, transition events.',
    security: 'Fallback still authenticates.',
    performance: 'Fail-fast saves pools.',
    scalability: 'Per-dependency breaker instances.',
    production: 'Alert OPEN > 1min; tune per traffic.',
    mistakes: ['5% threshold on low QPS', 'No fallback when OPEN'],
    antiPatterns: ['Global breaker for all deps'],
    alternatives: ['Bulkhead', 'Load shedding'],
    tradeoffs: 'Protection vs availability during outage.',
    interviewQs: ['Purpose of HALF_OPEN?'],
    trickyQs: ['COUNT vs TIME window?'],
    seniorFollowUps: ['Distributed vs per-instance CB'],
    deepLabHref: '/resilience4j',
  },
  {
    id: 'bulkhead',
    part: 5,
    name: 'Bulkhead (Thread Pool + Semaphore)',
    frequency: 'Frequently used',
    definition:
      'Isolate resource pools so failure or slowness in one dependency cannot exhaust shared threads or connections for the entire service.',
    problem:
      'One slow fraud-check API blocks all checkout threads because they share a single unbounded executor.',
    realWorld:
      'Resilience4j Bulkhead, HikariCP per-datasource pools, Tomcat separate connectors, semaphores per downstream.',
    whyExists:
      'Compartmentalization limits blast radius of overload on a single integration point.',
    ascii: `Pool Pay max 20 | Pool Fraud max 5`,
    flow: `flowchart TD
  R --> BH{Permit?}
  BH -->|yes| W[Worker]
  BH -->|no| Reject`,
    components: [
      {name: 'Thread pool bulkhead', responsibility: 'Dedicated ExecutorService with fixed max threads.'},
      {name: 'Semaphore bulkhead', responsibility: 'Limits concurrent calls without extra threads.'},
      {name: 'Resilience4j Bulkhead', responsibility: 'maxConcurrentCalls, maxWaitDuration.'},
      {name: 'Rejection handler', responsibility: 'Fail fast when bulkhead full.'},
    ],
    javaCode: `package com.vibhu.resilience.bulkhead;

import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadConfig;
import io.github.resilience4j.bulkhead.BulkheadRegistry;
import io.github.resilience4j.bulkhead.ThreadPoolBulkhead;
import io.github.resilience4j.bulkhead.ThreadPoolBulkheadConfig;

import java.time.Duration;
import java.util.concurrent.Callable;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Semaphore;
import java.util.function.Supplier;

public final class BulkheadIsolation {

  public static BulkheadRegistry semaphoreBulkheadRegistry() {
    BulkheadConfig config = BulkheadConfig.custom()
        .maxConcurrentCalls(10)
        .maxWaitDuration(Duration.ofMillis(100))
        .build();
    return BulkheadRegistry.of(config);
  }

  public static ThreadPoolBulkhead threadPoolBulkhead() {
    ThreadPoolBulkheadConfig config = ThreadPoolBulkheadConfig.custom()
        .coreThreadPoolSize(4)
        .maxThreadPoolSize(8)
        .queueCapacity(20)
        .keepAliveDuration(Duration.ofSeconds(60))
        .build();
    return ThreadPoolBulkhead.of("fraud", config);
  }

  public static <T> T withSemaphoreBulkhead(Bulkhead bulkhead, Callable<T> callable) throws Exception {
    return Bulkhead.decorateCallable(bulkhead, callable).call();
  }

  public static final class ManualSemaphoreBulkhead {
    private final Semaphore semaphore;
    public ManualSemaphoreBulkhead(int maxConcurrent) {
      this.semaphore = new Semaphore(maxConcurrent, true);
    }
    public <T> T execute(Supplier<T> supplier) {
      boolean acquired = semaphore.tryAcquire();
      if (!acquired) throw new IllegalStateException("Bulkhead full");
      try { return supplier.get(); } finally { semaphore.release(); }
    }
  }

  public static <T> CompletableFuture<T> submitToPool(ThreadPoolBulkhead pool, Supplier<T> supplier) {
    return pool.executeSupplier(supplier);
  }
}`,
    springCode: `resilience4j.bulkhead.instances.fraud.maxConcurrentCalls: 5`,
    unitTest: `package com.vibhu.resilience.bulkhead;

import org.junit.jupiter.api.Test;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.junit.jupiter.api.Assertions.*;

class BulkheadIsolationTest {
  @Test
  void rejectsWhenFull() throws Exception {
    var bh = new BulkheadIsolation.ManualSemaphoreBulkhead(1);
    CountDownLatch hold = new CountDownLatch(1);
    AtomicBoolean rejected = new AtomicBoolean(false);
    Thread t = new Thread(() -> bh.execute(() -> {
      try { hold.await(5, TimeUnit.SECONDS); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
      return "done";
    }));
    t.start();
    Thread.sleep(50);
    try { bh.execute(() -> "x"); } catch (IllegalStateException e) { rejected.set(true); }
    hold.countDown();
    t.join(2000);
    assertTrue(rejected.get());
  }
}`,
    edgeCases: ['Queue full reject vs block', 'Reactive uses semaphore not thread pool'],
    failureScenarios: ['Too small → false reject', 'Too large → no isolation'],
    retry: 'Do not immediately retry bulkhead rejection.',
    idempotency: 'Rejected before dependency — safe retry if idempotent.',
    timeout: 'maxWaitDuration on acquire.',
    observability: 'bulkhead_rejected_total.',
    security: 'Per-tenant bulkheads.',
    performance: 'Semaphores lighter than thread pools.',
    scalability: 'Size from Little\'s Law.',
    production: 'Monitor rejection rate.',
    mistakes: ['Single pool for all deps'],
    antiPatterns: ['Unbounded queue'],
    alternatives: ['Rate limiter', 'Circuit breaker'],
    tradeoffs: 'Isolation vs thread overhead.',
    interviewQs: ['Semaphore vs thread pool bulkhead?'],
    trickyQs: ['Bulkhead full but dep healthy?'],
    seniorFollowUps: ['Size pools from p99 latency.'],
  },
  {
    id: 'rate-limiter',
    part: 5,
    name: 'Rate Limiter (Fixed / Sliding / Token / Leaky + Redis Lua)',
    frequency: 'Frequently used',
    definition:
      'Cap request rate per key using fixed/sliding windows, token bucket, or leaky bucket — locally or via Redis Lua for cluster-wide atomic limits.',
    problem: 'Unbounded traffic overwhelms dependencies and enables abuse.',
    realWorld: 'API gateways, Stripe, Resilience4j RateLimiter, Redis+Lua.',
    whyExists: 'Admission control returns 429 with Retry-After instead of cascading failure.',
    ascii: `Request → allow(key)? → pass | 429`,
    flow: `flowchart LR
  R --> L{Limiter}
  L --> OK
  L --> 429`,
    components: [
      {name: 'FixedWindowCounter', responsibility: 'O(1) INCR per window; boundary burst risk.'},
      {name: 'SlidingWindowLog', responsibility: 'Exact rolling count.'},
      {name: 'TokenBucket', responsibility: 'Sustained rate + burst.'},
      {name: 'LeakyBucket', responsibility: 'Smooth constant egress.'},
      {name: 'Redis Lua', responsibility: 'Distributed atomic token bucket.'},
    ],
    javaCode: `package com.vibhu.resilience.ratelimit;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public final class RateLimitAlgorithms {

  public record Result(boolean allowed, long remaining, long retryAfterMs) {}

  public static final class FixedWindowCounter {
    private final long windowMs;
    private final long limit;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private record Window(long epochWindow, AtomicLong count) {}
    public FixedWindowCounter(long windowMs, long limit) {
      this.windowMs = windowMs; this.limit = limit;
    }
    public synchronized Result allow(String key) {
      long now = System.currentTimeMillis();
      long bucket = now / windowMs;
      Window w = windows.computeIfAbsent(key, k -> new Window(bucket, new AtomicLong(0)));
      if (w.epochWindow() != bucket) { w = new Window(bucket, new AtomicLong(0)); windows.put(key, w); }
      long c = w.count().incrementAndGet();
      if (c <= limit) return new Result(true, limit - c, 0);
      return new Result(false, 0, ((bucket + 1) * windowMs) - now);
    }
  }

  public static final class SlidingWindowLog {
    private final long windowMs;
    private final int limit;
    private final Map<String, Deque<Long>> logs = new ConcurrentHashMap<>();
    public SlidingWindowLog(long windowMs, int limit) { this.windowMs = windowMs; this.limit = limit; }
    public synchronized Result allow(String key) {
      long now = System.currentTimeMillis();
      Deque<Long> q = logs.computeIfAbsent(key, k -> new ArrayDeque<>());
      while (!q.isEmpty() && now - q.peekFirst() >= windowMs) q.pollFirst();
      if (q.size() < limit) { q.addLast(now); return new Result(true, limit - q.size(), 0); }
      return new Result(false, 0, windowMs - (now - q.peekFirst()));
    }
  }

  public static final class TokenBucket {
    private final double refillPerMs, capacity;
    private double tokens;
    private long lastRefillMs;
    public TokenBucket(double capacity, double refillPerSecond) {
      this.capacity = capacity; this.tokens = capacity;
      this.refillPerMs = refillPerSecond / 1000.0;
      this.lastRefillMs = System.currentTimeMillis();
    }
    public synchronized Result allow(int cost) {
      long now = System.currentTimeMillis();
      tokens = Math.min(capacity, tokens + (now - lastRefillMs) * refillPerMs);
      lastRefillMs = now;
      if (tokens >= cost) { tokens -= cost; return new Result(true, (long) tokens, 0); }
      return new Result(false, 0, (long) Math.ceil((cost - tokens) / refillPerMs));
    }
  }

  public static final class LeakyBucket {
    private final double leakPerMs, capacity;
    private double level;
    private long lastLeakMs;
    public LeakyBucket(double capacity, double leakPerSecond) {
      this.capacity = capacity; this.leakPerMs = leakPerSecond / 1000.0;
      this.lastLeakMs = System.currentTimeMillis();
    }
    public synchronized Result allow(int drops) {
      long now = System.currentTimeMillis();
      level = Math.max(0, level - (now - lastLeakMs) * leakPerMs);
      lastLeakMs = now;
      if (level + drops <= capacity) { level += drops; return new Result(true, (long) (capacity - level), 0); }
      return new Result(false, 0, (long) Math.ceil((level + drops - capacity) / leakPerMs));
    }
  }
}`,
    redisCode: `local key=KEYS[1]; local cap=tonumber(ARGV[1]); local refill=tonumber(ARGV[2])
local now=tonumber(ARGV[3]); local cost=tonumber(ARGV[4])
local d=redis.call('HMGET',key,'tokens','ts'); local t=tonumber(d[1]); local ts=tonumber(d[2])
if t==nil then t=cap; ts=now end
t=math.min(cap,t+math.max(0,now-ts)/1000.0*refill)
if t>=cost then t=t-cost; redis.call('HMSET',key,'tokens',t,'ts',now); return {1,math.floor(t),0} end
return {0,0,math.ceil((cost-t)/refill*1000)}`,
    springCode: `resilience4j.ratelimiter.instances.api.limitForPeriod: 100`,
    unitTest: `package com.vibhu.resilience.ratelimit;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class RateLimitAlgorithmsTest {
  @Test void fixedWindowBlocks() {
    var fw = new RateLimitAlgorithms.FixedWindowCounter(1000, 2);
    assertTrue(fw.allow("u").allowed());
    assertTrue(fw.allow("u").allowed());
    assertFalse(fw.allow("u").allowed());
  }
  @Test void tokenBucketBurst() throws Exception {
    var tb = new RateLimitAlgorithms.TokenBucket(2, 10);
    assertTrue(tb.allow(1).allowed());
    assertTrue(tb.allow(1).allowed());
    assertFalse(tb.allow(1).allowed());
    Thread.sleep(150);
    assertTrue(tb.allow(1).allowed());
  }
}`,
    edgeCases: ['Fixed window 2× burst at boundary', 'Redis hot key', 'Clock skew'],
    failureScenarios: ['Redis down fail-open vs closed', 'Limiter too tight at launch'],
    retry: 'Honor Retry-After on 429.',
    idempotency: 'Rejected request never processed.',
    timeout: 'Redis EVAL < 5ms budget.',
    observability: 'rate_limit_rejected_total, X-RateLimit-Remaining.',
    security: 'Limit by authenticated identity.',
    performance: 'Token bucket O(1); sliding log O(k).',
    scalability: 'Redis cluster + local shield.',
    production: 'Multi-level edge+app; fail-closed on payments.',
    mistakes: ['Per-server HashMap = N× limit'],
    antiPatterns: ['Limit after expensive work'],
    alternatives: ['Load shedding', 'WAF'],
    tradeoffs: 'Accuracy vs memory; distributed vs local.',
    interviewQs: ['Fixed vs token bucket burst?'],
    trickyQs: ['Fail-open or closed on Redis outage?'],
    seniorFollowUps: ['5K policies under 5ms p99.'],
    deepLabHref: '/rate-limiter',
  },
  {
    id: 'backpressure',
    part: 5,
    name: 'Backpressure (Reactor + Kafka Consumer + Bounded Queue)',
    frequency: 'Frequently used',
    definition:
      'Slow downstream signals upstream to reduce emit rate — bounded queues, reactive request(n), Kafka pause/resume, and drop/shed policies.',
    problem: 'Fast producer outruns slow consumer; unbounded buffers cause OOM and GC pauses.',
    realWorld: 'Project Reactor onBackpressureBuffer, Kafka consumer pause(), bounded Executor queues, gRPC flow control.',
    whyExists: 'Stability under mismatch — system degrades gracefully instead of dying from memory pressure.',
    ascii: `Producer ══queue(max)══► Consumer
           ▲ pause when full`,
    flow: `sequenceDiagram
  P->>Q: emit
  Q->>C: process
  C-->>P: pause when queue full
  C-->>P: resume when drained`,
    components: [
      {name: 'Bounded queue', responsibility: 'Fixed capacity buffer between stages.'},
      {name: 'Reactor backpressure', responsibility: 'request(n) credit-based flow control.'},
      {name: 'Kafka pause/resume', responsibility: 'Stop polling when handler queue full.'},
      {name: 'Pressure signal', responsibility: 'Metrics/alerts on queue depth.'},
    ],
    javaCode: `package com.vibhu.resilience.backpressure;

import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.common.TopicPartition;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Collection;
import java.util.Deque;
import java.util.concurrent.atomic.AtomicBoolean;

public final class BackpressureHandlers {

  public static final class BoundedQueue<T> {
    private final int capacity;
    private final Deque<T> queue = new ArrayDeque<>();
    private final AtomicBoolean paused = new AtomicBoolean(false);

    public BoundedQueue(int capacity) { this.capacity = capacity; }

    public synchronized boolean offer(T item) {
      if (queue.size() >= capacity) {
        paused.set(true);
        return false;
      }
      queue.addLast(item);
      return true;
    }

    public synchronized T poll() {
      T item = queue.pollFirst();
      if (item != null && queue.size() < capacity / 2) paused.set(false);
      return item;
    }

    public boolean isPaused() { return paused.get(); }
    public int size() { return queue.size(); }
  }

  public static final class KafkaBackpressureLoop<K, V> {
    private final Consumer<K, V> consumer;
    private final BoundedQueue<ConsumerRecords<K, V>> buffer;
    private final java.util.function.Consumer<ConsumerRecords<K, V>> handler;

    public KafkaBackpressureLoop(Consumer<K, V> consumer, int bufferSize,
        java.util.function.Consumer<ConsumerRecords<K, V>> handler) {
      this.consumer = consumer;
      this.buffer = new BoundedQueue<>(bufferSize);
      this.handler = handler;
    }

    public void runOnce(Collection<TopicPartition> assignment) {
      if (!buffer.isPaused()) {
        ConsumerRecords<K, V> records = consumer.poll(Duration.ofMillis(100));
        if (!records.isEmpty() && !buffer.offer(records)) {
          consumer.pause(assignment);
        }
      }
      ConsumerRecords<K, V> batch = buffer.poll();
      if (batch != null) {
        handler.accept(batch);
        if (!buffer.isPaused()) consumer.resume(assignment);
      }
    }
  }

  /** Reactor-style credit: subscriber requests n items. */
  public static final class CreditBasedPublisher<T> {
    private final java.util.function.Supplier<T> source;
    private long credits;

    public CreditBasedPublisher(java.util.function.Supplier<T> source) {
      this.source = source;
    }

    public void request(long n) { credits += n; }

    public synchronized T emitOrNull() {
      if (credits <= 0) return null;
      credits--;
      return source.get();
    }
  }
}`,
    kafkaCode: `// pause(assignment) when handler queue full
// resume when queue < low watermark
consumer.pause(partitions);
consumer.resume(partitions);`,
    unitTest: `package com.vibhu.resilience.backpressure;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class BackpressureHandlersTest {
  @Test void boundedQueuePausesWhenFull() {
    var q = new BackpressureHandlers.BoundedQueue<String>(2);
    assertTrue(q.offer("a"));
    assertTrue(q.offer("b"));
    assertFalse(q.offer("c"));
    assertTrue(q.isPaused());
    q.poll();
    q.poll();
    assertFalse(q.isPaused());
  }

  @Test void creditBasedPublisherRespectsRequest() {
    var pub = new BackpressureHandlers.CreditBasedPublisher<>(() -> "x");
    assertNull(pub.emitOrNull());
    pub.request(1);
    assertEquals("x", pub.emitOrNull());
    assertNull(pub.emitOrNull());
  }
}`,
    edgeCases: ['Kafka pause without commit stalls partition', 'Reactor BUFFER_OVERFLOW strategy drops vs errors'],
    failureScenarios: ['Deadlock if resume never called', 'OOM if buffer misconfigured unbounded'],
    retry: 'Retry after backpressure clears — not during pause storm.',
    idempotency: 'At-least-once Kafka + pause may redeliver — handler idempotent.',
    timeout: 'Max wait in queue before shed.',
    observability: 'queue_depth, consumer_paused, lag.',
    security: 'Backpressure not a substitute for rate limiting attackers.',
    performance: 'Bounded memory; tune buffer to p99 processing time.',
    scalability: 'Scale consumers when lag grows; backpressure is per-partition.',
    production: 'Alert on sustained pause; low/high watermarks for hysteresis.',
    mistakes: ['Unbounded LinkedBlockingQueue', 'Never resume after pause'],
    antiPatterns: ['Ignore consumer lag until OOM'],
    alternatives: ['Scale consumers', 'Load shedding', 'Drop oldest policy'],
    tradeoffs: 'Latency vs memory safety; pause increases Kafka lag.',
    interviewQs: ['Kafka pause vs reduce max.poll.records?'],
    trickyQs: ['Backpressure with reactive-Kafka bridge?'],
    seniorFollowUps: ['End-to-end backpressure across HTTP and Kafka.'],
  },
  {
    id: 'load-shedding',
    part: 5,
    name: 'Load Shedding (Queue / CPU / Concurrency / Latency)',
    frequency: 'Frequently used',
    definition:
      'Reject or degrade new work when system signals overload — queue depth, CPU, in-flight count, or latency SLO breach.',
    problem: 'Under overload, accepting more work increases latency for everyone and risks total collapse.',
    realWorld: 'Google SRE load shedding, Envoy overload manager, JVM thread pool rejection, 503 with Retry-After.',
    whyExists: 'Preserve partial availability and recovery — better to serve 80% fast than 100% timeout.',
    ascii: `if queue>max OR cpu>85% OR p99>sla → 503 shed`,
    flow: `flowchart TD
  R[Request] --> S{Shed?}
  S -->|no| OK[Process]
  S -->|yes| 503[503 Retry-After]`,
    components: [
      {name: 'Queue depth gate', responsibility: 'Reject when executor queue exceeds threshold.'},
      {name: 'CPU gate', responsibility: 'Shed when process or host CPU sustained high.'},
      {name: 'Concurrency gate', responsibility: 'Max in-flight requests global counter.'},
      {name: 'Latency SLO gate', responsibility: 'Shed when rolling p99 exceeds budget.'},
    ],
    javaCode: `package com.vibhu.resilience.loadshed;

import java.lang.management.ManagementFactory;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

public final class LoadShedder {

  public record Decision(boolean accept, String reason, long retryAfterMs) {}

  private final int maxQueueDepth;
  private final double maxCpuLoad;
  private final int maxConcurrency;
  private final long maxP99Ms;
  private final AtomicInteger inFlight = new AtomicInteger(0);
  private final AtomicLong lastLatencyMs = new AtomicLong(0);

  public LoadShedder(int maxQueueDepth, double maxCpuLoad, int maxConcurrency, long maxP99Ms) {
    this.maxQueueDepth = maxQueueDepth;
    this.maxCpuLoad = maxCpuLoad;
    this.maxConcurrency = maxConcurrency;
    this.maxP99Ms = maxP99Ms;
  }

  public Decision admit(int currentQueueDepth) {
    if (currentQueueDepth > maxQueueDepth) {
      return new Decision(false, "queue", 1000);
    }
    if (inFlight.get() >= maxConcurrency) {
      return new Decision(false, "concurrency", 500);
    }
    double cpu = ManagementFactory.getOperatingSystemMXBean().getSystemLoadAverage();
    if (cpu > 0 && cpu > maxCpuLoad) {
      return new Decision(false, "cpu", 2000);
    }
    if (lastLatencyMs.get() > maxP99Ms) {
      return new Decision(false, "latency", 1000);
    }
    inFlight.incrementAndGet();
    return new Decision(true, "ok", 0);
  }

  public void release(long latencyMs) {
    inFlight.decrementAndGet();
    lastLatencyMs.set(latencyMs);
  }

  public int inFlightCount() {
    return inFlight.get();
  }
}`,
    unitTest: `package com.vibhu.resilience.loadshed;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class LoadShedderTest {
  @Test void shedsOnQueueDepth() {
    var shed = new LoadShedder(5, 100, 100, 1000);
    var d = shed.admit(10);
    assertFalse(d.accept());
    assertEquals("queue", d.reason());
  }

  @Test void admitsAndReleases() {
    var shed = new LoadShedder(100, 100, 10, 5000);
    assertTrue(shed.admit(0).accept());
    shed.release(50);
    assertEquals(0, shed.inFlightCount());
  }
}`,
    edgeCases: ['CPU load average lag on containers', 'Shedding read while writes continue — policy choice'],
    failureScenarios: ['Too aggressive shed → revenue loss', 'No shed → total outage'],
    retry: 'Clients backoff on 503 Retry-After.',
    idempotency: 'Shed before processing — safe retry.',
    timeout: 'Fast reject < 1ms — do not queue shed checks.',
    observability: 'shed_total by reason; in_flight gauge.',
    security: 'Shed unauthenticated traffic first; protect paid tier.',
    performance: 'Shedding cheaper than timeout under load.',
    scalability: 'Distributed shed needs shared signal (Redis) or per-instance.',
    production: 'Priority queues: shed bulk before checkout.',
    mistakes: ['Shed after acquiring DB connection', 'No Retry-After header'],
    antiPatterns: ['Infinite queue "to never reject"'],
    alternatives: ['Autoscale', 'Rate limiter', 'Circuit breaker'],
    tradeoffs: 'User errors vs system survival; tuning per tier.',
    interviewQs: ['Shed vs throttle difference?'],
    trickyQs: ['Shed at gateway or service?'],
    seniorFollowUps: ['Multi-signal adaptive shedding controller.'],
  },
  {
    id: 'graceful-degradation',
    part: 5,
    name: 'Graceful Degradation (Recommendation Fails, Product Works)',
    frequency: 'Frequently used',
    definition:
      'Deliver core functionality with reduced features when non-critical dependencies fail — product page loads without recommendations.',
    problem: 'Optional enrichment failure should not block primary user journey.',
    realWorld: 'Amazon product without "Customers also bought", Netflix reduced thumbnails, checkout without promo suggestions.',
    whyExists: 'Maximizes revenue and UX during partial outages — clear core vs optional boundary.',
    ascii: `Product ✓ | Recommendations ✗ → show product only`,
    flow: `sequenceDiagram
  C->>P: product page
  P->>Catalog: get product
  Catalog-->>P: ok
  P->>Rec: recommendations
  Rec-->>P: timeout
  P-->>C: product without recs`,
    components: [
      {name: 'Core path', responsibility: 'Must-succeed operations with strict SLO.'},
      {name: 'Enhancement path', responsibility: 'Best-effort with short timeout.'},
      {name: 'Feature flag', responsibility: 'Disable optional modules under stress.'},
      {name: 'Response composer', responsibility: 'Merge partial results with clear gaps.'},
    ],
    javaCode: `package com.vibhu.resilience.degrade;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

public final class ProductPageComposer {

  public record Product(String id, String title, String price) {}
  public record Recommendation(String productId, double score) {}
  public record ProductPage(Product product, List<Recommendation> recommendations, boolean degraded) {}

  public interface ProductCatalog {
    Product getProduct(String id);
  }

  public interface RecommendationService {
    List<Recommendation> recommend(String productId);
  }

  private final ProductCatalog catalog;
  private final RecommendationService recommendations;
  private final Duration recTimeout;

  public ProductPageComposer(ProductCatalog catalog, RecommendationService recommendations, Duration recTimeout) {
    this.catalog = catalog;
    this.recommendations = recommendations;
    this.recTimeout = recTimeout;
  }

  public ProductPage load(String productId) {
    Product product = catalog.getProduct(productId);
    List<Recommendation> recs = List.of();
    boolean degraded = false;
    try {
      recs = CompletableFuture.supplyAsync(() -> recommendations.recommend(productId))
          .orTimeout(recTimeout.toMillis(), TimeUnit.MILLISECONDS)
          .exceptionally(ex -> List.of())
          .join();
      if (recs.isEmpty()) {
        degraded = true;
      }
    } catch (Exception ex) {
      degraded = true;
    }
    return new ProductPage(product, recs, degraded);
  }
}`,
    unitTest: `package com.vibhu.resilience.degrade;

import org.junit.jupiter.api.Test;
import java.time.Duration;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class ProductPageComposerTest {
  @Test void productWorksWhenRecommendationsFail() {
    var catalog = (ProductPageComposer.ProductCatalog) id ->
        new ProductPageComposer.Product(id, "Widget", "9.99");
    var recs = (ProductPageComposer.RecommendationService) id -> {
      throw new RuntimeException("down");
    };
    var composer = new ProductPageComposer(catalog, recs, Duration.ofMillis(50));
    var page = composer.load("p1");
    assertEquals("Widget", page.product().title());
    assertTrue(page.degraded());
    assertTrue(page.recommendations().isEmpty());
  }
}`,
    edgeCases: ['Degraded flag confuses A/B metrics', 'Core misclassified as optional'],
    failureScenarios: ['Cascade if core depends on optional cache warming'],
    retry: 'Short retry on recommendations only; never block core.',
    idempotency: 'Core read idempotent; optional path skip on failure.',
    timeout: 'Recommendations 200ms; core 2s.',
    observability: 'degraded_responses_total; trace optional span failed.',
    security: 'Degraded mode must not skip auth on core.',
    performance: 'Parallel optional fetches with tight timeout.',
    scalability: 'Feature flags disable expensive optional globally.',
    production: 'Document core vs optional matrix per endpoint.',
    mistakes: ['Blocking page on ads/recs', 'Fake data in degraded mode'],
    antiPatterns: ['Return 500 when optional fails'],
    alternatives: ['Async load optional client-side', 'Cached stale recommendations'],
    tradeoffs: 'UX richness vs reliability; stale cache vs empty.',
    interviewQs: ['Define core vs optional for checkout?'],
    trickyQs: ['Degrade payment fraud check?'],
    seniorFollowUps: ['SLO budget split core vs enrichment.'],
  },
  {
    id: 'fallback',
    part: 5,
    name: 'Fallback (Default / Cache / Alt / Partial — When Dangerous)',
    frequency: 'Frequently used',
    definition:
      'Substitute response when primary call fails — static default, stale cache, alternate provider, or partial data — with explicit danger zones for money and auth.',
    problem: 'Hard failure on optional or recoverable paths; but wrong fallback on payments causes financial loss.',
    realWorld: 'Resilience4j fallback, Hystrix fallbackMethod, CDN stale-while-revalidate, secondary payment rail.',
    whyExists: 'Improves perceived availability when substitute is safe and clearly labeled.',
    ascii: `Primary fail → fallback chain: cache → alt → default`,
    flow: `flowchart LR
  P[Primary] -->|fail| C[Cache]
  C -->|miss| A[Alternate]
  A -->|fail| D[Default]`,
    components: [
      {name: 'Default fallback', responsibility: 'Static safe response (empty list, generic banner).'},
      {name: 'Cache fallback', responsibility: 'Stale-but-usable data with timestamp.'},
      {name: 'Alternate provider', responsibility: 'Secondary integration (backup PSP).'},
      {name: 'Partial fallback', responsibility: 'Merge available shards; mark incomplete.'},
    ],
    javaCode: `package com.vibhu.resilience.fallback;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

public final class FallbackChain {

  public record CachedValue<T>(T value, Instant storedAt) {}

  public static final class CacheFallback<T> {
    private final Map<String, CachedValue<T>> cache = new ConcurrentHashMap<>();

    public T getOrCompute(String key, Supplier<T> primary, Supplier<T> staleDefault) {
      try {
        T fresh = primary.get();
        cache.put(key, new CachedValue<>(fresh, Instant.now()));
        return fresh;
      } catch (Exception ex) {
        CachedValue<T> cached = cache.get(key);
        if (cached != null) return cached.value();
        return staleDefault.get();
      }
    }
  }

  public static <T> T primaryOrAlternate(Supplier<T> primary, Supplier<T> alternate, Supplier<T> defaultValue) {
    try {
      return primary.get();
    } catch (Exception ex) {
      try {
        return alternate.get();
      } catch (Exception ex2) {
        return defaultValue.get();
      }
    }
  }

  /** DANGEROUS for payments — illustrative only. */
  public static String paymentFallbackDanger() {
    throw new UnsupportedOperationException(
        "Never fallback payment to fake SUCCESS — return PENDING or fail closed");
  }

  public static List<String> safeEmptyListFallback() {
    return List.of();
  }
}`,
    unitTest: `package com.vibhu.resilience.fallback;

import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;

class FallbackChainTest {
  @Test void cacheFallbackUsesStaleOnPrimaryFail() {
    var cache = new FallbackChain.CacheFallback<List<String>>();
    var calls = new AtomicInteger();
    List<String> first = cache.getOrCompute("k",
        () -> { calls.incrementAndGet(); return List.of("live"); },
        List::of);
    assertEquals(List.of("live"), first);
    List<String> stale = cache.getOrCompute("k",
        () -> { throw new RuntimeException("down"); },
        () -> List.of("default"));
    assertEquals(List.of("live"), stale);
  }

  @Test void paymentFallbackIsUnsupported() {
    assertThrows(UnsupportedOperationException.class, FallbackChain::paymentFallbackDanger);
  }
}`,
    edgeCases: ['Stale cache shows wrong price — TTL and version checks', 'Alternate PSP different fees'],
    failureScenarios: ['Fallback masks ongoing outage', 'Fake success on payment'],
    retry: 'Retry primary before fallback for idempotent reads.',
    idempotency: 'Alternate provider needs same idempotency key for writes.',
    timeout: 'Short primary timeout then fast fallback path.',
    observability: 'fallback_invoked_total by type; never hide financial fallback.',
    security: 'Default auth deny not allow; no cached credentials.',
    performance: 'Cache fallback fast; alternate may be slower route.',
    scalability: 'Cache fallback per instance — may serve different stale per node.',
    production: 'Explicit runbook: which endpoints allow fallback; payment fail-closed.',
    mistakes: ['Fallback SUCCESS on charge', 'Silent stale price'],
    antiPatterns: ['Fallback to random data', 'Cascade fallback without logging'],
    alternatives: ['Graceful degradation', 'Queue for async', 'Circuit breaker fast fail'],
    tradeoffs: 'Availability vs correctness — especially financial and inventory.',
    interviewQs: ['When is cache fallback dangerous?'],
    trickyQs: ['Fallback to secondary region with split brain?'],
    seniorFollowUps: ['Fallback matrix signed off by product and risk.'],
  },
  {
    id: 'hedged-requests',
    part: 5,
    name: 'Hedged Requests',
    frequency: 'Specialized',
    definition:
      'After primary request exceeds delay threshold, send duplicate to another backend; use first successful response and cancel the loser.',
    problem: 'Tail latency at p99 dominates user experience in large fan-out systems.',
    realWorld: 'Google "The Tail at Scale", DynamoDB request hedging option, some gRPC retry hedging policies.',
    whyExists: 'Reduces tail latency for read-only idempotent requests without waiting full timeout.',
    ascii: `t=0 → backend A
t=50ms no reply → hedge backend B
first wins → cancel other`,
    flow: `sequenceDiagram
  C->>A: request
  Note over C: delay threshold
  C->>B: hedge
  B-->>C: 200 first
  C-xA: cancel`,
    components: [
      {name: 'Primary call', responsibility: 'First attempt to preferred backend.'},
      {name: 'Hedge timer', responsibility: 'Trigger duplicate after p95-ish delay.'},
      {name: 'Race coordinator', responsibility: 'CompletableFuture.anyOf; cancel loser.'},
      {name: 'Load cap', responsibility: 'Max hedge fraction to avoid doubling load.'},
    ],
    javaCode: `package com.vibhu.resilience.hedge;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

public final class HedgedRequestExecutor implements AutoCloseable {

  private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
  private final long hedgeDelayMs;
  private final double maxHedgeFraction;

  public HedgedRequestExecutor(long hedgeDelayMs, double maxHedgeFraction) {
    this.hedgeDelayMs = hedgeDelayMs;
    this.maxHedgeFraction = maxHedgeFraction;
  }

  public <T> CompletableFuture<T> execute(Supplier<CompletableFuture<T>> primary,
      Supplier<CompletableFuture<T>> hedge) {
    CompletableFuture<T> primaryFuture = primary.get();
    CompletableFuture<T> result = new CompletableFuture<>();
    primaryFuture.whenComplete((val, err) -> {
      if (err == null) result.complete(val);
    });
    scheduler.schedule(() -> {
      if (!result.isDone()) {
        CompletableFuture<T> hedgeFuture = hedge.get();
        hedgeFuture.whenComplete((val, err) -> {
          if (err == null && result.complete(val)) {
            primaryFuture.cancel(true);
          }
        });
      }
    }, hedgeDelayMs, TimeUnit.MILLISECONDS);
    primaryFuture.whenComplete((val, err) -> {
      if (err != null && !result.isDone()) {
        result.completeExceptionally(err);
      }
    });
    return result;
  }

  @Override
  public void close() {
    scheduler.shutdownNow();
  }
}`,
    unitTest: `package com.vibhu.resilience.hedge;

import org.junit.jupiter.api.Test;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import static org.junit.jupiter.api.Assertions.*;

class HedgedRequestExecutorTest {
  @Test void hedgeWinsWhenPrimarySlow() throws Exception {
    try (var exec = new HedgedRequestExecutor(30, 0.1)) {
      CompletableFuture<String> primary = CompletableFuture.supplyAsync(() -> {
        try { Thread.sleep(200); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        return "slow";
      });
      CompletableFuture<String> hedge = CompletableFuture.completedFuture("fast");
      String result = exec.execute(() -> primary, () -> hedge).get(1, TimeUnit.SECONDS);
      assertEquals("fast", result);
    }
  }
}`,
    edgeCases: [
      'Non-idempotent writes — hedging causes duplicate side effects.',
      'Hedge storm doubles load during outage — cap hedge fraction.',
      'Both fail — caller sees combined failure.',
    ],
    failureScenarios: [
      '100% hedge rate during incident — amplifies load 2×.',
      'Cancel does not stop server work — backend still processes.',
    ],
    retry: 'Hedging is alternative to retry for tail latency — do not combine blindly.',
    idempotency: 'Mandatory for hedged requests — reads only unless dedup token.',
    timeout: 'Overall deadline still applies to race winner.',
    observability: 'hedge_triggered_total, hedge_won_total, extra_load_factor.',
    security: 'Both backends must enforce same auth — hedge to trusted replica only.',
    performance: 'Cuts p99 for reads; increases average load by hedge fraction.',
    scalability: 'Limit hedge to 5–10% of requests globally.',
    production: 'Reads only; disable during dependency degradation; monitor load multiplier.',
    mistakes: ['Hedge POST payment', 'No max hedge fraction'],
    antiPatterns: ['Hedge to untrusted third region'],
    alternatives: ['Lower timeout + single retry', 'Speculative prefetch', 'Replica read'],
    tradeoffs: 'Tail latency vs load amplification and duplicate execution risk.',
    interviewQs: ['Why hedging dangerous for writes?'],
    trickyQs: ['Hedge delay derived from what percentile?'],
    seniorFollowUps: ['Adaptive hedge rate from live error and latency signals.'],
  },
];
