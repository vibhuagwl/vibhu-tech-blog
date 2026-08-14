package com.vibhu.msp.outbox;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

/** In-memory event bus for relaying outbox messages without Kafka. */
public final class InMemoryEventBus {

  private final List<Consumer<OutboxEntity>> subscribers = new CopyOnWriteArrayList<>();
  private final List<OutboxEntity> published = new ArrayList<>();

  public void subscribe(Consumer<OutboxEntity> handler) {
    subscribers.add(handler);
  }

  public void publish(OutboxEntity event) {
    published.add(event);
    for (Consumer<OutboxEntity> subscriber : subscribers) {
      subscriber.accept(event);
    }
  }

  public List<OutboxEntity> publishedEvents() {
    return List.copyOf(published);
  }
}
