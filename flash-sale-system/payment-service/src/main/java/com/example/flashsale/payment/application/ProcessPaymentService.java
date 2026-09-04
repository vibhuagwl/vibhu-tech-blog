package com.example.flashsale.payment.application;

import com.example.flashsale.common.event.EventEnvelope;
import com.example.flashsale.common.event.EventPayloads;
import com.example.flashsale.common.event.JsonEvents;
import com.example.flashsale.common.event.PurchaseStory;
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

/**
 * Chapter 4 of {@link PurchaseStory}.
 *
 * Decide (short TX) → charge the PSP (no connection held) → write the ending (short TX).
 * A second PaymentRequested with a new eventId still keys the charge on orderId, so the
 * card is not hit twice.
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
        String orderId = EventPayloads.requireText(env, "orderId");
        ChargePlan plan = transactions.execute(status -> shouldCharge(env, orderId));
        if (plan != ChargePlan.CHARGE) {
            return;
        }
        PaymentResult result = paymentClient.charge(new PaymentRequest(orderId, orderId));
        transactions.executeWithoutResult(status -> writeEnding(env, orderId, result));
    }

    private ChargePlan shouldCharge(EventEnvelope env, String orderId) {
        if (processed.existsById(env.eventId())) {
            return ChargePlan.SKIP;
        }
        Payment payment = payments.findByOrderId(orderId)
                .orElseGet(() -> payments.save(Payment.initiated(orderId)));
        if (payment.isTerminal()) {
            processed.save(new ProcessedEvent(env.eventId()));
            return ChargePlan.SKIP;
        }
        payment.markProcessing();
        return ChargePlan.CHARGE;
    }

    private void writeEnding(EventEnvelope env, String orderId, PaymentResult result) {
        if (processed.existsById(env.eventId())) {
            return;
        }
        Payment payment = payments.findByOrderId(orderId)
                .orElseGet(() -> payments.save(Payment.initiated(orderId)));
        if (payment.isSuccess()) {
            processed.save(new ProcessedEvent(env.eventId()));
            return;
        }
        if (result.success()) {
            payment.succeed();
        } else {
            payment.fail();
        }
        String topic = result.success() ? Topics.PAYMENT_SUCCEEDED : Topics.PAYMENT_FAILED;
        String type = result.success() ? "PaymentSucceeded" : "PaymentFailed";
        EventEnvelope out = PurchaseStory.paymentEnded(type,
                topic,
                orderId,
                env.correlationId(),
                result.providerReference());
        outbox.save(OutboxEvent.pending(out.eventId(), type, orderId, JsonEvents.write(out)));
        processed.save(new ProcessedEvent(env.eventId()));
    }

    private enum ChargePlan {
        SKIP,
        CHARGE
    }
}
