package com.vibhu.msp.inbox;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(
    properties = {
      "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,"
          + "org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
    })
class InboxIdempotencyConcurrencyTest {

  @Autowired InboxService inboxService;

  @Test
  void parallelDuplicateMessagesProcessedOnce() throws InterruptedException {
    String messageId = "parallel-msg-" + System.nanoTime();
    AtomicInteger processed = new AtomicInteger(0);
    Runnable handler = processed::incrementAndGet;
    int threads = 32;
    CountDownLatch start = new CountDownLatch(1);
    CountDownLatch done = new CountDownLatch(threads);
    AtomicInteger accepted = new AtomicInteger(0);

    try (ExecutorService pool = Executors.newFixedThreadPool(threads)) {
      for (int i = 0; i < threads; i++) {
        pool.submit(
            () -> {
              try {
                start.await();
                if (inboxService.processIfNew(messageId, handler)) {
                  accepted.incrementAndGet();
                }
              } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
              } finally {
                done.countDown();
              }
            });
      }
      start.countDown();
      assertTrue(done.await(30, TimeUnit.SECONDS));
    }

    assertEquals(1, accepted.get());
    assertEquals(1, processed.get());
    assertTrue(inboxService.alreadyProcessed(messageId));
  }

  @Test
  void parallelDistinctMessagesAllProcessed() throws InterruptedException {
    int messages = 50;
    AtomicInteger processed = new AtomicInteger(0);
    CountDownLatch done = new CountDownLatch(messages);

    try (ExecutorService pool = Executors.newFixedThreadPool(16)) {
      for (int i = 0; i < messages; i++) {
        String id = "distinct-" + i;
        pool.submit(
            () -> {
              inboxService.processIfNew(id, processed::incrementAndGet);
              done.countDown();
            });
      }
      assertTrue(done.await(30, TimeUnit.SECONDS));
    }

    assertEquals(messages, processed.get());
  }
}
