package com.vibhu.msp.customer.cache;

import com.vibhu.msp.customer.entity.CustomerEntity;
import com.vibhu.msp.customer.repository.CustomerRepository;
import java.time.Duration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class CustomerCacheService {

  private static final String KEY_PREFIX = "customer:";
  private final CustomerRepository customerRepository;
  private final StringRedisTemplate redisTemplate;
  private final Duration ttl;

  public CustomerCacheService(CustomerRepository customerRepository,
                              StringRedisTemplate redisTemplate,
                              @org.springframework.beans.factory.annotation.Value("${msp.cache.ttl-seconds:300}") long ttlSeconds) {
    this.customerRepository = customerRepository;
    this.redisTemplate = redisTemplate;
    this.ttl = Duration.ofSeconds(ttlSeconds);
  }

  public CustomerEntity getCustomer(String customerId) {
    String cacheKey = KEY_PREFIX + customerId;
    String cached = redisTemplate.opsForValue().get(cacheKey);
    if (cached != null) {
      String[] parts = cached.split("\\|", 3);
      CustomerEntity entity = new CustomerEntity();
      entity.setId(customerId);
      entity.setName(parts[0]);
      entity.setEmail(parts[1]);
      entity.setTier(parts.length > 2 ? parts[2] : "STANDARD");
      return entity;
    }
    CustomerEntity entity = customerRepository.findById(customerId)
        .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));
    redisTemplate.opsForValue().set(cacheKey,
        entity.getName() + "|" + entity.getEmail() + "|" + entity.getTier(), ttl);
    return entity;
  }
}
