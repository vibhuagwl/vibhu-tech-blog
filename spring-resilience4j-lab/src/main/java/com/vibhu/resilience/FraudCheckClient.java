package com.vibhu.resilience;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;

import java.util.concurrent.CompletableFuture;

import org.springframework.stereotype.Service;

/**
 * Isolated fraud pool — a slow fraud vendor must not steal payment threads.
 */
@Service
public class FraudCheckClient {

    @Bulkhead(name = "fraud", type = Bulkhead.Type.THREADPOOL)
    @TimeLimiter(name = "fraud")
    public CompletableFuture<String> screen(String customerId) {
        return CompletableFuture.supplyAsync(() -> "CLEAR");
    }
}
