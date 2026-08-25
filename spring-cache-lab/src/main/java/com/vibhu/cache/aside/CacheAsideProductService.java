package com.vibhu.cache.aside;

import com.vibhu.cache.algorithm.CacheStore;
import com.vibhu.cache.algorithm.LruCache;
import com.vibhu.cache.product.Product;
import com.vibhu.cache.product.ProductRepository;
import org.springframework.stereotype.Service;

/**
 * Explicit cache-aside (no Spring annotations). App owns miss → DB → put.
 */
@Service
public class CacheAsideProductService {

  private final ProductRepository repo;
  private final CacheStore<Long, Product> cache = new LruCache<>(256);

  public CacheAsideProductService(ProductRepository repo) {
    this.repo = repo;
  }

  public Product get(Long id) {
    Product cached = cache.get(id);
    if (cached != null) {
      return cached;
    }
    Product loaded = repo.findById(id).orElse(null);
    if (loaded != null) {
      cache.put(id, loaded);
    }
    return loaded;
  }

  public Product update(Product product) {
    Product saved = repo.save(product);
    cache.put(product.id(), saved); // write: update cache (or invalidate)
    return saved;
  }

  public void delete(Long id) {
    repo.deleteById(id);
    cache.remove(id);
  }
}
