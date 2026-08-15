package com.vibhu.lock.service;

import com.vibhu.lock.common.DeadlockException;
import com.vibhu.lock.common.LockAcquisitionException;
import com.vibhu.lock.common.LockMode;
import com.vibhu.lock.common.LockTimeoutException;
import com.vibhu.lock.common.LockToken;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

@Service
public class RedisDistributedLockManager {
  private static final Duration DEFAULT_LEASE = Duration.ofSeconds(30);
  private static final Duration DEFAULT_WAIT_TIMEOUT = Duration.ofSeconds(2);
  private static final long SHARED_METADATA_GRACE_MS = 60_000L;

  private static final RedisScript<String> EXCLUSIVE_ACQUIRE_SCRIPT =
      RedisScript.of(
          """
            local expired = redis.call('ZRANGEBYSCORE', KEYS[6], '-inf', ARGV[4])
            for _, token in ipairs(expired) do
              redis.call('HDEL', KEYS[2], token)
              redis.call('HDEL', KEYS[5], token)
              redis.call('ZREM', KEYS[6], token)
            end
            if redis.call('HLEN', KEYS[2]) == 0 then
              redis.call('DEL', KEYS[2], KEYS[5], KEYS[6])
            end
            if redis.call('EXISTS', KEYS[1]) == 0 and redis.call('EXISTS', KEYS[2]) == 0 then
              local fence = redis.call('INCR', KEYS[3])
              local value = ARGV[1] .. ':' .. fence
              local ok = redis.call('SET', KEYS[1], value, 'NX', 'PX', ARGV[2])
              if ok then
                redis.call('SET', KEYS[4], ARGV[3], 'PX', ARGV[2])
                return value
              end
            end
            return nil
            """,
          String.class);

  private static final RedisScript<String> SHARED_ACQUIRE_SCRIPT =
      RedisScript.of(
          """
            local expired = redis.call('ZRANGEBYSCORE', KEYS[5], '-inf', ARGV[4])
            for _, token in ipairs(expired) do
              redis.call('HDEL', KEYS[2], token)
              redis.call('HDEL', KEYS[4], token)
              redis.call('ZREM', KEYS[5], token)
            end
            if redis.call('HLEN', KEYS[2]) == 0 then
              redis.call('DEL', KEYS[2], KEYS[4], KEYS[5])
            end
            if redis.call('EXISTS', KEYS[1]) == 0 then
              local fence = redis.call('INCR', KEYS[3])
              local value = ARGV[1] .. ':' .. fence
              redis.call('HSET', KEYS[2], ARGV[1], value)
              redis.call('HSET', KEYS[4], ARGV[1], ARGV[3])
              redis.call('ZADD', KEYS[5], ARGV[4] + ARGV[2], ARGV[1])
              redis.call('PEXPIRE', KEYS[2], ARGV[2] + ARGV[5])
              redis.call('PEXPIRE', KEYS[4], ARGV[2] + ARGV[5])
              redis.call('PEXPIRE', KEYS[5], ARGV[2] + ARGV[5])
              return value
            end
            return nil
            """,
          String.class);

  private static final RedisScript<Long> RENEW_SCRIPT =
      RedisScript.of(
          """
            local exclusive = redis.call('GET', KEYS[1])
            if exclusive and string.sub(exclusive, 1, string.len(ARGV[1]) + 1) == ARGV[1] .. ':' then
              redis.call('PEXPIRE', KEYS[1], ARGV[2])
              redis.call('PEXPIRE', KEYS[2], ARGV[2])
              return 1
            end
            if redis.call('HEXISTS', KEYS[3], ARGV[1]) == 1 then
              redis.call('ZADD', KEYS[5], ARGV[3] + ARGV[2], ARGV[1])
              redis.call('PEXPIRE', KEYS[3], ARGV[2] + ARGV[4])
              redis.call('PEXPIRE', KEYS[4], ARGV[2] + ARGV[4])
              redis.call('PEXPIRE', KEYS[5], ARGV[2] + ARGV[4])
              return 1
            end
            return 0
            """,
          Long.class);

