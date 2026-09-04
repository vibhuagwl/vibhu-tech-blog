package com.example.flashsale.order.domain.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "saga_transactions")
public class SagaTransaction {
    @Id
    @Column(name = "saga_id")
    private String sagaId;

    @Column(name = "order_id", nullable = false, unique = true)
    private String orderId;

    @Enumerated(EnumType.STRING)
    private SagaStatus status;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    protected SagaTransaction() {
    }

    public static SagaTransaction start(String orderId) {
        SagaTransaction s = new SagaTransaction();
        s.sagaId = UUID.randomUUID()
                .toString();
        s.orderId = orderId;
        s.status = SagaStatus.STARTED;
        return s;
    }

    public boolean tryTransition(SagaStatus next) {
        if (!status.canTransitionTo(next)) {
            return false;
        }
        this.status = next;
        this.updatedAt = Instant.now();
        return true;
    }

    public void transition(SagaStatus next) {
        if (!tryTransition(next)) {
            throw new IllegalStateException(status + " -> " + next);
        }
    }

    public SagaStatus getStatus() {
        return status;
    }

    public String getOrderId() {
        return orderId;
    }
}
