package com.example.flashsale.inventory.application;

import com.example.flashsale.common.event.EventEnvelope;
import com.example.flashsale.common.event.JsonEvents;
import com.example.flashsale.common.kafka.Topics;
import com.example.flashsale.inventory.domain.model.InventoryReservation;
import com.example.flashsale.inventory.domain.model.ReservationStatus;
import com.example.flashsale.inventory.domain.repository.InventoryRepository;
import com.example.flashsale.inventory.domain.repository.InventoryReservationRepository;
import com.example.flashsale.inventory.domain.strategy.ReservationStrategy;
import com.example.flashsale.inventory.infrastructure.kafka.ProcessedEvent;
import com.example.flashsale.inventory.infrastructure.kafka.ProcessedEventRepository;
import com.example.flashsale.inventory.infrastructure.outbox.OutboxEvent;
import com.example.flashsale.inventory.infrastructure.outbox.OutboxEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

@Service
public class ReserveInventoryService {

    private static final Logger log = LoggerFactory.getLogger(ReserveInventoryService.class);

    private final InventoryRepository inventoryRepository;
    private final InventoryReservationRepository reservationRepository;
    private final ReservationStrategy reservationStrategy;
    private final OutboxEventRepository outboxEventRepository;
    private final ProcessedEventRepository processedEventRepository;
    private final Duration ttl;

    public ReserveInventoryService(InventoryRepository inventoryRepository,
            InventoryReservationRepository reservationRepository, ReservationStrategy reservationStrategy,
            OutboxEventRepository outboxEventRepository, ProcessedEventRepository processedEventRepository,
            @Value("${app.reservation-ttl:5m}") Duration ttl) {
        this.inventoryRepository = inventoryRepository;
        this.reservationRepository = reservationRepository;
        this.reservationStrategy = reservationStrategy;
        this.outboxEventRepository = outboxEventRepository;
        this.processedEventRepository = processedEventRepository;
        this.ttl = ttl;
    }

    /**
     * WHY one TX: inventory row + reservation + outbox + processed_event commit together.
     * If Kafka publish were in this method, a crash after commit/before send loses the event
     * OR a crash after send/before commit double-delivers without an outbox.
     */
    @Transactional
    public boolean reserve(EventEnvelope incoming) {
        if (processedEventRepository.existsById(incoming.eventId())) {
            log.info("eventId={} already processed — idempotent no-op", incoming.eventId());
            return reservationRepository.findByOrderId(String.valueOf(incoming.payload()
                            .get("orderId")))
                    .isPresent();
        }
        String orderId = String.valueOf(incoming.payload()
                .get("orderId"));
        String productId = String.valueOf(incoming.payload()
                .get("productId"));
        int qty = ((Number) incoming.payload()
                .getOrDefault("quantity", 1)).intValue();
        String correlationId = incoming.correlationId();

        if (reservationRepository.findByOrderId(orderId)
                .isPresent()) {
            processedEventRepository.save(new ProcessedEvent(incoming.eventId()));
            return true;
        }

        if (!reservationStrategy.tryReserve(productId, qty)) {
            enqueue(incoming, Topics.INVENTORY_REJECTED, "InventoryRejected", orderId, productId, qty);
            processedEventRepository.save(new ProcessedEvent(incoming.eventId()));
            return false;
        }
        reservationRepository.save(InventoryReservation.reserve(orderId,
                productId,
                qty,
                Instant.now()
                        .plus(ttl)));
        enqueue(incoming, Topics.INVENTORY_RESERVED, "InventoryReserved", orderId, productId, qty);
        processedEventRepository.save(new ProcessedEvent(incoming.eventId()));
        return true;
    }

    @Transactional
    public void release(String orderId, String incomingEventId) {
        if (incomingEventId != null && processedEventRepository.existsById(incomingEventId)) {
            return;
        }
        reservationRepository.findByOrderId(orderId)
                .ifPresent(reservation -> {
                    if (reservation.getStatus() == ReservationStatus.RESERVED) {
                        reservation.release();
                        inventoryRepository.incrementOnRelease(reservation.getProductId(), reservation.getQuantity());
                    }
                });
        if (incomingEventId != null) {
            processedEventRepository.save(new ProcessedEvent(incomingEventId));
        }
    }

    /**
     * Payment never arrived. Distinct from compensation RELEASED so ops can tell the two apart.
     */
    @Transactional
    public void expire(String orderId, String incomingEventId) {
        if (incomingEventId != null && processedEventRepository.existsById(incomingEventId)) {
            return;
        }
        reservationRepository.findByOrderId(orderId)
                .ifPresent(reservation -> {
                    if (reservation.getStatus() == ReservationStatus.RESERVED) {
                        reservation.expire();
                        inventoryRepository.incrementOnRelease(reservation.getProductId(), reservation.getQuantity());
                    }
                });
        if (incomingEventId != null) {
            processedEventRepository.save(new ProcessedEvent(incomingEventId));
        }
    }

    @Transactional
    public void confirm(String orderId, String incomingEventId) {
        if (incomingEventId != null && processedEventRepository.existsById(incomingEventId)) {
            return;
        }
        reservationRepository.findByOrderId(orderId)
                .ifPresent(reservation -> {
                    if (reservation.getStatus() == ReservationStatus.RESERVED) {
                        reservation.confirm();
                        inventoryRepository.confirmSold(reservation.getProductId(), reservation.getQuantity());
                    }
                });
        if (incomingEventId != null) {
            processedEventRepository.save(new ProcessedEvent(incomingEventId));
        }
    }

    private void enqueue(EventEnvelope incoming, String topic, String type, String orderId, String productId, int qty) {
        EventEnvelope env = EventEnvelope.of(type,
                incoming.correlationId(),
                orderId,
                orderId,
                Map.of("orderId",
                        orderId,
                        "productId",
                        productId,
                        "quantity",
                        qty,
                        "userId",
                        String.valueOf(incoming.payload()
                                .getOrDefault("userId", "")),
                        "saleId",
                        String.valueOf(incoming.payload()
                                .getOrDefault("saleId", "")),
                        "topic",
                        topic));
        outboxEventRepository.save(OutboxEvent.pending(env.eventId(), type, env.partitionKey(), JsonEvents.write(env)));
    }
}
