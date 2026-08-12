package com.vibhu.security.pii.common.dto;

import java.time.Instant;
import java.util.UUID;

/** Full decrypted record — internal microservice wire format (private network only). */
public record CustomerRecord(
        UUID id,
        String fullName,
        String email,
        String ssn,
        String panLast4,
        Instant createdAt
) {
}
