import type {PatternCard} from './types';

export const DECOMPOSE_ASCII = `
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DECOMPOSITION PATTERNS — OVERVIEW                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Monolith ──► slice by capability / subdomain / strangler / ACL / branch  │
│                                                                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│   │ Customer │  │  Order   │  │ Payment  │  │Inventory │  │  Notify  │   │
│   │ service  │  │ service  │  │ service  │  │ service  │  │ service  │   │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│        │             │             │             │             │           │
│        └─────────────┴──────┬──────┴─────────────┴─────────────┘           │
│                             │ async events / APIs                           │
│                    ┌────────▼────────┐                                      │
│                    │  API Gateway /  │                                      │
│                    │  Strangler fig  │                                      │
│                    └────────┬────────┘                                      │
│                             │                                               │
│                    ┌────────▼────────┐                                      │
│                    │ Legacy monolith │  ◄── ACL / branch-by-abstraction     │
│                    └─────────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────┘
`;

export const GATEWAY_ASCII = `
┌─────────────────────────────────────────────────────────────────────────────┐
│              GATEWAY PATTERNS — OVERVIEW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Clients ──► API Gateway ──► microservices                                 │
│              (auth, rate limit, routing, correlation ID)                    │
│                                                                             │
│   Web SPA ──► Web BFF ──┐                                                   │
│                         ├──► API Gateway ──► Customer / Order / Payment     │
│   Mobile  ──► Mobile BFF┘         │                                         │
│                                   └──► Aggregation (parallel futures)       │
│                                                                             │
│   Responsibilities: routing · TLS termination · authN/Z · rate limiting     │
│                     request logging · error mapping · circuit breaking      │
└─────────────────────────────────────────────────────────────────────────────┘
`;

const decomposeByBusinessCapability: PatternCard = {
  id: 'decompose-by-business-capability',
  part: 1,
  name: 'Decompose by Business Capability',
  frequency: 'Frequently used',
  definition:
    'Split a monolith into independently deployable services aligned with business capabilities (Customer, Order, Payment, Inventory, Notification) rather than technical layers. Each capability owns its data, API, and lifecycle.',
  problem:
    'A single deployable unit couples unrelated business areas. A change in payment logic forces retesting checkout, inventory, and notifications. Teams step on each other, release trains slow down, and scaling is all-or-nothing.',
  realWorld:
    'E-commerce platforms carve out Order Management, Payments, Catalog/Inventory, and Customer Profile as separate services. Amazon famously organized around "two-pizza teams" owning capabilities end-to-end.',
  whyExists:
    'Conway\'s Law: system structure mirrors communication structure. Capability-aligned services let product teams own outcomes, deploy independently, and scale hot paths (e.g., checkout) without scaling the entire monolith.',
  ascii: `
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Customer   │  │    Order    │  │   Payment   │
│  capability │  │  capability │  │  capability │
│  + own DB   │  │  + own DB   │  │  + own DB   │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │ domain events
              ┌─────────▼─────────┐
              │   Notification    │
              │    capability     │
              └───────────────────┘
`,
  flow: 'Identify bounded capabilities → assign team ownership → extract data per capability → expose APIs/events → migrate callers incrementally → retire shared DB tables.',
  components: [
    {name: 'Capability map', responsibility: 'Inventory of business functions and their data ownership boundaries'},
    {name: 'Service boundary', responsibility: 'Deployable unit with private schema and public contract'},
    {name: 'Integration contract', responsibility: 'REST/gRPC/events between capabilities; no shared tables'},
    {name: 'Team topology', responsibility: 'Stream-aligned team per capability with on-call rotation'},
  ],
  javaCode: `package com.vibhu.msp.decompose.capability;

import java.util.Map;
import java.util.Set;

/** Capability registry — each business area is a deployable boundary with its own package tree. */
public final class CapabilityRegistry {

    private CapabilityRegistry() {}

    public enum Capability {
        CUSTOMER("com.vibhu.msp.customer"),
        ORDER("com.vibhu.msp.order"),
        PAYMENT("com.vibhu.msp.payment"),
        INVENTORY("com.vibhu.msp.inventory"),
        NOTIFICATION("com.vibhu.msp.notification");

        private final String basePackage;

        Capability(String basePackage) {
            this.basePackage = basePackage;
        }

        public String basePackage() {
            return basePackage;
        }

        public PackageLayout layout() {
            return switch (this) {
                case CUSTOMER -> new PackageLayout(
                    basePackage + ".api",
                    basePackage + ".domain",
                    basePackage + ".application",
                    basePackage + ".infrastructure",
                    Set.of("customer_id", "email", "profile"));
                case ORDER -> new PackageLayout(
                    basePackage + ".api",
                    basePackage + ".domain",
                    basePackage + ".application",
                    basePackage + ".infrastructure",
                    Set.of("order_id", "customer_id", "line_items", "status"));
                case PAYMENT -> new PackageLayout(
                    basePackage + ".api",
                    basePackage + ".domain",
                    basePackage + ".application",
                    basePackage + ".infrastructure",
                    Set.of("payment_id", "order_id", "amount", "status"));
                case INVENTORY -> new PackageLayout(
                    basePackage + ".api",
                    basePackage + ".domain",
                    basePackage + ".application",
                    basePackage + ".infrastructure",
                    Set.of("sku", "quantity_reserved", "warehouse_id"));
                case NOTIFICATION -> new PackageLayout(
                    basePackage + ".api",
                    basePackage + ".domain",
                    basePackage + ".application",
                    basePackage + ".infrastructure",
                    Set.of("notification_id", "channel", "template", "status"));
            };
        }
    }

    public record PackageLayout(
        String apiPackage,
        String domainPackage,
        String applicationPackage,
        String infrastructurePackage,
        Set<String> ownedEntities) {}

    public static Map<Capability, PackageLayout> allLayouts() {
        return Map.of(
            Capability.CUSTOMER, Capability.CUSTOMER.layout(),
            Capability.ORDER, Capability.ORDER.layout(),
            Capability.PAYMENT, Capability.PAYMENT.layout(),
            Capability.INVENTORY, Capability.INVENTORY.layout(),
            Capability.NOTIFICATION, Capability.NOTIFICATION.layout());
    }

    public static boolean isCrossCapabilityDataAccess(Capability owner, Capability accessor) {
        return owner != accessor;
    }
}`,
  unitTest: `package com.vibhu.msp.decompose.capability;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CapabilityRegistryTest {

    @Test
    void eachCapabilityHasDistinctBasePackage() {
        var layouts = CapabilityRegistry.allLayouts();
        assertEquals(5, layouts.size());
        assertEquals("com.vibhu.msp.customer", CapabilityRegistry.Capability.CUSTOMER.basePackage());
        assertEquals("com.vibhu.msp.payment", CapabilityRegistry.Capability.PAYMENT.basePackage());
    }

    @Test
    void orderCapabilityOwnsOrderEntities() {
        var layout = CapabilityRegistry.Capability.ORDER.layout();
        assertTrue(layout.ownedEntities().contains("order_id"));
        assertTrue(layout.apiPackage().endsWith(".api"));
        assertTrue(layout.infrastructurePackage().endsWith(".infrastructure"));
    }

    @Test
    void crossCapabilityDataAccessIsForbidden() {
        assertTrue(CapabilityRegistry.isCrossCapabilityDataAccess(
            CapabilityRegistry.Capability.PAYMENT,
            CapabilityRegistry.Capability.ORDER));
        assertFalse(CapabilityRegistry.isCrossCapabilityDataAccess(
            CapabilityRegistry.Capability.PAYMENT,
            CapabilityRegistry.Capability.PAYMENT));
    }
}`,
  edgeCases: [
    'Shared reference data (country codes) — replicate read-only or publish via catalog service',
    'Capability spans multiple products — split by subdomain within capability',
    'Circular dependencies between Order and Payment — introduce saga or event choreography',
    'Reporting needs cross-capability joins — use CDC/read models, not shared DB',
  ],
  failureScenarios: [
    'Distributed monolith: services still deploy together due to tight coupling',
    'Split too fine: operational overhead exceeds benefit',
    'Wrong boundary: Customer and Identity merged then split again — expensive rework',
  ],
  retry: 'Inter-capability calls use client-side retry with idempotency keys on mutating operations; prefer async events for non-critical paths.',
  idempotency: 'Each capability exposes idempotent command endpoints (Idempotency-Key header or natural keys like order_id + operation).',
  timeout: 'Synchronous capability chains should stay ≤3 hops; default 2s per hop with bulkhead isolation.',
  observability: 'Trace context propagated across capability boundaries; metrics per capability SLO (availability, p99 latency).',
  security: 'OAuth2 scopes per capability; service-to-service mTLS; no direct DB access across boundaries.',
  performance: 'Hot capabilities (Order, Payment) scale independently; cache read-heavy Customer profile at gateway/BFF.',
  scalability: 'Horizontal pod autoscaling per capability based on CPU, queue depth, or custom checkout RPS.',
  production: 'Start with capability map workshop; extract highest-change area first; enforce arch unit tests banning cross-package DB imports.',
  mistakes: [
    'Decomposing by technical layer (all controllers in one service)',
    'Sharing a database "temporarily" that becomes permanent',
    'Extracting services before stabilizing domain boundaries',
  ],
  antiPatterns: [
    'Smart endpoints, dumb pipes with orchestration logic in gateway only',
    'Nano-services per entity (CustomerAddressService)',
    'Shared ORM models across repositories',
  ],
  alternatives: [
    'Modular monolith with strict module boundaries',
    'Decompose by subdomain (DDD)',
    'Strangler fig for gradual extraction',
  ],
  tradeoffs:
    'Pros: team autonomy, independent scaling, fault isolation. Cons: distributed transactions, network latency, operational complexity, eventual consistency.',
  interviewQs: [
    'How do you identify service boundaries in an e-commerce monolith?',
    'What is the difference between decomposing by capability vs by subdomain?',
    'How do you handle cross-cutting concerns like authentication?',
  ],
  trickyQs: [
    'Customer and Loyalty — same capability or separate services?',
    'How do you migrate without a big-bang rewrite?',
  ],
  seniorFollowUps: [
    'Draw the data ownership matrix for Order/Payment/Inventory',
    'How would you measure if decomposition succeeded (DORA metrics)?',
    'When would you merge two microservices back together?',
  ],
};

