package com.vibhu.msp.lock;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class FencingTokenTest {

  @BeforeEach
  void reset() {
    FencingToken.resetForTests();
  }

  @Test
  void fencingTokensAreMonotonic() {
    long first = FencingToken.parse(FencingToken.next());
    long second = FencingToken.parse(FencingToken.next());
    assertTrue(second > first);
  }

  @Test
  void staleLockHolderCannotPassValidation() {
    InMemoryLockStore store = new InMemoryLockStore();
    RedisStyleLock lock = new RedisStyleLock(store, "resource-1", Duration.ofSeconds(5));

    Optional<RedisStyleLock.LockHandle> h1 = lock.tryLock();
    assertTrue(h1.isPresent());
    long token1 = h1.get().fencingToken();

    h1.get().release();

    Optional<RedisStyleLock.LockHandle> h2 = lock.tryLock();
    assertTrue(h2.isPresent());
    long token2 = h2.get().fencingToken();

    assertTrue(token2 > token1);
    assertFalse(h1.get().validateWrite(token1));
    assertTrue(h2.get().validateWrite(token2));
    h2.get().release();
  }

  @Test
  void onlyOneHolderAtATime() {
    InMemoryLockStore store = new InMemoryLockStore();
    RedisStyleLock lock = new RedisStyleLock(store, "resource-2", Duration.ofSeconds(5));

    Optional<RedisStyleLock.LockHandle> first = lock.tryLock();
    assertTrue(first.isPresent());
    assertFalse(lock.tryLock().isPresent());
    first.get().release();
    assertTrue(lock.tryLock().isPresent());
  }
}
