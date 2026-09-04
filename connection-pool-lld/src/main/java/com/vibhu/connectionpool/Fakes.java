package com.vibhu.connectionpool;

import com.vibhu.connectionpool.exception.ConnectionCreationException;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Supplier;

/** Test doubles for failure injection — no real network. */
public final class Fakes {
  private Fakes() {}

  public static final class FakeConnection implements Connection {
    private final AtomicBoolean open = new AtomicBoolean(true);
    private final long id;
    private volatile boolean corrupt;

    FakeConnection(long id) {
      this.id = id;
    }

    public long id() {
      return id;
    }

    public void corrupt() {
      this.corrupt = true;
      open.set(false);
    }

    @Override
    public boolean isOpen() {
      return open.get() && !corrupt;
    }

    @Override
    public void close() {
      open.set(false);
    }
  }

  public static final class FakeFactory implements ConnectionFactory {
    private final AtomicLong seq = new AtomicLong();
    private final AtomicInteger createCalls = new AtomicInteger();
    private volatile Supplier<RuntimeException> failWith;
    private volatile long createDelayMs;
    private volatile int failNext;

    public void failNext(int n, Supplier<RuntimeException> error) {
      this.failNext = n;
      this.failWith = error;
    }

    public void alwaysFail(Supplier<RuntimeException> error) {
      this.failNext = Integer.MAX_VALUE;
      this.failWith = error;
    }

    public void clearFailures() {
      this.failNext = 0;
      this.failWith = null;
    }

    public void createDelayMs(long ms) {
      this.createDelayMs = ms;
    }

    public int createCalls() {
      return createCalls.get();
    }

    @Override
    public Connection create() {
      createCalls.incrementAndGet();
      if (createDelayMs > 0) {
        try {
          Thread.sleep(createDelayMs);
        } catch (InterruptedException e) {
          Thread.currentThread().interrupt();
          throw new ConnectionCreationException("interrupted", e);
        }
      }
      if (failNext > 0) {
        failNext--;
        RuntimeException ex =
            failWith != null
                ? failWith.get()
                : new ConnectionCreationException("injected create failure");
        throw ex;
      }
      return new FakeConnection(seq.incrementAndGet());
    }
  }

  public static final class FakeValidator implements ConnectionValidator {
    private volatile boolean alwaysInvalid;
    private volatile long delayMs;

    public void alwaysInvalid(boolean v) {
      this.alwaysInvalid = v;
    }

    public void delayMs(long ms) {
      this.delayMs = ms;
    }

    @Override
    public boolean isValid(Connection connection) {
      if (delayMs > 0) {
        try {
          Thread.sleep(delayMs);
        } catch (InterruptedException e) {
          Thread.currentThread().interrupt();
          return false;
        }
      }
      if (alwaysInvalid) {
        return false;
      }
      return connection.isOpen();
    }
  }
}