const decomposeBySubdomain: PatternCard = {
  id: 'decompose-by-subdomain',
  part: 1,
  name: 'Decompose by Subdomain',
  frequency: 'Frequently used',
  definition:
    'Apply Domain-Driven Design: each subdomain (core, supporting, generic) becomes a service with internal layers — Domain (entities, aggregates), Application (use cases), Infrastructure (persistence, messaging), API (controllers).',
  problem:
    'Business capability decomposition without DDD discipline leads to anemic services and leaking persistence models. Teams confuse "microservice" with "CRUD over HTTP" and lose ubiquitous language.',
  realWorld:
    'Shipping logistics subdomain separate from billing subdomain in a SaaS platform. Each subdomain has its own aggregate roots, repositories, and anti-corruption boundaries toward generic subdomains (email, auth).',
  whyExists:
    'Subdomains reflect how experts think about the problem space. Layering inside each subdomain keeps domain logic pure and testable while infrastructure concerns stay at the edges.',
  ascii: `
┌──────────────────────────────────────────────┐
│              Subdomain: Order                │
├──────────────────────────────────────────────┤
│  API (controllers, DTOs)                   │
├──────────────────────────────────────────────┤
│  Application (commands, queries, handlers)   │
├──────────────────────────────────────────────┤
│  Domain (aggregates, value objects, events)  │
├──────────────────────────────────────────────┤
│  Infrastructure (JPA, Kafka, HTTP clients)   │
└──────────────────────────────────────────────┘
`,
  flow: 'Event storming → identify subdomains → define aggregates → layer packages → expose application services via API → integrate via domain events.',
  components: [
    {name: 'Domain layer', responsibility: 'Business invariants, aggregates, domain events — zero framework imports'},
    {name: 'Application layer', responsibility: 'Orchestrates use cases; transaction boundaries at aggregate level'},
    {name: 'Infrastructure layer', responsibility: 'Adapters implementing repository and messaging ports'},
    {name: 'API layer', responsibility: 'HTTP/gRPC translation; input validation only'},
  ],
  javaCode: `package com.vibhu.msp.decompose.subdomain.order.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class OrderAggregate {
    private final OrderId id;
    private final CustomerId customerId;
    private OrderStatus status;
    private final List<LineItem> lines;
    private final List<DomainEvent> events = new ArrayList<>();

    private OrderAggregate(OrderId id, CustomerId customerId, List<LineItem> lines) {
        this.id = id;
        this.customerId = customerId;
        this.lines = List.copyOf(lines);
        this.status = OrderStatus.DRAFT;
    }

    public static OrderAggregate create(CustomerId customerId, List<LineItem> lines) {
        if (lines.isEmpty()) {
            throw new IllegalArgumentException("Order must have at least one line");
        }
        var order = new OrderAggregate(new OrderId(UUID.randomUUID()), customerId, lines);
        order.events.add(new OrderCreated(order.id, customerId, Instant.now()));
        return order;
    }

    public void submit() {
        if (status != OrderStatus.DRAFT) {
            throw new IllegalStateException("Only draft orders can be submitted");
        }
        status = OrderStatus.SUBMITTED;
        events.add(new OrderSubmitted(id, total(), Instant.now()));
    }

    public BigDecimal total() {
        return lines.stream().map(LineItem::subtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public List<DomainEvent> pullEvents() {
        var copy = List.copyOf(events);
        events.clear();
        return copy;
    }

    public OrderId id() { return id; }
    public OrderStatus status() { return status; }

    public record OrderId(UUID value) {}
    public record CustomerId(UUID value) {}
    public record LineItem(String sku, int qty, BigDecimal unitPrice) {
        BigDecimal subtotal() { return unitPrice.multiply(BigDecimal.valueOf(qty)); }
    }
    public enum OrderStatus { DRAFT, SUBMITTED, PAID, SHIPPED }
    public sealed interface DomainEvent permits OrderCreated, OrderSubmitted {}
    public record OrderCreated(OrderId orderId, CustomerId customerId, Instant at) implements DomainEvent {}
    public record OrderSubmitted(OrderId orderId, BigDecimal total, Instant at) implements DomainEvent {}
}`,
  unitTest: `package com.vibhu.msp.decompose.subdomain.order.domain;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class OrderAggregateTest {

    @Test
    void createAndSubmitOrderEmitsEvents() {
        var customer = new OrderAggregate.CustomerId(java.util.UUID.randomUUID());
        var lines = List.of(new OrderAggregate.LineItem("SKU-1", 2, new BigDecimal("10.00")));
        var order = OrderAggregate.create(customer, lines);
        assertEquals(OrderAggregate.OrderStatus.DRAFT, order.status());
        order.submit();
        assertEquals(OrderAggregate.OrderStatus.SUBMITTED, order.status());
        var events = order.pullEvents();
        assertEquals(2, events.size());
        assertInstanceOf(OrderAggregate.OrderSubmitted.class, events.get(1));
    }

    @Test
    void cannotSubmitTwice() {
        var customer = new OrderAggregate.CustomerId(java.util.UUID.randomUUID());
        var order = OrderAggregate.create(customer, List.of(
            new OrderAggregate.LineItem("SKU-1", 1, BigDecimal.ONE)));
        order.submit();
        assertThrows(IllegalStateException.class, order::submit);
    }
}`,
  edgeCases: [
    'Generic subdomain (notifications) used by many — treat as shared service with stable API',
    'Core subdomain changes frequently — invest in rich domain model',
    'Supporting subdomain — buy vs build decision',
  ],
  failureScenarios: [
    'Anemic domain model: all logic in application services',
    'Leaking JPA entities into API responses',
    'Cross-subdomain aggregate spanning two databases',
  ],
  retry: 'Application commands are retried at infrastructure boundary; domain layer remains pure and deterministic.',
  idempotency: 'Command handlers check aggregate version or business idempotency token before applying side effects.',
  timeout: 'Application service calls external ports with explicit timeouts; domain logic never blocks on I/O.',
  observability: 'Domain events published to outbox for audit trail; correlation ID attached at API ingress.',
  security: 'API layer enforces authorization; domain enforces business rules (e.g., customer can only see own orders).',
  performance: 'Read models (CQRS) for query-heavy subdomains; write path stays aggregate-focused.',
  scalability: 'Each subdomain scales independently; event-driven integration reduces synchronous coupling.',
  production: 'ArchUnit rules: domain package must not depend on infrastructure; use hexagonal ports.',
  mistakes: [
    'One subdomain per database table',
    'Skipping ubiquitous language workshop',
    'Shared kernel without governance',
  ],
  antiPatterns: [
    'Transaction script across multiple aggregates in one service call',
    'Domain events as afterthought without outbox',
  ],
  alternatives: [
    'Decompose by business capability without formal DDD',
    'Modular monolith with subdomain modules',
  ],
  tradeoffs:
    'Rich domain model improves maintainability but requires skilled modeling and upfront investment. Over-DDD on simple CRUD adds ceremony.',
  interviewQs: [
    'Explain the four DDD layers inside a microservice',
    'What is the difference between a subdomain and a bounded context?',
    'Where do you put validation — API or domain?',
  ],
  trickyQs: [
    'Is User Authentication a subdomain or cross-cutting infrastructure?',
    'How do you handle a process spanning Order and Shipping subdomains?',
  ],
  seniorFollowUps: [
    'Design aggregate boundaries for a multi-tenant billing subdomain',
    'How do you evolve a published domain event schema?',
  ],
};

const stranglerFig: PatternCard = {
  id: 'strangler-fig',
  part: 1,
  name: 'Strangler Fig',
  frequency: 'Occasionally used',
  definition:
    'Incrementally replace a legacy monolith by routing traffic through an API Gateway (or facade) that sends new features and migrated endpoints to modern services while legacy paths still hit the old system until fully retired.',
  problem:
    'Big-bang rewrites fail: years of undocumented behavior, regression risk, and business cannot pause. Teams need to ship value while migrating.',
  realWorld:
    'Retail banks route /accounts/v2 to new core banking microservices while /accounts/v1 still proxies to mainframe COBOL until parity is proven.',
  whyExists:
    'Risk-managed migration: prove new system in production with real traffic slices, rollback via routing rules, and measurable cutover criteria.',
  ascii: `
        Client requests
              │
              ▼
      ┌───────────────┐
      │  API Gateway  │
      │  route rules  │
      └───┬───────┬───┘
          │       │
   /v2/*  │       │  /v1/* (legacy)
          ▼       ▼
    ┌─────────┐ ┌─────────────┐
    │ New μsvc│ │ Legacy mono │
    └─────────┘ └─────────────┘
`,
  flow: 'Place facade/gateway → identify slice to migrate → build new service → dual-write or sync → shadow read compare → flip route % → decommission legacy path.',
  components: [
    {name: 'Routing facade', responsibility: 'Path/version/header-based routing to legacy vs new'},
    {name: 'Migration tracker', responsibility: 'Records which endpoints are migrated and parity status'},
    {name: 'Data synchronizer', responsibility: 'Dual-write or CDC to keep stores consistent during transition'},
    {name: 'Parity checker', responsibility: 'Shadow traffic comparison between legacy and new responses'},
  ],
  javaCode: `package com.vibhu.msp.decompose.strangler;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public final class StranglerRouter {

    public enum Backend { LEGACY, NEW_SERVICE }

    public record RouteDecision(Backend backend, String targetUri, String reason) {}

    private final Map<String, MigrationState> routes = new ConcurrentHashMap<>();

    public StranglerRouter() {
        routes.put("/api/customers", new MigrationState(100, Backend.NEW_SERVICE, "http://customer-svc:8080"));
        routes.put("/api/orders", new MigrationState(30, Backend.NEW_SERVICE, "http://order-svc:8080"));
        routes.put("/api/payments", new MigrationState(0, Backend.LEGACY, "http://legacy-monolith:8080"));
    }

    public RouteDecision route(String path, String canaryUserId) {
        var state = routes.getOrDefault(path, new MigrationState(0, Backend.LEGACY, "http://legacy-monolith:8080"));
        if (state.percentToNew() <= 0) {
            return new RouteDecision(Backend.LEGACY, state.newUri(), "not started");
        }
        if (isInCanaryBucket(canaryUserId, state.percentToNew())) {
            return new RouteDecision(Backend.NEW_SERVICE, state.newUri(), "canary " + state.percentToNew() + "%");
        }
        return new RouteDecision(Backend.LEGACY, "http://legacy-monolith:8080", "majority on legacy");
    }

    public void increaseMigration(String path, int newPercent) {
        routes.computeIfPresent(path, (k, v) -> new MigrationState(
            Math.min(100, newPercent), Backend.NEW_SERVICE, v.newUri()));
    }

    private boolean isInCanaryBucket(String userId, int percent) {
        if (userId == null) return false;
        int bucket = Math.floorMod(userId.hashCode(), 100);
        return bucket < percent;
    }

    public record MigrationState(int percentToNew, Backend defaultBackend, String newUri) {}
}`,
  unitTest: `package com.vibhu.msp.decompose.strangler;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StranglerRouterTest {

    @Test
    void fullyMigratedPathRoutesToNewService() {
        var router = new StranglerRouter();
        var decision = router.route("/api/customers", "user-42");
        assertEquals(StranglerRouter.Backend.NEW_SERVICE, decision.backend());
        assertTrue(decision.targetUri().contains("customer-svc"));
    }

    @Test
    void unmigratedPathStaysOnLegacy() {
        var router = new StranglerRouter();
        var decision = router.route("/api/payments", "user-42");
        assertEquals(StranglerRouter.Backend.LEGACY, decision.backend());
    }

    @Test
    void partialMigrationUsesCanaryBucket() {
        var router = new StranglerRouter();
        int newCount = 0;
        for (int i = 0; i < 1000; i++) {
            var d = router.route("/api/orders", "user-" + i);
            if (d.backend() == StranglerRouter.Backend.NEW_SERVICE) newCount++;
        }
        assertTrue(newCount > 200 && newCount < 400, "expected ~30% canary, got " + newCount);
    }
}`,
  edgeCases: [
    'Dual-write: legacy and new both updated — reconcile conflicts with last-write-wins or version vectors',
    'Dual-read: read from both and compare — latency doubles unless async shadow',
    'Session affinity: sticky sessions may bypass canary routing',
    'Feature parity gaps block increasing migration percent',
  ],
  failureScenarios: [
    'Data divergence between legacy and new after dual-write bug',
    'Routing misconfiguration sends production traffic to unfinished service',
    'Rollback impossible because legacy code path was deleted too early',
  ],
  retry: 'Gateway retries only idempotent GET on new backend; never auto-retry dual-write without compensating action.',
  idempotency: 'Migration writes carry migration_id; both systems dedupe on business key during dual-write window.',
  timeout: 'Shadow compare runs async with separate timeout; user-facing path uses stricter SLA on chosen backend.',
  observability: 'Metrics: migration_percent, parity_mismatch_rate, legacy_vs_new_latency; dashboards per endpoint.',
  security: 'Both backends must enforce same auth; gateway validates JWT once before routing.',
  performance: 'Dual-read adds latency — use sampling (1% shadow) not 100% during steady state.',
  scalability: 'New services scale independently; legacy remains bottleneck until fully strangled.',
  production: 'Define cutover checklist: parity tests green, rollback runbook, data reconciliation job, stakeholder sign-off.',
  mistakes: [
    'Starting strangler without automated parity tests',
    'Migrating write path before read path is validated',
    'No feature flags for emergency rollback',
  ],
  antiPatterns: [
    'Permanent dual-write without reconciliation',
    'Strangler without versioned APIs',
  ],
  alternatives: [
    'Branch by abstraction inside monolith before extraction',
    'Rewrite in parallel (high risk)',
  ],
  tradeoffs:
    'Lower risk than big-bang but operational complexity of running two systems. Dual-write/read windows are fragile and need explicit exit criteria.',
  interviewQs: [
    'How does the strangler fig pattern work?',
    'What are dual-write risks during migration?',
    'How do you decide when to increase traffic to the new system?',
  ],
  trickyQs: [
    'Legacy returns 200 with wrong data — how does shadow read help?',
    'Can you strangler a database or only the application layer?',
  ],
  seniorFollowUps: [
    'Design a reconciliation job for divergent customer records',
    'What metrics prove it is safe to decommission legacy?',
  ],
};

