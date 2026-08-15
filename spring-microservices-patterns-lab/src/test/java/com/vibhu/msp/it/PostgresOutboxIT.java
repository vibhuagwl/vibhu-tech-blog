package com.vibhu.msp.it;

import com.vibhu.msp.outbox.InMemoryEventBus;
import com.vibhu.msp.outbox.OutboxRelay;
import com.vibhu.msp.outbox.OutboxService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Testcontainers
@EnabledIfEnvironmentVariable(named = "MSP_IT", matches = "true")
@TestPropertySource(properties = {
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,"
        + "org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
})
class PostgresOutboxIT {

  @Container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

  @DynamicPropertySource
  static void datasourceProps(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
    registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
    registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    registry.add("spring.jpa.properties.hibernate.dialect",
        () -> "org.hibernate.dialect.PostgreSQLDialect");
  }

  @Autowired OutboxService outboxService;
  @Autowired OutboxRelay outboxRelay;
  @Autowired InMemoryEventBus eventBus;

  @Test
  void outboxPersistsAndRelaysAgainstRealPostgres() {
    List<String> received = new ArrayList<>();
    eventBus.subscribe(e -> received.add(e.getEventType()));

    outboxService.saveInSameTransaction(
        "pg-evt-1", "Order", "ORD-PG-1", "OrderCreated", "{\"id\":\"ORD-PG-1\"}", () -> {});
    int relayed = outboxRelay.relayPending();

    assertEquals(1, relayed);
    assertEquals(1, received.size());
    assertEquals("OrderCreated", received.getFirst());
  }
}
