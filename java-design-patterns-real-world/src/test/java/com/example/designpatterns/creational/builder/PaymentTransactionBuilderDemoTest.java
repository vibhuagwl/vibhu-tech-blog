package com.example.designpatterns.creational.builder;

import static org.assertj.core.api.Assertions.assertThat;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class PaymentTransactionBuilderDemoTest {
    @Test void shouldBuildReadablePaymentTransaction() {
        var tx = new PaymentTransactionBuilderDemo.Builder().transactionId("tx-1").customerId("c1").amount(BigDecimal.TEN).currency("USD").metadata("flow", "api").build();
        assertThat(tx.metadata()).containsEntry("flow", "api");
    }
}
