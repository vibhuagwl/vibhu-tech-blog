import type {BeforeAfter, CaseStudy, PerfTopic, PlaybookScenario} from './types';

/** Spring MVC request path (blocking Tomcat thread model). */
export const SPRING_MVC_FLOW = `
Client
  │
  ▼
Tomcat connector (accept-count queue)
  │  borrows a request thread from the pool
  ▼
FilterChain → DispatcherServlet
  │
  ▼
HandlerMapping → @Controller / @RestController
  │
  ▼
@Service  (@Transactional opens / joins TX)
  │
  ▼
Spring Data / EntityManager / JdbcTemplate
  │  borrows HikariCP connection
  ▼
Database
  │
  ▼
Response written → thread returned to Tomcat pool
`.trim();

/** MVC vs WebFlux comparison — starting points for interviews. */
export const MVC_VS_WEBFLUX_ROWS: string[][] = [
  ['Dimension', 'Spring MVC', 'Spring WebFlux'],
  [
    'Threading model',
    '1 request ≈ 1 Tomcat/Jetty thread (blocking)',
    'Event-loop (Netty) + reactive operators; few threads',
  ],
  [
    'Best fit',
    'Blocking JDBC, JPA, RestClient, Redis sync — most CRUD APIs',
    'High concurrent I/O with non-blocking clients end-to-end',
  ],
  [
    'Backpressure',
    'Thread pool + queues (accept-count, Hikari pending)',
    'Reactive Streams demand; still need timeouts & bulkheads',
  ],
  [
    'DB access',
    'HikariCP + JDBC/JPA is natural',
    'Need R2DBC / reactive driver — blocking JDBC on event loop is a footgun',
  ],
  [
    'Debugging',
    'Familiar stack traces; Virtual Threads (Java 21) help scale blocking I/O',
    'Operator chains harder to debug; Schedulers matter',
  ],
  [
    'When to choose',
    'Default for Spring Boot services with relational DBs',
    'Only when the whole call graph is non-blocking and concurrency ≫ CPU',
  ],
  [
    'Interview trap',
    '"MVC cannot scale" — false; pools + VT + cache often win',
    '"WebFlux always faster" — false if you block the event loop',
  ],
];

export const WEBFLUX_WARNING =
  'Calling blocking JDBC/JPA (or synchronized Redis) on the WebFlux event loop destroys the benefit: a handful of Netty threads stall, latency explodes, and you get worse throughput than MVC. Either stay on MVC (or Java 21 virtual threads) for blocking stacks, or use R2DBC/reactive clients and isolate any unavoidable blocking work on a bounded elastic scheduler — never on the event loop.';

export const JPA_NPLUS1: BeforeAfter = {
  id: 'jpa-nplus1',
  title: 'JPA N+1 select storm',
  problem:
    'Listing parents then touching a lazy collection (or association) fires one query per row — classic N+1 under load.',
  bad: `// Java 21 · Spring Boot 3 · BAD: LazyCollection + open session
@GetMapping("/orders")
List<OrderResponse> list() {
  return orderRepository.findAll().stream()   // 1 SELECT orders
      .map(o -> new OrderResponse(
          o.getId(),
          o.getLines().size()))               // N SELECT order_lines
      .toList();
}
// spring.jpa.open-in-view=true hides this until prod traffic`,
  whySlow:
    '1 + N round-trips to the DB. Connection pool and DB CPU melt under modest list sizes; p99 grows linearly with page size.',
  good: `// GOOD A: fetch join (watch cartesian product — paginate carefully)
@Query("""
  select distinct o from Order o
  left join fetch o.lines
  where o.status = :status
  """)
List<Order> findWithLines(@Param("status") OrderStatus status);

// GOOD B: DTO / interface projection — only columns you need
@Query("""
  select new com.example.OrderSummaryDto(o.id, count(l))
  from Order o left join o.lines l
  where o.status = :status
  group by o.id
  """)
List<OrderSummaryDto> summarize(@Param("status") OrderStatus status);

// GOOD C: @EntityGraph(attributePaths = "lines") on a repository method`,
  whyFaster:
    'One (or two controlled) SQL statements instead of N+1. Less pool borrow time, less DB parse/execute, stable p95.',
  tradeoff:
    'Fetch joins can over-fetch and break pagination (cartesian). Prefer DTO projections for list APIs; fetch joins for aggregate roots you truly need in memory. Disable open-in-view for REST.',
  interview:
    'I detect N+1 with Hibernate statistics / datasource-proxy query counts, then fix with join fetch, @EntityGraph, or DTO projection — never by making everything EAGER globally.',
  validate:
    'Query count per request under fixed page size; P95/P99 and DB CPU before/after. STARTING POINT — BENCHMARK join vs DTO.',
};

