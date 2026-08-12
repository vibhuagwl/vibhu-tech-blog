package com.vibhu.security.pii.audit;

import java.time.Instant;
import java.util.UUID;

public record PiiAccessEvent(
        Instant at,
        String actor,
        String action,
        UUID customerId,
        boolean fullPiiRequested,
        String clientIp
) {
}
