package com.vibhu.msp.customer;

import com.vibhu.msp.customer.cache.CustomerCacheService;
import com.vibhu.msp.customer.entity.CustomerEntity;
import com.vibhu.msp.customer.repository.CustomerRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

class CustomerCacheServiceUnitTest {

  @Test
  void returnsFromDatabaseWhenCacheMiss() {
    CustomerRepository repo = Mockito.mock(CustomerRepository.class);
    StringRedisTemplate redis = Mockito.mock(StringRedisTemplate.class);
    ValueOperations<String, String> ops = Mockito.mock(ValueOperations.class);
    when(redis.opsForValue()).thenReturn(ops);
    when(ops.get("customer:cust-1")).thenReturn(null);

    CustomerEntity customer = new CustomerEntity();
    customer.setId("cust-1");
    customer.setName("Alice");
    customer.setEmail("alice@example.com");
    customer.setTier("GOLD");
    when(repo.findById("cust-1")).thenReturn(java.util.Optional.of(customer));

    CustomerCacheService service = new CustomerCacheService(repo, redis, 300);
    CustomerEntity result = service.getCustomer("cust-1");
    assertThat(result.getName()).isEqualTo("Alice");
  }
}
