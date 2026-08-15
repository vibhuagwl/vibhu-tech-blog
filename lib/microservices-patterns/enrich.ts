import type {PatternCard} from './types';

const INCOMPLETE_MARKERS = ['TODO', '...', '/* assert', '/* publish', '{ /*', '{}'];

function toPascalCase(id: string): string {
  return id
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

function toPackageSegment(id: string): string {
  return id.replace(/-/g, '');
}

function isIncomplete(value?: string): boolean {
  if (!value || value.trim().length === 0) return true;
  return INCOMPLETE_MARKERS.some((m) => value.includes(m));
}

function matchesId(id: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(id));
}

export function needsKafka(p: PatternCard): boolean {
  return matchesId(p.id, [
    /saga/,
    /outbox/,
    /inbox/,
    /idempotent/,
    /kafka/,
    /event/,
    /messaging/,
    /pub-sub/,
    /dlq/,
    /retry-topic/,
    /poison/,
    /replay/,
    /ordering/,
    /partitioning/,
    /consumer/,
    /notification/,
    /carried-state/,
    /guaranteed-delivery/,
    /^message-/,
    /dead-letter/,
    /competing/,
    /choreography/,
    /orchestration/,
    /ecst/,
    /event-driven/,
  ]);
}

export function needsDb(p: PatternCard): boolean {
  return matchesId(p.id, [
    /outbox/,
    /inbox/,
    /cqrs/,
    /event-sourcing/,
    /materialized/,
    /database/,
    /shared-db/,
    /lock/,
    /optimistic/,
    /pessimistic/,
    /idempotent/,
    /transactional/,
    /saga/,
    /two-phase/,
    /try-confirm/,
    /^db-/,
    /processed/,
    /leader-election/,
    /quorum/,
    /scheduler/,
    /snowflake/,
    /gossip/,
    /heartbeat/,
    /failure-detector/,
    /lease/,
    /fencing/,
    /distributed-id/,
    /vector-clock/,
    /lamport/,
    /shared-database/,
    /api-composition/,
    /materialized-view/,
  ]);
}

export function needsRedis(p: PatternCard): boolean {
  return matchesId(p.id, [
    /cache/,
    /redis/,
    /redisson/,
    /rate-limiter/,
    /stampede/,
    /hot-key/,
    /fencing/,
    /idempotent/,
    /penetration/,
    /avalanche/,
    /read-through/,
    /write-through/,
    /write-behind/,
    /refresh-ahead/,
    /consistent-hashing/,
    /lb-consistent/,
  ]);
}

export function needsConfig(p: PatternCard): boolean {
  return (
    matchesId(p.id, [
      /gateway/,
      /bff/,
      /discovery/,
      /timeout/,
      /retry/,
      /circuit/,
      /bulkhead/,
      /rate-limiter/,
      /backpressure/,
      /load-shedding/,
      /kafka/,
      /oauth/,
      /jwt/,
      /mtls/,
      /security/,
      /resilience/,
      /^lb-/,
      /client-side/,
      /server-side/,
      /saga/,
      /outbox/,
      /inbox/,
      /hedged/,
      /graceful/,
      /fallback/,
      /mesh/,
      /envoy/,
      /istio/,
      /sidecar/,
      /canary/,
      /blue-green/,
      /rolling/,
      /shadow/,
      /feature-flag/,
      /dark-launch/,
      /token-/,
      /secrets/,
      /rbac/,
      /abac/,
      /openid/,
      /service-to-service/,
    ]) || p.part <= 5
  );
}

export function needsRestApi(p: PatternCard): boolean {
  return matchesId(p.id, [
    /gateway/,
    /bff/,
    /api-composition/,
    /backend-for-frontend/,
    /uri-versioning/,
    /header-versioning/,
    /media-type/,
    /decompose/,
    /strangler/,
    /aggregation/,
    /api-gateway/,
    /load-shedding/,
    /graceful-degradation/,
    /fallback/,
    /rate-limiter/,
    /circuit-breaker/,
    /timeout/,
    /retry/,
    /cqrs/,
    /materialized-view/,
    /oauth/,
    /jwt/,
    /rbac/,
    /abac/,
    /versioning/,
    /god-service/,
    /chatty/,
    /nano-services/,
    /synchronous-chain/,
    /missing-timeout/,
    /missing-idempotency/,
  ]);
}

