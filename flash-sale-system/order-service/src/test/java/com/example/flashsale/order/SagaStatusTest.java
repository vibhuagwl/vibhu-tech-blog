package com.example.flashsale.order;

import com.example.flashsale.order.domain.model.SagaStatus;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SagaStatusTest {
    @Test
    void completedCannotRestart() {
        assertThat(SagaStatus.COMPLETED.canTransitionTo(SagaStatus.STARTED)).isFalse();
    }

    @Test
    void happyPathIsLegal() {
        assertThat(SagaStatus.STARTED.canTransitionTo(SagaStatus.INVENTORY_RESERVED)).isTrue();
        assertThat(SagaStatus.INVENTORY_RESERVED.canTransitionTo(SagaStatus.PAYMENT_PENDING)).isTrue();
        assertThat(SagaStatus.PAYMENT_PENDING.canTransitionTo(SagaStatus.PAYMENT_COMPLETED)).isTrue();
        assertThat(SagaStatus.PAYMENT_COMPLETED.canTransitionTo(SagaStatus.COMPLETED)).isTrue();
    }
}
