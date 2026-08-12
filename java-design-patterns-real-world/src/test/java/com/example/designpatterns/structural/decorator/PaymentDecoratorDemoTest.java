package com.example.designpatterns.structural.decorator;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.ArrayList;
import org.junit.jupiter.api.Test;

class PaymentDecoratorDemoTest {
    @Test void shouldAddBehaviorWithoutChangingCoreProcessor() {
        var audit = new ArrayList<String>();
        var processor = new PaymentDecoratorDemo.LoggingDecorator(new PaymentDecoratorDemo.BasicPayment(), audit);
        processor.process(100);
        assertThat(audit).contains("log:100");
    }
}