export function needsConcurrency(p: PatternCard): boolean {
  return matchesId(p.id, [
    /lock/,
    /saga/,
    /outbox/,
    /inbox/,
    /idempotent/,
    /rate-limiter/,
    /^lb-/,
    /stampede/,
    /snowflake/,
    /fencing/,
    /bulkhead/,
    /hedged/,
    /cqrs/,
    /optimistic/,
    /pessimistic/,
    /leader-election/,
    /distributed-id/,
    /redisson/,
    /lease/,
    /quorum/,
    /hot-key/,
    /write-behind/,
    /competing-consumers/,
    /consumer-groups/,
  ]);
}

function pkg(p: PatternCard): string {
  return `com.vibhu.msp.e2e.${toPackageSegment(p.id)}`;
}

function cls(p: PatternCard): string {
  return `${toPascalCase(p.id)}E2E`;
}

function generateSpringCode(p: PatternCard): string {
  const className = cls(p);
  const packageName = pkg(p);
  return `package ${packageName};

import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * Spring wrapper for pattern: ${p.name}
 * Part ${p.part} — ${p.definition.slice(0, 120)}
 */
@Component
public class ${className}Service {

    private final ${className}Properties properties;
    private final ${className}Delegate delegate;

    public ${className}Service(${className}Properties properties, ${className}Delegate delegate) {
        this.properties = properties;
        this.delegate = delegate;
    }

    public ${className}Result execute(${className}Request request) {
        delegate.validate(request);
        return delegate.apply(request, properties);
    }

    public record ${className}Request(String correlationId, String payload) {}
    public record ${className}Result(String correlationId, String outcome, boolean success) {}

    public interface ${className}Delegate {
        void validate(${className}Request request);
        ${className}Result apply(${className}Request request, ${className}Properties properties);
    }
}

@Configuration
@EnableConfigurationProperties(${className}Properties.class)
class ${className}AutoConfiguration {

    @Bean
    ${className}Delegate ${toPackageSegment(p.id)}Delegate() {
        return new ${className}DelegateImpl();
    }

    static final class ${className}DelegateImpl implements ${className}Service.${className}Delegate {
        @Override
        public void validate(${className}Service.${className}Request request) {
            if (request.correlationId() == null || request.correlationId().isBlank()) {
                throw new IllegalArgumentException("correlationId required");
            }
        }

        @Override
        public ${className}Service.${className}Result apply(
            ${className}Service.${className}Request request,
            ${className}Properties properties) {
            return new ${className}Service.${className}Result(
                request.correlationId(),
                properties.getMode() + "-applied",
                true);
        }
    }
}

@ConfigurationProperties(prefix = "msp.e2e.${p.id.replace(/-/g, '.')}")
class ${className}Properties {
    private String mode = "production";
    private int timeoutMs = 3000;

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public int getTimeoutMs() { return timeoutMs; }
    public void setTimeoutMs(int timeoutMs) { this.timeoutMs = timeoutMs; }
}`;
}