const antiCorruptionLayer: PatternCard = {
  id: 'anti-corruption-layer',
  part: 1,
  name: 'Anti-Corruption Layer',
  frequency: 'Occasionally used',
  definition:
    'A translation boundary that converts a legacy or external system\'s model into the new domain model so upstream services never depend on foreign concepts, field names, or inconsistent semantics.',
  problem:
    'Integrating directly with legacy SOAP/XML or a partner API leaks their model into your domain. Refactoring becomes impossible because every service speaks "legacy customer format."',
  realWorld:
    'New Order service receives LegacyCustomerRecord (flat, string dates, nullable everything) and ACL maps to rich Customer aggregate with Email value object and validated Address.',
  whyExists:
    'Protects domain purity during coexistence with systems you do not control. ACL is the only place that knows legacy quirks.',
  ascii: `
 Legacy system          ACL (translator)           New domain
┌──────────────┐      ┌─────────────────┐      ┌──────────────┐
│ CUST_NBR     │─────►│ LegacyCustomer  │─────►│ Customer     │
│ CUST_NM      │      │ Adapter         │      │ aggregate    │
│ ADDR_LN1...  │      │ + validation    │      │ + invariants │
└──────────────┘      └─────────────────┘      └──────────────┘
`,
  flow: 'Define canonical domain model → implement adapter port → map legacy DTO field-by-field → validate and reject corrupt records → expose only domain types to application layer.',
  components: [
    {name: 'Legacy adapter', responsibility: 'Fetches/parses legacy format (XML, flat file, old REST)'},
    {name: 'Translator', responsibility: 'Maps legacy fields to domain value objects with defaults and rules'},
    {name: 'Domain facade', responsibility: 'Application-facing API using only domain types'},
    {name: 'Error mapper', responsibility: 'Converts legacy error codes to domain exceptions'},
  ],
  javaCode: `package com.vibhu.msp.decompose.acl;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Optional;

public final class LegacyCustomerAcl {

    private static final DateTimeFormatter LEGACY_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    public record LegacyCustomerRecord(
        String custNbr,
        String custNm,
        String emailAddr,
        String addrLn1,
        String addrCity,
        String addrZip,
        String birthDt) {}

    public record Customer(
        CustomerId id,
        String displayName,
        Email email,
        Address address,
        Optional<LocalDate> birthDate) {}

    public record CustomerId(String value) {}
    public record Email(String value) {
        public Email {
            if (value == null || !value.contains("@")) {
                throw new IllegalArgumentException("Invalid email: " + value);
            }
        }
    }
    public record Address(String line1, String city, String postalCode) {}

    public Customer toDomain(LegacyCustomerRecord legacy) {
        if (legacy.custNbr() == null || legacy.custNbr().isBlank()) {
            throw new CorruptLegacyRecordException("Missing custNbr");
        }
        var email = legacy.emailAddr() == null || legacy.emailAddr().isBlank()
            ? new Email("unknown+" + legacy.custNbr() + "@placeholder.local")
            : new Email(legacy.emailAddr().trim().toLowerCase());
        var address = new Address(
            nullToEmpty(legacy.addrLn1()),
            nullToEmpty(legacy.addrCity()),
            normalizeZip(legacy.addrZip()));
        var birth = parseBirthDate(legacy.birthDt());
        return new Customer(
            new CustomerId(legacy.custNbr()),
            nullToEmpty(legacy.custNm()).trim(),
            email,
            address,
            birth);
    }

    public LegacyCustomerRecord fromDomain(Customer customer) {
        return new LegacyCustomerRecord(
            customer.id().value(),
            customer.displayName(),
            customer.email().value(),
            customer.address().line1(),
            customer.address().city(),
            customer.address().postalCode(),
            customer.birthDate().map(d -> d.format(LEGACY_DATE)).orElse(""));
    }

    private Optional<LocalDate> parseBirthDate(String raw) {
        if (raw == null || raw.isBlank()) return Optional.empty();
        try {
            return Optional.of(LocalDate.parse(raw.trim(), LEGACY_DATE));
        } catch (DateTimeParseException e) {
            return Optional.empty();
        }
    }

    private String nullToEmpty(String s) { return s == null ? "" : s; }

    private String normalizeZip(String zip) {
        if (zip == null) return "";
        return zip.replaceAll("[^0-9A-Za-z-]", "").toUpperCase();
    }

    public static class CorruptLegacyRecordException extends RuntimeException {
        public CorruptLegacyRecordException(String message) { super(message); }
    }
}`,
  unitTest: `package com.vibhu.msp.decompose.acl;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class LegacyCustomerAclTest {

    private final LegacyCustomerAcl acl = new LegacyCustomerAcl();

    @Test
    void mapsLegacyRecordToDomain() {
        var legacy = new LegacyCustomerAcl.LegacyCustomerRecord(
            "C001", "Jane Doe", "jane@example.com", "1 Main St", "Boston", "02101", "19900315");
        var customer = acl.toDomain(legacy);
        assertEquals("C001", customer.id().value());
        assertEquals("jane@example.com", customer.email().value());
        assertEquals(LocalDate.of(1990, 3, 15), customer.birthDate().orElseThrow());
    }

    @Test
    void roundTripPreservesId() {
        var legacy = new LegacyCustomerAcl.LegacyCustomerRecord(
            "C002", "Bob", "bob@test.com", "St", "City", "12345", "");
        var back = acl.fromDomain(acl.toDomain(legacy));
        assertEquals("C002", back.custNbr());
    }

    @Test
    void rejectsMissingCustomerNumber() {
        var legacy = new LegacyCustomerAcl.LegacyCustomerRecord(
            "", "X", "a@b.com", "", "", "", "");
        assertThrows(LegacyCustomerAcl.CorruptLegacyRecordException.class, () -> acl.toDomain(legacy));
    }
}`,
  edgeCases: [
    'Legacy sends duplicate customers with different keys — ACL dedupes or flags for manual review',
    'Unknown enum values in legacy — map to UNKNOWN or reject with metric',
    'Bidirectional sync — fromDomain must not lose information only present in legacy',
  ],
  failureScenarios: [
    'ACL becomes god-class with 5000-line switch statements',
    'Silent data loss on unmapped fields',
    'Performance bottleneck if every read hits legacy synchronously',
  ],
  retry: 'Legacy adapter retries transient SOAP/HTTP failures with exponential backoff; corrupt records go to DLQ.',
  idempotency: 'Outbound writes to legacy use legacy transaction IDs; inbound events deduped by custNbr + event sequence.',
  timeout: 'Legacy calls often slow — circuit breaker at ACL boundary with cached fallback for reads where acceptable.',
  observability: 'Log translation failures with legacy payload hash (not PII); metric acl.translation.errors by field.',
  security: 'ACL sanitizes legacy input; never pass raw legacy strings to SQL; validate all inbound data.',
  performance: 'Cache translated domain objects with TTL; batch legacy fetches where API supports it.',
  scalability: 'ACL is stateless — scale horizontally; legacy system remains the limit.',
  production: 'Contract tests against legacy sandbox; version ACL when legacy schema changes; never expose LegacyCustomerRecord outside ACL package.',
  mistakes: [
    'Letting domain entities import legacy JAR types',
    'Skipping validation because "legacy is source of truth"',
    'No round-trip tests',
  ],
  antiPatterns: [
    'Shared DTO library between legacy and new services',
    'ACL logic scattered in controllers',
  ],
  alternatives: [
    'Replace legacy entirely (if feasible)',
    'Event-driven CDC with transform in stream processor',
  ],
  tradeoffs:
    'ACL adds maintenance when legacy changes but saves domain integrity. Cost is an extra layer and mapping bugs.',
  interviewQs: [
    'What problem does an anti-corruption layer solve?',
    'Where does ACL sit in hexagonal architecture?',
    'ACL vs adapter — same thing?',
  ],
  trickyQs: [
    'Legacy adds a mandatory field — who owns the change?',
    'Should ACL call legacy sync or consume CDC events?',
  ],
  seniorFollowUps: [
    'Design ACL for legacy customer with 200 optional XML fields',
    'How do you test ACL without production legacy access?',
  ],
};

