package com.vibhu.whatsapp.common.dto;

import java.time.Instant;

public record PresenceView(
    String userId, String deviceId, String gatewayNode, boolean online, Instant lastSeenAt) {}