function generateIntegrationTest(p: PatternCard): string {
  const className = cls(p);
  const packageName = pkg(p);
  const usesKafka = needsKafka(p);
  const usesDb = needsDb(p);
  const usesRedis = needsRedis(p);

  const containers: string[] = [];
  const containerFields: string[] = [];
  const dynamicProps: string[] = [];

  if (usesKafka) {
    containers.push(
      `  @Container\n  static final KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.0"));`,
    );
    dynamicProps.push(
      `    registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);`,
    );
  }
  if (usesDb) {
    containers.push(
      `  @Container\n  static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");`,
    );
    dynamicProps.push(
      `    registry.add("spring.datasource.url", postgres::getJdbcUrl);`,
      `    registry.add("spring.datasource.username", postgres::getUsername);`,
      `    registry.add("spring.datasource.password", postgres::getPassword);`,
    );
  }
  if (usesRedis) {
    containers.push(
      `  @Container\n  static final GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);`,
    );
    dynamicProps.push(
      `    registry.add("spring.data.redis.host", redis::getHost);`,
      `    registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));`,
    );
  }

  const containerImports = [
    usesKafka ? 'org.testcontainers.kafka.KafkaContainer' : '',
    usesDb ? 'org.testcontainers.containers.PostgreSQLContainer' : '',
    usesRedis ? 'org.testcontainers.containers.GenericContainer' : '',
    usesKafka || usesDb || usesRedis ? 'org.testcontainers.utility.DockerImageName' : '',
    usesKafka || usesDb || usesRedis ? 'org.testcontainers.junit.jupiter.Container' : '',
    usesKafka || usesDb || usesRedis ? 'org.testcontainers.junit.jupiter.Testcontainers' : '',
  ]
    .filter(Boolean)
    .map((i) => `import ${i};`)
    .join('\n');

  const testcontainersAnnot = usesKafka || usesDb || usesRedis ? '@Testcontainers\n' : '';

  return `package ${packageName};

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
${containerImports}
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = {${className}Service.class, ${className}AutoConfiguration.class})
${testcontainersAnnot}class ${className}IntegrationTest {

${containers.join('\n\n')}

  @Autowired
  ${className}Service service;

${
  dynamicProps.length
    ? `  @DynamicPropertySource
  static void configure(DynamicPropertyRegistry registry) {
${dynamicProps.join('\n')}
  }

`
    : ''
}  @Test
  void endToEnd_happyPath_returnsSuccess() {
    var request = new ${className}Service.${className}Request("corr-it-001", "${p.id}");
    var result = service.execute(request);
    assertThat(result.success()).isTrue();
    assertThat(result.correlationId()).isEqualTo("corr-it-001");
    assertThat(result.outcome()).contains("applied");
  }

  @Test
  void endToEnd_rejectsBlankCorrelationId() {
    var request = new ${className}Service.${className}Request("  ", "${p.id}");
    org.junit.jupiter.api.Assertions.assertThrows(
        IllegalArgumentException.class,
        () -> service.execute(request));
  }
}`;
}

function generateFailureTest(p: PatternCard): string {
  const className = cls(p);
  const packageName = pkg(p);
  return `package ${packageName};

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ${className}FailureTest {

    @Mock
    ${className}Service.${className}Delegate delegate;

    @Mock
    ${className}Properties properties;

    ${className}Service service;

    @BeforeEach
    void setUp() {
        service = new ${className}Service(properties, delegate);
        when(properties.getMode()).thenReturn("failure-test");
    }

    @Test
    void delegateThrows_propagatesFailure() {
        doThrow(new RuntimeException("${p.name} downstream unavailable"))
            .when(delegate)
            .apply(any(), any());

        var request = new ${className}Service.${className}Request("corr-fail-001", "${p.id}");
        assertThatThrownBy(() -> service.execute(request))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("unavailable");
    }

    @Test
    void validationFailure_beforeDelegate() {
        var request = new ${className}Service.${className}Request("", "${p.id}");
        assertThatThrownBy(() -> service.execute(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("correlationId");
    }

    @Test
    void partialFailure_recordsCorrelationForObservability() {
        when(properties.getTimeoutMs()).thenReturn(1);
        doThrow(new ${className}TimeoutException("timeout after 1ms"))
            .when(delegate)
            .apply(any(), any());

        var request = new ${className}Service.${className}Request("corr-fail-002", "${p.id}");
        assertThatThrownBy(() -> service.execute(request))
            .isInstanceOf(${className}TimeoutException.class);
        verify(delegate).validate(request);
    }

    static final class ${className}TimeoutException extends RuntimeException {
        ${className}TimeoutException(String message) { super(message); }
    }
}`;
}

