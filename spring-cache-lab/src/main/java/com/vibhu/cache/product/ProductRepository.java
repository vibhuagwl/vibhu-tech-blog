package com.vibhu.cache.product;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Repository;

@Repository
public class ProductRepository {

  private final Map<Long, Product> db = new ConcurrentHashMap<>();
  private final AtomicLong dbLoads = new AtomicLong();
  private final AtomicLong dbWrites = new AtomicLong();

  public ProductRepository() {
    db.put(1L, new Product(1L, "Wireless Mouse", new BigDecimal("29.99"), "electronics"));
    db.put(2L, new Product(2L, "USB-C Hub", new BigDecimal("49.00"), "electronics"));
    db.put(3L, new Product(3L, "Notebook", new BigDecimal("4.50"), "stationery"));
  }

  public Optional<Product> findById(Long id) {
    dbLoads.incrementAndGet();
    simulateLatency();
    return Optional.ofNullable(db.get(id));
  }

  public Product save(Product product) {
    dbWrites.incrementAndGet();
    db.put(product.id(), product);
    return product;
  }

  public void deleteById(Long id) {
    dbWrites.incrementAndGet();
    db.remove(id);
  }

  public long dbLoads() {
    return dbLoads.get();
  }

  public long dbWrites() {
    return dbWrites.get();
  }

  public void resetStats() {
    dbLoads.set(0);
    dbWrites.set(0);
  }

  private static void simulateLatency() {
    try {
      Thread.sleep(5);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }
}
