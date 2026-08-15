package com.vibhu.msp.resilience;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ManualCircuitBreakerTest {

  @Test
  void opensAfterFailureThreshold() throws Exception {
    ManualCircuitBreaker cb = new ManualCircuitBreaker(2, Duration.ofMillis(100));
    AtomicInteger calls = new AtomicInteger(0);

  assertThrows(RuntimeException.class, () ->
        cb.execute(() -> {
          calls.incrementAndGet();
          throw new RuntimeException("fail");
        }));
    assertThrows(RuntimeException.class, () ->
        cb.execute(() -> {
          calls.incrementAndGet();
          throw new RuntimeException("fail");
        }));
    assertEquals(ManualCircuitBreaker.State.OPEN, cb.state());
    assertThrows(ManualCircuitBreaker.CircuitOpenException.class, () ->
        cb.execute(() -> "ok"));
    assertEquals(2, calls.get());
  }

  @Test
  void halfOpenAfterTimeout() throws Exception {
    ManualCircuitBreaker cb = new ManualCircuitBreaker(1, Duration.ofMillis(50));
    assertThrows(RuntimeException.class, () ->
        cb.execute(() -> { throw new RuntimeException("fail"); }));
    assertEquals(ManualCircuitBreaker.State.OPEN, cb.state());
    Thread.sleep(60);
    assertEquals(ManualCircuitBreaker.State.HALF_OPEN, cb.state());
    String result = cb.execute(() -> "recovered");
    assertEquals("recovered", result);
    assertEquals(ManualCircuitBreaker.State.CLOSED, cb.state());
  }

  @Test
  void fallbackService_returnsFallbackOnFailure() {
    FallbackService fallback = new FallbackService();
    String result = fallback.withStaticFallback(() -> { throw new RuntimeException("down"); }, "cached");
    assertEquals("cached", result);
  }

  @Test
  void bulkhead_rejectsWhenSaturated() throws Exception {
    Bulkheads bulkhead = new Bulkheads(1);
    bulkhead.execute(() -> {
      assertThrows(Bulkheads.BulkheadFullException.class, () -> bulkhead.execute(() -> "blocked"));
      return "ok";
    });
    assertTrue(bulkhead.availablePermits() >= 0);
  }
}
