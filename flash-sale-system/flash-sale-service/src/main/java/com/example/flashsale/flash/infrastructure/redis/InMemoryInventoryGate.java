package com.example.flashsale.flash.infrastructure.redis;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Profile("test")
public class InMemoryInventoryGate implements InventoryGate {
    private final ConcurrentHashMap<String, AtomicInteger> stock = new ConcurrentHashMap<>();

    public InMemoryInventoryGate() {
        stock.put("P1001", new AtomicInteger(10_000));
    }

    @Override
    public boolean tryAcquire(String productId, int quantity) {
        AtomicInteger s = stock.computeIfAbsent(productId, k -> new AtomicInteger(0));
        while (true) {
            int cur = s.get();
            if (cur < quantity) {
                return false;
            }
            if (s.compareAndSet(cur, cur - quantity)) {
                return true;
            }
        }
    }

    @Override
    public void release(String productId, int quantity) {
        stock.computeIfAbsent(productId, k -> new AtomicInteger(0))
                .addAndGet(quantity);
    }

    public void reset(String productId, int quantity) {
        stock.put(productId, new AtomicInteger(quantity));
    }
}