const branchByAbstraction: PatternCard = {
  id: 'branch-by-abstraction',
  part: 1,
  name: 'Branch by Abstraction',
  frequency: 'Occasionally used',
  definition:
    'Introduce a stable interface abstraction over existing implementation, then provide a new implementation behind the same interface. A feature flag or configuration selects which branch runs, enabling incremental replacement without changing callers.',
  problem:
    'Teams want to rewrite PaymentProcessor internals but every caller imports the concrete class. Direct replacement risks breaking all checkout flows at once.',
  realWorld:
    'CheckoutService depends on PaymentGateway interface; v1 uses StripeLegacyAdapter, v2 uses StripeModernAdapter toggled by feature flag per merchant or percentage rollout.',
  whyExists:
    'Keeps migration inside the monolith or service boundary before extraction. Callers stay ignorant of which implementation runs.',
  ascii: `
  CheckoutService
        │
        ▼
  ┌─────────────────┐
  │ PaymentGateway  │  ◄── abstraction (interface)
  └────────┬────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
 LegacyImpl   NewImpl
 (flag=off)   (flag=on)
`,
  flow: 'Extract interface from concrete class → wrap legacy as LegacyPaymentGateway → implement NewPaymentGateway → add feature flag router → ramp flag → delete legacy impl.',
  components: [
    {name: 'Abstraction', responsibility: 'Stable interface contract consumed by application layer'},
    {name: 'Legacy implementation', responsibility: 'Existing behavior wrapped to satisfy interface'},
    {name: 'New implementation', responsibility: 'Replacement with improved design or external service'},
    {name: 'Branch router', responsibility: 'Feature flag / config selects implementation at runtime'},
  ],
  javaCode: `package com.vibhu.msp.decompose.branch;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public interface PaymentGateway {
    PaymentResult charge(ChargeRequest request);
}

public record ChargeRequest(String merchantId, String orderId, BigDecimal amount, String currency) {}
public record PaymentResult(String transactionId, PaymentStatus status, String message) {}
public enum PaymentStatus { APPROVED, DECLINED, ERROR }

final class LegacyPaymentGateway implements PaymentGateway {
    @Override
    public PaymentResult charge(ChargeRequest request) {
        return new PaymentResult(
            "LEG-" + UUID.randomUUID(),
            PaymentStatus.APPROVED,
            "charged via legacy mainframe bridge");
    }
}

final class ModernPaymentGateway implements PaymentGateway {
    @Override
    public PaymentResult charge(ChargeRequest request) {
        if (request.amount().compareTo(new BigDecimal("10000")) > 0) {
            return new PaymentResult(null, PaymentStatus.DECLINED, "amount exceeds modern limit");
        }
        return new PaymentResult(
            "MOD-" + UUID.randomUUID(),
            PaymentStatus.APPROVED,
            "charged via PSP REST API");
    }
}

public final class BranchingPaymentGateway implements PaymentGateway {

    private final PaymentGateway legacy;
    private final PaymentGateway modern;
    private final FeatureFlagService flags;

    public BranchingPaymentGateway(PaymentGateway legacy, PaymentGateway modern, FeatureFlagService flags) {
        this.legacy = legacy;
        this.modern = modern;
        this.flags = flags;
    }

    @Override
    public PaymentResult charge(ChargeRequest request) {
        PaymentGateway delegate = flags.isEnabled("payment.modern", request.merchantId())
            ? modern
            : legacy;
        return delegate.charge(request);
    }
}

public final class FeatureFlagService {
    private final Map<String, Boolean> globalFlags = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Boolean>> merchantOverrides = new ConcurrentHashMap<>();

    public void setGlobal(String flag, boolean enabled) {
        globalFlags.put(flag, enabled);
    }

    public void setMerchantOverride(String flag, String merchantId, boolean enabled) {
        merchantOverrides.computeIfAbsent(flag, k -> new ConcurrentHashMap<>()).put(merchantId, enabled);
    }

    public boolean isEnabled(String flag, String merchantId) {
        var merchantMap = merchantOverrides.get(flag);
        if (merchantMap != null && merchantMap.containsKey(merchantId)) {
            return merchantMap.get(merchantId);
        }
        return globalFlags.getOrDefault(flag, false);
    }
}`,
  unitTest: `package com.vibhu.msp.decompose.branch;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class BranchingPaymentGatewayTest {

    private FeatureFlagService flags;
    private BranchingPaymentGateway gateway;

    @BeforeEach
    void setUp() {
        flags = new FeatureFlagService();
        gateway = new BranchingPaymentGateway(
            new LegacyPaymentGateway(),
            new ModernPaymentGateway(),
            flags);
    }

    @Test
    void usesLegacyWhenFlagOff() {
        var result = gateway.charge(new ChargeRequest("m1", "o1", new BigDecimal("50"), "USD"));
        assertEquals(PaymentStatus.APPROVED, result.status());
        assertTrue(result.transactionId().startsWith("LEG-"));
    }

    @Test
    void usesModernWhenFlagOn() {
        flags.setMerchantOverride("payment.modern", "m1", true);
        var result = gateway.charge(new ChargeRequest("m1", "o1", new BigDecimal("50"), "USD"));
        assertTrue(result.transactionId().startsWith("MOD-"));
    }

    @Test
    void modernDeclinesHighAmount() {
        flags.setGlobal("payment.modern", true);
        var result = gateway.charge(new ChargeRequest("m1", "o1", new BigDecimal("20000"), "USD"));
        assertEquals(PaymentStatus.DECLINED, result.status());
    }
}`,
  edgeCases: [
    'Interface too narrow — new impl needs extra methods; evolve interface with default methods',
    'Behavioral differences — legacy approves what modern declines; shadow compare before flip',
    'Stateful legacy singleton — wrap carefully for testability',
  ],
  failureScenarios: [
    'Flag stuck on wrong branch in production',
    'Both implementations called accidentally (missing branch guard)',
    'Interface leak exposes legacy types in signature',
  ],
  retry: 'Retry policy belongs inside each implementation; router is pass-through.',
  idempotency: 'Both implementations must honor same orderId idempotency key.',
  timeout: 'Router does not add latency; set timeouts per implementation.',
  observability: 'Log which branch served each request: payment.impl=legacy|modern; compare success rates.',
  security: 'Both implementations must validate merchant credentials; no security bypass on legacy path.',
  performance: 'Modern path may be faster — monitor p99 per branch during rollout.',
  scalability: 'Eventually extract modern impl to separate service; interface becomes remote client.',
  production: 'Use LaunchDarkly or similar; per-merchant overrides; kill switch to legacy; delete dead code after 30d zero legacy traffic.',
  mistakes: [
    'Abstracting before understanding legacy behavior',
    'Permanent feature flag never removed',
    'Different error semantics between branches',
  ],
  antiPatterns: [
    'if (useNew) everywhere instead of single router',
    'Branch by copy-paste not interface',
  ],
  alternatives: [
    'Strangler fig at gateway level',
    'Parallel run (shadow) without routing user traffic',
  ],
  tradeoffs:
    'Low-risk in-process migration but doubles test matrix. Interface design mistakes are expensive to fix later.',
  interviewQs: [
    'How does branch by abstraction differ from strangler fig?',
    'Where do feature flags live in the architecture?',
    'When is it safe to delete the legacy implementation?',
  ],
  trickyQs: [
    'New implementation needs async API but interface is sync — what do you do?',
    'How do you A/B test payment success rates between branches?',
  ],
  seniorFollowUps: [
    'Design abstraction for OrderRepository backed by DB then event store',
    'How do arch unit tests enforce single entry point for branching?',
  ],
};

const domainDrivenDesign: PatternCard = {
  id: 'domain-driven-design',
  part: 1,
  name: 'Domain-Driven Design (DDD)',
  frequency: 'Frequently used',
  definition:
    'Model software around the business domain: bounded contexts, aggregates, entities, value objects, domain events. Each microservice aligns with one bounded context.',
  problem:
    'Technical layering (controller/service/dao) mirrors nothing in the business — Order and Payment teams speak different languages for the same concepts.',
  realWorld:
    'Payment bounded context: Payment aggregate, Money value object, PaymentCaptured domain event. Order context has its own Order aggregate — integrate via events not shared entities.',
  whyExists:
    'Ubiquitous language reduces bugs; bounded contexts define service boundaries; aggregates enforce consistency within one TX boundary.',
  ascii: `
┌─────────────────┐     ┌─────────────────┐
│ Order Context   │     │ Payment Context │
│ Aggregate: Order│     │ Aggregate: Pay  │
│ Events: Placed  │────►│ Events: Captured│
└─────────────────┘     └─────────────────┘
        │ no shared Order entity in Payment
        └── integration via PaymentCaptured event + ACL if needed
`,
  flow: 'Event storming → identify bounded contexts → define aggregates + invariants → one context = one service → publish domain events at aggregate boundaries.',
  components: [
    {name: 'Bounded context', responsibility: 'Linguistic and model boundary; maps to service'},
    {name: 'Aggregate', responsibility: 'Consistency boundary; one TX per aggregate'},
    {name: 'Domain event', responsibility: 'Past-tense fact crossing context boundary'},
    {name: 'ACL', responsibility: 'Translate foreign model at boundary'},
  ],
  javaCode: `// Payment aggregate — enforces invariants inside one boundary
public final class Payment {
  private PaymentId id;
  private PaymentStatus status;
  private Money amount;

  public PaymentCaptured capture() {
    if (status != PaymentStatus.AUTHORIZED)
      throw new DomainException("Cannot capture in " + status);
    this.status = PaymentStatus.CAPTURED;
    return new PaymentCaptured(id, amount, Instant.now());
  }
}`,
  unitTest: `@Test void capture_whenNotAuthorized_throws() {
  Payment p = Payment.authorized("pay-1", Money.ofCents(100));
  p.markFailed();
  assertThrows(DomainException.class, p::capture);
}`,
  edgeCases: ['Shared kernel between contexts — minimize; prefer ACL', 'Large aggregate — split by invariant scope'],
  failureScenarios: ['Cross-context FK — violation of bounded context'],
  retry: 'N/A at domain layer',
  idempotency: 'Domain commands idempotent by business key',
  timeout: 'N/A',
  observability: 'Log aggregateId + command type',
  security: 'Context owns its authorization rules',
  performance: 'Small aggregates; avoid distributed aggregate',
  scalability: 'One aggregate instance per shard key',
  production: 'ArchUnit tests enforce package boundaries per context',
  mistakes: ['Anemic domain model — logic in services', 'One giant bounded context'],
  antiPatterns: ['Shared entity classes across services'],
  alternatives: ['Transaction script for simple CRUD'],
  tradeoffs: 'Pros: alignment with business, clear boundaries. Cons: learning curve, over-modeling simple CRUD.',
  interviewQs: ['Bounded context vs microservice?', 'Aggregate vs entity?'],
  trickyQs: ['Order needs Payment status — sync call or event?'],
  seniorFollowUps: ['Map e-commerce checkout to bounded contexts'],
};

