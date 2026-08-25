package com.vibhu.cache.web;

import com.vibhu.cache.product.Product;
import com.vibhu.cache.product.ProductService;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/products")
public class ProductController {

  private final ProductService products;

  public ProductController(ProductService products) {
    this.products = products;
  }

  @GetMapping("/{id}")
  public Product get(@PathVariable Long id) {
    Product p = products.getById(id);
    if (p == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "product not found");
    }
    return p;
  }

  @PostMapping
  public Product create(@RequestBody Product product) {
    return products.save(product);
  }

  @PutMapping("/{id}")
  public Product update(@PathVariable Long id, @RequestBody Product product) {
    Product updated = new Product(id, product.name(), product.price(), product.category());
    return products.updateAndInvalidateLists(updated);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    products.delete(id);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/_stats")
  public Map<String, Object> stats() {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("dbLoads", products.dbLoads());
    m.put("dbWrites", products.dbWrites());
    m.put(
        "hint",
        "Call GET /api/products/1 twice; dbLoads should increase once if cache HIT on second call");
    return m;
  }

  @PostMapping("/_reset-stats")
  public Map<String, String> reset() {
    products.resetStats();
    return Map.of("status", "ok");
  }
}
