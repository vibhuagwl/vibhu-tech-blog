package com.example.designpatterns.structural.proxy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;

class PaymentServiceProxyDemoTest {
    @Test void shouldControlAccessBeforeDelegating() {
        var proxy = new PaymentServiceProxyDemo.PaymentServiceProxy(new PaymentServiceProxyDemo.RealPaymentService());
        assertThat(proxy.fetchStatus("p1", "ALLOW")).contains("SETTLED");
        assertThatThrownBy(() -> proxy.fetchStatus("p1", "DENY")).isInstanceOf(SecurityException.class);
    }
}
