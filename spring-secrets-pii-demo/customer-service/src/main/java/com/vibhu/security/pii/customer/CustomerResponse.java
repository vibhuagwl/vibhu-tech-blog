package com.vibhu.security.pii.customer;

import java.time.Instant;
import java.util.UUID;

public record CustomerResponse(
        UUID id,
        String fullName,
        String email,
        String ssn,
        String panLast4,
        boolean masked,
        Instant createdAt
) {
}
