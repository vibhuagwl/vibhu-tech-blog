package com.vibhu.counter.api.messaging;

import com.vibhu.counter.common.events.CounterDeltaEvent;

public interface OutboxPublisher {
  void publishAfterPersist(CounterDeltaEvent event);

  int flush(String resourceId);

  int pendingCount(String resourceId);
}