const servicePerTeam: PatternCard = {
  id: 'service-per-team',
  part: 1,
  name: 'Service per Team',
  frequency: 'Frequently used',
  definition:
    'Conway\'s Law applied: each stream-aligned team owns one or few services end-to-end (build, deploy, operate, on-call).',
  problem:
    'Platform team owns all 40 services — bottleneck on every deploy; domain teams cannot move at their pace.',
  realWorld:
    'Payment team owns payment-service + payment-db + payment Kafka topics; Order team owns order-service; platform team owns gateway + Kafka cluster.',
  whyExists:
    'Autonomous teams need autonomous deployables; cognitive load limit (~2 services per team per Team Topologies).',
  ascii: `
Team Payment ──owns──► payment-service + payment-db + on-call
Team Order   ──owns──► order-service + order-db + on-call
Platform     ──owns──► gateway, Kafka, observability stack
`,
  flow: 'Organize teams by business stream → assign service ownership → team owns SLI/SLO → platform provides paved road.',
  components: [
    {name: 'Stream-aligned team', responsibility: 'Feature delivery for one capability'},
    {name: 'Platform team', responsibility: 'Internal developer platform (IDP)'},
    {name: 'Enabling team', responsibility: 'Consult on hard problems (saga, security)'},
  ],
  javaCode: `// CODEOWNERS — payment team owns payment service
// /payment-service/  @payment-team
// /order-service/    @order-team`,
  unitTest: `// Organizational test: can Payment team deploy Friday without Order team sign-off?`,
  edgeCases: ['Shared library owned by whom?', 'Cross-team API changes — consumer-driven contracts'],
  failureScenarios: ['No owner service — orphaned on-call'],
  retry: 'N/A',
  idempotency: 'N/A',
  timeout: 'Team SLA defines downstream timeout budgets',
  observability: 'Team dashboard per service RED metrics',
  security: 'Team rotates service credentials',
  performance: 'Team scales own service independently',
  scalability: 'Add teams + services for new capabilities',
  production: 'Runbooks per team; blameless postmortems',
  mistakes: ['Team per service (nano-teams)', 'No platform team — every team builds CI/Kafka from scratch'],
  antiPatterns: ['Feature team + component team mismatch'],
  alternatives: ['Internal open source with maintainer rotation'],
  tradeoffs: 'Pros: autonomy, speed. Cons: duplication risk, integration coordination.',
  interviewQs: ['Conway\'s Law example?', 'Team Topologies — stream vs platform?'],
  trickyQs: ['Two teams need same schema change — who leads?'],
  seniorFollowUps: ['Design team topology for 50-engineer fintech'],
};

export const DECOMPOSE_PATTERNS: PatternCard[] = [
  decomposeByBusinessCapability,
  decomposeBySubdomain,
  domainDrivenDesign,
  servicePerTeam,
  stranglerFig,
  antiCorruptionLayer,
  branchByAbstraction,
];

const apiGateway: PatternCard = {
  id: 'api-gateway',
  part: 2,
  name: 'API Gateway',
  frequency: 'Frequently used',
  definition:
    'A single entry point for client traffic that handles cross-cutting concerns — routing, authentication, rate limiting, request/response transformation, correlation ID injection, centralized logging, and uniform error responses — before forwarding to backend microservices.',
  problem:
    'Clients would otherwise need to know every service URL, auth mechanism, and retry policy. Cross-cutting logic duplicated in every service and mobile app.',
  realWorld:
    'Spring Cloud Gateway in front of Customer, Order, and Payment services on Kubernetes. JWT validated once at edge; routes use service discovery; Resilience4j rate limiter protects Payment service.',
  whyExists:
    'Separation of edge concerns from domain services. Enables independent evolution of public API vs internal service mesh.',
  ascii: `
  Mobile / Web / Partner
           │
           ▼
  ┌────────────────────────────┐
  │     Spring Cloud Gateway    │
  │  JWT · rate limit · route   │
  │  correlation-id · logging   │
  └─────────┬──────────┬────────┘
            │          │
     /customers    /orders
            ▼          ▼
      customer-svc  order-svc
`,
  flow: 'Client → TLS termination → JWT validation filter → rate limit → add correlation ID → route by path → forward to downstream → map errors to ProblemDetail → log with trace context.',
  components: [
    {name: 'Route locator', responsibility: 'Maps paths/host/headers to downstream URIs via discovery'},
    {name: 'Auth filter', responsibility: 'Validates JWT/OAuth2; attaches principal to exchange'},
    {name: 'Rate limiter', responsibility: 'Token bucket per client/IP/API key'},
    {name: 'Global filters', responsibility: 'Correlation ID, request logging, error envelope'},
  ],
  javaCode: `package com.vibhu.msp.gateway;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
public class CorrelationIdFilter implements GlobalFilter, Ordered {

    public static final String CORRELATION_HEADER = "X-Correlation-Id";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String correlationId = exchange.getRequest().getHeaders().getFirst(CORRELATION_HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        final String cid = correlationId;
        ServerWebExchange mutated = exchange.mutate()
            .request(builder -> builder.header(CORRELATION_HEADER, cid))
            .response(builder -> builder.header(CORRELATION_HEADER, cid))
            .build();
        mutated.getAttributes().put(CORRELATION_HEADER, cid);
        return chain.filter(mutated);
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}

@Component
class GatewayErrorMapper implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return chain.filter(exchange)
            .onErrorResume(ex -> {
                exchange.getResponse().setStatusCode(HttpStatus.BAD_GATEWAY);
                exchange.getResponse().getHeaders().add("Content-Type", "application/problem+json");
                String body = "{\\"title\\":\\"Gateway Error\\",\\"detail\\":\\"" +
                    ex.getMessage().replace("\"", "'") + "\\"}";
                var buffer = exchange.getResponse().bufferFactory().wrap(body.getBytes());
                return exchange.getResponse().writeWith(Mono.just(buffer));
            });
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}`,
  springCode: `package com.vibhu.msp.gateway;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

@Configuration
public class GatewayConfig {

    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> Mono.justOrEmpty(exchange.getRequest().getRemoteAddress())
            .map(addr -> addr.getAddress().getHostAddress())
            .defaultIfEmpty("unknown");
    }
}`,
  config: `spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      default-filters:
        - AddResponseHeader=X-Gateway, vibhu-msp
        - name: RequestRateLimiter
          args:
            redis-rate-limiter.replenishRate: 100
            redis-rate-limiter.burstCapacity: 200
            key-resolver: "#{@ipKeyResolver}"
      routes:
        - id: customer-service
          uri: lb://customer-service
          predicates:
            - Path=/api/customers/**
          filters:
            - StripPrefix=1
            - name: CircuitBreaker
              args:
                name: customerCb
                fallbackUri: forward:/fallback/customer
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - StripPrefix=1
        - id: payment-service
          uri: lb://payment-service
          predicates:
            - Path=/api/payments/**
          filters:
            - StripPrefix=1
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 20
                redis-rate-limiter.burstCapacity: 40
                key-resolver: "#{@ipKeyResolver}"
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
logging:
  pattern:
    level: "%5p [\${spring.application.name:},%X{traceId:-},%X{spanId:-}]"`,
  unitTest: `package com.vibhu.msp.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.test.StepVerifier;

class CorrelationIdFilterTest {

  private final CorrelationIdFilter filter = new CorrelationIdFilter();

  @Test
  void generatesCorrelationIdWhenMissing() {
    MockServerHttpRequest request = MockServerHttpRequest.get("/api/orders").build();
    ServerWebExchange exchange = MockServerWebExchange.from(request);
    StepVerifier.create(filter.filter(exchange, ex -> {
      String cid = ex.getRequest().getHeaders().getFirst(CorrelationIdFilter.CORRELATION_HEADER);
      assert cid != null && !cid.isBlank();
      return reactor.core.publisher.Mono.empty();
    })).verifyComplete();
  }

  @Test
  void preservesExistingCorrelationId() {
    MockServerHttpRequest request = MockServerHttpRequest.get("/api/orders")
        .header(CorrelationIdFilter.CORRELATION_HEADER, "existing-123")
        .build();
    ServerWebExchange exchange = MockServerWebExchange.from(request);
    StepVerifier.create(filter.filter(exchange, ex -> {
      String cid = ex.getRequest().getHeaders().getFirst(CorrelationIdFilter.CORRELATION_HEADER);
      assert "existing-123".equals(cid);
      return reactor.core.publisher.Mono.empty();
    })).verifyComplete();
  }
}`,
  edgeCases: [
    'WebSocket upgrade through gateway — separate route and longer timeouts',
    'Large file upload — disable request buffering or increase limits',
    'Gateway becomes single point of failure — run multiple replicas behind LB',
  ],
  failureScenarios: [
    'Downstream timeout surfaces as 504 — clients need retry guidance',
    'Rate limit false positives block legitimate traffic spikes',
    'JWT clock skew causes mass 401',
  ],
  retry: 'Gateway generally does not retry non-idempotent POST; idempotent GET may retry once on connection reset.',
  idempotency: 'Forward Idempotency-Key header to downstream; gateway itself is stateless.',
  timeout: 'Configure per-route response-timeout (e.g., 5s reads, 30s payments); global default 10s.',
  observability: 'OpenTelemetry trace from gateway span; access logs with correlation ID, route id, upstream status, duration.',
  security: 'TLS termination, JWT validation, IP allowlists for partner routes, WAF integration, strip internal headers.',
  performance: 'Reactive Netty stack handles high concurrency; avoid blocking filters; cache JWKS keys.',
  scalability: 'Horizontal scale gateway pods; Redis for distributed rate limiting.',
  production: 'Blue/green gateway deploys; circuit breakers per route; fallback responses; SLO on gateway p99 < 50ms overhead.',
  mistakes: [
    'Business logic in gateway filters',
    'No timeout on downstream calls',
    'Logging full JWT or PII in access logs',
  ],
  antiPatterns: [
    'God gateway orchestrating sagas',
    'Shared session state in gateway memory',
  ],
  alternatives: [
    'Service mesh (Istio) for east-west; gateway for north-south',
    'Multiple gateways per client type (see BFF)',
  ],
  tradeoffs:
    'Centralizes cross-cutting concerns but adds hop latency and becomes critical infrastructure. Keep gateway thin.',
  interviewQs: [
    'What belongs in API Gateway vs microservice?',
    'How does Spring Cloud Gateway differ from Zuul?',
    'How do you implement rate limiting at the gateway?',
  ],
  trickyQs: [
    'Gateway vs load balancer — when do you need both?',
    'Should gateway call multiple services (aggregation)?',
  ],
  seniorFollowUps: [
    'Design zero-downtime gateway route migration',
    'How do you debug 502 across gateway and 5 downstream services?',
  ],
  deepLabHref: '/api-gateway',
};