export const SQL_SELECT_STAR: BeforeAfter = {
  id: 'sql-select-star',
  title: 'SELECT * and fat rows',
  problem:
    'APIs pull every column (LOB/JSON/blob included) when the screen needs three fields — waste on wire, buffer, GC, and index-only scans.',
  bad: `// BAD: entity / SELECT * for a list card
@Query("select p from Product p")
List<Product> findAllProducts();  // loads description CLOB, images JSON, audit cols

// equivalent anti-pattern
jdbcTemplate.query("SELECT * FROM product", mapper);`,
  whySlow:
    'Larger rows → more I/O, cache misses, network bytes, JSON serialization CPU, and young-gen pressure. Covering indexes cannot help if unused columns are selected.',
  good: `// GOOD: explicit columns + DTO / record projection
public record ProductCard(long id, String sku, BigDecimal price) {}

@Query("""
  select new com.example.ProductCard(p.id, p.sku, p.price)
  from Product p
  where p.active = true
  """)
List<ProductCard> findCards();

// JDBC
jdbcTemplate.query(
    "SELECT id, sku, price FROM product WHERE active = true",
    (rs, i) -> new ProductCard(rs.getLong(1), rs.getString(2), rs.getBigDecimal(3)));`,
  whyFaster:
    'Less data moved; better chance of index-only / covering plans; cheaper serialization and GC. Same pattern for Kafka payloads and Redis values.',
  tradeoff:
    'More DTOs to maintain. Worth it on hot list/search paths; fine to load full aggregate on rare detail views.',
  interview:
    'SELECT * is a smell on hot paths — project only what the contract needs, then confirm with EXPLAIN and payload size metrics.',
  validate:
    'Payload bytes, serialization CPU, and P99 under identical QPS; EXPLAIN shows covering/index-only where expected.',
};

export const INDEX_ASCII = `
WITHOUT INDEX on orders(customer_id)
────────────────────────────────────
SELECT * FROM orders WHERE customer_id = 42
  → Seq Scan on orders  (cost=… rows=5M)
  → read most of the heap
  → p95 climbs as table grows; lock/IO contention

WITH INDEX  CREATE INDEX CONCURRENTLY idx_orders_customer ON orders(customer_id);
────────────────────────────────────
  → Index Scan using idx_orders_customer
  → few pages → heap fetches (or covering INDEX … INCLUDE)
  → stable latency until write amplification / bloat bites

Story: "We scaled app pods 3× and p99 got worse — DB was seq-scanning.
       One index cut CPU 70% and we scaled pods back down."
`.trim();

/** Index tradeoffs — heuristics, not laws. */
export const INDEX_TRADEOFF_ROWS: string[][] = [
  ['Topic', 'Read win', 'Write / storage cost', 'Heuristic (starting point)'],
  [
    'B-tree equality / range',
    'Point + range lookups, ORDER BY matching leftmost prefix',
    'Extra writes, vacuum/bloat, planner choices',
    'Index WHERE / JOIN / ORDER BY columns that filter selectively',
  ],
  [
    'Composite index',
    'Serves multi-column predicates in left-to-right order',
    'Wider keys → more leaf pages',
    'Order = equality cols first, then range; avoid redundant single-col indexes',
  ],
  [
    'Covering / INCLUDE',
    'Index-only scans (no heap hit)',
    'Larger index; updates touch more structures',
    'Hot read paths that always need the same 2–3 columns',
  ],
  [
    'Partial index',
    'Tiny index for hot subset (e.g. status = OPEN)',
    'Only helps queries that match the predicate',
    'When 95% of rows are cold historical data',
  ],
  [
    'Too many indexes',
    'Diminishing returns; planner confusion',
    'INSERT/UPDATE slower; deploy migrations riskier',
    'Drop unused (pg_stat_user_indexes); prefer one composite over three singles',
  ],
];

