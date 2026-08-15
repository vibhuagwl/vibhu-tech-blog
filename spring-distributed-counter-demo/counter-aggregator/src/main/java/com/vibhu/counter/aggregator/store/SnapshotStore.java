package com.vibhu.counter.aggregator.store;

import com.vibhu.counter.common.dto.SnapshotResponse;
import com.vibhu.counter.common.events.CounterDeltaEvent;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Component;

@Component
public class SnapshotStore {
  private static final String SNAPSHOT_TOTAL = "SNAPSHOT_TOTAL";

  private final ConcurrentHashMap<String, AtomicLong> snapshots = new ConcurrentHashMap<>();
  private final Set<String> processedEventIds = ConcurrentHashMap.newKeySet();

  public boolean merge(CounterDeltaEvent event) {
    if (!processedEventIds.add(event.eventId())) {
      return false;
    }
    snapshots
        .computeIfAbsent(event.resourceId(), ignored -> new AtomicLong())
        .addAndGet(event.delta());
    return true;
  }

  public SnapshotResponse get(String resourceId) {
    long value = snapshots.getOrDefault(resourceId, new AtomicLong()).get();
    return new SnapshotResponse(resourceId, value, SNAPSHOT_TOTAL);
  }
}