const backendForFrontend: PatternCard = {
  id: 'backend-for-frontend',
  part: 2,
  name: 'Backend for Frontend (BFF)',
  frequency: 'Frequently used',
  definition:
    'A dedicated backend tailored to a specific client experience (Web SPA vs Mobile app) that aggregates, shapes, and optimizes API responses for that UI — keeping generic domain services free of presentation concerns.',
  problem:
    'One-size-fits-all API forces mobile to over-fetch desktop fields or makes web wait for mobile-specific batching. Frontend teams cannot ship without coordinating every microservice.',
  realWorld:
    'Web BFF returns rich checkout page DTO with nested product images; Mobile BFF returns minimal JSON and image CDN URLs sized for device. Both call same Order and Catalog services internally.',
  whyExists:
    'Different clients have different network, screen, and interaction constraints. BFF is the translation layer owned by the frontend team or a platform squad per channel.',
  ascii: `
   Web SPA ──────► Web BFF ──────┐
                                  ├──► Order svc
   iOS/Android ──► Mobile BFF ───┤──► Catalog svc
                                  └──► Customer svc
`,
  flow: 'UI needs screen data → BFF orchestrates parallel service calls → maps to view model → caches hot fragments → returns channel-optimized JSON → UI renders without N+1 client calls.',
  components: [
    {name: 'Web BFF', responsibility: 'Aggregates for browser: larger payloads, SSR-friendly, cookie session'},
    {name: 'Mobile BFF', responsibility: 'Lean payloads, pagination, offline-friendly field selection'},
    {name: 'View model mapper', responsibility: 'Transforms domain DTOs to UI-specific shapes'},
    {name: 'Channel auth adapter', responsibility: 'Web uses cookies; mobile uses bearer tokens'},
  ],
  javaCode: `package com.vibhu.msp.gateway.bff;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

public final class WebCheckoutBff {

    private final OrderClient orderClient;
    private final CatalogClient catalogClient;
    private final Executor executor;

    public WebCheckoutBff(OrderClient orderClient, CatalogClient catalogClient, Executor executor) {
        this.orderClient = orderClient;
        this.catalogClient = catalogClient;
        this.executor = executor;
    }

    public CheckoutPageView loadCheckoutPage(String orderId) {
        var orderFuture = CompletableFuture.supplyAsync(() -> orderClient.getOrder(orderId), executor);
        var order = orderFuture.join();
        var productsFuture = CompletableFuture.supplyAsync(
            () -> catalogClient.getProductsWithImages(order.lineSkus()), executor);
        var products = productsFuture.join();
        return new CheckoutPageView(
            order.orderId(),
            order.customerName(),
            products,
            order.total(),
            true,
            List.of("express", "standard"));
    }

    public record CheckoutPageView(
        String orderId,
        String customerName,
        List<ProductCard> products,
        java.math.BigDecimal total,
        boolean showPromoBanner,
        List<String> shippingOptions) {}

    public record ProductCard(String sku, String title, String imageUrlHd, int qty) {}
}

final class MobileCheckoutBff {

    private final OrderClient orderClient;
    private final CatalogClient catalogClient;

    MobileCheckoutBff(OrderClient orderClient, CatalogClient catalogClient) {
        this.orderClient = orderClient;
        this.catalogClient = catalogClient;
    }

    public MobileCheckoutView loadCheckout(String orderId) {
        var order = orderClient.getOrderSummary(orderId);
        var thumbs = catalogClient.getThumbnailUrls(order.lineSkus());
        return new MobileCheckoutView(order.orderId(), order.total(), thumbs);
    }

    public record MobileCheckoutView(String orderId, java.math.BigDecimal total, List<String> thumbUrls) {}
}

interface OrderClient {
    OrderDetail getOrder(String orderId);
    OrderSummary getOrderSummary(String orderId);
    record OrderDetail(String orderId, String customerName, List<String> lineSkus, java.math.BigDecimal total) {}
    record OrderSummary(String orderId, java.math.BigDecimal total, List<String> lineSkus) {}
}

interface CatalogClient {
    List<WebCheckoutBff.ProductCard> getProductsWithImages(List<String> skus);
    List<String> getThumbnailUrls(List<String> skus);
}`,
  unitTest: `package com.vibhu.msp.gateway.bff;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.*;

class WebCheckoutBffTest {

    @Test
    void webBffReturnsRichCheckoutPage() {
        var orderClient = new OrderClient() {
            @Override
            public OrderDetail getOrder(String orderId) {
                return new OrderDetail(orderId, "Alice", List.of("SKU-1"), new BigDecimal("99.00"));
            }
            @Override
            public OrderSummary getOrderSummary(String orderId) {
                return new OrderSummary(orderId, new BigDecimal("99.00"), List.of("SKU-1"));
            }
        };
        var catalogClient = new CatalogClient() {
            @Override
            public List<WebCheckoutBff.ProductCard> getProductsWithImages(List<String> skus) {
                return List.of(new WebCheckoutBff.ProductCard("SKU-1", "Widget", "https://cdn/hd.jpg", 1));
            }
            @Override
            public List<String> getThumbnailUrls(List<String> skus) {
                return List.of("https://cdn/thumb.jpg");
            }
        };
        var bff = new WebCheckoutBff(orderClient, catalogClient, Executors.newVirtualThreadPerTaskExecutor());
        var page = bff.loadCheckoutPage("ord-1");
        assertEquals("Alice", page.customerName());
        assertTrue(page.showPromoBanner());
        assertEquals(2, page.shippingOptions().size());
    }

    @Test
    void mobileBffReturnsLeanPayload() {
        var orderClient = new OrderClient() {
            @Override
            public OrderDetail getOrder(String orderId) {
                throw new UnsupportedOperationException();
            }
            @Override
            public OrderSummary getOrderSummary(String orderId) {
                return new OrderSummary(orderId, BigDecimal.TEN, List.of("SKU-1"));
            }
        };
        var catalogClient = new CatalogClient() {
            @Override
            public List<WebCheckoutBff.ProductCard> getProductsWithImages(List<String> skus) {
                throw new UnsupportedOperationException();
            }
            @Override
            public List<String> getThumbnailUrls(List<String> skus) {
                return List.of("https://cdn/t.jpg");
            }
        };
        var bff = new MobileCheckoutBff(orderClient, catalogClient);
        var view = bff.loadCheckout("ord-1");
        assertEquals(1, view.thumbUrls().size());
    }
}`,
  edgeCases: [
    'BFF duplication — share internal client library but not view models',
    'BFF becomes orchestration god — extract shared aggregation to domain service',
    'GraphQL as alternative single BFF with client-driven selection',
  ],
  failureScenarios: [
    'Web BFF outage blocks web but mobile unaffected — acceptable blast radius',
    'BFF caches stale product prices — TTL and cache invalidation required',
  ],
  retry: 'BFF retries downstream idempotent reads with short backoff; surfaces degraded UI partial state.',
  idempotency: 'BFF passes through idempotency keys on writes; does not generate duplicate side effects.',
  timeout: 'BFF overall timeout < sum of parts; parallel calls with 2s per dependency.',
  observability: 'Trace per BFF endpoint; metric bff.downstream.failures by client channel.',
  security: 'BFF is trust boundary for its channel; validate session; never expose internal service tokens to browser.',
  performance: 'Parallel fetching; HTTP/2 to downstream; compress mobile responses.',
  scalability: 'Scale Web and Mobile BFF independently based on traffic mix.',
  production: 'Separate deployables web-bff and mobile-bff; contract tests against downstream OpenAPI; feature flags per channel.',
  mistakes: [
    'One BFF for all clients defeating the purpose',
    'BFF owns business rules that belong in domain',
    'Leaking BFF view models to other services',
  ],
  antiPatterns: [
    'BFF calling BFF',
    'Shared monolithic BFF with 200 endpoints',
  ],
  alternatives: [
    'GraphQL federation',
    'Client-side aggregation (only for few calls)',
  ],
  tradeoffs:
    'Optimizes UX per channel at cost of duplicated orchestration logic. Mitigate with shared clients and careful boundary discipline.',
  interviewQs: [
    'Why not one API for web and mobile?',
    'BFF vs API Gateway — what is the difference?',
    'Who owns the BFF team — frontend or backend?',
  ],
  trickyQs: [
    'Should BFF talk to database directly for performance?',
    'When does BFF become a distributed monolith?',
  ],
  seniorFollowUps: [
    'Design BFF caching strategy for product catalog',
    'How do you version mobile BFF without forcing app store release?',
  ],
};

