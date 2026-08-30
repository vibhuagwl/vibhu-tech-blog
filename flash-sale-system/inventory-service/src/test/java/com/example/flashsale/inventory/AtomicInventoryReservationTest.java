package com.example.flashsale.inventory;

import com.example.flashsale.common.event.EventEnvelope;
import com.example.flashsale.inventory.application.ReserveInventoryService;
import com.example.flashsale.inventory.domain.model.Inventory;
import com.example.flashsale.inventory.domain.repository.InventoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class AtomicInventoryReservationTest {

    @Autowired
    ReserveInventoryService reserveInventoryService;

    @Autowired
    InventoryRepository inventoryRepository;

    @Test
    void oneUnit_thousandConcurrentRequests_exactlyOneWins() throws Exception {
        inventoryRepository.save(new Inventory("P-HOT", 1));
        int n = 1000;
        AtomicInteger wins = new AtomicInteger();
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(n);
        try (ExecutorService pool = Executors.newFixedThreadPool(64)) {
            for (int i = 0; i < n; i++) {
                int idx = i;
                pool.submit(() -> {
                    try {
                        start.await();
                        EventEnvelope env = EventEnvelope.of(
                                "OrderRequested",
                                "corr-hot",
                                "ord-" + idx,
                                "P-HOT",
                                Map.of(
                                        "orderId",
                                        "ord-" + idx + "-" + UUID.randomUUID(),
                                        "productId",
                                        "P-HOT",
                                        "quantity",
                                        1));
                        if (reserveInventoryService.reserve(env)) {
                            wins.incrementAndGet();
                        }
                    } catch (Exception ignored) {
                        // loser or transient — must not increment wins
                    } finally {
                        done.countDown();
                    }
                });
            }
            start.countDown();
            assertThat(done.await(45, TimeUnit.SECONDS)).isTrue();
        }
        Inventory after = inventoryRepository.findById("P-HOT")
                .orElseThrow();
        assertThat(wins.get()).isEqualTo(1);
        assertThat(after.getAvailableQuantity()).isGreaterThanOrEqualTo(0);
        assertThat(after.getAvailableQuantity()).isEqualTo(0);
        assertThat(after.getReservedQuantity()).isEqualTo(1);
    }
}
