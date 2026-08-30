package com.example.flashsale.order.domain.model;

import java.util.Set;

public enum SagaStatus {
    STARTED,
    INVENTORY_RESERVED,
    PAYMENT_PENDING,
    PAYMENT_COMPLETED,
    COMPLETED,
    COMPENSATING,
    COMPENSATED,
    FAILED;

    public boolean canTransitionTo(SagaStatus next) {
        return switch (this) {
            case STARTED -> Set.of(INVENTORY_RESERVED, FAILED)
                    .contains(next);
            case INVENTORY_RESERVED -> Set.of(PAYMENT_PENDING, COMPENSATING)
                    .contains(next);
            case PAYMENT_PENDING -> Set.of(PAYMENT_COMPLETED, COMPENSATING)
                    .contains(next);
            case PAYMENT_COMPLETED -> Set.of(COMPLETED)
                    .contains(next);
            case COMPENSATING -> Set.of(COMPENSATED)
                    .contains(next);
            case COMPLETED, COMPENSATED, FAILED -> false;
        };
    }
}
