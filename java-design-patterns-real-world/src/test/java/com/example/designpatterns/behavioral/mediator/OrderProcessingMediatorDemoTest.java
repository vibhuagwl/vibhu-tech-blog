package com.example.designpatterns.behavioral.mediator;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class OrderProcessingMediatorDemoTest {
    @Test void shouldCentralizeServiceCoordination() {
        assertThat(new OrderProcessingMediatorDemo.OrderProcessingMediator().placeOrder("o1")).isEqualTo("order-complete:o1");
    }
}
