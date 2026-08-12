package com.vibhu.security.pii.common.dto;

import java.time.Instant;
import java.util.UUID;

/** Edge API response — PII fields may be masked. */
public record CustomerView(
        UUID id,
        String fullName,
        String email,
        String ssn,
        String panLast4,
        boolean masked,
        Instant createdAt
) {
}
