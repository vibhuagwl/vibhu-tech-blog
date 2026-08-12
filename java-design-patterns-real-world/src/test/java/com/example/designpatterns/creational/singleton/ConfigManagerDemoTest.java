package com.example.designpatterns.creational.singleton;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class ConfigManagerDemoTest {
    @Test void shouldShareOneConfigSource() {
        assertThat(ConfigManagerDemo.ConfigManager.getInstance()).isSameAs(ConfigManagerDemo.ConfigManager.getInstance());
        assertThat(ConfigManagerDemo.paymentTimeout()).isEqualTo("30s");
    }
}
