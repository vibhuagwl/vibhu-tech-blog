package com.vibhu.counter.aggregator.service;

import com.vibhu.counter.aggregator.store.SnapshotStore;
import com.vibhu.counter.common.events.CounterDeltaEvent;
import org.springframework.stereotype.Service;

@Service
public class CounterDeltaConsumer {
  private final SnapshotStore snapshotStore;

  public CounterDeltaConsumer(SnapshotStore snapshotStore) {
    this.snapshotStore = snapshotStore;
  }

  public boolean onDelta(CounterDeltaEvent event) {
    return snapshotStore.merge(event);
  }
}
