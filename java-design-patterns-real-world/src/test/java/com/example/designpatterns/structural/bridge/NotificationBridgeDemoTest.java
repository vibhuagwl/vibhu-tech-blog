package com.example.designpatterns.structural.bridge;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class NotificationBridgeDemoTest {
    @Test void shouldMixMessageTypeAndProviderWithoutSubclassExplosion() {
        assertThat(new NotificationBridgeDemo.EmailNotification(new NotificationBridgeDemo.SnsProvider()).send("hello")).contains("EMAIL");
    }
}
