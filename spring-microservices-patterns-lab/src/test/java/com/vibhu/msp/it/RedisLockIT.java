package com.vibhu.msp.it;

import com.vibhu.msp.lock.FencingToken;
import com.vibhu.msp.lock.RedisLockStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Testcontainers
@EnabledIfEnvironmentVariable(named = "MSP_IT", matches = "true")
@TestPropertySource(properties = {
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
})
class RedisLockIT {

  @Container
  static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
      .withExposedPorts(6379);

  @DynamicPropertySource
  static void redisProps(DynamicPropertyRegistry registry) {
    registry.add("spring.data.redis.host", redis::getHost);
    registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
  }

  @Autowired org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

  @BeforeEach
  void reset() {
    FencingToken.resetForTests();
    redisTemplate.getConnectionFactory().getConnection().serverCommands().flushAll();
  }

  @Test
  void redisLockEnforcesSingleHolderWithFencing() {
    RedisLockStore store = new RedisLockStore(redisTemplate);

    Optional<String> t1 = store.tryAcquire("order-123", Duration.ofSeconds(5));
    assertTrue(t1.isPresent());
    long token1 = FencingToken.parse(t1.get());

    assertFalse(store.tryAcquire("order-123", Duration.ofSeconds(5)).isPresent());

    store.release("order-123", t1.get());
    Optional<String> t2 = store.tryAcquire("order-123", Duration.ofSeconds(5));
    assertTrue(t2.isPresent());
    long token2 = FencingToken.parse(t2.get());

    assertTrue(token2 > token1);
    assertFalse(store.validateWrite("order-123", token1));
    assertTrue(store.validateWrite("order-123", token2));
    store.release("order-123", t2.get());
  }
}
