package com.vibhu.lock.service;

import com.vibhu.lock.common.DeadlockException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Collection;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Component
public class DeadlockDetector {
    private static final String WAIT_FOR_PREFIX = "waitfor:";

    private final StringRedisTemplate redis;

    public DeadlockDetector(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public void registerWait(String waiterTransactionId, Collection<String> holderTransactionIds, Duration ttl) {
        if (isBlank(waiterTransactionId)) {
            return;
        }

        String key = waitForKey(waiterTransactionId);
        redis.delete(key);

        Set<String> holders = new HashSet<>(holderTransactionIds == null ? Set.of() : holderTransactionIds);
        holders.removeIf(holder -> isBlank(holder) || Objects.equals(holder, waiterTransactionId));
        if (holders.isEmpty()) {
            return;
        }

        redis.opsForSet().add(key, holders.toArray(String[]::new));
        redis.expire(key, ttl);

        if (hasCycle(waiterTransactionId)) {
            clearWait(waiterTransactionId);
            throw new DeadlockException("Deadlock detected for transaction " + waiterTransactionId);
        }
    }

    public void clearWait(String waiterTransactionId) {
        if (!isBlank(waiterTransactionId)) {
            redis.delete(waitForKey(waiterTransactionId));
        }
    }

    public boolean hasCycle(String transactionId) {
        if (isBlank(transactionId)) {
            return false;
        }
        return reaches(transactionId, transactionId, new HashSet<>());
    }

    private boolean reaches(String current, String target, Set<String> visited) {
        if (!visited.add(current)) {
            return false;
        }
        Set<String> holders = redis.opsForSet().members(waitForKey(current));
        if (holders == null || holders.isEmpty()) {
            return false;
        }
        for (String holder : holders) {
            if (Objects.equals(holder, target) || reaches(holder, target, visited)) {
                return true;
            }
        }
        return false;
    }

    private static String waitForKey(String transactionId) {
        return WAIT_FOR_PREFIX + transactionId;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
