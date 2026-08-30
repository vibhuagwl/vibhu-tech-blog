package com.example.flashsale.inventory.domain.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "inventory_reservations")
public class InventoryReservation {

    @Id
    @Column(name = "reservation_id")
    private String reservationId;

    @Column(name = "order_id", nullable = false, unique = true)
    private String orderId;

    @Column(name = "product_id", nullable = false)
    private String productId;

    @Column(nullable = false)
    private int quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReservationStatus status;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected InventoryReservation() {
    }

    public static InventoryReservation reserve(String orderId, String productId, int quantity, Instant expiresAt) {
        InventoryReservation r = new InventoryReservation();
        r.reservationId = UUID.randomUUID()
                .toString();
        r.orderId = orderId;
        r.productId = productId;
        r.quantity = quantity;
        r.status = ReservationStatus.RESERVED;
        r.expiresAt = expiresAt;
        return r;
    }

    public String getReservationId() {
        return reservationId;
    }

    public String getOrderId() {
        return orderId;
    }

    public String getProductId() {
        return productId;
    }

    public int getQuantity() {
        return quantity;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void release() {
        if (status == ReservationStatus.RELEASED || status == ReservationStatus.EXPIRED) {
            return;
        }
        if (status != ReservationStatus.RESERVED) {
            throw new IllegalStateException("cannot release " + status);
        }
        status = ReservationStatus.RELEASED;
        updatedAt = Instant.now();
    }

    public void expire() {
        if (status != ReservationStatus.RESERVED) {
            return;
        }
        status = ReservationStatus.EXPIRED;
        updatedAt = Instant.now();
    }

    public void confirm() {
        if (status != ReservationStatus.RESERVED) {
            return;
        }
        status = ReservationStatus.CONFIRMED;
        updatedAt = Instant.now();
    }
}
