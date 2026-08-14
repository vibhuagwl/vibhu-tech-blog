package com.vibhu.msp.gateway;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.function.Supplier;

/**
 * API Gateway aggregation — fan-out parallel downstream calls with CompletableFuture.
 * Maps to curriculum Part 02 (API Gateway · BFF · aggregation).
 */
public final class AggregationService {

    private final Executor executor;

    public AggregationService() {
        this(Executors.newVirtualThreadPerTaskExecutor());
    }

    public AggregationService(Executor executor) {
        this.executor = executor;
    }

    public record OrderDashboard(
            String orderId,
            String customerName,
            String paymentStatus,
            int inventoryReserved) {}

    public CompletableFuture<OrderDashboard> aggregateOrderView(
            String orderId,
            Supplier<String> customerLookup,
            Supplier<String> paymentLookup,
            Supplier<Integer> inventoryLookup) {

        CompletableFuture<String> customerFuture = CompletableFuture.supplyAsync(customerLookup, executor);
        CompletableFuture<String> paymentFuture = CompletableFuture.supplyAsync(paymentLookup, executor);
        CompletableFuture<Integer> inventoryFuture = CompletableFuture.supplyAsync(inventoryLookup, executor);

        return CompletableFuture.allOf(customerFuture, paymentFuture, inventoryFuture)
                .thenApply(ignored -> new OrderDashboard(
                        orderId,
                        customerFuture.join(),
                        paymentFuture.join(),
                        inventoryFuture.join()
                ));
    }

    public <T> CompletableFuture<List<T>> parallelFetch(List<Supplier<T>> suppliers) {
        List<CompletableFuture<T>> futures = suppliers.stream()
                .map(s -> CompletableFuture.supplyAsync(s, executor))
                .toList();
        return CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new))
                .thenApply(ignored -> futures.stream().map(CompletableFuture::join).toList());
    }
}