  private static final RedisScript<Long> RELEASE_EXCLUSIVE_SCRIPT =
      RedisScript.of(
          """
            local value = redis.call('GET', KEYS[1])
            if value and string.sub(value, 1, string.len(ARGV[1]) + 1) == ARGV[1] .. ':' then
              redis.call('DEL', KEYS[1], KEYS[2])
              return 1
            end
            return 0
            """,
          Long.class);

  private static final RedisScript<Long> RELEASE_SHARED_SCRIPT =
      RedisScript.of(
          """
            if redis.call('HEXISTS', KEYS[1], ARGV[1]) == 1 then
              redis.call('HDEL', KEYS[1], ARGV[1])
              redis.call('HDEL', KEYS[2], ARGV[1])
              redis.call('ZREM', KEYS[3], ARGV[1])
              if redis.call('HLEN', KEYS[1]) == 0 then
                redis.call('DEL', KEYS[1], KEYS[2], KEYS[3])
              end
              return 1
            end
            return 0
            """,
          Long.class);

  private final StringRedisTemplate redis;
  private final DeadlockDetector deadlockDetector;
  private final Counter acquireAttempts;
  private final Counter acquireSuccess;
  private final Counter acquireTimeouts;
  private final Counter acquireDeadlocks;
  private final Counter releaseSuccess;
  private final Counter releaseFailure;
  private final Counter renewSuccess;
  private final Counter renewFailure;
  private final Timer acquireTimer;

  public RedisDistributedLockManager(
      StringRedisTemplate redis, DeadlockDetector deadlockDetector, MeterRegistry registry) {
    this.redis = redis;
    this.deadlockDetector = deadlockDetector;
    this.acquireAttempts =
        registry.counter("distributed_lock_acquisition_total", "result", "attempt");
    this.acquireSuccess =
        registry.counter("distributed_lock_acquisition_total", "result", "success");
    this.acquireTimeouts = registry.counter("distributed_lock_timeout_total");
    this.acquireDeadlocks = registry.counter("distributed_deadlock_total");
    this.releaseSuccess = registry.counter("distributed_lock_release_total", "result", "success");
    this.releaseFailure = registry.counter("distributed_lock_release_total", "result", "failure");
    this.renewSuccess = registry.counter("distributed_lock_renew_total", "result", "success");
    this.renewFailure = registry.counter("distributed_lock_renew_total", "result", "failure");
    this.acquireTimer = registry.timer("distributed_lock_wait_seconds");
    registry.timer("distributed_lock_held_seconds");
  }

  public LockToken acquireExclusive(String lockKey, String ownerId, Duration lease) {
    return attemptAcquire(lockKey, LockMode.EXCLUSIVE, ownerId, ownerId, normalizeLease(lease))
        .orElseThrow(
            () -> new LockAcquisitionException("Exclusive lock is already held for " + lockKey));
  }

  public LockToken tryAcquire(
      String lockKey,
      LockMode mode,
      String ownerId,
      String transactionId,
      Duration waitTimeout,
      Duration lease) {
    validateAcquireRequest(lockKey, mode, ownerId, transactionId);
    Duration effectiveLease = normalizeLease(lease);
    Duration effectiveWait =
        waitTimeout == null || waitTimeout.isNegative() ? DEFAULT_WAIT_TIMEOUT : waitTimeout;
    long requestTime = System.currentTimeMillis();
    long deadline = requestTime + effectiveWait.toMillis();
    String waiter = waitQueueMember(ownerId, transactionId);
    Timer.Sample sample = Timer.start();

    try {
      while (true) {
        acquireAttempts.increment();
        Optional<LockToken> acquired =
            attemptAcquire(lockKey, mode, ownerId, transactionId, effectiveLease);
        if (acquired.isPresent()) {
          redis.opsForZSet().remove(waitQueueKey(lockKey), waiter);
          deadlockDetector.clearWait(transactionId);
          acquireSuccess.increment();
          return acquired.get();
        }

        redis.opsForZSet().add(waitQueueKey(lockKey), waiter, requestTime);
        registerWaitFor(lockKey, transactionId, effectiveWait.plus(effectiveLease));

        long now = System.currentTimeMillis();
        if (now >= deadline) {
          redis.opsForZSet().remove(waitQueueKey(lockKey), waiter);
          deadlockDetector.clearWait(transactionId);
          acquireTimeouts.increment();
          throw new LockTimeoutException("Timed out waiting for " + mode + " lock on " + lockKey);
        }
        sleepBeforeRetry(deadline - now);
      }
    } catch (DeadlockException ex) {
      redis.opsForZSet().remove(waitQueueKey(lockKey), waiter);
      deadlockDetector.clearWait(transactionId);
      acquireDeadlocks.increment();
      throw ex;
    } finally {
      sample.stop(acquireTimer);
    }
  }