function generateConcurrencyTest(p: PatternCard): string {
  const className = cls(p);
  const packageName = pkg(p);
  return `package ${packageName};

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class ${className}ConcurrencyTest {

    @Test
    void parallelRequests_allCompleteWithoutDataRace() throws Exception {
        var properties = new ${className}Properties();
        properties.setMode("concurrent");
        var delegate = new ${className}AutoConfiguration.${className}DelegateImpl();
        var service = new ${className}Service(properties, delegate);
        ExecutorService pool = Executors.newFixedThreadPool(16);
        List<Callable<${className}Service.${className}Result>> tasks = new ArrayList<>();
        AtomicInteger counter = new AtomicInteger();

        for (int i = 0; i < 64; i++) {
            final int idx = i;
            tasks.add(() -> {
                counter.incrementAndGet();
                return service.execute(
                    new ${className}Service.${className}Request("corr-conc-" + idx, "${p.id}"));
            });
        }

        List<Future<${className}Service.${className}Result>> futures = pool.invokeAll(tasks);
        pool.shutdown();
        assertThat(pool.awaitTermination(30, TimeUnit.SECONDS)).isTrue();

        for (Future<${className}Service.${className}Result> future : futures) {
            ${className}Service.${className}Result result = future.get(5, TimeUnit.SECONDS);
            assertThat(result.success()).isTrue();
        }
        assertThat(counter.get()).isEqualTo(64);
    }

    @Test
    void parallelRequests_uniqueCorrelationIds() throws Exception {
        var properties = new ${className}Properties();
        var delegate = new ${className}AutoConfiguration.${className}DelegateImpl();
        var service = new ${className}Service(properties, delegate);
        ExecutorService pool = Executors.newFixedThreadPool(8);
        List<String> correlationIds = new ArrayList<>();

        for (int i = 0; i < 32; i++) {
            final int idx = i;
            pool.submit(() -> {
                var result = service.execute(
                    new ${className}Service.${className}Request("corr-uniq-" + idx, "${p.id}"));
                synchronized (correlationIds) {
                    correlationIds.add(result.correlationId());
                }
            }).get(10, TimeUnit.SECONDS);
        }
        pool.shutdown();
        assertThat(correlationIds).hasSize(32);
        assertThat(correlationIds.stream().distinct().count()).isEqualTo(32);
    }
}`;
}

function generateKafkaCode(p: PatternCard): string {
  const topic = p.id.replace(/-/g, '.');
  return `package ${pkg(p)};

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.Future;

/**
 * Kafka integration for pattern: ${p.name}
 */
@Component
public class ${cls(p)}KafkaAdapter {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ${cls(p)}EventStore eventStore;

    public ${cls(p)}KafkaAdapter(KafkaTemplate<String, String> kafkaTemplate, ${cls(p)}EventStore eventStore) {
        this.kafkaTemplate = kafkaTemplate;
        this.eventStore = eventStore;
    }

    public RecordMetadata publish(String aggregateId, String payload, String correlationId) throws Exception {
        ProducerRecord<String, String> record = new ProducerRecord<>(
            "msp.${topic}.v1",
            aggregateId,
            payload);
        record.headers().add("correlationId", correlationId.getBytes(StandardCharsets.UTF_8));
        record.headers().add("patternId", "${p.id}".getBytes(StandardCharsets.UTF_8));
        Future<RecordMetadata> future = kafkaTemplate.send(record);
        return future.get();
    }

    @KafkaListener(topics = "msp.${topic}.v1", groupId = "msp-${toPackageSegment(p.id)}-consumer")
    public void consume(ConsumerRecord<String, String> record, Acknowledgment ack) {
        String correlationId = header(record, "correlationId");
        String idempotencyKey = record.topic() + ":" + record.partition() + ":" + record.offset();
        if (eventStore.alreadyProcessed(idempotencyKey)) {
            ack.acknowledge();
            return;
        }
        process(record.key(), record.value(), correlationId);
        eventStore.markProcessed(idempotencyKey);
        ack.acknowledge();
    }

    private void process(String key, String value, String correlationId) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Empty payload for key=" + key);
        }
    }

    private static String header(ConsumerRecord<String, String> record, String name) {
        var header = record.headers().lastHeader(name);
        return header == null ? "" : new String(header.value(), StandardCharsets.UTF_8);
    }

    public interface ${cls(p)}EventStore {
        boolean alreadyProcessed(String idempotencyKey);
        void markProcessed(String idempotencyKey);
    }
}

// Topics: msp.${topic}.v1, msp.${topic}.v1-retry-1, msp.${topic}.v1-dlt
// Partition key: aggregateId | Headers: correlationId, patternId`;
}

