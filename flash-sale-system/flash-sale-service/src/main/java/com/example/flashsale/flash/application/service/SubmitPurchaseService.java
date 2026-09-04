package com.example.flashsale.flash.application.service;

import com.example.flashsale.common.error.ErrorCode;
import com.example.flashsale.common.error.FlashSaleException;
import com.example.flashsale.common.event.EventEnvelope;
import com.example.flashsale.common.event.JsonEvents;
import com.example.flashsale.common.event.PurchaseStory;
import com.example.flashsale.flash.api.dto.PurchaseAccepted;
import com.example.flashsale.flash.api.dto.PurchaseRequest;
import com.example.flashsale.flash.domain.model.FlashSale;
import com.example.flashsale.flash.domain.repository.FlashSaleProductRepository;
import com.example.flashsale.flash.domain.repository.FlashSaleRepository;
import com.example.flashsale.flash.domain.state.FlashSaleContext;
import com.example.flashsale.flash.domain.state.FlashSaleStates;
import com.example.flashsale.flash.infrastructure.outbox.OutboxEvent;
import com.example.flashsale.flash.infrastructure.outbox.OutboxEventRepository;
import com.example.flashsale.flash.infrastructure.persistence.IdempotencyRecord;
import com.example.flashsale.flash.infrastructure.persistence.IdempotencyRecordRepository;
import com.example.flashsale.flash.infrastructure.redis.InventoryGate;
import com.example.flashsale.flash.infrastructure.redis.PurchaseRateLimiter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.UUID;

/**
 * Chapter 1 of {@link PurchaseStory}.
 * <p>
 * Redis is the bouncer, not the store room. We decrement it <em>before</em> the short Postgres
 * write so T-0 traffic never sits on a DB connection. If that write dies, we hand the ticket
 * back to Redis — otherwise the next thousand buyers are told "sold out" while the shelf is full.
 */
@Service
public class SubmitPurchaseService {

    private static final String PURCHASE = "PURCHASE";

    private final FlashSaleRepository sales;
    private final FlashSaleProductRepository products;
    private final IdempotencyRecordRepository idempotency;
    private final OutboxEventRepository outbox;
    private final InventoryGate gate;
    private final PurchaseRateLimiter rateLimiter;
    private final TransactionTemplate transactions;

    public SubmitPurchaseService(
            FlashSaleRepository sales,
            FlashSaleProductRepository products,
            IdempotencyRecordRepository idempotency,
            OutboxEventRepository outbox,
            InventoryGate gate,
            PurchaseRateLimiter rateLimiter,
            PlatformTransactionManager transactionManager) {
        this.sales = sales;
        this.products = products;
        this.idempotency = idempotency;
        this.outbox = outbox;
        this.gate = gate;
        this.rateLimiter = rateLimiter;
        this.transactions = new TransactionTemplate(transactionManager);
    }

    public PurchaseAccepted submit(String userId, String saleId, String ip, PurchaseRequest request) {
        PurchaseAccepted already = replayIfSeen(userId, request.idempotencyKey());
        if (already != null) {
            return already;
        }

        assertSaleIsLive(saleId, request);

        if (!rateLimiter.allow(userId, ip)) {
            throw new FlashSaleException(ErrorCode.RATE_LIMITED, "Slow down");
        }

        already = replayIfSeen(userId, request.idempotencyKey());
        if (already != null) {
            return already;
        }

        if (!gate.tryAcquire(request.productId(), request.quantity())) {
            throw new FlashSaleException(ErrorCode.PRODUCT_SOLD_OUT, "Sold out at the gate");
        }

        try {
            return transactions.execute(status -> writeIntent(userId, saleId, request));
        } catch (RuntimeException failed) {
            gate.release(request.productId(), request.quantity());
            if (isDuplicateKey(failed)) {
                PurchaseAccepted winner = replayIfSeen(userId, request.idempotencyKey());
                if (winner != null) {
                    return winner;
                }
            }
            throw failed;
        }
    }

    /**
     * Same finger, same key — return the first 202. Never 429 a retry we already accepted.
     */
    private PurchaseAccepted replayIfSeen(String userId, String idempotencyKey) {
        return idempotency
                .findByUserIdAndOperationAndIdempotencyKey(userId, PURCHASE, idempotencyKey)
                .map(r -> parse(r.getResponseBody()))
                .orElse(null);
    }

    private void assertSaleIsLive(String saleId, PurchaseRequest request) {
        FlashSale sale = sales.findById(saleId)
                .orElseThrow(() -> new FlashSaleException(ErrorCode.INVALID_REQUEST, "Unknown sale"));
        FlashSaleStates.of(sale.getStatus())
                .validatePurchase(new FlashSaleContext(
                        saleId, sale.getStatus(), Instant.now(), sale.getStartsAt(), sale.getEndsAt()));
        if (!products.existsBySaleIdAndProductId(saleId, request.productId())) {
            throw new FlashSaleException(ErrorCode.INVALID_REQUEST, "Unknown product");
        }
        if (request.quantity() != 1) {
            throw new FlashSaleException(ErrorCode.INVALID_REQUEST, "Flash SKU quantity must be 1");
        }
    }

    /**
     * One short transaction: outbox (the promise) + idempotency row (the receipt).
     */
    private PurchaseAccepted writeIntent(String userId, String saleId, PurchaseRequest request) {
        String orderId = UUID.randomUUID()
                .toString();
        String requestId = UUID.randomUUID()
                .toString();
        EventEnvelope env = PurchaseStory.orderRequested(
                requestId, orderId, userId, saleId, request.productId(), request.quantity());
        rememberOutbox(env);
        PurchaseAccepted accepted = new PurchaseAccepted(requestId, orderId, "PENDING");
        idempotency.save(new IdempotencyRecord(
                userId, PURCHASE, request.idempotencyKey(), "PENDING", JsonEvents.write(accepted)));
        return accepted;
    }

    private void rememberOutbox(EventEnvelope env) {
        outbox.save(OutboxEvent.pending(env.eventId(), env.eventType(), env.partitionKey(), JsonEvents.write(env)));
    }

    private static boolean isDuplicateKey(Throwable ex) {
        while (ex != null) {
            if (ex instanceof DataIntegrityViolationException) {
                return true;
            }
            String name = ex.getClass()
                    .getName();
            if (name.contains("ConstraintViolation") || name.contains("DataIntegrity")) {
                return true;
            }
            ex = ex.getCause();
        }
        return false;
    }

    private static PurchaseAccepted parse(String json) {
        try {
            return JsonEvents.mapper()
                    .readValue(json, PurchaseAccepted.class);
        } catch (Exception e) {
            throw new IllegalStateException("Corrupt idempotency body", e);
        }
    }
}