  public boolean renew(String lockKey, String ownerToken, Duration lease) {
    requireText(lockKey, "lockKey");
    requireText(ownerToken, "ownerToken");
    Duration effectiveLease = normalizeLease(lease);
    Long renewed =
        redis.execute(
            RENEW_SCRIPT,
            List.of(
                exclusiveKey(lockKey),
                exclusiveHolderKey(lockKey),
                sharedKey(lockKey),
                sharedHolderKey(lockKey),
                sharedExpiryKey(lockKey)),
            ownerToken,
            String.valueOf(effectiveLease.toMillis()),
            String.valueOf(System.currentTimeMillis()),
            String.valueOf(SHARED_METADATA_GRACE_MS));
    boolean success = Objects.equals(renewed, 1L);
    if (success) {
      renewSuccess.increment();
    } else {
      renewFailure.increment();
    }
    return success;
  }

  public boolean unlock(String lockKey, LockMode mode, String ownerToken) {
    requireText(lockKey, "lockKey");
    requireText(ownerToken, "ownerToken");
    LockMode effectiveMode = mode == null ? LockMode.EXCLUSIVE : mode;
    Long released =
        effectiveMode == LockMode.EXCLUSIVE
            ? redis.execute(
                RELEASE_EXCLUSIVE_SCRIPT,
                List.of(exclusiveKey(lockKey), exclusiveHolderKey(lockKey)),
                ownerToken)
            : redis.execute(
                RELEASE_SHARED_SCRIPT,
                List.of(sharedKey(lockKey), sharedHolderKey(lockKey), sharedExpiryKey(lockKey)),
                ownerToken);
    boolean success = Objects.equals(released, 1L);
    if (success) {
      releaseSuccess.increment();
    } else {
      releaseFailure.increment();
    }
    return success;
  }

  public LockStateView describe(String lockKey) {
    requireText(lockKey, "lockKey");
    cleanupExpiredShared(lockKey);

    String exclusiveValue = redis.opsForValue().get(exclusiveKey(lockKey));
    LockValue exclusive = exclusiveValue == null ? null : LockValue.parse(exclusiveValue);

    Map<Object, Object> sharedEntries = redis.opsForHash().entries(sharedKey(lockKey));
    Map<String, LockValue> sharedOwners = new LinkedHashMap<>();
    for (Map.Entry<Object, Object> entry : sharedEntries.entrySet()) {
      sharedOwners.put(
          String.valueOf(entry.getKey()), LockValue.parse(String.valueOf(entry.getValue())));
    }

    Set<String> waitingOwners = redis.opsForZSet().range(waitQueueKey(lockKey), 0, -1);
    return new LockStateView(
        lockKey,
        exclusive,
        sharedOwners,
        waitingOwners == null ? Set.of() : waitingOwners,
        currentHolderTransactions(lockKey));
  }