/** HikariCP — property / meaning / heuristic (starting points). */
export const HIKARI_ROWS: string[][] = [
  ['Property', 'Meaning', 'Heuristic (starting point)'],
  [
    'maximumPoolSize',
    'Hard cap on concurrent DB connections from this pool',
    'Often cores×2 for OLTP app pods, but MUST satisfy: instances × pool < DB max_connections (leave headroom for admin/replicas). Start ~10–20 per pod, measure pending vs DB CPU.',
  ],
  [
    'minimumIdle',
    'Floor of idle connections kept warm',
    'Equal to maximumPoolSize for latency-sensitive APIs (avoid ramp); lower for spiky batch workers to free DB slots.',
  ],
  [
    'connectionTimeout',
    'Max wait to obtain a connection before SQLException',
    '250–1000ms for user-facing APIs so you fail fast instead of queueing forever. Pair with load shedding.',
  ],
  [
    'idleTimeout',
    'Idle connection eviction (when minimumIdle < max)',
    '~10 minutes typical; keep below DB/wait_timeout. Irrelevant if minIdle == max.',
  ],
  [
    'maxLifetime',
    'Max age before connection is retired',
    '~30 minutes starting point; rotate before firewall/NAT idle kills; 0 = infinite (usually avoid).',
  ],
  [
    'leakDetectionThreshold',
    'Logs stack if connection borrowed longer than threshold',
    'Only in non-prod or briefly in prod (~20–60s). Finds missing close / long TX — not a substitute for fixing hold time.',
  ],
];

export const POOL_MATH_ASCII = `
Pool math (must hold in every environment)
──────────────────────────────────────────
  app_instances × hikari.maximumPoolSize  <  db.max_connections
                                         −  headroom (admin, migrations, replicas, BI)

Example:
  10 ECS tasks × maximumPoolSize 20  =  200 connections
  If Postgres max_connections = 200 → you are already saturated.
  Fix: lower pool (e.g. 10), add PgBouncer/RDS Proxy, or raise DB cap with RAM math.

Also align Tomcat max threads with pool size:
  200 request threads + 20 DB connections ⇒ 180 threads can block on pool.
`.trim();

export const SPRING_BOOT_STARTUP_VS_RUNTIME =
  'Spring Boot startup cost (component scan, auto-config, Hibernate metadata, Flyway) is a deploy/cold-start concern — optimize with lazy init, lean starters, and AOT/native where it matters (Lambda, scale-to-zero). Runtime p99 is dominated by request path: SQL, pools, serialization, downstream I/O, GC, and logging — not by how long the JVM took to boot. Do not confuse a slow /actuator startup probe with a slow checkout API.';

/** Embedded Tomcat (Spring Boot) — starting points. */
export const TOMCAT_ROWS: string[][] = [
  ['Property', 'Meaning', 'Heuristic (starting point)'],
  [
    'server.tomcat.threads.max',
    'Max worker threads handling requests',
    '~200 default-ish; with Java 21 virtual threads (spring.threads.virtual.enabled) model changes. For platform threads: size near concurrent blocking work you can sustain, not "as high as possible".',
  ],
  [
    'server.tomcat.threads.min-spare',
    'Warm idle workers',
    '~10–25; enough to absorb small bursts without thread-create delay.',
  ],
  [
    'server.tomcat.accept-count',
    'Queue length when all workers busy (before connection refusal)',
    '~100 starting point; large queues hide overload and inflate p99 — prefer fail fast + shedding.',
  ],
  [
    'server.tomcat.max-connections',
    'Max simultaneous TCP connections',
    'Often thousands; remember each connected slow client still competes for workers when data arrives.',
  ],
  [
    'server.tomcat.connection-timeout',
    'Time to wait for request line after accept',
    '~2–20s typical; shorter on hostile edges.',
  ],
  [
    'Alignment rule',
    'Tomcat concurrency vs Hikari vs downstream',
    'If workers ≫ DB pool, most threads wait on Hikari pending. Cap concurrency or raise pool only within DB budget.',
  ],
];
