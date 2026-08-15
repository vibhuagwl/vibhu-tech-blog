package com.vibhu.msp.inventory.service;

import com.vibhu.msp.common.EventEnvelope;
import com.vibhu.msp.common.events.EventTypes;
import com.vibhu.msp.common.events.InventoryReleased;
import com.vibhu.msp.common.events.InventoryReserved;
import com.vibhu.msp.common.events.OrderCreated;
import com.vibhu.msp.inventory.entity.ReservationEntity;
import com.vibhu.msp.inventory.entity.ReservationEntity.ReservationStatus;
import com.vibhu.msp.inventory.entity.StockEntity;
import com.vibhu.msp.inventory.repository.ReservationRepository;
import com.vibhu.msp.inventory.repository.StockRepository;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

  private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

  private final StockRepository stockRepository;
  private final ReservationRepository reservationRepository;
  private final OutboxService outboxService;

  public InventoryService(
      StockRepository stockRepository,
      ReservationRepository reservationRepository,
      OutboxService outboxService) {
    this.stockRepository = stockRepository;
    this.reservationRepository = reservationRepository;
    this.outboxService = outboxService;
  }

  @Transactional
  public void reserveForOrder(OrderCreated order, String correlationId) {
    if (reservationRepository.findByOrderId(order.orderId()).isPresent()) {
      return;
    }
    for (OrderCreated.OrderLine line : order.lines()) {
      StockEntity stock =
          stockRepository
              .findById(line.sku())
              .orElseThrow(() -> new IllegalStateException("SKU not found: " + line.sku()));
      if (stock.getAvailable() < line.quantity()) {
        throw new IllegalStateException("Insufficient stock for " + line.sku());
      }
      stock.setAvailable(stock.getAvailable() - line.quantity());
      stockRepository.save(stock);
    }
    String reservationId = UUID.randomUUID().toString();
    ReservationEntity reservation = new ReservationEntity();
    reservation.setId(reservationId);
    reservation.setOrderId(order.orderId());
    reservation.setSku(order.lines().get(0).sku());
    reservation.setQuantity(order.lines().get(0).quantity());
    reservation.setStatus(ReservationStatus.RESERVED);
    reservation.setCreatedAt(Instant.now());
    reservationRepository.save(reservation);

    EventEnvelope<InventoryReserved> envelope =
        EventEnvelope.of(
            EventTypes.INVENTORY_RESERVED,
            correlationId,
            new InventoryReserved(order.orderId(), reservationId));
    outboxService.enqueue("Inventory", reservationId, EventTypes.INVENTORY_RESERVED, envelope);
    log.info("Inventory reserved orderId={} reservationId={}", order.orderId(), reservationId);
  }

  @Transactional
  public void releaseForOrder(String orderId, String reason, String correlationId) {
    reservationRepository
        .findByOrderId(orderId)
        .ifPresent(
            reservation -> {
              if (reservation.getStatus() == ReservationStatus.RELEASED) {
                return;
              }
              StockEntity stock = stockRepository.findById(reservation.getSku()).orElse(null);
              if (stock != null) {
                stock.setAvailable(stock.getAvailable() + reservation.getQuantity());
                stockRepository.save(stock);
              }
              reservation.setStatus(ReservationStatus.RELEASED);
              reservationRepository.save(reservation);
              EventEnvelope<InventoryReleased> envelope =
                  EventEnvelope.of(
                      EventTypes.INVENTORY_RELEASED,
                      correlationId,
                      new InventoryReleased(orderId, reservation.getId(), reason));
              outboxService.enqueue(
                  "Inventory", reservation.getId(), EventTypes.INVENTORY_RELEASED, envelope);
              log.info("Inventory released orderId={}", orderId);
            });
  }
}
