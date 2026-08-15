package com.vibhu.msp.resilience;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.Callable;
import java.util.concurrent.atomic.AtomicInteger;

/** Manual circuit breaker — CLOSED → OPEN → HALF_OPEN. Maps to curriculum Part 05. */
public final class ManualCircuitBreaker {

    public enum State { CLOSED, OPEN, HALF_OPEN }

    private final int failureThreshold;
    private final Duration openDuration;
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    private volatile State state = State.CLOSED;
    private volatile Instant openedAt = Instant.EPOCH;

    public ManualCircuitBreaker(int failureThreshold, Duration openDuration) {
        this.failureThreshold = failureThreshold;
        this.openDuration = openDuration;
    }

    public State state() {
        if (state == State.OPEN && Instant.now().isAfter(openedAt.plus(openDuration))) {
            state = State.HALF_OPEN;
        }
        return state;
    }

    public <T> T execute(Callable<T> action) throws Exception {
        State current = state();
        if (current == State.OPEN) {
            throw new CircuitOpenException("Circuit is OPEN");
        }
        try {
            T result = action.call();
            onSuccess();
            return result;
        } catch (Exception ex) {
            onFailure();
            throw ex;
        }
    }

    private void onSuccess() {
        consecutiveFailures.set(0);
        state = State.CLOSED;
    }

    private void onFailure() {
        if (consecutiveFailures.incrementAndGet() >= failureThreshold) {
            state = State.OPEN;
            openedAt = Instant.now();
        }
    }

    public static class CircuitOpenException extends RuntimeException {
        public CircuitOpenException(String message) {
            super(message);
        }
    }
}
