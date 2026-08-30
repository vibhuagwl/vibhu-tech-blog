package com.example.flashsale.common.event;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class EventEnvelopeTest {
    @Test
    void roundTrip() {
        EventEnvelope env = EventEnvelope.of("OrderRequested", "c1", "ord-1", "P1001", Map.of("qty", 1));
        EventEnvelope copy = JsonEvents.read(JsonEvents.write(env));
        assertThat(copy.eventId()).isEqualTo(env.eventId());
        assertThat(copy.eventType()).isEqualTo("OrderRequested");
        assertThat(copy.partitionKey()).isEqualTo("P1001");
    }
}
