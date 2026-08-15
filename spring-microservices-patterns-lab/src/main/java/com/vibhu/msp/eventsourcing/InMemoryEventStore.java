package com.vibhu.msp.eventsourcing;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Component;

/** In-memory append-only event store. Maps to curriculum Part 07. */
@Component
public class InMemoryEventStore {

  private final Map<String, List<DomainEvent>> streams = new ConcurrentHashMap<>();

  public synchronized void append(String aggregateId, DomainEvent event) {
    streams.computeIfAbsent(aggregateId, k -> new CopyOnWriteArrayList<>()).add(event);
  }

  public List<DomainEvent> load(String aggregateId) {
    return List.copyOf(streams.getOrDefault(aggregateId, List.of()));
  }

  public List<DomainEvent> loadFromVersion(String aggregateId, long fromVersion) {
    return load(aggregateId).stream().filter(e -> e.version() >= fromVersion).toList();
  }

  public int streamCount() {
    return streams.size();
  }
}
