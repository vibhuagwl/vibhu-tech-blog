package com.vibhu.spring.cache.repo;

import com.vibhu.spring.cache.domain.Payment;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Repository;

@Repository
public class PaymentRepository {
  private final Map<String, Payment> db = new ConcurrentHashMap<>();
  private final AtomicLong queryCount = new AtomicLong();

  public PaymentRepository() {
    db.put("P100", new Payment("P100", "SETTLED", 12_500));
    db.put("P101", new Payment("P101", "PENDING", 9_900));
  }

  public Optional<Payment> findById(String id) {
    queryCount.incrementAndGet();
    simulateDbLatency();
    return Optional.ofNullable(db.get(id));
  }

  public Payment save(Payment payment) {
    db.put(payment.id(), payment);
    return payment;
  }

  public long queryCount() {
    return queryCount.get();
  }

  public void resetQueryCount() {
    queryCount.set(0);
  }

  private static void simulateDbLatency() {
    try {
      Thread.sleep(5);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }
}