function generateDbCode(p: PatternCard): string {
  const table = p.id.replace(/-/g, '_');
  return `-- PostgreSQL schema for pattern: ${p.name}
CREATE TABLE IF NOT EXISTS ${table}_state (
    id              VARCHAR(128) PRIMARY KEY,
    correlation_id  VARCHAR(128) NOT NULL,
    payload         JSONB NOT NULL,
    version         BIGINT NOT NULL DEFAULT 0,
    status          VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ${table}_processed_events (
    idempotency_key VARCHAR(256) PRIMARY KEY,
    processed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_${table}_correlation ON ${table}_state (correlation_id);
CREATE INDEX IF NOT EXISTS idx_${table}_status ON ${table}_state (status);

-- Repository (Spring Data JDBC)
package ${pkg(p)};

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ${cls(p)}StateRepository extends CrudRepository<${cls(p)}StateEntity, String> {

    @Query("SELECT * FROM ${table}_state WHERE correlation_id = :correlationId FOR UPDATE")
    Optional<${cls(p)}StateEntity> findByCorrelationIdForUpdate(String correlationId);
}

record ${cls(p)}StateEntity(
    String id,
    String correlationId,
    String payload,
    long version,
    String status) {}`;
}

function generateRedisCode(p: PatternCard): string {
  const keyPrefix = `msp:${p.id}`;
  return `package ${pkg(p)};

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

/**
 * Redis operations for pattern: ${p.name}
 */
@Component
public class ${cls(p)}RedisStore {

    private static final String KEY_PREFIX = "${keyPrefix}:";
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(5);

    private final StringRedisTemplate redis;

    public ${cls(p)}RedisStore(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public void put(String id, String value) {
        redis.opsForValue().set(key(id), value, DEFAULT_TTL);
    }

    public Optional<String> get(String id) {
        return Optional.ofNullable(redis.opsForValue().get(key(id)));
    }

    public boolean tryLock(String id, String owner, Duration lease) {
        Boolean acquired = redis.opsForValue().setIfAbsent(lockKey(id), owner, lease);
        return Boolean.TRUE.equals(acquired);
    }

    public void releaseLock(String id, String owner) {
        String current = redis.opsForValue().get(lockKey(id));
        if (owner.equals(current)) {
            redis.delete(lockKey(id));
        }
    }

    public long incrementRateLimit(String bucket, int windowSeconds) {
        String rateKey = KEY_PREFIX + "rate:" + bucket;
        Long count = redis.opsForValue().increment(rateKey);
        if (count != null && count == 1L) {
            redis.expire(rateKey, Duration.ofSeconds(windowSeconds));
        }
        return count == null ? 0L : count;
    }

    private static String key(String id) {
        return KEY_PREFIX + ":data:" + id;
    }

    private static String lockKey(String id) {
        return KEY_PREFIX + ":lock:" + id;
    }
}

// Redis keys:
// ${keyPrefix}:data:{id}     — cached payload (TTL 5m)
// ${keyPrefix}:lock:{id}     — distributed lock with lease
// ${keyPrefix}:rate:{bucket} — sliding window counter`;
}

