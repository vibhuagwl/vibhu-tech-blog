package com.vibhu.msp.order.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.msp.common.CorrelationIdContext;
import com.vibhu.msp.common.EventEnvelope;
import com.vibhu.msp.common.events.EventTypes;
import com.vibhu.msp.common.events.OrderCancelled;
import com.vibhu.msp.common.events.OrderCompleted;
import com.vibhu.msp.common.events.OrderCreated;
import com.vibhu.msp.order.client.PaymentClient;
import com.vibhu.msp.order.entity.OrderEntity;
import com.vibhu.msp.order.entity.OrderEntity.OrderStatus;
import com.vibhu.msp.order.entity.OrderLineEntity;
import com.vibhu.msp.order.repository.OrderLineRepository;
import com.vibhu.msp.order.repository.OrderRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

  private static final Logger log = LoggerFactory.getLogger(OrderService.class);

  private final OrderRepository orderRepository;
  private final OrderLineRepository orderLineRepository;
  private final OutboxService outboxService;
  private final PaymentClient paymentClient;
  private final ObjectMapper objectMapper;

  public OrderService(OrderRepository orderRepository,
                      OrderLineRepository orderLineRepository,
                      OutboxService outboxService,
                      PaymentClient paymentClient,
                      ObjectMapper objectMapper) {
    this.orderRepository = orderRepository;
    this.orderLineRepository = orderLineRepository;
    this.outboxService = outboxService;
    this.paymentClient = paymentClient;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public OrderEntity createOrder(String idempotencyKey, String customerId,
                                 List<CreateOrderLine> lines) {
    if (idempotencyKey != null && !idempotencyKey.isBlank()) {
      return orderRepository.findByIdempotencyKey(idempotencyKey)
          .orElseGet(() -> persistNewOrder(idempotencyKey, customerId, lines));
    }
    return persistNewOrder(null, customerId, lines);
  }

  private OrderEntity persistNewOrder(String idempotencyKey, String customerId,
                                      List<CreateOrderLine> lines) {
    String orderId = UUID.randomUUID().toString();
    BigDecimal total = lines.stream()
        .map(l -> l.unitPrice().multiply(BigDecimal.valueOf(l.quantity())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    OrderEntity order = new OrderEntity();
    order.setId(orderId);
    order.setCustomerId(customerId);
    order.setTotalAmount(total);
    order.setStatus(OrderStatus.PENDING);
    order.setIdempotencyKey(idempotencyKey);
    order.setCorrelationId(CorrelationIdContext.getOrCreate());
    order.setCreatedAt(Instant.now());
    order.setUpdatedAt(Instant.now());
    orderRepository.save(order);

    for (CreateOrderLine line : lines) {
      OrderLineEntity lineEntity = new OrderLineEntity();
      lineEntity.setId(UUID.randomUUID().toString());
      lineEntity.setOrderId(orderId);
      lineEntity.setSku(line.sku());
      lineEntity.setQuantity(line.quantity());
      lineEntity.setUnitPrice(line.unitPrice());
      orderLineRepository.save(lineEntity);
    }

    List<OrderCreated.OrderLine> eventLines = lines.stream()
        .map(l -> new OrderCreated.OrderLine(l.sku(), l.quantity(), l.unitPrice()))
        .toList();
    OrderCreated event = new OrderCreated(orderId, customerId, total, eventLines);
    EventEnvelope<OrderCreated> envelope = EventEnvelope.of(
        EventTypes.ORDER_CREATED,
        order.getCorrelationId(),
        event
    );
    outboxService.enqueue("Order", orderId, EventTypes.ORDER_CREATED, envelope);

    log.info("Order created orderId={} customerId={} total={}", orderId, customerId, total);

  try {
      paymentClient.ping();
    } catch (Exception ex) {
      log.warn("Payment service ping failed (saga continues via Kafka): {}", ex.getMessage());
    }

    return order;
  }

  @Transactional
  public void markPaymentAuthorized(String orderId) {
    orderRepository.findById(orderId).ifPresent(order -> {
      if (order.getStatus() == OrderStatus.CANCELLED) {
        return;
      }
      order.setPaymentAuthorized(true);
      order.setUpdatedAt(Instant.now());
      orderRepository.save(order);
      tryCompleteOrder(order);
    });
  }

  @Transactional
  public void markInventoryReserved(String orderId) {
    orderRepository.findById(orderId).ifPresent(order -> {
      if (order.getStatus() == OrderStatus.CANCELLED) {
        return;
      }
      order.setInventoryReserved(true);
      order.setUpdatedAt(Instant.now());
      orderRepository.save(order);
      tryCompleteOrder(order);
    });
  }

  private void tryCompleteOrder(OrderEntity order) {
    if (order.getStatus() == OrderStatus.COMPLETED) {
      return;
    }
    if (order.isPaymentAuthorized() && order.isInventoryReserved()) {
      order.setStatus(OrderStatus.COMPLETED);
      order.setUpdatedAt(Instant.now());
      orderRepository.save(order);
      EventEnvelope<OrderCompleted> envelope = EventEnvelope.of(
          EventTypes.ORDER_COMPLETED,
          order.getCorrelationId(),
          new OrderCompleted(order.getId())
      );
      outboxService.enqueue("Order", order.getId(), EventTypes.ORDER_COMPLETED, envelope);
      log.info("Order completed orderId={}", order.getId());
    }
  }

  @Transactional
  public void cancelOrder(String orderId, String reason) {
    orderRepository.findById(orderId).ifPresent(order -> {
      if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.COMPLETED) {
        return;
      }
      order.setStatus(OrderStatus.CANCELLED);
      order.setUpdatedAt(Instant.now());
      orderRepository.save(order);
      EventEnvelope<OrderCancelled> envelope = EventEnvelope.of(
          EventTypes.ORDER_CANCELLED,
          order.getCorrelationId(),
          new OrderCancelled(orderId, reason)
      );
      outboxService.enqueue("Order", orderId, EventTypes.ORDER_CANCELLED, envelope);
      log.info("Order cancelled orderId={} reason={}", orderId, reason);
    });
  }

  public OrderEntity getOrder(String orderId) {
    return orderRepository.findById(orderId).orElse(null);
  }

  public record CreateOrderLine(String sku, int quantity, BigDecimal unitPrice) {}
}
