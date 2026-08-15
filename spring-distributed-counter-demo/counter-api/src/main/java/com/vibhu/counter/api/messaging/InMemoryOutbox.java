package com.vibhu.counter.api.messaging;

import com.vibhu.counter.common.events.CounterDeltaEvent;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;
import org.springframework.stereotype.Component;

@Component
public class InMemoryOutbox {
  private final ConcurrentLinkedQueue<CounterDeltaEvent> pending = new ConcurrentLinkedQueue<>();

  public void add(CounterDeltaEvent event) {
    pending.add(event);
  }

  public void remove(CounterDeltaEvent event) {
    pending.remove(event);
  }

  public List<CounterDeltaEvent> pendingFor(String resourceId) {
    return pending.stream().filter(event -> event.resourceId().equals(resourceId)).toList();
  }

  public int pendingCount(String resourceId) {
    return (int) pending.stream().filter(event -> event.resourceId().equals(resourceId)).count();
  }
}
