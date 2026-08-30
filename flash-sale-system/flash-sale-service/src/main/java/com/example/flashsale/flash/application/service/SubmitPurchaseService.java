package com.example.flashsale.flash.application.service;

import com.example.flashsale.common.error.ErrorCode;
import com.example.flashsale.common.error.FlashSaleException;
import com.example.flashsale.common.event.EventEnvelope;
import com.example.flashsale.common.event.JsonEvents;
import com.example.flashsale.common.kafka.Topics;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class SubmitPurchaseService {

    private final FlashSaleRepository sales;
    private final FlashSaleProductRepository products;
    private final IdempotencyRecordRepository idempotency;
    private final OutboxEventRepository outbox;
    private final InventoryGate gate;
    private final PurchaseRateLimiter rateLimiter;

    public SubmitPurchaseService(FlashSaleRepository sales, FlashSaleProductRepository products,
            IdempotencyRecordRepository idempotency, OutboxEventRepository outbox, InventoryGate gate,
            PurchaseRateLimiter rateLimiter) {
        this.sales = sales;
        this.products = products;
        this.idempotency = idempotency;
        this.outbox = outbox;
        this.gate = gate;
        this.rateLimiter = rateLimiter;
    }

    @Transactional
    public PurchaseAccepted submit(String userId, String saleId, String ip, PurchaseRequest request) {
        if (!rateLimiter.allow(userId, ip)) {
            throw new FlashSaleException(ErrorCode.RATE_LIMITED, "Slow down");
        }
        return idempotency.findByUserIdAndOperationAndIdempotencyKey(userId, "PURCHASE", request.idempotencyKey())
                .map(r -> parse(r.getResponseBody()))
                .orElseGet(() -> createNew(userId, saleId, request));
    }

    private PurchaseAccepted createNew(String userId, String saleId, PurchaseRequest request) {
        FlashSale sale = sales.findById(saleId)
                .orElseThrow(() -> new FlashSaleException(ErrorCode.INVALID_REQUEST, "Unknown sale"));
        FlashSaleStates.of(sale.getStatus())
                .validatePurchase(new FlashSaleContext(saleId,
                        sale.getStatus(),
                        Instant.now(),
                        sale.getStartsAt(),
                        sale.getEndsAt()));
        if (!products.existsBySaleIdAndProductId(saleId, request.productId())) {
            throw new FlashSaleException(ErrorCode.INVALID_REQUEST, "Unknown product");
        }
        if (request.quantity() != 1) {
            throw new FlashSaleException(ErrorCode.INVALID_REQUEST, "Flash SKU quantity must be 1");
        }
        if (!gate.tryAcquire(request.productId(), request.quantity())) {
            throw new FlashSaleException(ErrorCode.PRODUCT_SOLD_OUT, "Sold out at the gate");
        }
        String orderId = UUID.randomUUID()
                .toString();
        String requestId = UUID.randomUUID()
                .toString();
        EventEnvelope env = EventEnvelope.of("OrderRequested",
                requestId,
                orderId,
                request.productId(),
                Map.of("orderId",
                        orderId,
                        "userId",
                        userId,
                        "saleId",
                        saleId,
                        "productId",
                        request.productId(),
                        "quantity",
                        request.quantity(),
                        "topic",
                        Topics.ORDER_REQUESTED));
        outbox.save(OutboxEvent.pending(env.eventId(), env.eventType(), env.partitionKey(), JsonEvents.write(env)));
        PurchaseAccepted accepted = new PurchaseAccepted(requestId, orderId, "PENDING");
        try {
            idempotency.save(new IdempotencyRecord(userId,
                    "PURCHASE",
                    request.idempotencyKey(),
                    "PENDING",
                    JsonEvents.write(accepted)));
        } catch (DataIntegrityViolationException duplicate) {
            gate.release(request.productId(), request.quantity());
            return idempotency.findByUserIdAndOperationAndIdempotencyKey(userId, "PURCHASE", request.idempotencyKey())
                    .map(r -> parse(r.getResponseBody()))
                    .orElseThrow();
        }
        return accepted;
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
