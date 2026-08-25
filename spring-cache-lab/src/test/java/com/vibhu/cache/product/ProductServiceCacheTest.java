package com.vibhu.cache.product;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;

@SpringBootTest
class ProductServiceCacheTest {

  @Autowired ProductService products;
  @Autowired ProductRepository repo;
  @Autowired CacheManager cacheManager;

  @Test
  void secondGetIsCacheHit() {
    products.resetStats();
    cacheManager.getCache("products").clear();

    Product first = products.getById(1L);
    assertNotNull(first);
    long afterMiss = products.dbLoads();

    Product second = products.getById(1L);
    assertEquals(first, second);
    assertEquals(afterMiss, products.dbLoads(), "second call must not hit DB");
  }

  @Test
  void evictRemovesEntry() {
    products.resetStats();
    cacheManager.getCache("products").clear();
    products.getById(2L);
    products.delete(2L);
    // re-seed for other tests
    repo.save(new Product(2L, "USB-C Hub", new BigDecimal("49.00"), "electronics"));
    cacheManager.getCache("products").clear();
    products.resetStats();
    products.getById(2L);
    assertEquals(1, products.dbLoads());
  }

  @Test
  void unlessSkipsNull() {
    products.resetStats();
    cacheManager.getCache("products").clear();
    assertNull(products.getById(999L));
    assertNull(products.getById(999L));
    assertEquals(2, products.dbLoads(), "null not cached → two DB loads");
  }
}
