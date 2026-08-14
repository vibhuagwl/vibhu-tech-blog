package com.vibhu.bloom.kafka;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class IdempotencyGuardTest {

  @Test
  void bloomPlusTruthPreventsDuplicateProcessing() {
    IdempotencyGuard guard = new IdempotencyGuard(10_000, 0.01);
    AtomicInteger handled = new AtomicInteger();
    assertTrue(guard.tryProcess("evt-1", handled::incrementAndGet));
    assertFalse(guard.tryProcess("evt-1", handled::incrementAndGet));
    assertEquals(1, handled.get());
    assertEquals(1, guard.truthSize());
  }

  @Test
  void bloomFalsePositiveStillProcessesWhenTruthSaysNew() {
    // Fill filter with unrelated keys to raise FPP, then process a fresh id that may FP.
    IdempotencyGuard guard = new IdempotencyGuard(100, 0.1);
    for (int i = 0; i < 200; i++) {
      guard.tryProcess("seed-" + i, () -> {});
    }
    AtomicInteger handled = new AtomicInteger();
    String fresh = "brand-new-event";
    // Even if bloom says maybe, truth allows first process.
    assertTrue(guard.tryProcess(fresh, handled::incrementAndGet));
    assertEquals(1, handled.get());
  }
}
