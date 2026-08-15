package com.vibhu.hadron.service;

import com.vibhu.hadron.domain.CashLineEvent;
import com.vibhu.hadron.exception.TransientTechnicalException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

@Component
public class TransientFailureSimulator {

  private final ConcurrentHashMap<String, AtomicInteger> remaining = new ConcurrentHashMap<>();

  public void maybeFail(CashLineEvent event) {
    String force = event.forceFailure();
    if (!"TRANSIENT_THEN_OK".equals(force) && !"TIMEOUT_TWICE".equals(force)) {
      return;
    }
    int left =
        remaining.computeIfAbsent(event.eventId(), id -> new AtomicInteger(2)).getAndDecrement();
    if (left > 0) {
      throw new TransientTechnicalException("Simulated Hadron DB timeout remaining=" + left);
    }
  }

  public void reset() {
    remaining.clear();
  }
}
