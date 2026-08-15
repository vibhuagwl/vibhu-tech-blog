package com.vibhu.msp.resilience;

import java.time.Duration;
import java.util.concurrent.Callable;
import java.util.function.Predicate;

/** Manual retry with exponential backoff. Maps to curriculum Part 05. */
public final class ManualRetry {

    private final int maxAttempts;
    private final Duration initialBackoff;
    private final Predicate<Exception> retryOn;

    public ManualRetry(int maxAttempts, Duration initialBackoff, Predicate<Exception> retryOn) {
        this.maxAttempts = maxAttempts;
        this.initialBackoff = initialBackoff;
        this.retryOn = retryOn;
    }

    public <T> T execute(Callable<T> action) throws Exception {
        Exception last = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return action.call();
            } catch (Exception ex) {
                last = ex;
                if (!retryOn.test(ex) || attempt == maxAttempts) {
                    throw ex;
                }
                Thread.sleep(initialBackoff.multipliedBy(attempt).toMillis());
            }
        }
        throw last;
    }
}
