package com.example.flashsale.order.application.saga;

import com.example.flashsale.common.error.ErrorCode;
import com.example.flashsale.common.error.FlashSaleException;
import com.example.flashsale.common.event.*;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Chapter 3 of {@link PurchaseStory}.
 * <p>
 * This service holds the plot, not the stock and not the card. PaymentSucceeded cannot revive a
 * cancelled order. PaymentFailed cannot unwind a paid one. Payment is requested only the first
 * time the saga walks STARTED → PAYMENT_PENDING.
 */
@Service
public class SagaOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(SagaOrchestrator.class);

    private final CustomerOrderRepository orders;
    private final SagaTransactionRepository sagas;
    private final OutboxEventRepository outbox;
    private final ProcessedEventRepository processed;

    public SagaOrchestrator(
            CustomerOrderRepository orders,
            SagaTransactionRepository sagas,
            OutboxEventRepository outbox,
            ProcessedEventRepository processed) {
        this.orders = orders;
        this.sagas = sagas;
        this.outbox = outbox;
        this.processed = processed;
    }

    @Transactional
    public void onInventoryReserved(EventEnvelope env) {
        if (alreadyHeard(env)) {
            return;
        }
        OrderFacts facts = OrderFacts.saga(env);
        Optional<CustomerOrder> order = openOrderOrGiveUnitBack(facts, env.correlationId());
        if (order.isEmpty()) {
            remember(env);
            return;
        }
        if (walkTowardPayment(facts.orderId())) {
            tell(PurchaseStory.paymentRequested(facts, env.correlationId()));
        }
        remember(env);
    }

    @Transactional
    public void onPaymentSucceeded(EventEnvelope env) {
        if (alreadyHeard(env)) {
            return;
        }
        CustomerOrder order = orders.findById(EventPayloads.requireText(env, "orderId"))
                .orElseThrow();
        if (!order.confirm()) {
            log.warn("PaymentSucceeded after the plot already ended orderId={} status={}",
                    order.getOrderId(),
                    order.getStatus());
            remember(env);
            return;
        }
        OrderFacts facts = factsOf(order);
        finishHappyPath(facts);
        tell(PurchaseStory.orderConfirmed(facts, env.correlationId()));
        tell(PurchaseStory.notify(facts, env.correlationId()));
        remember(env);
    }

    @Transactional
    public void onPaymentFailed(EventEnvelope env) {
        if (alreadyHeard(env)) {
            return;
        }
        CustomerOrder order = orders.findById(EventPayloads.requireText(env, "orderId"))
                .orElseThrow();
        if (order.getStatus() == OrderStatus.CONFIRMED || !order.cancel()) {
            log.warn("PaymentFailed ignored for terminal orderId={} status={}", order.getOrderId(), order.getStatus());
            remember(env);
            return;
        }
        OrderFacts facts = factsOf(order);
        compensate(facts, env.correlationId());
        tell(PurchaseStory.orderCancelled(facts, env.correlationId()));
        remember(env);
    }

    @Transactional
    public void cancelByUser(String orderId) {
        CustomerOrder order = orders.findById(orderId)
                .orElseThrow(() -> new FlashSaleException(ErrorCode.INVALID_REQUEST, "Unknown order"));
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return;
        }
        if (order.getStatus() == OrderStatus.CONFIRMED || !order.cancel()) {
            throw new FlashSaleException(ErrorCode.INVALID_REQUEST, "Cannot cancel a confirmed order");
        }
        compensate(factsOf(order), orderId);
    }

    /**
     * One phone per shopper. A losing orderId still reserved stock — give it back instead of
     * throwing on UNIQUE(user, sale, product).
     */
    private Optional<CustomerOrder> openOrderOrGiveUnitBack(OrderFacts facts, String correlationId) {
        Optional<CustomerOrder> holder =
                orders.findByUserIdAndFlashSaleIdAndProductId(facts.userId(), facts.saleId(), facts.productId());
        if (holder.isPresent() && !holder.get()
                .getOrderId()
                .equals(facts.orderId())) {
            log.warn("duplicate SKU losingOrderId={} winningOrderId={}",
                    facts.orderId(),
                    holder.get()
                            .getOrderId());
            tell(PurchaseStory.releaseInventory(facts, correlationId));
            return Optional.empty();
        }
        try {
            return Optional.of(orders.findById(facts.orderId())
                    .orElseGet(() -> orders.save(CustomerOrder.pending(
                            facts.orderId(), facts.userId(), facts.saleId(), facts.productId(), facts.quantity()))));
        } catch (DataIntegrityViolationException race) {
            CustomerOrder winner = orders
                    .findByUserIdAndFlashSaleIdAndProductId(facts.userId(), facts.saleId(), facts.productId())
                    .orElseThrow();
            if (!winner.getOrderId()
                    .equals(facts.orderId())) {
                tell(PurchaseStory.releaseInventory(facts, correlationId));
            }
            return Optional.empty();
        }
    }

    private boolean walkTowardPayment(String orderId) {
        SagaTransaction saga = sagas.findByOrderId(orderId)
                .orElseGet(() -> sagas.save(SagaTransaction.start(orderId)));
        if (saga.getStatus() != SagaStatus.STARTED) {
            return false;
        }
        saga.tryTransition(SagaStatus.INVENTORY_RESERVED);
        return saga.tryTransition(SagaStatus.PAYMENT_PENDING);
    }

    private void finishHappyPath(OrderFacts facts) {
        sagas.findByOrderId(facts.orderId())
                .ifPresent(s -> {
                    s.tryTransition(SagaStatus.PAYMENT_COMPLETED);
                    s.tryTransition(SagaStatus.COMPLETED);
                });
    }

    private void compensate(OrderFacts facts, String correlationId) {
        sagas.findByOrderId(facts.orderId())
                .ifPresent(s -> {
                    s.tryTransition(SagaStatus.COMPENSATING);
                    s.tryTransition(SagaStatus.COMPENSATED);
                });
        tell(PurchaseStory.releaseInventory(facts, correlationId));
    }

    private boolean alreadyHeard(EventEnvelope env) {
        return processed.existsById(env.eventId());
    }

    private void remember(EventEnvelope env) {
        processed.save(new ProcessedEvent(env.eventId()));
    }

    private void tell(EventEnvelope env) {
        outbox.save(OutboxEvent.pending(env.eventId(), env.eventType(), env.partitionKey(), JsonEvents.write(env)));
    }

    private static OrderFacts factsOf(CustomerOrder order) {
        return OrderFacts.of(
                order.getOrderId(), order.getUserId(), order.getFlashSaleId(), order.getProductId(), order.getQuantity());
    }
}