const gatewayAggregation: PatternCard = {
  id: 'gateway-aggregation',
  part: 2,
  name: 'Gateway Aggregation',
  frequency: 'Occasionally used',
  definition:
    'The API Gateway (or BFF) fans out parallel requests to multiple backend services (Customer, Order, Payment), combines results into a single response, and handles partial failure with timeouts and fallbacks.',
  problem:
    'Mobile app needs account dashboard: customer profile + recent orders + payment methods. Three round trips on high-latency mobile network ruin UX.',
  realWorld:
    'GET /api/account/summary triggers parallel CompletableFuture calls to customer-svc, order-svc, payment-svc; 800ms timeout; payment failure returns cached last-four digits fallback.',
  whyExists:
    'Reduces client chattiness and latency via server-side parallelism. Trade latency variance for single request convenience.',
  ascii: `
  GET /account/summary
         │
         ▼
   ┌─────────────┐
   │  Aggregator │
   └──┬─────┬────┘
      │     │     │
      ▼     ▼     ▼
  Customer Order Payment
   (2s)   (2s)   (2s)
      │     │     │
      └─────┴─────┘
            ▼
      Combined JSON
`,
  flow: 'Receive aggregate request → launch parallel async calls with per-service timeout → apply fallback on failure → merge successful parts → return 200 with partial flag or 503 if critical path fails.',
  components: [
    {name: 'Aggregator service', responsibility: 'Orchestrates parallel downstream calls'},
    {name: 'Timeout policy', responsibility: 'Per-dependency deadline (e.g., 2s)'},
    {name: 'Fallback provider', responsibility: 'Stale cache or default values on non-critical failure'},
    {name: 'Response composer', responsibility: 'Merges partial results with metadata.degraded=true'},
  ],
  javaCode: `package com.vibhu.msp.gateway.aggregation;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

public final class AccountSummaryAggregator {

    private static final Duration TIMEOUT = Duration.ofSeconds(2);

    private final CustomerServiceClient customerClient;
    private final OrderServiceClient orderClient;
    private final PaymentServiceClient paymentClient;
    private final PaymentFallbackProvider paymentFallback;
    private final Executor executor;

    public AccountSummaryAggregator(
        CustomerServiceClient customerClient,
        OrderServiceClient orderClient,
        PaymentServiceClient paymentClient,
        PaymentFallbackProvider paymentFallback,
        Executor executor) {
        this.customerClient = customerClient;
        this.orderClient = orderClient;
        this.paymentClient = paymentClient;
        this.paymentFallback = paymentFallback;
        this.executor = executor;
    }

    public AccountSummary aggregate(String customerId) {
        CompletableFuture<CustomerProfile> customerFuture = CompletableFuture
            .supplyAsync(() -> customerClient.getProfile(customerId), executor)
            .orTimeout(TIMEOUT.toMillis(), TimeUnit.MILLISECONDS);

        CompletableFuture<List<OrderSummary>> ordersFuture = CompletableFuture
            .supplyAsync(() -> orderClient.getRecentOrders(customerId, 5), executor)
            .orTimeout(TIMEOUT.toMillis(), TimeUnit.MILLISECONDS);

        CompletableFuture<PaymentMethods> paymentFuture = CompletableFuture
            .supplyAsync(() -> paymentClient.getPaymentMethods(customerId), executor)
            .orTimeout(TIMEOUT.toMillis(), TimeUnit.MILLISECONDS)
            .exceptionally(ex -> paymentFallback.fallback(customerId, ex));

        CompletableFuture.allOf(customerFuture, ordersFuture, paymentFuture).join();

        CustomerProfile customer = joinOrThrow(customerFuture, "customer");
        List<OrderSummary> orders = joinOrDefault(ordersFuture, List.of());
        PaymentMethods payments = joinOrDefault(paymentFuture, paymentFallback.fallback(customerId, null));

        boolean degraded = !ordersFuture.isDone() || ordersFuture.isCompletedExceptionally()
            || paymentFuture.isCompletedExceptionally();

        return new AccountSummary(customer, orders, payments, degraded);
    }

    private <T> T joinOrThrow(CompletableFuture<T> future, String critical) {
        try {
            return future.join();
        } catch (Exception e) {
            throw new AggregationException("Critical dependency failed: " + critical, e);
        }
    }

    private <T> T joinOrDefault(CompletableFuture<T> future, T defaultValue) {
        try {
            return future.join();
        } catch (Exception e) {
            return defaultValue;
        }
    }

    public record CustomerProfile(String id, String name, String email) {}
    public record OrderSummary(String orderId, String status, java.math.BigDecimal total) {}
    public record PaymentMethods(List<String> lastFourDigits) {}
    public record AccountSummary(
        CustomerProfile customer,
        List<OrderSummary> orders,
        PaymentMethods payments,
        boolean degraded) {}

    public static class AggregationException extends RuntimeException {
        public AggregationException(String message, Throwable cause) { super(message, cause); }
    }
}

interface CustomerServiceClient {
    AccountSummaryAggregator.CustomerProfile getProfile(String customerId);
}

interface OrderServiceClient {
    List<AccountSummaryAggregator.OrderSummary> getRecentOrders(String customerId, int limit);
}

interface PaymentServiceClient {
    AccountSummaryAggregator.PaymentMethods getPaymentMethods(String customerId);
}

final class PaymentFallbackProvider {
    AccountSummaryAggregator.PaymentMethods fallback(String customerId, Throwable cause) {
        return new AccountSummaryAggregator.PaymentMethods(List.of("****"));
    }
}`,
  unitTest: `package com.vibhu.msp.gateway.aggregation;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.*;

class AccountSummaryAggregatorTest {

    @Test
    void aggregatesAllServicesInParallel() {
        var aggregator = new AccountSummaryAggregator(
            id -> new AccountSummaryAggregator.CustomerProfile(id, "Jane", "j@x.com"),
            (id, limit) -> List.of(new AccountSummaryAggregator.OrderSummary("o1", "SHIPPED", new BigDecimal("10"))),
            id -> new AccountSummaryAggregator.PaymentMethods(List.of("4242")),
            new PaymentFallbackProvider(),
            Executors.newVirtualThreadPerTaskExecutor());

        var summary = aggregator.aggregate("c1");
        assertEquals("Jane", summary.customer().name());
        assertEquals(1, summary.orders().size());
        assertFalse(summary.degraded());
    }

    @Test
    void usesPaymentFallbackOnFailure() {
        var aggregator = new AccountSummaryAggregator(
            id -> new AccountSummaryAggregator.CustomerProfile(id, "Jane", "j@x.com"),
            (id, limit) -> List.of(),
            id -> { throw new RuntimeException("payment down"); },
            new PaymentFallbackProvider(),
            Executors.newVirtualThreadPerTaskExecutor());

        var summary = aggregator.aggregate("c1");
        assertEquals("****", summary.payments().lastFourDigits().get(0));
    }

    @Test
    void failsWhenCustomerUnavailable() {
        var aggregator = new AccountSummaryAggregator(
            id -> { throw new RuntimeException("customer down"); },
            (id, limit) -> List.of(),
            id -> new AccountSummaryAggregator.PaymentMethods(List.of()),
            new PaymentFallbackProvider(),
            Executors.newVirtualThreadPerTaskExecutor());

        assertThrows(AccountSummaryAggregator.AggregationException.class, () -> aggregator.aggregate("c1"));
    }
}`,
  edgeCases: [
    'One slow dependency blocks until timeout — set aggressive deadlines',
    'Partial success semantics — document which fields are optional',
    'Cascading failure if aggregator thread pool exhausted — bulkhead',
  ],
  failureScenarios: [
    'Thundering herd on downstream when aggregator scales',
    'Inconsistent snapshot — order shipped between parallel reads',
    'Fallback serves stale payment method after fraud block',
  ],
  retry: 'Aggregator retries idempotent reads once per dependency inside client; not at merge level.',
  idempotency: 'Read aggregation is naturally idempotent; write aggregation (rare) needs distributed transaction or saga.',
  timeout: 'Overall client timeout 3s; per-dependency 2s; CompletableFuture.orTimeout in Java 21.',
  observability: 'Span per downstream call; metric aggregation.partial_response count; log degraded responses.',
  security: 'Aggregator forwards auth context to each downstream; least-privilege token per service.',
  performance: 'Parallelism cuts latency from sum to max; CPU-bound merge is cheap vs network.',
  scalability: 'Stateless aggregator scales horizontally; downstream capacity is bottleneck.',
  production: 'Classify critical vs optional dependencies; circuit breakers; cache fallbacks with TTL; load test fan-out factor.',
  mistakes: [
    'Sequential calls disguised as aggregation',
    'No timeout — one hung service blocks forever',
    'Returning 500 when optional payment methods fail',
  ],
  antiPatterns: [
    'Aggregator writes to multiple services without saga',
    '20-way fan-out per request',
  ],
  alternatives: [
    'GraphQL with DataLoader',
    'Client-side parallel fetch',
    'Materialized read model (CQRS)',
  ],
  tradeoffs:
    'Better client UX vs tighter coupling at gateway and hardest failure modes. Prefer CQRS read models when aggregation is hot path.',
  interviewQs: [
    'How do you handle partial failure in gateway aggregation?',
    'Aggregation in gateway vs BFF vs dedicated service?',
    'What timeout strategy for parallel calls?',
  ],
  trickyQs: [
    'Customer and Order data inconsistent in combined response — acceptable?',
    'How does aggregation interact with circuit breakers?',
  ],
  seniorFollowUps: [
    'Design aggregation with bulkhead thread pools per dependency',
    'When would you replace aggregation with a CQRS projection?',
  ],
};

const gatewayRouting: PatternCard = {
  id: 'gateway-routing',
  part: 2,
  name: 'Gateway Routing',
  frequency: 'Frequently used',
  definition: 'Route requests to downstream services by path, host, header, or weight — central routing table at the edge.',
  problem: 'Clients hard-code service URLs; routing changes require app store releases.',
  realWorld: 'Spring Cloud Gateway: /api/orders/** → lb://order-service, /api/payments/** → lb://payment-service.',
  whyExists: 'Single routing configuration; enables blue-green/canary via weight predicates.',
  ascii: `Gateway routes:
  /api/orders/**    → order-service
  /api/payments/**  → payment-service
  /api/customers/** → customer-service`,
  flow: 'Request arrives → predicate match (path/host) → filter chain → forward to URI from service discovery.',
  components: [
    {name: 'RouteDefinition', responsibility: 'id, uri, predicates, filters'},
    {name: 'Discovery locator', responsibility: 'lb://service-name from Eureka/K8s DNS'},
  ],
  javaCode: `@Bean
RouteLocator routes(RouteLocatorBuilder builder) {
  return builder.routes()
      .route("orders", r -> r.path("/api/orders/**").uri("lb://order-service"))
      .route("payments", r -> r.path("/api/payments/**").uri("lb://payment-service"))
      .build();
}`,
  config: `spring.cloud.gateway.routes[0].id=orders
spring.cloud.gateway.routes[0].uri=lb://order-service
spring.cloud.gateway.routes[0].predicates[0]=Path=/api/orders/**`,
  unitTest: `@Test void orderPath_routesToOrderService() {
  assertRoute("/api/orders/123", "lb://order-service");
}`,
  edgeCases: ['Path overlap — most specific wins', 'WebSocket upgrade routing'],
  failureScenarios: ['Unknown route → 404', 'Discovery empty → 503'],
  retry: 'Gateway retry only for idempotent GET',
  idempotency: 'N/A at routing layer',
  timeout: 'Global response-timeout on routes',
  observability: 'Log routeId + downstream status',
  security: 'Route-level auth filters',
  performance: 'Reactive Netty — non-blocking forward',
  scalability: 'Gateway pods scale independently',
  production: 'Route config in Git; canary via WeightRoutePredicateFactory',
  mistakes: ['Routing logic in client apps'],
  antiPatterns: ['God gateway with business rules'],
  alternatives: ['Service mesh routing'],
  tradeoffs: 'Pros: centralized routing. Cons: gateway config becomes critical path.',
  interviewQs: ['Canary routing at gateway?', 'Gateway vs mesh routing?'],
  trickyQs: ['Route change without downtime?'],
  seniorFollowUps: ['Design weighted canary routes'],
  deepLabHref: '/api-gateway',
};