  private Optional<LockToken> attemptAcquire(
      String lockKey, LockMode mode, String ownerId, String transactionId, Duration lease) {
    String ownerToken = UUID.randomUUID().toString();
    long now = System.currentTimeMillis();
    String encoded =
        mode == LockMode.EXCLUSIVE
            ? redis.execute(
                EXCLUSIVE_ACQUIRE_SCRIPT,
                List.of(
                    exclusiveKey(lockKey),
                    sharedKey(lockKey),
                    fenceKey(lockKey),
                    exclusiveHolderKey(lockKey),
                    sharedHolderKey(lockKey),
                    sharedExpiryKey(lockKey)),
                ownerToken,
                String.valueOf(lease.toMillis()),
                transactionId,
                String.valueOf(now))
            : redis.execute(
                SHARED_ACQUIRE_SCRIPT,
                List.of(
                    exclusiveKey(lockKey),
                    sharedKey(lockKey),
                    fenceKey(lockKey),
                    sharedHolderKey(lockKey),
                    sharedExpiryKey(lockKey)),
                ownerToken,
                String.valueOf(lease.toMillis()),
                transactionId,
                String.valueOf(now),
                String.valueOf(SHARED_METADATA_GRACE_MS));

    if (encoded == null) {
      return Optional.empty();
    }

    LockValue value = LockValue.parse(encoded);
    return Optional.of(
        new LockToken(
            lockKey,
            value.ownerToken(),
            value.fencingToken(),
            mode,
            lease.toMillis(),
            Instant.ofEpochMilli(now)));
  }

  private void registerWaitFor(String lockKey, String transactionId, Duration ttl) {
    Set<String> holders = currentHolderTransactions(lockKey);
    deadlockDetector.registerWait(transactionId, holders, ttl);
  }

  private Set<String> currentHolderTransactions(String lockKey) {
    Set<String> holders = new LinkedHashSet<>();
    String exclusiveHolder = redis.opsForValue().get(exclusiveHolderKey(lockKey));
    if (exclusiveHolder != null && !exclusiveHolder.isBlank()) {
      holders.add(exclusiveHolder);
    }
    Map<Object, Object> sharedHolders = redis.opsForHash().entries(sharedHolderKey(lockKey));
    for (Object holder : sharedHolders.values()) {
      if (holder != null && !String.valueOf(holder).isBlank()) {
        holders.add(String.valueOf(holder));
      }
    }
    return holders;
  }

  private void cleanupExpiredShared(String lockKey) {
    Set<String> expired =
        redis.opsForZSet().rangeByScore(sharedExpiryKey(lockKey), 0, System.currentTimeMillis());
    if (expired == null || expired.isEmpty()) {
      return;
    }
    for (String ownerToken : expired) {
      redis.opsForHash().delete(sharedKey(lockKey), ownerToken);
      redis.opsForHash().delete(sharedHolderKey(lockKey), ownerToken);
      redis.opsForZSet().remove(sharedExpiryKey(lockKey), ownerToken);
    }
    Long remaining = redis.opsForHash().size(sharedKey(lockKey));
    if (remaining != null && remaining == 0L) {
      redis.delete(List.of(sharedKey(lockKey), sharedHolderKey(lockKey), sharedExpiryKey(lockKey)));
    }
  }

  private static Duration normalizeLease(Duration lease) {
    if (lease == null || lease.isZero() || lease.isNegative()) {
      return DEFAULT_LEASE;
    }
    return lease;
  }

  private static void validateAcquireRequest(
      String lockKey, LockMode mode, String ownerId, String transactionId) {
    requireText(lockKey, "lockKey");
    requireText(ownerId, "ownerId");
    requireText(transactionId, "transactionId");
    if (mode == null) {
      throw new IllegalArgumentException("mode is required");
    }
  }

  private static void requireText(String value, String fieldName) {
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException(fieldName + " is required");
    }
  }

  private static void sleepBeforeRetry(long remainingMillis) {
    try {
      Thread.sleep(Math.min(100L, Math.max(10L, remainingMillis)));
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new LockAcquisitionException("Interrupted while waiting for a lock", ex);
    }
  }

  private static String waitQueueMember(String ownerId, String transactionId) {
    return ownerId + ":" + transactionId;
  }

  private static String exclusiveKey(String lockKey) {
    return "excl:" + lockKey;
  }

  private static String sharedKey(String lockKey) {
    return "shared:" + lockKey;
  }

  private static String fenceKey(String lockKey) {
    return "fence:" + lockKey;
  }

  private static String waitQueueKey(String lockKey) {
    return "wait:" + lockKey;
  }

  private static String exclusiveHolderKey(String lockKey) {
    return "holder:excl:" + lockKey;
  }

  private static String sharedHolderKey(String lockKey) {
    return "holder:shared:" + lockKey;
  }

  private static String sharedExpiryKey(String lockKey) {
    return "shared-expiry:" + lockKey;
  }
}
