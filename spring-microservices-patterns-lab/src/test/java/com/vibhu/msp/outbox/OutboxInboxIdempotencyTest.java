package com.vibhu.msp.outbox;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vibhu.msp.inbox.InboxService;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(
    properties = {
      "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,"
          + "org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
    })
class OutboxInboxIdempotencyTest {

  @Autowired OutboxService outboxService;
  @Autowired OutboxRelay outboxRelay;
  @Autowired InMemoryEventBus eventBus;
  @Autowired InboxService inboxService;

  @Test
  void outboxRelay_publishesPendingEvents() {
    List<String> received = new ArrayList<>();
    eventBus.subscribe(e -> received.add(e.getEventType()));

    outboxService.saveInSameTransaction(
        "evt-1", "Order", "ORD-1", "OrderCreated", "{\"id\":\"ORD-1\"}", () -> {});
    int relayed = outboxRelay.relayPending();

    assertEquals(1, relayed);
    assertEquals(1, received.size());
    assertEquals("OrderCreated", received.getFirst());
  }

  @Test
  void inbox_skipsDuplicateMessages() {
    AtomicInteger processed = new AtomicInteger(0);
    Runnable handler = processed::incrementAndGet;

    assertTrue(inboxService.processIfNew("msg-1", handler));
    assertFalse(inboxService.processIfNew("msg-1", handler));
    assertEquals(1, processed.get());
    assertTrue(inboxService.alreadyProcessed("msg-1"));
  }
}
