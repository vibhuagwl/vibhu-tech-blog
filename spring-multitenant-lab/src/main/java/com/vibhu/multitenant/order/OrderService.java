package com.vibhu.multitenant.order;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.multitenant.audit.AuditLogEntity;
import com.vibhu.multitenant.audit.AuditLogRepository;
import com.vibhu.multitenant.cache.TenantRateLimiter;
import com.vibhu.multitenant.common.OrderStatus;
import com.vibhu.multitenant.customer.CustomerRepository;
import com.vibhu.multitenant.exception.TenantExceptions;
import com.vibhu.multitenant.outbox.OutboxEventEntity;
import com.vibhu.multitenant.outbox.OutboxEventRepository;
import com.vibhu.multitenant.tenant.context.TenantContext;
import com.vibhu.multitenant.tenant.service.TenantConfigService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

  private final OrderRepository orders;
  private final CustomerRepository customers;
  private final OutboxEventRepository outbox;
  private final AuditLogRepository audits;
  private final TenantConfigService configs;
  private final TenantRateLimiter rateLimiter;
  private final ObjectMapper mapper;

  public OrderService(
      OrderRepository orders,
      CustomerRepository customers,
      OutboxEventRepository outbox,
      AuditLogRepository audits,
      TenantConfigService configs,
      TenantRateLimiter rateLimiter,
      ObjectMapper mapper) {
    this.orders = orders;
    this.customers = customers;
    this.outbox = outbox;
    this.audits = audits;
    this.configs = configs;
    this.rateLimiter = rateLimiter;
    this.mapper = mapper;
  }

  @Transactional
  public OrderEntity create(UUID customerId, BigDecimal amount) {
    rateLimiter.checkAndIncrement();
    UUID tenantId = TenantContext.requireTenantId();
    customers
        .findByIdAndTenantId(customerId, tenantId)
        .orElseThrow(() -> TenantExceptions.notFound("customer"));
    OrderEntity order = new OrderEntity();
    order.setId(UUID.randomUUID());
    order.setTenantId(tenantId);
    order.setCustomerId(customerId);
    order.setAmount(amount);
    order.setCurrency(configs.getCurrent().getCurrency());
    order.setStatus(OrderStatus.CREATED);
    order.setCreatedBy(TenantContext.get() == null ? null : TenantContext.get().userId());
    order.setCreatedAt(Instant.now());
    order.setUpdatedAt(Instant.now());
    OrderEntity saved = orders.save(order);
    writeOutbox(saved, "ORDER_CREATED");
    audit("ORDER_CREATED", saved.getId().toString(), null);
    return saved;
  }

  @Transactional(readOnly = true)
  public OrderEntity get(UUID orderId) {
    // NEVER findById alone — always scope by tenant.
    return orders
        .findByIdAndTenantId(orderId, TenantContext.requireTenantId())
        .orElseThrow(() -> TenantExceptions.notFound("order"));
  }

  @Transactional(readOnly = true)
  public Page<OrderEntity> list(Pageable pageable) {
    return orders.findAllByTenantId(TenantContext.requireTenantId(), pageable);
  }

  @Transactional
  public OrderEntity cancel(UUID orderId) {
    OrderEntity order = get(orderId);
    order.setStatus(OrderStatus.CANCELLED);
    order.setUpdatedAt(Instant.now());
    OrderEntity saved = orders.save(order);
    writeOutbox(saved, "ORDER_CANCELLED");
    audit("ORDER_CANCELLED", saved.getId().toString(), null);
    return saved;
  }

  private void writeOutbox(OrderEntity order, String type) {
    try {
      OutboxEventEntity event = new OutboxEventEntity();
      event.setId(UUID.randomUUID());
      event.setTenantId(order.getTenantId());
      event.setEventId(UUID.randomUUID().toString());
      event.setEventType(type);
      event.setAggregateId(order.getId().toString());
      event.setPayload(
          mapper.writeValueAsString(
              Map.of(
                  "eventId", event.getEventId(),
                  "tenantId", order.getTenantId().toString(),
                  "tenantSlug", TenantContext.requireTenantSlug(),
                  "eventType", type,
                  "aggregateId", order.getId().toString(),
                  "timestamp", Instant.now().toString(),
                  "payload",
                      Map.of(
                          "orderId", order.getId().toString(),
                          "amount", order.getAmount(),
                          "status", order.getStatus().name()))));
      event.setStatus("PENDING");
      outbox.save(event);
    } catch (Exception e) {
      throw new IllegalStateException("Unable to write outbox", e);
    }
  }

  private void audit(String action, String entityId, String detail) {
    AuditLogEntity log = new AuditLogEntity();
    log.setId(UUID.randomUUID());
    log.setTenantId(TenantContext.requireTenantId());
    log.setActorUserId(TenantContext.get() == null ? null : TenantContext.get().userId());
    log.setAction(action);
    log.setEntityType("ORDER");
    log.setEntityId(entityId);
    log.setDetail(detail);
    audits.save(log);
  }
}
