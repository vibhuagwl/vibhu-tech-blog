package com.vibhu.lock.service;

import com.vibhu.lock.common.LockAcquireRequest;
import com.vibhu.lock.common.LockAcquireResponse;
import com.vibhu.lock.common.LockReleaseRequest;
import com.vibhu.lock.common.LockToken;
import com.vibhu.lock.common.TransactionState;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/internal/locks")
public class LockController {
    private final RedisDistributedLockManager lockManager;

    public LockController(RedisDistributedLockManager lockManager) {
        this.lockManager = lockManager;
    }

    @PostMapping("/acquire")
    public LockAcquireResponse acquire(@RequestBody LockAcquireRequest request) {
        LockToken token = lockManager.tryAcquire(
                request.lockKey(),
                request.mode(),
                request.ownerId(),
                request.transactionId(),
                durationFromMillis(request.waitTimeoutMs()),
                durationFromMillis(request.leaseMs())
        );
        return new LockAcquireResponse(true, token, TransactionState.LOCKING, "Lock acquired");
    }

    @PostMapping("/renew")
    public ResponseEntity<Map<String, Object>> renew(@RequestBody LockRenewRequest request) {
        boolean renewed = lockManager.renew(request.lockKey(), request.ownerToken(), durationFromMillis(request.leaseMs()));
        if (!renewed) {
            return ResponseEntity.status(409).body(Map.of("renewed", false, "message", "Lock token is not held"));
        }
        return ResponseEntity.ok(Map.of("renewed", true));
    }

    @PostMapping("/release")
    public ResponseEntity<Map<String, Object>> release(@RequestBody LockReleaseRequest request) {
        boolean released = lockManager.unlock(request.lockKey(), request.mode(), request.ownerToken());
        if (!released) {
            return ResponseEntity.status(409).body(Map.of("released", false, "message", "Lock token is not held"));
        }
        return ResponseEntity.ok(Map.of("released", true));
    }

    @GetMapping("/{lockKey}")
    public LockStateView describe(@PathVariable String lockKey) {
        return lockManager.describe(lockKey);
    }

    private static Duration durationFromMillis(Long millis) {
        return millis == null ? null : Duration.ofMillis(millis);
    }
}
