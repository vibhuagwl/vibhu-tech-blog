package com.example.flashsale.order.application.saga;

import com.example.flashsale.common.event.EventEnvelope;
import com.example.flashsale.common.event.JsonEvents;
import com.example.flashsale.common.kafka.Topics;
import com.example.flashsale.order.domain.model.CustomerOrder;
import com.example.flashsale.order.domain.model.OrderStatus;
import com.example.flashsale.order.domain.model.SagaStatus;
import com.example.flashsale.order.domain.model.SagaTransaction;
import com.example.flashsale.order.domain.repository.CustomerOrderRepository;
import com.example.flashsale.order.domain.repository.SagaTransactionRepository;
import com.example.flashsale.order.infrastructure.kafka.ProcessedEvent;
import com.example.flashsale.order.infrastructure.kafka.ProcessedEventRepository;
import com.example.flashsale.order.infrastructure.outbox.OutboxEvent;
import com.example.flashsale.order.infrastructure.outbox.OutboxEventRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class SagaOrchestrator {

    private final CustomerOrderRepository orders;
    private final SagaTransactionRepository sagas;
    private final OutboxEventRepository outbox;
    private final ProcessedEventRepository processed;

    public SagaOrchestrator(CustomerOrderRepository orders, SagaTransactionRepository sagas,
            OutboxEventRepository outbox, ProcessedEventRepository processed) {
        this.orders = orders;
        this.sagas = sagas;
        this.outbox = outbox;
        this.processed = processed;
    }

    @Transactional
    public void onInventoryReserved(EventEnvelope env) {
        if (already(env)) {
            return;
        }
        String orderId = str(env, "orderId");
        CustomerOrder order = orders.findById(orderId)
                .orElseGet(() -> {
                    try {
                        return orders.save(CustomerOrder.pending(orderId,
                                str(env, "userId"),
                                str(env, "saleId"),
                                str(env, "productId"),
                                num(env, "quantity")));
                    } catch (DataIntegrityViolationException dup) {
                        return orders.findById(orderId)
                                .orElseThrow();
                    }
                });
        SagaTransaction saga = sagas.findByOrderId(orderId)
                .orElseGet(() -> sagas.save(SagaTransaction.start(orderId)));
        if (saga.getStatus() == SagaStatus.STARTED) {
            saga.transition(SagaStatus.INVENTORY_RESERVED);
            saga.transition(SagaStatus.PAYMENT_PENDING);
        }
        enqueue(Topics.PAYMENT_REQUESTED, "PaymentRequested", order, env.correlationId());
        processed.save(new ProcessedEvent(env.eventId()));
    }

    @Transactional
    public void onPaymentSucceeded(EventEnvelope env) {
        if (already(env)) {
            return;
        }
        String orderId = str(env, "orderId");
        CustomerOrder order = orders.findById(orderId)
                .orElseThrow();
        order.confirm();
        sagas.findByOrderId(orderId)
                .ifPresent(s -> {
                    if (s.getStatus() == SagaStatus.PAYMENT_PENDING) {
                        s.transition(SagaStatus.PAYMENT_COMPLETED);
                        s.transition(SagaStatus.COMPLETED);
                    }
                });
        enqueue(Topics.ORDER_CONFIRMED, "OrderConfirmed", order, env.correlationId());
        enqueue(Topics.NOTIFICATION_REQUESTED, "NotificationRequested", order, env.correlationId());
        processed.save(new ProcessedEvent(env.eventId()));
    }

    @Transactional
    public void onPaymentFailed(EventEnvelope env) {
        if (already(env)) {
            return;
        }
        String orderId = str(env, "orderId");
        CustomerOrder order = orders.findById(orderId)
                .orElseThrow();
        order.cancel();
        sagas.findByOrderId(orderId)
                .ifPresent(s -> {
                    if (s.getStatus()
                            .canTransitionTo(SagaStatus.COMPENSATING)) {
                        s.transition(SagaStatus.COMPENSATING);
                        s.transition(SagaStatus.COMPENSATED);
                    }
                });
        EventEnvelope release = EventEnvelope.of("InventoryReleaseRequested",
                env.correlationId(),
                orderId,
                order.getProductId(),
                Map.of("orderId",
                        orderId,
                        "productId",
                        order.getProductId(),
                        "quantity",
                        order.getQuantity(),
                        "topic",
                        Topics.INVENTORY_RELEASE_REQUESTED));
        outbox.save(OutboxEvent.pending(release.eventId(),
                release.eventType(),
                release.partitionKey(),
                JsonEvents.write(release)));
        enqueue(Topics.ORDER_CANCELLED, "OrderCancelled", order, env.correlationId());
        processed.save(new ProcessedEvent(env.eventId()));
    }

    @Transactional
    public void cancelByUser(String orderId) {
        CustomerOrder order = orders.findById(orderId)
                .orElseThrow();
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return;
        }
        order.cancel();
        sagas.findByOrderId(orderId)
                .ifPresent(s -> {
                    if (s.getStatus()
                            .canTransitionTo(SagaStatus.COMPENSATING)) {
                        s.transition(SagaStatus.COMPENSATING);
                        s.transition(SagaStatus.COMPENSATED);
                    }
                });
        EventEnvelope release = EventEnvelope.of("InventoryReleaseRequested",
                orderId,
                orderId,
                order.getProductId(),
                Map.of("orderId",
                        orderId,
                        "productId",
                        order.getProductId(),
                        "quantity",
                        order.getQuantity(),
                        "topic",
                        Topics.INVENTORY_RELEASE_REQUESTED));
        outbox.save(OutboxEvent.pending(release.eventId(),
                release.eventType(),
                release.partitionKey(),
                JsonEvents.write(release)));
    }

    private boolean already(EventEnvelope env) {
        return processed.existsById(env.eventId());
    }

    private void enqueue(String topic, String type, CustomerOrder order, String correlationId) {
        EventEnvelope env = EventEnvelope.of(type,
                correlationId,
                order.getOrderId(),
                order.getOrderId(),
                Map.of("orderId",
                        order.getOrderId(),
                        "userId",
                        order.getUserId(),
                        "saleId",
                        order.getFlashSaleId(),
                        "productId",
                        order.getProductId(),
                        "quantity",
                        order.getQuantity(),
                        "topic",
                        topic));
        outbox.save(OutboxEvent.pending(env.eventId(), type, env.partitionKey(), JsonEvents.write(env)));
    }

    private static String str(EventEnvelope env, String key) {
        Object v = env.payload()
                .get(key);
        return v == null ? "" : String.valueOf(v);
    }

    private static int num(EventEnvelope env, String key) {
        Object v = env.payload()
                .getOrDefault(key, 1);
        return v instanceof Number n ? n.intValue() : Integer.parseInt(String.valueOf(v));
    }
}
