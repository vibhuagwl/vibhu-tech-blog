package com.vibhu.security.pii.common.audit;

import java.time.Instant;
import java.util.UUID;

public record PiiAccessEventRequest(
    Instant at,
    String actor,
    String sourceService,
    String action,
    UUID customerId,
    boolean fullPiiGranted,
    String clientIp) {}
