package com.vibhu.lock.service;

import com.vibhu.lock.common.LockMode;
import com.vibhu.lock.common.LockTimeoutException;
import com.vibhu.lock.common.LockToken;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Testcontainers(disabledWithoutDocker = true)
class RedisDistributedLockManagerTest {
    @Container
    static final GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7.4-alpine"))
            .withExposedPorts(6379);

    @Autowired
    private RedisDistributedLockManager lockManager;

    @DynamicPropertySource
    static void redisProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", redis::getFirstMappedPort);
    }

    @Test
    void sharedLocksCanCoexistAndBlockExclusiveUntilReleased() {
        String lockKey = "account:" + System.nanoTime();
        LockToken first = lockManager.tryAcquire(lockKey, LockMode.SHARED, "owner-a", "txn-a", Duration.ZERO, Duration.ofSeconds(5));
        LockToken second = lockManager.tryAcquire(lockKey, LockMode.SHARED, "owner-b", "txn-b", Duration.ZERO, Duration.ofSeconds(5));

        assertThat(first.fencingToken()).isPositive();
        assertThat(second.fencingToken()).isGreaterThan(first.fencingToken());
        assertThatThrownBy(() -> lockManager.tryAcquire(lockKey, LockMode.EXCLUSIVE, "owner-c", "txn-c", Duration.ofMillis(75), Duration.ofSeconds(5)))
                .isInstanceOf(LockTimeoutException.class);

        assertThat(lockManager.unlock(lockKey, LockMode.SHARED, first.ownerToken())).isTrue();
        assertThat(lockManager.unlock(lockKey, LockMode.SHARED, second.ownerToken())).isTrue();

        LockToken exclusive = lockManager.tryAcquire(lockKey, LockMode.EXCLUSIVE, "owner-c", "txn-c", Duration.ofMillis(500), Duration.ofSeconds(5));
        assertThat(exclusive.fencingToken()).isGreaterThan(second.fencingToken());
        assertThat(lockManager.renew(lockKey, exclusive.ownerToken(), Duration.ofSeconds(5))).isTrue();
        assertThat(lockManager.unlock(lockKey, LockMode.EXCLUSIVE, exclusive.ownerToken())).isTrue();
    }
}
