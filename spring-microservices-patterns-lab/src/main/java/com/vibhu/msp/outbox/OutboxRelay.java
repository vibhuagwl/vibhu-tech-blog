package com.vibhu.msp.outbox;

import org.springframework.stereotype.Component;

import java.util.List;

/** Polls pending outbox rows and relays to the in-memory bus. Maps to curriculum Part 08. */
@Component
public class OutboxRelay {

  private final OutboxService outboxService;
  private final InMemoryEventBus eventBus;

  public OutboxRelay(OutboxService outboxService, InMemoryEventBus eventBus) {
    this.outboxService = outboxService;
    this.eventBus = eventBus;
  }

  public int relayPending() {
    List<OutboxEntity> pending = outboxService.findPending();
    for (OutboxEntity entity : pending) {
      eventBus.publish(entity);
      outboxService.markPublished(entity.getId());
    }
    return pending.size();
  }
}
