package com.vibhu.cache.product;

import java.util.concurrent.atomic.AtomicLong;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

/**
 * Spring Cache annotations demo.
 *
 * <p>MEMORY: @Cacheable = check first · @CachePut = always run + refresh · @CacheEvict = forget
 */
@Service
@CacheConfig(cacheNames = "products")
public class ProductService {

  private final ProductRepository repo;
  private final AtomicLong hitsTracked = new AtomicLong(); // informational via controller stats

  public ProductService(ProductRepository repo) {
    this.repo = repo;
  }

  /**
   * condition BEFORE · unless AFTER.
   *
   * <p>Note: Spring does not allow {@code sync=true} together with {@code unless}. Use {@link
   * #getByIdSynced} for stampede coalescing.
   */
  @Cacheable(key = "#id", condition = "#id > 0", unless = "#result == null")
  public Product getById(Long id) {
    return repo.findById(id).orElse(null);
  }

  /** sync=true coalesces concurrent miss loads for the same key in this JVM only. */
  @Cacheable(cacheNames = "productsSynced", key = "#id", sync = true)
  public Product getByIdSynced(Long id) {
    return repo.findById(id).orElseThrow();
  }

  @CachePut(key = "#product.id")
  public Product save(Product product) {
    return repo.save(product);
  }

  @CacheEvict(key = "#id")
  public void delete(Long id) {
    repo.deleteById(id);
  }

  @Caching(
      put = @CachePut(key = "#product.id"),
      evict = @CacheEvict(cacheNames = "productLists", allEntries = true))
  public Product updateAndInvalidateLists(Product product) {
    return repo.save(product);
  }

  @CacheEvict(allEntries = true)
  public void flushAll() {
    // intentional no-op body — eviction is the point
  }

  public long dbLoads() {
    return repo.dbLoads();
  }

  public long dbWrites() {
    return repo.dbWrites();
  }

  public void resetStats() {
    repo.resetStats();
    hitsTracked.set(0);
  }
}
