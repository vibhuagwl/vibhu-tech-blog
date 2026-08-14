package com.vibhu.msp.resilience;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/** Hedged requests — send duplicate call if primary is slow; return first success. */
public final class HedgedRequests {

    private final Duration hedgeAfter;
    private final Executor executor;

    public HedgedRequests(Duration hedgeAfter) {
        this(hedgeAfter, Executors.newVirtualThreadPerTaskExecutor());
    }

    public HedgedRequests(Duration hedgeAfter, Executor executor) {
        this.hedgeAfter = hedgeAfter;
        this.executor = executor;
    }

    public <T> T execute(Supplier<T> primary, Supplier<T> hedge) throws Exception {
        CompletableFuture<T> primaryFuture = CompletableFuture.supplyAsync(primary, executor);
        CompletableFuture<T> hedgeFuture = CompletableFuture
                .runAsync(() -> {
                    try {
                        Thread.sleep(hedgeAfter.toMillis());
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }, executor)
                .thenCompose(ignored -> CompletableFuture.supplyAsync(hedge, executor));

        CompletableFuture<Object> winner = CompletableFuture.anyOf(primaryFuture, hedgeFuture);
        Object result = winner.get(hedgeAfter.multipliedBy(10).toMillis(), TimeUnit.MILLISECONDS);
        primaryFuture.cancel(true);
        hedgeFuture.cancel(true);
        return (T) result;
    }
}
