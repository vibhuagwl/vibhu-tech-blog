package com.vibhu.spring.cache.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.vibhu.spring.cache.domain.Payment;
import com.vibhu.spring.cache.lock.DistributedLock;
import com.vibhu.spring.cache.repo.PaymentRepository;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class PaymentCacheService {
  private static final Logger log = LoggerFactory.getLogger(PaymentCacheService.class);

  private final PaymentRepository repo;
  private final DistributedLock lock;
  private final CacheManager cacheManager;
  private final Cache<String, Payment> l1 =
      Caffeine.newBuilder().maximumSize(5_000).expireAfterWrite(15, TimeUnit.SECONDS).build();

  public PaymentCacheService(
      PaymentRepository repo, DistributedLock lock, CacheManager cacheManager) {
    this.repo = repo;
    this.lock = lock;
    this.cacheManager = cacheManager;
  }

  @Cacheable(cacheNames = "payments", key = "#id")
  public Payment getCached(String id) {
    return repo.findById(id).orElseThrow(() -> new PaymentNotFoundException(id));
  }

  /** Cache-aside with L1 + Spring CacheManager L2 (avoids self-invocation proxy trap). */
  public Payment getAside(String id) {
    Payment local = l1.getIfPresent(id);
    if (local != null) {
      return local;
    }
    org.springframework.cache.Cache springCache = cacheManager.getCache("payments");
    if (springCache != null) {
      Payment fromL2 = springCache.get(id, Payment.class);
      if (fromL2 != null) {
        l1.put(id, fromL2);
        return fromL2;
      }
    }
    Payment loaded = loadWithStampedeGuard(id);
    if (springCache != null) {
      springCache.put(id, loaded);
    }
    return loaded;
  }

  public Payment loadWithStampedeGuard(String id) {
    Payment existing = l1.getIfPresent(id);
    if (existing != null) {
      return existing;
    }
    String token = UUID.randomUUID().toString();
    String lockName = "payments:" + id;
    if (lock.tryLock(lockName, token, Duration.ofSeconds(5))) {
      try {
        Payment again = l1.getIfPresent(id);
        if (again != null) {
          return again;
        }
        Payment loaded = repo.findById(id).orElseThrow(() -> new PaymentNotFoundException(id));
        l1.put(id, loaded);
        return loaded;
      } finally {
        lock.unlock(lockName, token);
      }
    }
    sleep(40);
    Payment afterWait = l1.getIfPresent(id);
    if (afterWait != null) {
      return afterWait;
    }
    return repo.findById(id).orElseThrow(() -> new PaymentNotFoundException(id));
  }

  /** Negative caching for penetration protection. */
  public Optional<Payment> getSafe(String id) {
    Payment hit = l1.getIfPresent(id);
    if (hit != null) {
      return Optional.of(hit);
    }
    Optional<Payment> found = repo.findById(id);
    if (found.isEmpty()) {
      log.info("negative cache candidate id={}", id);
      return Optional.empty();
    }
    l1.put(id, found.get());
    return found;
  }

  @CacheEvict(cacheNames = "payments", key = "#id")
  public void evict(String id) {
    l1.invalidate(id);
    org.springframework.cache.Cache springCache = cacheManager.getCache("payments");
    if (springCache != null) {
      springCache.evict(id);
    }
  }

  public Payment updateStatus(String id, String status) {
    Payment current = repo.findById(id).orElseThrow(() -> new PaymentNotFoundException(id));
    Payment updated = new Payment(current.id(), status, current.amountCents());
    repo.save(updated);
    Runnable bust =
        () -> {
          evict(id);
          log.info("cache invalidated after commit id={}", id);
        };
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
      TransactionSynchronizationManager.registerSynchronization(
          new TransactionSynchronization() {
            @Override
            public void afterCommit() {
              bust.run();
            }
          });
    } else {
      bust.run();
    }
    return updated;
  }

  public static Duration ttlWithJitter() {
    long base = 300;
    long jitter = ThreadLocalRandom.current().nextLong(30, 120);
    return Duration.ofSeconds(base + jitter);
  }

  private static void sleep(long ms) {
    try {
      Thread.sleep(ms);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }
}
