package com.vibhu.multitenant.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.multitenant.config.MultiTenantProperties;
import com.vibhu.multitenant.outbox.OutboxEventEntity;
import com.vibhu.multitenant.outbox.OutboxEventRepository;
import com.vibhu.multitenant.tenant.TenantEntity;
import com.vibhu.multitenant.tenant.TenantRepository;
import com.vibhu.multitenant.tenant.context.TenantContext;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Outbox publisher. Default profile publishes to an in-memory bus. Infra profile can swap to Kafka.
 * Partition recommendation: key by orderId for order lifecycle order; include tenantId in envelope
 * always. For strict per-tenant global order, key by tenantId (watch hot partitions).
 */
@Component
public class OutboxPublisher {

  private static final Logger log = LoggerFactory.getLogger(OutboxPublisher.class);

  private final OutboxEventRepository outbox;
  private final TenantRepository tenants;
  private final ObjectMapper mapper;
  private final MultiTenantProperties properties;
  private final TenantEventBus bus;
  private final DeadLetterStore dlq;

  public OutboxPublisher(
      OutboxEventRepository outbox,
      TenantRepository tenants,
      ObjectMapper mapper,
      MultiTenantProperties properties,
      TenantEventBus bus,
      DeadLetterStore dlq) {
    this.outbox = outbox;
    this.tenants = tenants;
    this.mapper = mapper;
    this.properties = properties;
    this.bus = bus;
    this.dlq = dlq;
  }

  @Scheduled(fixedDelay = 500)
  @Transactional
  public void publishPending() {
    List<OutboxEventEntity> pending = outbox.findTop50ByStatusOrderByCreatedAtAsc("PENDING");
    for (OutboxEventEntity event : pending) {
      try {
        bus.publish(properties.getKafka().getTopicOrders(), event.getAggregateId(), event.getPayload());
        event.setStatus("PUBLISHED");
        event.setPublishedAt(Instant.now());
        outbox.save(event);
      } catch (Exception ex) {
        log.warn("Outbox publish failed eventId={}", event.getEventId());
        dlq.store(event, ex.getMessage());
        event.setStatus("FAILED");
        outbox.save(event);
      }
    }
  }

  @Component
  public static class TenantOrderConsumer {
    private static final Logger log = LoggerFactory.getLogger(TenantOrderConsumer.class);
    private final ObjectMapper mapper;
    private final TenantRepository tenants;
    private final CopyOnWriteArrayList<String> consumed = new CopyOnWriteArrayList<>();

    public TenantOrderConsumer(ObjectMapper mapper, TenantRepository tenants, TenantEventBus bus) {
      this.mapper = mapper;
      this.tenants = tenants;
      bus.subscribe(
          "tenant.orders",
          (key, payload) -> {
            try {
              JsonNode node = mapper.readTree(payload);
              String tenantId = node.path("tenantId").asText(null);
              String tenantSlug = node.path("tenantSlug").asText(null);
              if (tenantId == null) {
                throw new IllegalArgumentException("Kafka payload missing tenantId");
              }
              TenantEntity tenant =
                  tenants
                      .findById(UUID.fromString(tenantId))
                      .orElseThrow(() -> new IllegalArgumentException("Unknown tenant in event"));
              try {
                TenantContext.set(
                    new TenantContext.TenantSnapshot(
                        tenant.getId(),
                        tenant.getSlug(),
                        tenant.getStatus().name(),
                        tenant.getDatabaseStrategy().name(),
                        null,
                        null));
                MDC.put("tenantId", tenantSlug == null ? tenant.getSlug() : tenantSlug);
                consumed.add(node.path("eventId").asText());
                log.info(
                    "Consumed tenant event type={} aggregate={}",
                    node.path("eventType").asText(),
                    node.path("aggregateId").asText());
              } finally {
                TenantContext.clear();
                MDC.remove("tenantId");
              }
            } catch (Exception e) {
              throw new IllegalStateException(e);
            }
          });
    }

    public List<String> consumedEventIds() {
      return List.copyOf(consumed);
    }
  }
}
