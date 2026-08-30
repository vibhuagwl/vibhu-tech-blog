package com.example.flashsale.flash;

import com.example.flashsale.common.error.FlashSaleException;
import com.example.flashsale.flash.api.dto.PurchaseRequest;
import com.example.flashsale.flash.application.service.SubmitPurchaseService;
import com.example.flashsale.flash.infrastructure.redis.InMemoryInventoryGate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class FlashSaleConcurrencyTest {

    @Autowired
    SubmitPurchaseService submitPurchaseService;

    @Autowired
    InMemoryInventoryGate gate;

    @Test
    void tenUnits_manyConcurrentBuyers_onlyTenAccepted() throws Exception {
        gate.reset("P1001", 10);
        int n = 1_000;
        AtomicInteger accepted = new AtomicInteger();
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(n);
        try (ExecutorService pool = Executors.newFixedThreadPool(64)) {
            for (int i = 0; i < n; i++) {
                int idx = i;
                pool.submit(() -> {
                    try {
                        start.await();
                        String user = "user-" + idx;
                        submitPurchaseService.submit(
                                user,
                                "SALE1001",
                                "127.0.0.1",
                                new PurchaseRequest("P1001", 1, user + "-P1001-SALE1001"));
                        accepted.incrementAndGet();
                    } catch (FlashSaleException ignored) {
                        // sold out / validation — not a win
                    } catch (Exception ignored) {
                        // isolation / unique collisions must not count as wins
                    } finally {
                        done.countDown();
                    }
                });
            }
            start.countDown();
            assertThat(done.await(60, TimeUnit.SECONDS)).isTrue();
        }
        assertThat(accepted.get()).isEqualTo(10);
    }
}
