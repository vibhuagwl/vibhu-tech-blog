import type {AwsTopic} from './types';

export const TOPICS_SPRING: AwsTopic[] = [
  {
    id: 'spring-aws',
    title: 'Spring Boot on AWS — RDS, DynamoDB, Redis, S3, SQS, SNS, MSK, Secrets Manager, IAM & CloudWatch',
    badge: 'Spring',
    category: 'Integration',
    askLevel: '🏆 STAFF',
    what:
      'Single comprehensive reference for running Spring Boot 3 on AWS: JDBC/RDS with RDS Proxy, DynamoDB Enhanced Client, ElastiCache Redis, S3, SQS/SNS messaging, MSK Kafka, Secrets Manager config import, default credentials chain (IRSA / instance profile), and custom CloudWatch metrics — production-ready Java config and code.',
    mermaid: `flowchart TB
  subgraph boot [Spring Boot 3 on ECS/EKS]
    APP[Payment Application]
    ACT[Actuator /health]
    APP --> ACT
  end
  subgraph creds [Default Credentials Chain]
    IRSA[IRSA WebIdentityToken]
    IMDS[EC2 Instance Profile]
    LOCAL[Profile / Env local dev]
    IRSA --> APP
    IMDS --> APP
    LOCAL -.-> APP
  end
  subgraph aws [AWS Services]
    SM[Secrets Manager]
    RDS[(Aurora RDS Proxy)]
    DDB[(DynamoDB)]
    REDIS[(ElastiCache Redis)]
    S3[(S3)]
    SQS[SQS / SNS]
    MSK[MSK Kafka]
    CW[CloudWatch Metrics]
  end
  APP --> SM
  APP --> RDS
  APP --> DDB
  APP --> REDIS
  APP --> S3
  APP --> SQS
  APP --> MSK
  APP --> CW`,
    code: `# ═══════════════════════════════════════════════════════════════════
# pom.xml / build.gradle — AWS SDK v2 + Spring integrations
# ═══════════════════════════════════════════════════════════════════

# Maven dependencies (Spring Boot 3.3+, Java 17+)
<!--
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>software.amazon.awssdk</groupId>
      <artifactId>bom</artifactId>
      <version>2.25.60</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
    <dependency>
      <groupId>io.awspring.cloud</groupId>
      <artifactId>spring-cloud-aws-dependencies</artifactId>
      <version>3.1.1</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<dependencies>
  spring-boot-starter-web
  spring-boot-starter-data-jpa
  spring-boot-starter-data-redis
  spring-boot-starter-actuator
  io.awspring.cloud:spring-cloud-aws-starter-secrets-manager
  io.awspring.cloud:spring-cloud-aws-starter-sqs
  io.awspring.cloud:spring-cloud-aws-starter-s3
  software.amazon.awssdk:dynamodb-enhanced
  software.amazon.awssdk:cloudwatch
  software.amazon.awssdk:sts
  org.springframework.kafka:spring-kafka
  org.postgresql:postgresql
  io.micrometer:micrometer-registry-cloudwatch2
  com.zaxxer:HikariCP
</dependencies>
-->


# ═══════════════════════════════════════════════════════════════════
# application.yml — Secrets Manager + profiles
# ═══════════════════════════════════════════════════════════════════

# application.yml (shared)
spring:
  application:
    name: payment-api
  profiles:
    active: \${SPRING_PROFILES_ACTIVE:local}

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    export:
      cloudwatch:
        namespace: Acme/Payment
        step: 1m
        enabled: true

# application-prod.yml — import secrets BEFORE datasource binds
spring:
  config:
    import: aws-secretsmanager:prod/payment-db
  cloud:
    aws:
      region:
        static: us-east-1
      credentials:
        # DefaultCredentialsProvider — NO access keys in prod
        # Chain: env vars → system props → web identity (IRSA) → IMDS (EC2/ECS)
        use-default-credentials-chain: true

  datasource:
    url: jdbc:postgresql://\${host}:\${port}/\${dbname}?sslmode=verify-full&targetServerType=primary
    username: \${username}
    password: \${password}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 5000
      idle-timeout: 300000
      max-lifetime: 1800000
      pool-name: payment-hikari

  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true

  data:
    redis:
      cluster:
        nodes: \${REDIS_CLUSTER_ENDPOINT:payment-redis.xxxxx.clustercfg.use1.cache.amazonaws.com:6379}
      ssl:
        enabled: true
      timeout: 2s

  kafka:
    bootstrap-servers: \${MSK_BOOTSTRAP:b-1.acme.xxxxx.kafka.us-east-1.amazonaws.com:9098,b-2.acme.xxxxx.kafka.us-east-1.amazonaws.com:9098}
    properties:
      security.protocol: SASL_SSL
      sasl.mechanism: AWS_MSK_IAM
      sasl.jaas.config: software.amazon.msk.auth.iam.IAMLoginModule required;
      sasl.client.callback.handler.class: software.amazon.msk.auth.iam.IAMClientCallbackHandler
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all
      enable-idempotence: true
    consumer:
      group-id: payment-api
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: com.acme.payment.events

cloud:
  aws:
    sqs:
      listener:
        max-concurrent-messages: 10
        poll-timeout: 20s
    s3:
      region: us-east-1

app:
  s3:
    bucket: acme-payment-docs-prod
  sqs:
    settlement-queue: https://sqs.us-east-1.amazonaws.com/123456789012/payment-settlement.fifo
  sns:
    alert-topic-arn: arn:aws:sns:us-east-1:123456789012:payment-alerts
  dynamodb:
    idempotency-table: payment-idempotency


# ═══════════════════════════════════════════════════════════════════
# IAM DEFAULT CREDENTIALS CHAIN — how Spring resolves creds
# ═══════════════════════════════════════════════════════════════════

# Order (DefaultCredentialsProvider):
# 1. Environment variables (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) — local dev only
# 2. System properties
# 3. Web identity token (EKS IRSA — AWS_WEB_IDENTITY_TOKEN_FILE + AWS_ROLE_ARN)
# 4. Shared credentials file (~/.aws/credentials) — local dev
# 5. EC2/ECS instance metadata (IMDSv2 on EC2, task role on ECS Fargate)

@Configuration
public class AwsClientConfig {

  @Bean
  public AwsCredentialsProvider awsCredentialsProvider() {
    // Never hardcode keys — DefaultCredentialsProvider picks up IRSA/task role automatically
    return DefaultCredentialsProvider.builder()
        .asyncCredentialUpdateEnabled(true)
        .build();
  }

  @Bean
  public Region awsRegion(@Value("\${spring.cloud.aws.region.static:us-east-1}") String region) {
    return Region.of(region);
  }

  @Bean
  public DynamoDbClient dynamoDbClient(AwsCredentialsProvider creds, Region region) {
    return DynamoDbClient.builder()
        .credentialsProvider(creds)
        .region(region)
        .build();
  }

  @Bean
  public DynamoDbEnhancedClient dynamoDbEnhanced(DynamoDbClient client) {
    return DynamoDbEnhancedClient.builder().dynamoDbClient(client).build();
  }

  @Bean
  public S3Client s3Client(AwsCredentialsProvider creds, Region region) {
    return S3Client.builder()
        .credentialsProvider(creds)
        .region(region)
        .build();
  }

  @Bean
  public SqsClient sqsClient(AwsCredentialsProvider creds, Region region) {
    return SqsClient.builder().credentialsProvider(creds).region(region).build();
  }

  @Bean
  public SnsClient snsClient(AwsCredentialsProvider creds, Region region) {
    return SnsClient.builder().credentialsProvider(creds).region(region).build();
  }

  @Bean
  public CloudWatchClient cloudWatchClient(AwsCredentialsProvider creds, Region region) {
    return CloudWatchClient.builder().credentialsProvider(creds).region(region).build();
  }
}


# ═══════════════════════════════════════════════════════════════════
# RDS / AURORA — JPA + RDS Proxy + failover handling
# ═══════════════════════════════════════════════════════════════════

@Entity
@Table(name = "payments")
public class PaymentEntity {
  @Id
  private UUID paymentId;
  private String merchantId;
  private long amountCents;
  private String currency;
  @Enumerated(EnumType.STRING)
  private PaymentStatus status;
  private String idempotencyKey;
  private Instant createdAt;
  // getters/setters
}

public interface PaymentRepository extends JpaRepository<PaymentEntity, UUID> {
  Optional<PaymentEntity> findByMerchantIdAndIdempotencyKey(String merchantId, String key);
}

@Service
@Transactional
public class PaymentService {
  private final PaymentRepository repo;

  public PaymentEntity authorize(AuthorizeCommand cmd, String idempotencyKey) {
    return repo.findByMerchantIdAndIdempotencyKey(cmd.merchantId(), idempotencyKey)
        .orElseGet(() -> {
          PaymentEntity p = new PaymentEntity();
          p.setPaymentId(UUID.randomUUID());
          p.setMerchantId(cmd.merchantId());
          p.setAmountCents(cmd.amountCents());
          p.setCurrency(cmd.currency());
          p.setStatus(PaymentStatus.AUTHORIZED);
          p.setIdempotencyKey(idempotencyKey);
          p.setCreatedAt(Instant.now());
          return repo.save(p);
        });
  }
}

# RDS Proxy endpoint in JDBC URL (not direct Aurora endpoint):
# jdbc:postgresql://payment-proxy.proxy-abc123.us-east-1.rds.amazonaws.com:5432/payments
# Benefits: connection pooling across failover, IAM auth option, less connection churn

# Failover retry — Spring Retry on transient PG errors
@Retryable(retryFor = {TransientDataAccessException.class, PSQLException.class},
           maxAttempts = 3, backoff = @Backoff(delay = 500, multiplier = 2))
public PaymentEntity saveWithRetry(PaymentEntity entity) {
  return repo.save(entity);
}


# ═══════════════════════════════════════════════════════════════════
# DYNAMODB — Enhanced Client + idempotency pattern
# ═══════════════════════════════════════════════════════════════════

@DynamoDbBean
public class IdempotencyRecord {
  private String pk;
  private String paymentId;
  private String status;
  private String responseBody;
  private Long ttl;

  @DynamoDbPartitionKey
  public String getPk() { return pk; }
  public void setPk(String pk) { this.pk = pk; }
  @DynamoDbAttribute("paymentId")
  public String getPaymentId() { return paymentId; }
  public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
  @DynamoDbAttribute("status")
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  @DynamoDbAttribute("responseBody")
  public String getResponseBody() { return responseBody; }
  public void setResponseBody(String responseBody) { this.responseBody = responseBody; }
  @DynamoDbAttribute("ttl")
  public Long getTtl() { return ttl; }
  public void setTtl(Long ttl) { this.ttl = ttl; }
}

@Repository
public class IdempotencyStore {
  private final DynamoDbTable<IdempotencyRecord> table;

  public IdempotencyStore(DynamoDbEnhancedClient enhanced,
                          @Value("\${app.dynamodb.idempotency-table}") String tableName) {
    this.table = enhanced.table(tableName,
        TableSchema.fromBean(IdempotencyRecord.class));
  }

  /** Returns existing record if present; empty if caller should proceed (first attempt). */
  public Optional<IdempotencyRecord> find(String merchantId, String idempotencyKey) {
    String pk = "MERCHANT#" + merchantId + "#KEY#" + idempotencyKey;
    IdempotencyRecord rec = table.getItem(Key.builder().partitionValue(pk).build());
    return Optional.ofNullable(rec);
  }

  /** Conditional put — fails if another concurrent request wins the race. */
  public void saveIfAbsent(IdempotencyRecord rec) {
    rec.setTtl(Instant.now().plus(24, ChronoUnit.HOURS).getEpochSecond());
    table.putItem(PutItemEnhancedRequest.builder(IdempotencyRecord.class)
        .item(rec)
        .conditionExpression(Expression.builder()
            .expression("attribute_not_exists(pk)")
            .build())
        .build());
  }
}


# ═══════════════════════════════════════════════════════════════════
# REDIS (ElastiCache) — rate limiting + cache-aside
# ═══════════════════════════════════════════════════════════════════

@Configuration
@EnableCaching
public class RedisConfig {
  @Bean
  public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory factory) {
    RedisTemplate<String, String> tpl = new RedisTemplate<>();
    tpl.setConnectionFactory(factory);
    tpl.setKeySerializer(new StringRedisSerializer());
    tpl.setValueSerializer(new StringRedisSerializer());
    return tpl;
  }
}

@Service
public class RateLimiterService {
  private final StringRedisTemplate redis;

  public RateLimiterService(StringRedisTemplate redis) { this.redis = redis; }

  /** Sliding window: 100 requests per merchant per minute. */
  public boolean allowRequest(String merchantId, int limit) {
    String key = "ratelimit:" + merchantId + ":" + (System.currentTimeMillis() / 60_000);
    Long count = redis.opsForValue().increment(key);
    if (count != null && count == 1L) {
      redis.expire(key, Duration.ofMinutes(2));
    }
    return count != null && count <= limit;
  }
}

@Service
public class MerchantConfigCache {
  private final StringRedisTemplate redis;
  private final MerchantConfigRepository repo;

  @Cacheable(value = "merchantConfig", key = "#merchantId")
  public MerchantConfig getConfig(String merchantId) {
    String cached = redis.opsForValue().get("config:merchant:" + merchantId);
    if (cached != null) return parse(cached);
    MerchantConfig cfg = repo.findById(merchantId).orElseThrow();
    redis.opsForValue().set("config:merchant:" + merchantId, serialize(cfg), Duration.ofMinutes(10));
    return cfg;
  }

  @CacheEvict(value = "merchantConfig", key = "#merchantId")
  public void evict(String merchantId) {
    redis.delete("config:merchant:" + merchantId);
  }
}


# ═══════════════════════════════════════════════════════════════════
# S3 — receipt upload + presigned URLs
# ═══════════════════════════════════════════════════════════════════

@Service
public class ReceiptStorageService {
  private final S3Client s3;
  private final S3Presigner presigner;
  @Value("\${app.s3.bucket}") private String bucket;

  public ReceiptStorageService(S3Client s3, S3Presigner presigner) {
    this.s3 = s3;
    this.presigner = presigner;
  }

  @Bean
  static S3Presigner s3Presigner(AwsCredentialsProvider creds, Region region) {
    return S3Presigner.builder().credentialsProvider(creds).region(region).build();
  }

  public void storeReceipt(String paymentId, byte[] pdfBytes) {
    s3.putObject(PutObjectRequest.builder()
        .bucket(bucket)
        .key("receipts/" + paymentId + ".pdf")
        .serverSideEncryption(ServerSideEncryption.AWS_KMS)
        .ssekmsKeyId("alias/payment-data")
        .contentType("application/pdf")
        .build(),
        RequestBody.fromBytes(pdfBytes));
  }

  public URL presignedDownloadUrl(String paymentId, Duration ttl) {
    GetObjectRequest getReq = GetObjectRequest.builder()
        .bucket(bucket)
        .key("receipts/" + paymentId + ".pdf")
        .build();
    PresignedGetObjectRequest presigned = presigner.presignGetObject(
        GetObjectPresignRequest.builder()
            .signatureDuration(ttl)
            .getObjectRequest(getReq)
            .build());
    return presigned.url();
  }
}


# ═══════════════════════════════════════════════════════════════════
# SQS — settlement queue producer + @SqsListener consumer
# ═══════════════════════════════════════════════════════════════════

public record SettlementMessage(String paymentId, String merchantId, long amountCents) {}

@Service
public class SettlementPublisher {
  private final SqsTemplate sqsTemplate;
  @Value("\${app.sqs.settlement-queue}") private String queueUrl;

  public SettlementPublisher(SqsTemplate sqsTemplate) { this.sqsTemplate = sqsTemplate; }

  public void enqueue(SettlementMessage msg) {
    sqsTemplate.send(to -> to
        .queue(queueUrl)
        .payload(msg)
        .headers(Map.of(
            "message-group-id", msg.merchantId(),          // FIFO ordering per merchant
            "message-deduplication-id", msg.paymentId())));
  }
}

@Component
public class SettlementConsumer {
  private static final Logger log = LoggerFactory.getLogger(SettlementConsumer.class);
  private final SettlementService settlementService;
  private final MeterRegistry metrics;

  @SqsListener("\${app.sqs.settlement-queue}")
  public void onMessage(SettlementMessage msg, @Header("ApproximateReceiveCount") int receiveCount) {
    try {
      settlementService.process(msg);
      metrics.counter("settlement.processed", "merchant", msg.merchantId()).increment();
    } catch (TransientException ex) {
      throw ex; // SQS retry — visibility timeout expires, message re-delivered
    } catch (Exception ex) {
      log.error("Permanent failure paymentId={} receiveCount={}", msg.paymentId(), receiveCount, ex);
      throw ex; // after maxReceiveCount → DLQ
    }
  }
}


# ═══════════════════════════════════════════════════════════════════
# SNS — ops alerts
# ═══════════════════════════════════════════════════════════════════

@Service
public class AlertPublisher {
  private final SnsClient sns;
  @Value("\${app.sns.alert-topic-arn}") private String topicArn;

  public AlertPublisher(SnsClient sns) { this.sns = sns; }

  public void publishHighValuePayment(String paymentId, long amountCents) {
    sns.publish(PublishRequest.builder()
        .topicArn(topicArn)
        .subject("High-value payment alert")
        .message("""
            {"paymentId":"%s","amountCents":%d,"severity":"WARN"}
            """.formatted(paymentId, amountCents))
        .build());
  }
}


# ═══════════════════════════════════════════════════════════════════
# MSK (Kafka) — IAM auth producer + consumer
# ═══════════════════════════════════════════════════════════════════

public record PaymentCapturedEvent(
    String eventId, String paymentId, String merchantId,
    long amountCents, String currency, Instant capturedAt) {}

@Service
public class PaymentEventPublisher {
  private final KafkaTemplate<String, PaymentCapturedEvent> kafka;

  public PaymentEventPublisher(KafkaTemplate<String, PaymentCapturedEvent> kafka) {
    this.kafka = kafka;
  }

  public void publishCaptured(PaymentCapturedEvent event) {
    kafka.send("acme.fintech.payment.captured", event.paymentId(), event)
        .whenComplete((result, ex) -> {
          if (ex != null) throw new EventPublishException(ex);
        });
  }
}

@Component
public class FraudEventConsumer {
  @KafkaListener(topics = "acme.fintech.payment.captured", groupId = "fraud-scorer")
  public void onPaymentCaptured(
      @Payload PaymentCapturedEvent event,
      @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
      @Header(KafkaHeaders.OFFSET) long offset) {
    // Idempotent: check DynamoDB eventId before scoring
    fraudScorer.score(event);
  }
}


# ═══════════════════════════════════════════════════════════════════
# SECRETS MANAGER — rotation-aware datasource (no restart)
# ═══════════════════════════════════════════════════════════════════

# Secret JSON in Secrets Manager (prod/payment-db):
# {"username":"payment_app","password":"...","host":"proxy-abc.us-east-1.rds.amazonaws.com","port":5432,"dbname":"payments"}

# For rotation without restart — custom DataSource that refreshes credentials:
@Component
@RefreshScope  // Spring Cloud — re-bind on /actuator/refresh (or use Secrets Manager rotation Lambda + RDS Proxy IAM auth)
public class RotatingDataSourceConfig {

  @Bean
  @ConfigurationProperties("spring.datasource.hikari")
  public HikariDataSource dataSource(SecretsManagerClient sm) {
    HikariConfig config = new HikariConfig();
    DbSecret secret = fetchSecret(sm, "prod/payment-db");
    config.setJdbcUrl("jdbc:postgresql://" + secret.host() + ":" + secret.port() + "/" + secret.dbname() + "?sslmode=verify-full");
    config.setUsername(secret.username());
    config.setPassword(secret.password());
    config.setMaximumPoolSize(20);
    return new HikariDataSource(config);
  }

  private DbSecret fetchSecret(SecretsManagerClient sm, String secretId) {
    String json = sm.getSecretValue(GetSecretValueRequest.builder().secretId(secretId).build())
        .secretString();
    return parse(json);
  }
}

# Preferred prod pattern: RDS Proxy + IAM database authentication (no password in secret)
# Generate auth token:
# RDSUtilities.generateAuthenticationToken(host, port, username, creds, region)


# ═══════════════════════════════════════════════════════════════════
# CLOUDWATCH METRICS — Micrometer + custom SDK metrics
# ═══════════════════════════════════════════════════════════════════

@Configuration
public class MetricsConfig {
  @Bean
  public CloudWatchMeterRegistry cloudWatchRegistry(CloudWatchAsyncClient asyncClient) {
    CloudWatchConfig config = new CloudWatchConfig() {
      @Override public String get(String key) {
        return switch (key) {
          case "cloudwatch.namespace" -> "Acme/Payment";
          case "cloudwatch.step" -> Duration.ofMinutes(1).toString();
          default -> null;
        };
      }
      @Override public String namespace() { return "Acme/Payment"; }
    };
    return new CloudWatchMeterRegistry(config, Clock.SYSTEM, asyncClient);
  }
}

@Service
public class PaymentMetrics {
  private final MeterRegistry registry;
  private final CloudWatchClient cloudWatch;

  public PaymentMetrics(MeterRegistry registry, CloudWatchClient cloudWatch) {
    this.registry = registry;
    this.cloudWatch = cloudWatch;
  }

  // Micrometer — auto-exported to CloudWatch via registry
  public void recordAuthorization(String merchantId, boolean success, long latencyMs) {
    registry.counter("payments.authorize", "merchant", merchantId, "result", success ? "ok" : "fail").increment();
    registry.timer("payments.authorize.latency", "merchant", merchantId).record(Duration.ofMillis(latencyMs));
  }

  // Direct CloudWatch PutMetricData — custom dimensions / high-cardinality guard
  public void publishSettlementLag(long lagSeconds) {
    cloudWatch.putMetricData(PutMetricDataRequest.builder()
        .namespace("Acme/Payment")
        .metricData(MetricDatum.builder()
            .metricName("SettlementLagSeconds")
            .value((double) lagSeconds)
            .unit(StandardUnit.SECONDS)
            .timestamp(Instant.now())
            .dimensions(Dimension.builder().name("Environment").value("prod").build())
            .build())
        .build());
  }
}

# CloudWatch alarm (Terraform/CDK reference)
# Metric: Acme/Payment payments.authorize.latency p99 > 300ms → SNS ops-alerts


# ═══════════════════════════════════════════════════════════════════
# REST CONTROLLER — ties it all together
# ═══════════════════════════════════════════════════════════════════

@RestController
@RequestMapping("/v1/payments")
public class PaymentController {
  private final IdempotencyStore idempotencyStore;
  private final PaymentService paymentService;
  private final RateLimiterService rateLimiter;
  private final PaymentEventPublisher eventPublisher;
  private final SettlementPublisher settlementPublisher;
  private final PaymentMetrics metrics;

  @PostMapping
  public ResponseEntity<PaymentResponse> createPayment(
      @RequestHeader("Idempotency-Key") String idempotencyKey,
      @RequestBody AuthorizeRequest req) {

    if (!rateLimiter.allowRequest(req.merchantId(), 100)) {
      return ResponseEntity.status(429).build();
    }

    var existing = idempotencyStore.find(req.merchantId(), idempotencyKey);
    if (existing.isPresent()) {
      return ResponseEntity.ok(parse(existing.get().getResponseBody()));
    }

    long start = System.currentTimeMillis();
    try {
      PaymentEntity payment = paymentService.authorize(toCommand(req), idempotencyKey);
      PaymentResponse response = toResponse(payment);

      idempotencyStore.saveIfAbsent(buildIdempotencyRecord(req.merchantId(), idempotencyKey, response));
      eventPublisher.publishCaptured(toEvent(payment));
      settlementPublisher.enqueue(new SettlementMessage(payment.getPaymentId().toString(), req.merchantId(), payment.getAmountCents()));

      metrics.recordAuthorization(req.merchantId(), true, System.currentTimeMillis() - start);
      return ResponseEntity.status(201).body(response);
    } catch (ConditionalCheckFailedException dup) {
      return ResponseEntity.ok(idempotencyStore.find(req.merchantId(), idempotencyKey)
          .map(r -> parse(r.getResponseBody())).orElseThrow());
    } catch (Exception ex) {
      metrics.recordAuthorization(req.merchantId(), false, System.currentTimeMillis() - start);
      throw ex;
    }
  }
}


# ═══════════════════════════════════════════════════════════════════
# ECS/EKS DEPLOYMENT NOTES
# ═══════════════════════════════════════════════════════════════════
# ECS task role: secretsmanager:GetSecretValue, dynamodb:*, sqs:*, sns:Publish,
#   s3:PutObject/GetObject, kms:Decrypt, cloudwatch:PutMetricData, kafka-cluster:Connect
# EKS IRSA: same policy on IAM role annotated in ServiceAccount
# Health: /actuator/health/readiness includes RDS + Redis + MSK checks
# Never set AWS_ACCESS_KEY_ID in task definition — use task role only
# Local dev: AWS_PROFILE=acme-dev or LocalStack with spring-cloud-aws endpoint override`,
    verify: `# Verify IRSA / task role (from running pod/container)
aws sts get-caller-identity

# Health check
curl -s http://localhost:8080/actuator/health/readiness | jq .

# Secrets import
aws secretsmanager get-secret-value --secret-id prod/payment-db --query SecretString

# SQS send test (after deploy)
aws sqs send-message \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/payment-settlement.fifo \\
  --message-body '{"paymentId":"pay_test","merchantId":"m_test","amountCents":100}' \\
  --message-group-id m_test \\
  --message-deduplication-id pay_test

# CloudWatch custom metric
aws cloudwatch get-metric-statistics \\
  --namespace Acme/Payment \\
  --metric-name payments.authorize \\
  --start-time $(date -u -d '5 min ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 60 --statistics Sum`,
    pitfalls:
      'Hardcoding AWS access keys in application.yml or ECS task env — use default credentials chain. spring.config.import secrets after datasource already initialized — import order matters. Hikari pool sized for direct Aurora endpoint instead of RDS Proxy — exhausts connections on failover. @SqsListener without idempotency — duplicate settlement on retry. MSK without IAM auth config — connection refused on production cluster. CloudWatch high-cardinality tags (paymentId as dimension) — cost explosion.',
    production:
      'Spring Boot 3 + spring-cloud-aws 3.x: Secrets Manager import, DefaultCredentialsProvider (IRSA/task role), RDS Proxy JDBC URL, DynamoDB idempotency, Redis rate limit, SQS FIFO with DLQ, MSK IAM auth, Micrometer → CloudWatch. Actuator readiness gates ALB traffic. No access keys anywhere in prod artifacts.',
    interview30s:
      'Spring on AWS: spring.config.import for Secrets Manager; DefaultCredentialsProvider picks up IRSA or ECS task role; JDBC through RDS Proxy; DynamoDB Enhanced Client for idempotency; spring-cloud-aws SQS @SqsListener; Spring Kafka with MSK IAM; Micrometer exports to CloudWatch. Never embed access keys.',
    interview2m:
      'Walk payment POST: rate limit in Redis → DynamoDB idempotency check → JPA save to Aurora via RDS Proxy → publish to MSK → enqueue SQS settlement. Credentials: on EKS, IRSA injects web identity token; DefaultCredentialsProvider resolves automatically. Secrets rotation: RDS Proxy + IAM auth avoids password rotation restarts. SQS listener idempotency via paymentId dedup. CloudWatch: Micrometer for standard metrics, direct PutMetricData for low-cardinality business KPIs. Compare spring-cloud-aws SqsTemplate vs AWS SDK v2 for fine-grained control.',
    traps:
      '"Use @Value for AWS keys" — instant fail in security review. "Shared credentials on EKS nodes" — must use IRSA per pod. "Spring Cloud AWS 2.x config" — Boot 3 needs spring-cloud-aws 3.x package (io.awspring.cloud). Forgetting FIFO messageGroupId on SqsTemplate send.',
  },
];
