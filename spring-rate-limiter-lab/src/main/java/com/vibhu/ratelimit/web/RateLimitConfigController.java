package com.vibhu.ratelimit.web;

import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.config.RateLimitConfigProvider;
import com.vibhu.ratelimit.limiter.RateLimiterFactory;
import jakarta.validation.Valid;
import java.util.List;
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

/**
 * Admin CRUD for policies. Production must sit behind authz (role RATE_LIMIT_ADMIN)
 * and publish change events so every replica refreshes. This lab updates the
 * in-process provider immediately — the next {@code allow()} sees the new quota.
 */
@RestController
@RequestMapping("/api/rate-limits")
public class RateLimitConfigController {

  private final RateLimitConfigProvider provider;
  private final RateLimiterFactory factory;

  public RateLimitConfigController(RateLimitConfigProvider provider, RateLimiterFactory factory) {
    this.provider = provider;
    this.factory = factory;
  }

  @GetMapping
  public List<RateLimitPolicy> list() {
    return provider.findAll();
  }

  @GetMapping("/{key}")
  public ResponseEntity<RateLimitPolicy> get(@PathVariable String key) {
    return provider.findById(key).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PostMapping
  public ResponseEntity<RateLimitPolicy> create(@Valid @RequestBody RateLimitConfigRequest request) {
    if (provider.findById(request.id()).isPresent()) {
      return ResponseEntity.status(HttpStatus.CONFLICT).build();
    }
    RateLimitPolicy saved = provider.upsert(request.toPolicy());
    factory.evict(saved.id());
    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
  }

  @PutMapping("/{key}")
  public RateLimitPolicy update(@PathVariable String key, @Valid @RequestBody RateLimitConfigRequest request) {
    RateLimitPolicy policy = request.toPolicy();
    if (!key.equals(policy.id())) {
      throw new IllegalArgumentException("path key must match body id");
    }
    RateLimitPolicy saved = provider.upsert(policy);
    factory.evict(saved.id());
    return saved;
  }

  @DeleteMapping("/{key}")
  public ResponseEntity<Map<String, Object>> delete(@PathVariable String key) {
    boolean removed = provider.delete(key);
    factory.evict(key);
    if (!removed) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(Map.of("deleted", key));
  }
}
