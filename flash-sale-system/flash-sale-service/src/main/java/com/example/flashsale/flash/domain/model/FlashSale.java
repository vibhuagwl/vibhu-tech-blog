package com.example.flashsale.flash.domain.model;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "flash_sales")
public class FlashSale {
    @Id
    @Column(name = "sale_id")
    private String saleId;

    private String name;

    @Enumerated(EnumType.STRING)
    private FlashSaleStatus status;

    @Column(name = "starts_at")
    private Instant startsAt;

    @Column(name = "ends_at")
    private Instant endsAt;

    protected FlashSale() {
    }

    public String getSaleId() {
        return saleId;
    }

    public String getName() {
        return name;
    }

    public FlashSaleStatus getStatus() {
        return status;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public Instant getEndsAt() {
        return endsAt;
    }
}
