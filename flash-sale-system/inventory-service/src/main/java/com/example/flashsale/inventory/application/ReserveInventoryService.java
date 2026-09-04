package com.example.flashsale.inventory.application;

import com.example.flashsale.common.error.ErrorCode;
import com.example.flashsale.common.error.PermanentException;
import com.example.flashsale.common.error.TransientException;
import com.example.flashsale.common.event.EventEnvelope;
import com.example.flashsale.common.event.JsonEvents;
import com.example.flashsale.common.event.OrderFacts;
import com.example.flashsale.common.event.PurchaseStory;
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

/**
 * Chapter 2 of {@link PurchaseStory}.
 * <p>
 * One transaction owns the shelf move, the reservation row, the outbox promise, and the
 * "I already did this event" memory. Publishing Kafka here would be a dual-write: crash after
 * send and we reserved twice; crash before send and the saga never hears.
 */
@Service
public class ReserveInventoryService {

    private static final Logger log = LoggerFactory.getLogger(ReserveInventoryService.class);

    private final InventoryRepository inventoryRepository;
    private final InventoryReservationRepository reservationRepository;
    private final ReservationStrategy reservationStrategy;
    private final OutboxEventRepository outboxEventRepository;
    private final ProcessedEventRepository processedEventRepository;
    private final Duration ttl;

    public ReserveInventoryService(
            InventoryRepository inventoryRepository,
            InventoryReservationRepository reservationRepository,
            ReservationStrategy reservationStrategy,
            OutboxEventRepository outboxEventRepository,
            ProcessedEventRepository processedEventRepository,
            @Value("${app.reservation-ttl:5m}") Duration ttl) {
        this.inventoryRepository = inventoryRepository;
        this.reservationRepository = reservationRepository;
        this.reservationStrategy = reservationStrategy;
        this.outboxEventRepository = outboxEventRepository;
        this.processedEventRepository = processedEventRepository;
        this.ttl = ttl;
    }

    @Transactional
    public boolean reserve(EventEnvelope incoming) {
        if (alreadyHeard(incoming.eventId())) {
            return reservationRepository.findByOrderId(OrderFacts.stock(incoming)
                            .orderId())
                    .isPresent();
        }

        OrderFacts facts = OrderFacts.stock(incoming);
        if (facts.quantity() != 1) {
            throw new PermanentException(ErrorCode.INVALID_REQUEST, "Flash SKU quantity must be 1");
        }

        if (reservationRepository.findByOrderId(facts.orderId())
                .isPresent()) {
            remember(incoming.eventId());
            return true;
        }

        if (!reservationStrategy.tryReserve(facts.productId(), facts.quantity())) {
            tell(PurchaseStory.inventoryDecision(incoming, "InventoryRejected", Topics.INVENTORY_REJECTED, facts));
            remember(incoming.eventId());
            return false;
        }

        reservationRepository.save(InventoryReservation.reserve(
                facts.orderId(),
                facts.productId(),
                facts.quantity(),
                Instant.now()
                        .plus(ttl)));
        tell(PurchaseStory.inventoryDecision(incoming, "InventoryReserved", Topics.INVENTORY_RESERVED, facts));
        remember(incoming.eventId());
        return true;
    }

    @Transactional
    public void release(String orderId, String incomingEventId) {
        putBack(orderId, incomingEventId, ReservationStatus.RELEASED, "RELEASED");
    }

    /** Payment never answered. Same shelf math as release; a different status so ops can tell them apart. */
    @Transactional
    public void expire(String orderId, String incomingEventId) {
        putBack(orderId, incomingEventId, ReservationStatus.EXPIRED, "EXPIRED");
    }

    @Transactional
    public void confirm(String orderId, String incomingEventId) {
        if (alreadyHeard(incomingEventId)) {
            return;
        }
        InventoryReservation reservation = mustBeVisible(orderId);

        if (move(reservation, ReservationStatus.RESERVED, ReservationStatus.CONFIRMED)) {
            markSold(reservation);
            remember(incomingEventId);
            return;
        }

        InventoryReservation current = mustBeVisible(orderId);
        if (current.getStatus() == ReservationStatus.CONFIRMED) {
            remember(incomingEventId);
            return;
        }
        if (current.getStatus() == ReservationStatus.EXPIRED || current.getStatus() == ReservationStatus.RELEASED) {
            takeBackFromTheShelf(current);
        }
        remember(incomingEventId);
    }

    private void putBack(String orderId, String incomingEventId, ReservationStatus to, String reason) {
        if (alreadyHeard(incomingEventId)) {
            return;
        }
        InventoryReservation reservation = mustBeVisible(orderId);
        if (move(reservation, ReservationStatus.RESERVED, to)) {
            returnToAvailable(reservation);
            tell(PurchaseStory.inventoryReleased(factsOf(reservation), reason));
        }
        remember(incomingEventId);
    }

    /**
     * Payment succeeded after TTL already put the unit back. Steal it from available again if
     * nobody else bought it; otherwise the order is already CONFIRMED and ops has a drift to chase.
     */
    private void takeBackFromTheShelf(InventoryReservation reservation) {
        if (!reservationStrategy.tryReserve(reservation.getProductId(), reservation.getQuantity())) {
            log.error("late confirm cannot reacquire stock orderId={}", reservation.getOrderId());
            return;
        }
        if (move(reservation, reservation.getStatus(), ReservationStatus.CONFIRMED)) {
            markSold(reservation);
            return;
        }
        returnToAvailable(reservation);
        log.warn("late confirm lost CAS after re-reserve orderId={}", reservation.getOrderId());
    }

    private boolean move(InventoryReservation reservation, ReservationStatus from, ReservationStatus to) {
        return reservationRepository.casStatus(reservation.getOrderId(), from.name(), to.name()) == 1;
    }

    private boolean markSold(InventoryReservation reservation) {
        int rows = inventoryRepository.confirmSold(reservation.getProductId(), reservation.getQuantity());
        if (rows != 1) {
            log.error("confirmSold rows={} orderId={}", rows, reservation.getOrderId());
        }
        return rows == 1;
    }

    private boolean returnToAvailable(InventoryReservation reservation) {
        int rows = inventoryRepository.incrementOnRelease(reservation.getProductId(), reservation.getQuantity());
        if (rows != 1) {
            log.error("incrementOnRelease rows={} orderId={}", rows, reservation.getOrderId());
        }
        return rows == 1;
    }

    private InventoryReservation mustBeVisible(String orderId) {
        return reservationRepository
                .findByOrderId(orderId)
                .orElseThrow(() -> new TransientException(
                        ErrorCode.INVENTORY_RESERVATION_FAILED, "reservation not visible yet orderId=" + orderId));
    }

    private boolean alreadyHeard(String eventId) {
        return eventId != null && processedEventRepository.existsById(eventId);
    }

    private void remember(String eventId) {
        if (eventId != null) {
            processedEventRepository.save(new ProcessedEvent(eventId));
        }
    }

    private void tell(EventEnvelope env) {
        outboxEventRepository.save(
                OutboxEvent.pending(env.eventId(), env.eventType(), env.partitionKey(), JsonEvents.write(env)));
    }

    private static OrderFacts factsOf(InventoryReservation reservation) {
        return OrderFacts.of(
                reservation.getOrderId(), "", "", reservation.getProductId(), reservation.getQuantity());
    }
}
