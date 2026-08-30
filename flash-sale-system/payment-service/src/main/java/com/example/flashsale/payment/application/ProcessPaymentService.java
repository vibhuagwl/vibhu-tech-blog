package com.example.flashsale.payment.application;

import com.example.flashsale.common.event.EventEnvelope;
import com.example.flashsale.common.event.JsonEvents;
import com.example.flashsale.common.kafka.Topics;
import com.example.flashsale.payment.domain.model.Payment;
import com.example.flashsale.payment.domain.model.PaymentRepository;
import com.example.flashsale.payment.domain.strategy.PaymentRequest;
import com.example.flashsale.payment.domain.strategy.PaymentResult;
import com.example.flashsale.payment.infrastructure.kafka.ProcessedEvent;
import com.example.flashsale.payment.infrastructure.kafka.ProcessedEventRepository;
import com.example.flashsale.payment.infrastructure.outbox.OutboxEvent;
import com.example.flashsale.payment.infrastructure.outbox.OutboxEventRepository;
import com.example.flashsale.payment.infrastructure.resilience.ResilientPaymentClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Map;

/**
 * Provider call is outside the DB transaction. WHY: a 2s Stripe timeout must not hold a
 * connection. Dual-write is still outbox after the provider returns.
 */
@Service
public class ProcessPaymentService {
    private final PaymentRepository payments;
    private final ResilientPaymentClient paymentClient;
    private final OutboxEventRepository outbox;
    private final ProcessedEventRepository processed;
    private final TransactionTemplate transactions;

    public ProcessPaymentService(
            PaymentRepository payments,
            ResilientPaymentClient paymentClient,
            OutboxEventRepository outbox,
            ProcessedEventRepository processed,
            PlatformTransactionManager transactionManager) {
        this.payments = payments;
        this.paymentClient = paymentClient;
        this.outbox = outbox;
        this.processed = processed;
        this.transactions = new TransactionTemplate(transactionManager);
    }

    public void handle(EventEnvelope env) {
        Boolean skip = transactions.execute(status -> processed.existsById(env.eventId()));
        if (Boolean.TRUE.equals(skip)) {
            return;
        }
        String orderId = String.valueOf(env.payload()
                .get("orderId"));
        transactions.executeWithoutResult(status -> payments
                .findByOrderId(orderId)
                .orElseGet(() -> payments.save(Payment.initiated(orderId))));
        PaymentResult result = paymentClient.charge(new PaymentRequest(orderId, orderId));
        transactions.executeWithoutResult(status -> persistOutcome(env, orderId, result));
    }

    private void persistOutcome(EventEnvelope env, String orderId, PaymentResult result) {
        if (processed.existsById(env.eventId())) {
            return;
        }
        Payment payment = payments.findByOrderId(orderId)
                .orElseGet(() -> payments.save(Payment.initiated(orderId)));
        String topic = result.success() ? Topics.PAYMENT_SUCCEEDED : Topics.PAYMENT_FAILED;
        String type = result.success() ? "PaymentSucceeded" : "PaymentFailed";
        if (result.success()) {
            payment.succeed();
        } else {
            payment.fail();
        }
        EventEnvelope out = EventEnvelope.of(
                type,
                env.correlationId(),
                orderId,
                orderId,
                Map.of("orderId", orderId, "topic", topic, "provider", result.providerReference()));
        outbox.save(OutboxEvent.pending(out.eventId(), type, orderId, JsonEvents.write(out)));
        processed.save(new ProcessedEvent(env.eventId()));
    }
}