const gatewayOffloading: PatternCard = {
  id: 'gateway-offloading',
  part: 2,
  name: 'Gateway Offloading',
  frequency: 'Frequently used',
  definition: 'Move cross-cutting concerns from microservices to gateway: SSL termination, auth, rate limiting, CORS, logging, compression.',
  problem: 'Every service implements JWT validation, rate limits, and TLS — duplicated code and inconsistent policy.',
  realWorld: 'ACM cert on ALB; JWT validated once at Spring Cloud Gateway; services trust internal network or mTLS.',
  whyExists: 'DRY for edge concerns; domain services stay focused on business logic.',
  ascii: `Client ──TLS──► Gateway (auth, RL, CORS, gzip)
                      │
                      └── plain HTTP/mTLS ──► internal services`,
  flow: 'Terminate TLS → validate JWT → rate limit → add headers → forward to service (auth already done).',
  components: [
    {name: 'SSL termination', responsibility: 'Public cert at edge'},
    {name: 'Auth filter', responsibility: 'OAuth2 Resource Server JWT'},
    {name: 'Rate limiter filter', responsibility: 'Redis token bucket'},
  ],
  javaCode: `@Bean
SecurityWebFilterChain springSecurity(ServerHttpSecurity http) {
  return http.oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
      .authorizeExchange(ex -> ex.pathMatchers("/actuator/health").permitAll().anyExchange().authenticated())
      .build();
}`,
  config: `spring.cloud.gateway.default-filters[0]=TokenRelay
spring.cloud.gateway.httpclient.compression=true`,
  unitTest: `@Test void unauthenticatedRequest_401() {
  webTestClient.get().uri("/api/orders").exchange().expectStatus().isUnauthorized();
}`,
  edgeCases: ['Internal service-to-service — skip JWT, use mTLS'],
  failureScenarios: ['JWT issuer down — cache JWKS'],
  retry: 'N/A',
  idempotency: 'N/A',
  timeout: 'Auth validation timeout 2s',
  observability: 'Access log at gateway only',
  security: 'Offload auth; never log tokens',
  performance: 'Compression at edge reduces bandwidth',
  scalability: 'Edge scales horizontally',
  production: 'WAF + Shield in front of gateway on AWS',
  mistakes: ['Business validation in gateway', 'Trusting X-User-Id header without auth'],
  antiPatterns: ['Gateway calls DB for business rules'],
  alternatives: ['Service mesh policy'],
  tradeoffs: 'Pros: consistent edge policy. Cons: gateway blast radius; keep thin.',
  interviewQs: ['What to offload vs keep in service?', 'Token relay to downstream?'],
  trickyQs: ['Gateway compromised — impact?'],
  seniorFollowUps: ['Zero-trust: mTLS behind gateway too?'],
  deepLabHref: '/api-gateway',
};

const apiComposition: PatternCard = {
  id: 'api-composition',
  part: 2,
  name: 'API Composition',
  frequency: 'Occasionally used',
  definition: 'Compose data from multiple services into one API response — orchestrator fetches Order + Customer + Payment in parallel.',
  problem: 'Dashboard needs order header, customer name, and payment status — three separate REST calls from UI.',
  realWorld: 'Order detail page API: GET /api/order-details/{id} returns merged JSON from order, customer, payment services.',
  whyExists: 'Reduce client chattiness; server-side parallel fetch with timeout per dependency.',
  ascii: `GET /order-details/ord-1
        │
        ├──► Order Service
        ├──► Customer Service  ──► merge response
        └──► Payment Service`,
  flow: 'Receive request → parallel WebClient calls with individual timeouts → merge partial results → return 200 or 207 partial.',
  components: [
    {name: 'Composer service', responsibility: 'Orchestrates parallel fetches'},
    {name: 'WebClient pool', responsibility: 'Bulkhead per downstream'},
  ],
  javaCode: `@GetMapping("/api/order-details/{orderId}")
public Mono<OrderDetailView> compose(@PathVariable String orderId) {
  Mono<OrderDto> order = orderClient.get(orderId).timeout(Duration.ofSeconds(2));
  Mono<CustomerDto> customer = order.flatMap(o -> customerClient.get(o.customerId())).timeout(Duration.ofSeconds(2));
  Mono<PaymentDto> payment = paymentClient.getByOrder(orderId).timeout(Duration.ofSeconds(2));
  return Mono.zip(order, customer, payment).map(t -> OrderDetailView.merge(t.getT1(), t.getT2(), t.getT3()));
}`,
  unitTest: `@Test void paymentDown_returnsPartialWithFlag() {
  when(paymentClient.getByOrder(any())).thenReturn(Mono.error(new TimeoutException()));
  var view = composer.compose("ord-1").block();
  assertTrue(view.paymentUnavailable());
}`,
  edgeCases: ['One downstream slow — overall deadline', 'Stale customer name acceptable?'],
  failureScenarios: ['Payment down — return order+customer with paymentStatus=UNKNOWN'],
  retry: 'Retry individual fetch if idempotent GET',
  idempotency: 'Read-only composition — safe to retry',
  timeout: '2s per downstream; 5s overall',
  observability: 'Span per downstream; metric compose.partial',
  security: 'Propagate JWT to each downstream',
  performance: 'Parallel not serial — latency = max not sum',
  scalability: 'Composer scales; watch downstream fan-out',
  production: 'Prefer CQRS read model over live composition at scale',
  mistakes: ['Serial 3-call chain inside composer', 'No partial failure handling'],
  antiPatterns: ['Composition in gateway for complex domain logic'],
  alternatives: ['BFF', 'CQRS materialized view', 'GraphQL'],
  tradeoffs: 'Pros: one round-trip for client. Cons: coupling, latency = slowest dep.',
  interviewQs: ['Composition vs BFF vs CQRS?', 'Partial failure UX?'],
  trickyQs: ['Composer becomes god service — when stop?'],
  seniorFollowUps: ['Migrate composition to CQRS projection'],
};

const gatewayRateLimiting: PatternCard = {
  id: 'gateway-rate-limiting',
  part: 2,
  name: 'Gateway Rate Limiting',
  frequency: 'Frequently used',
  definition: 'Limit requests per client/API key/IP at gateway using token bucket or sliding window — protect backends from abuse.',
  problem: 'Partner API integration sends 10k req/s — Payment service collapses; all customers affected.',
  realWorld: 'Spring Cloud Gateway RequestRateLimiter filter with Redis; 100 req/s per API key.',
  whyExists: 'Edge enforcement before traffic hits expensive domain services.',
  ascii: `Client ──► Gateway [Token Bucket: 100/s]
                  │
                  ├── tokens available → forward
                  └── exhausted → 429 Too Many Requests`,
  flow: 'Extract key (API key / JWT sub / IP) → Redis INCR sliding window → allow or 429 with Retry-After.',
  components: [
    {name: 'KeyResolver', responsibility: 'Identify rate limit bucket'},
    {name: 'Redis rate limiter', responsibility: 'Distributed token state'},
  ],
  javaCode: `@Bean
KeyResolver apiKeyResolver() {
  return exchange -> Mono.just(
      exchange.getRequest().getHeaders().getFirst("X-Api-Key") != null
          ? exchange.getRequest().getHeaders().getFirst("X-Api-Key")
          : exchange.getRequest().getRemoteAddress().getAddress().getHostAddress());
}`,
  config: `spring.cloud.gateway.routes[0].filters[0]=RequestRateLimiter=100,1s,#{@apiKeyResolver}`,
  redisCode: `Redis sliding window: ZADD rate:{key} {timestamp} {uuid}; ZREMRANGEBYSCORE ...`,
  unitTest: `@Test void exceedsLimit_returns429() {
  for (int i = 0; i < 101; i++) client.get("/api/payments");
  assertEquals(429, lastStatus());
}`,
  edgeCases: ['Burst vs sustained rate', 'Distributed Redis failure — fail open or closed?'],
  failureScenarios: ['Redis down — policy: fail open with alert vs fail closed'],
  retry: 'Client honors Retry-After header',
  idempotency: 'N/A',
  timeout: 'Redis lookup < 10ms',
  observability: 'Metric gateway.rate_limit.exceeded',
  security: 'Per-tenant limits; prevent credential sharing',
  performance: 'Redis local to gateway region',
  scalability: 'Horizontal gateway + shared Redis',
  production: 'Different tiers: free 10/s, partner 1000/s',
  mistakes: ['Rate limit only at service not edge', 'IP-based behind NAT — unfair'],
  antiPatterns: ['Unlimited internal traffic — noisy neighbor'],
  alternatives: ['Service mesh local rate limit', 'WAF AWS'],
  tradeoffs: 'Pros: protects core. Cons: Redis dependency; tuning per client.',
  interviewQs: ['Fixed vs sliding window?', 'Rate limit vs throttle vs quota?'],
  trickyQs: ['429 storm from retried clients?'],
  seniorFollowUps: ['Design tiered API product limits'],
  deepLabHref: '/rate-limiter',
};

const gatewayAuthentication: PatternCard = {
  id: 'gateway-authentication',
  part: 2,
  name: 'Gateway Authentication & Authorization',
  frequency: 'Frequently used',
  definition: 'Validate OAuth2/JWT at gateway; enforce scopes/roles before routing. Downstream receives authenticated principal.',
  problem: 'Payment endpoint exposed without consistent auth — some services check JWT, some trust network.',
  realWorld: 'Spring Security OAuth2 Resource Server on gateway; route filters check SCOPE_payment.write.',
  whyExists: 'Single auth enforcement point; services can focus on fine-grained authz.',
  ascii: `Client ──Bearer JWT──► Gateway
                            │
                            ├─ invalid → 401
                            ├─ valid, wrong scope → 403
                            └─ valid → forward + X-User-Id header`,
  flow: 'Extract Bearer token → validate signature + expiry via JWKS → check scopes for route → forward with claims.',
  components: [
    {name: 'JwtDecoder', responsibility: 'Validate signature from issuer JWKS'},
    {name: 'AuthorizationManager', responsibility: 'Scope/role check per route'},
  ],
  javaCode: `@Bean
SecurityWebFilterChain api(HttpSecurity http) {
  return http.authorizeExchange(ex -> ex
      .pathMatchers(HttpMethod.POST, "/api/payments/**").hasAuthority("SCOPE_payment.write")
      .pathMatchers(HttpMethod.GET, "/api/payments/**").hasAuthority("SCOPE_payment.read")
      .anyExchange().authenticated())
    .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
    .build();
}`,
  config: `spring.security.oauth2.resourceserver.jwt.issuer-uri=https://auth.example.com`,
  unitTest: `@Test void missingScope_403() {
  webTestClient.post().uri("/api/payments").headers(h -> h.setBearerAuth(tokenWithoutWriteScope()))
      .exchange().expectStatus().isForbidden();
}`,
  edgeCases: ['Token expiry mid-request', 'Clock skew on exp claim'],
  failureScenarios: ['Auth server down — cached JWKS TTL'],
  retry: 'Client refreshes token on 401',
  idempotency: 'N/A',
  timeout: 'JWKS fetch timeout 2s',
  observability: 'Audit auth failures; never log token',
  security: 'TLS + short-lived JWT; mTLS service-to-service behind gateway',
  performance: 'Cache JWKS keys',
  scalability: 'Stateless gateway pods',
  production: 'Link to /oauth-jwt-demo and /spring-security hub',
  mistakes: ['Trust X-User-Id without validating JWT at each hop in zero-trust'],
  antiPatterns: ['Long-lived JWT without rotation'],
  alternatives: ['Service mesh JWT policy'],
  tradeoffs: 'Pros: consistent auth. Cons: gateway must know all route policies.',
  interviewQs: ['Auth at gateway vs each service?', 'JWT vs opaque token?'],
  trickyQs: ['Revoke compromised token before expiry?'],
  seniorFollowUps: ['Design scope model for payment APIs'],
  deepLabHref: '/oauth-jwt-demo',
};

export const GATEWAY_PATTERNS: PatternCard[] = [
  apiGateway,
  gatewayRouting,
  gatewayOffloading,
  gatewayRateLimiting,
  gatewayAuthentication,
  backendForFrontend,
  gatewayAggregation,
  apiComposition,
];
