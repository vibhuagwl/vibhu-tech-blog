package com.vibhu.security.jwt.security;

import com.vibhu.security.jwt.config.JwtProperties;
import com.vibhu.security.jwt.exception.TooManyLoginAttemptsException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class LoginAttemptService {

    private static final Logger log = LoggerFactory.getLogger(LoginAttemptService.class);

    private final int maxAttempts;
    private final java.time.Duration lockDuration;
    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    public LoginAttemptService(JwtProperties properties) {
        this.maxAttempts = properties.getLogin().getMaxAttempts();
        this.lockDuration = properties.getLogin().getLockDuration();
    }

    public void assertNotLocked(String email) {
        Attempt attempt = attempts.get(normalize(email));
        if (attempt != null && attempt.lockedUntil != null && Instant.now().isBefore(attempt.lockedUntil)) {
            throw new TooManyLoginAttemptsException("Too many failed login attempts");
        }
    }

    public void loginSucceeded(String email) {
        attempts.remove(normalize(email));
    }

    public void loginFailed(String email) {
        String key = normalize(email);
        Attempt next = attempts.compute(key, (k, current) -> {
            int count = current == null ? 1 : current.failures + 1;
            Instant lockedUntil = count >= maxAttempts ? Instant.now().plus(lockDuration) : null;
            return new Attempt(count, lockedUntil);
        });
        if (next.lockedUntil != null) {
            log.warn("Login locked after repeated failures for userKeyHash={}", Integer.toHexString(key.hashCode()));
        }
    }

    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private record Attempt(int failures, Instant lockedUntil) {}
}
