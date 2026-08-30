package com.example.flashsale.inventory.domain.model;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "inventory")
public class Inventory {

    @Id
    @Column(name = "product_id")
    private String productId;

    @Column(name = "available_quantity", nullable = false)
    private int availableQuantity;

    @Column(name = "reserved_quantity", nullable = false)
    private int reservedQuantity;

    @Column(name = "sold_quantity", nullable = false)
    private int soldQuantity;

    @Column(name = "initial_quantity", nullable = false)
    private int initialQuantity;

    /**
     * Optimistic lock for admin/restock and Approach 1. The hot path does NOT use this
     * (atomic SQL). If removed on the optimistic strategy, lost updates return.
     */
    @Version
    private Long version;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected Inventory() {
    }

    public Inventory(String productId, int initialQuantity) {
        this.productId = productId;
        this.initialQuantity = initialQuantity;
        this.availableQuantity = initialQuantity;
    }

    public String getProductId() {
        return productId;
    }

    public int getAvailableQuantity() {
        return availableQuantity;
    }

    public int getReservedQuantity() {
        return reservedQuantity;
    }

    public int getSoldQuantity() {
        return soldQuantity;
    }

    public int getInitialQuantity() {
        return initialQuantity;
    }

    public Long getVersion() {
        return version;
    }

    public void applyReserve(int qty) {
        if (availableQuantity < qty) {
            throw new IllegalStateException("insufficient");
        }
        availableQuantity -= qty;
        reservedQuantity += qty;
        updatedAt = Instant.now();
    }

    public void applyRelease(int qty) {
        reservedQuantity -= qty;
        availableQuantity += qty;
        updatedAt = Instant.now();
    }

    public void applyConfirm(int qty) {
        reservedQuantity -= qty;
        soldQuantity += qty;
        updatedAt = Instant.now();
    }
}
