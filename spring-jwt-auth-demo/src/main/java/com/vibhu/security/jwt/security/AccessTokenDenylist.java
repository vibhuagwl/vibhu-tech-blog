package com.vibhu.security.jwt.security;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/** In-memory denylist of access-token jti values populated on logout. TTL = remaining token life. */
@Component
public class AccessTokenDenylist {

    private final Map<String, Instant> deniedUntil = new ConcurrentHashMap<>();

    public void revoke(String jti, Instant until) {
        if (jti == null || jti.isBlank()) {
            return;
        }
        deniedUntil.put(jti, until);
    }

    public boolean isRevoked(String jti) {
        if (jti == null || jti.isBlank()) {
            return false;
        }
        Instant until = deniedUntil.get(jti);
        if (until == null) {
            return false;
        }
        if (Instant.now().isAfter(until)) {
            deniedUntil.remove(jti);
            return false;
        }
        return true;
    }
}