function generateConfig(p: PatternCard): string {
  const prefix = p.id.replace(/-/g, '.');
  return `# Spring configuration for pattern: ${p.name}
msp:
  e2e:
    ${prefix}:
      mode: production
      timeout-ms: 3000

spring:
  application:
    name: msp-${p.id}

management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
  tracing:
    sampling:
      probability: 1.0

logging:
  pattern:
    console: "%d{ISO8601} [%thread] %-5level %logger{36} - %msg correlationId=%X{correlationId}%n"

${
  needsKafka(p)
    ? `spring:
  kafka:
    bootstrap-servers: \${KAFKA_BOOTSTRAP:localhost:9092}
    producer:
      acks: all
      properties:
        enable.idempotence: true
    consumer:
      enable-auto-commit: false
      group-id: msp-${toPackageSegment(p.id)}
      isolation-level: read_committed
`
    : ''
}${
  needsDb(p)
    ? `spring:
  datasource:
    url: \${DATABASE_URL:jdbc:postgresql://localhost:5432/msp}
    username: \${DATABASE_USER:msp}
    password: \${DATABASE_PASSWORD:msp}
  jpa:
    hibernate:
      ddl-auto: validate
`
    : ''
}${
  needsRedis(p)
    ? `spring:
  data:
    redis:
      host: \${REDIS_HOST:localhost}
      port: \${REDIS_PORT:6379}
`
    : ''
}${
  matchesId(p.id, [/gateway/, /bff/, /rate-limiter/, /circuit/, /timeout/, /retry/])
    ? `resilience4j:
  circuitbreaker:
    instances:
      ${toPackageSegment(p.id)}:
        sliding-window-size: 20
        failure-rate-threshold: 50
  timelimiter:
    instances:
      ${toPackageSegment(p.id)}:
        timeout-duration: 3s
  retry:
    instances:
      ${toPackageSegment(p.id)}:
        max-attempts: 3
        wait-duration: 500ms
`
    : ''
}`;
}

function generateRestApi(p: PatternCard): string {
  const resource = p.id.replace(/-/g, '-');
  return `package ${pkg(p)}.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/${resource}")
public class ${cls(p)}Controller {

    private final com.vibhu.msp.e2e.${toPackageSegment(p.id)}.${cls(p)}Service service;

    public ${cls(p)}Controller(com.vibhu.msp.e2e.${toPackageSegment(p.id)}.${cls(p)}Service service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<${cls(p)}Response> get(
        @PathVariable String id,
        @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId) {
        String corr = correlationId == null ? "http-" + id : correlationId;
        var result = service.execute(new com.vibhu.msp.e2e.${toPackageSegment(p.id)}.${cls(p)}Service.${cls(p)}Request(corr, id));
        return ResponseEntity.ok(new ${cls(p)}Response(result.correlationId(), result.outcome(), result.success()));
    }

    @PostMapping
    public ResponseEntity<${cls(p)}Response> create(@RequestBody ${cls(p)}Request request) {
        var result = service.execute(
            new com.vibhu.msp.e2e.${toPackageSegment(p.id)}.${cls(p)}Service.${cls(p)}Request(
                request.correlationId(),
                request.payload()));
        return ResponseEntity.ok(new ${cls(p)}Response(result.correlationId(), result.outcome(), result.success()));
    }

    public record ${cls(p)}Request(String correlationId, String payload) {}
    public record ${cls(p)}Response(String correlationId, String outcome, boolean success) {}
}

# REST surface
# GET  /api/v1/${resource}/{id}  — read / invoke pattern
# POST /api/v1/${resource}       — create / trigger pattern
# Header: X-Correlation-Id (optional)`;
}

export function enrichPattern(pattern: PatternCard): PatternCard {
  const enriched: PatternCard = {...pattern};

  if (isIncomplete(enriched.springCode)) {
    enriched.springCode = generateSpringCode(pattern);
  }
  if (isIncomplete(enriched.integrationTest)) {
    enriched.integrationTest = generateIntegrationTest(pattern);
  }
  if (isIncomplete(enriched.failureTest)) {
    enriched.failureTest = generateFailureTest(pattern);
  }
  if (needsConcurrency(pattern) && isIncomplete(enriched.concurrencyTest)) {
    enriched.concurrencyTest = generateConcurrencyTest(pattern);
  }
  if (needsKafka(pattern) && isIncomplete(enriched.kafkaCode)) {
    enriched.kafkaCode = generateKafkaCode(pattern);
  }
  if (needsDb(pattern) && isIncomplete(enriched.dbCode)) {
    enriched.dbCode = generateDbCode(pattern);
  }
  if (needsRedis(pattern) && isIncomplete(enriched.redisCode)) {
    enriched.redisCode = generateRedisCode(pattern);
  }
  if (needsConfig(pattern) && isIncomplete(enriched.config)) {
    enriched.config = generateConfig(pattern);
  }
  if (needsRestApi(pattern) && isIncomplete(enriched.restApi)) {
    enriched.restApi = generateRestApi(pattern);
  }

  return enriched;
}

export function enrichPatterns(patterns: PatternCard[]): PatternCard[] {
  return patterns.map(enrichPattern);
}
