package com.example.designpatterns.structural.composite;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class OrderCompositeDemoTest {
    @Test void shouldTreatOneAndManyUniformly() {
        var bundle = new OrderCompositeDemo.Bundle().add(new OrderCompositeDemo.Product("a", 10)).add(new OrderCompositeDemo.Product("b", 15));
        assertThat(bundle.total()).isEqualTo(25);
    }
}
