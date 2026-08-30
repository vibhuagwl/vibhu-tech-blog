package com.example.flashsale.payment.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments")
public class Payment {
    @Id
    @Column(name = "payment_id")
    private String paymentId;

    @Column(name = "order_id", unique = true)
    private String orderId;

    private String status;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    protected Payment() {
    }

    public static Payment initiated(String orderId) {
        Payment p = new Payment();
        p.paymentId = UUID.randomUUID()
                .toString();
        p.orderId = orderId;
        p.status = "INITIATED";
        return p;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public String getOrderId() {
        return orderId;
    }

    public void succeed() {
        this.status = "SUCCESS";
    }

    public void fail() {
        this.status = "FAILED";
    }
}
